import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { playIncomingChime, playOutgoingPop } from '../utils/sound';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Generate or retrieve persistent guest ID
const getOrCreateGuestId = () => {
  if (typeof window === 'undefined') return 'guest_default';
  let id = localStorage.getItem('fv_chat_guest_id');
  if (!id) {
    const bytes = new Uint8Array(16);
    window.crypto?.getRandomValues(bytes);
    const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    id = `guest_${randomPart}`;
    localStorage.setItem('fv_chat_guest_id', id);
  }
  return id;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [supportOnline, setSupportOnline] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  // Customer widget state
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [customerConversation, setCustomerConversation] = useState(null);
  const [customerMessages, setCustomerMessages] = useState([]);
  const [customerTyping, setCustomerTyping] = useState(null);
  const [customerUnreadCount, setCustomerUnreadCount] = useState(0);

  // Audio preference
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('fv_chat_sound') !== 'false';
  });

  const activeConvIdRef = useRef(null);
  const socketRef = useRef(null);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('fv_chat_sound', String(next));
      return next;
    });
  }, []);

  // Fetch admin unread count
  const refreshAdminUnread = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/chat/unread-count');
      if (res.data?.success) {
        setAdminUnreadCount(res.data.count || 0);
      }
    } catch {
      // ignore
    }
  }, [isAdmin]);

  // Connect socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const guestId = getOrCreateGuestId();
    const customerName = user?.name || localStorage.getItem('fv_chat_guest_name') || 'Guest Shopper';
    const customerPhone = user?.phone || localStorage.getItem('fv_chat_guest_phone') || '';

    // Socket server target: use current origin in prod or default localhost:5000 in dev
    const serverUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/, '') 
      : window.location.origin;

    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token || undefined,
        guestId,
        guestCapability: localStorage.getItem('fv_chat_guest_capability') || undefined,
        customerName,
        customerPhone
      },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('support:check');
      if (isAdmin) {
        refreshAdminUnread();
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('support:presence', ({ isOnline }) => {
      setSupportOnline(isOnline);
    });

    // Incoming message
    newSocket.on('message:received', (message) => {
      // Check if message belongs to active customer widget
      if (customerConversation && message.conversationId === customerConversation._id) {
        setCustomerMessages((prev) => {
          if (prev.some((m) => m._id === message._id || (message.clientMsgId && m.clientMsgId === message.clientMsgId))) {
            return prev.map((m) => (m.clientMsgId === message.clientMsgId ? message : m));
          }
          return [...prev, message];
        });

        if (message.sender === 'admin') {
          if (soundEnabled) playIncomingChime();
          // If widget is open, mark read immediately
          if (activeConvIdRef.current === message.conversationId) {
            newSocket.emit('message:mark_read', { conversationId: message.conversationId });
          } else {
            setCustomerUnreadCount((c) => c + 1);
          }
        }
      }

      if (isAdmin) {
        if (message.sender === 'customer') {
          if (soundEnabled) playIncomingChime();
          setAdminUnreadCount((c) => c + 1);
        }
      }
    });

    // Read receipts sync (ticks turn blue!)
    newSocket.on('message:read_receipt', ({ conversationId, reader, readAt }) => {
      if (customerConversation && conversationId === customerConversation._id) {
        setCustomerMessages((prev) =>
          prev.map((m) => {
            if (reader === 'admin' && m.sender === 'customer') {
              return { ...m, status: 'read', readAt };
            }
            if (reader === 'customer' && m.sender === 'admin') {
              return { ...m, status: 'read', readAt };
            }
            return m;
          })
        );
      }
    });

    // Typing indicator
    newSocket.on('typing:status', ({ conversationId, isTyping, sender, senderName }) => {
      if (customerConversation && conversationId === customerConversation._id) {
        if (sender === 'admin') {
          setCustomerTyping(isTyping ? { senderName } : null);
        }
      }
    });

    // Admin counter sync
    newSocket.on('conversation:read_sync', ({ reader }) => {
      if (isAdmin && reader === 'admin') {
        refreshAdminUnread();
      }
    });

    // Real-time message deletion sync
    newSocket.on('message:deleted', ({ messageId, conversationId }) => {
      setCustomerMessages((prev) =>
        prev.filter((m) => m._id !== messageId && m.clientMsgId !== messageId)
      );
    });

    // Real-time conversation cleared sync
    newSocket.on('conversation:cleared', ({ conversationId }) => {
      if (customerConversation && conversationId === customerConversation._id) {
        setCustomerMessages([]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, isAdmin, refreshAdminUnread, soundEnabled, customerConversation]);

  // Load customer conversation
  const loadCustomerConversation = useCallback(async () => {
    try {
      const guestId = getOrCreateGuestId();
      const guestName = localStorage.getItem('fv_chat_guest_name') || '';
      const guestPhone = localStorage.getItem('fv_chat_guest_phone') || '';
      const queryName = user?.name || guestName;
      const queryPhone = user?.phone || guestPhone;
      const res = await api.get(`/chat/my-conversation?guestId=${guestId}&customerName=${encodeURIComponent(queryName)}&customerPhone=${encodeURIComponent(queryPhone)}`);
      if (res.data?.success && res.data.conversation) {
        if (res.data.guestCapability) {
          localStorage.setItem('fv_chat_guest_capability', res.data.guestCapability);
          if (socketRef.current) {
            socketRef.current.auth.guestCapability = res.data.guestCapability;
            if (socketRef.current.connected) {
              socketRef.current.disconnect().connect();
            }
          }
        }
        const conv = res.data.conversation;
        setCustomerConversation(conv);
        setCustomerUnreadCount(conv.unreadCustomerCount || 0);

        // Fetch messages with guestId parameter for IDOR safety
        const msgRes = await api.get(`/chat/conversations/${conv._id}/messages?guestId=${guestId}`);
        if (msgRes.data?.success) {
          setCustomerMessages(msgRes.data.messages || []);
        }

        // Join room
        if (socketRef.current) {
          socketRef.current.emit('conversation:join', { conversationId: conv._id });
          activeConvIdRef.current = conv._id;
        }
      }
    } catch (err) {
      console.error('Failed to load customer conversation:', err);
    }
  }, [user]);

  // Reload conversation whenever user logs in or auth state changes
  useEffect(() => {
    if (user) {
      loadCustomerConversation();
    }
  }, [user, loadCustomerConversation]);

  // Customer opens widget
  const openWidget = useCallback((options = {}) => {
    setIsWidgetOpen(true);
    setCustomerUnreadCount(0);
    if (!customerConversation) {
      loadCustomerConversation().then(() => {
        if (options.prompt && socketRef.current) {
          // Will be handled in widget
        }
      });
    } else {
      activeConvIdRef.current = customerConversation._id;
      if (socketRef.current) {
        socketRef.current.emit('conversation:join', { conversationId: customerConversation._id });
        socketRef.current.emit('message:mark_read', { conversationId: customerConversation._id });
      }
    }
  }, [customerConversation, loadCustomerConversation]);

  const closeWidget = useCallback(() => {
    setIsWidgetOpen(false);
    activeConvIdRef.current = null;
    if (socketRef.current && customerConversation) {
      socketRef.current.emit('conversation:leave', { conversationId: customerConversation._id });
    }
  }, [customerConversation]);

  // Global listener for 'open-in-app-chat' custom event
  useEffect(() => {
    const handleOpenEvent = (e) => {
      const { prompt, orderContext } = e.detail || {};
      openWidget();
      if (prompt || orderContext) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('in-app-chat-prefill', {
            detail: { prompt, orderContext }
          }));
        }, 150);
      }
    };

    window.addEventListener('open-in-app-chat', handleOpenEvent);
    return () => window.removeEventListener('open-in-app-chat', handleOpenEvent);
  }, [openWidget]);

  // Save guest compulsory contact details (name + 10-digit phone)
  const saveGuestContact = useCallback(async ({ name, phone }) => {
    const cleanName = (name || '').trim();
    const digitsOnly = (phone || '').toString().replace(/\D/g, '').slice(-10);

    if (!cleanName || cleanName.length < 2) {
      toast.error('Please enter your name (at least 2 characters).');
      return false;
    }
    if (!digitsOnly || !/^[6-9]\d{9}$/.test(digitsOnly)) {
      toast.error('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
      return false;
    }

    localStorage.setItem('fv_chat_guest_name', cleanName);
    localStorage.setItem('fv_chat_guest_phone', digitsOnly);

    const guestId = getOrCreateGuestId();
    try {
      const res = await api.post('/chat/init', {
        guestId,
        customerName: cleanName,
        customerPhone: digitsOnly
      });
      if (res.data?.success && res.data.conversation) {
        if (res.data.guestCapability) {
          localStorage.setItem('fv_chat_guest_capability', res.data.guestCapability);
        }
        setCustomerConversation(res.data.conversation);
      }
    } catch (err) {
      console.warn('Failed to sync guest contact with backend:', err);
    }

    if (socketRef.current) {
      socketRef.current.auth = {
        ...socketRef.current.auth,
        guestId,
        customerName: cleanName,
        customerPhone: digitsOnly
      };
    }

    toast.success(`Welcome, ${cleanName}! You can now chat directly with our team.`);
    return true;
  }, []);

  // Customer sends message (No login required! Compulsory name & phone for guests)
  const sendCustomerMessage = useCallback(async (text, orderContext = null, attachment = null, guestContact = null) => {
    const guestId = getOrCreateGuestId();
    const guestName = guestContact?.name || localStorage.getItem('fv_chat_guest_name') || '';
    const guestPhone = guestContact?.phone || localStorage.getItem('fv_chat_guest_phone') || '';

    // If not logged in, enforce compulsory name and phone
    if (!user) {
      if (!guestName || guestName.trim().length < 2) {
        toast.error('Please enter your name to send a message.');
        return false;
      }
      const digitsOnly = guestPhone.replace(/\D/g, '').slice(-10);
      if (!digitsOnly || !/^[6-9]\d{9}$/.test(digitsOnly)) {
        toast.error('Please enter a valid 10-digit mobile number to chat.');
        return false;
      }
    }

    const cleanText = (text || '').trim();
    if (!cleanText && (!attachment || !attachment.url)) return false;

    const clientMsgId = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const senderName = user?.name || guestName || 'Customer';
    const customerPhone = user?.phone || guestPhone;

    // Optimistic UI message
    const optimisticMessage = {
      _id: clientMsgId,
      clientMsgId,
      conversationId: customerConversation?._id,
      sender: 'customer',
      senderName,
      text: cleanText,
      attachment: attachment || null,
      status: 'pending',
      orderContext: orderContext || customerConversation?.orderContext || null,
      createdAt: new Date().toISOString()
    };

    setCustomerMessages((prev) => [...prev, optimisticMessage]);
    if (soundEnabled) playOutgoingPop();

    if (socketRef.current && isConnected) {
      socketRef.current.emit(
        'message:send',
        {
          conversationId: customerConversation?._id,
          text: cleanText,
          clientMsgId,
          orderContext,
          senderName,
          customerName: senderName,
          customerPhone,
          attachment
        },
        (response) => {
          if (response?.error) {
            toast.error(response.error);
            setCustomerMessages((prev) => prev.filter((m) => m.clientMsgId !== clientMsgId));
            return;
          }
          if (response?.success && response.message) {
            setCustomerMessages((prev) =>
              prev.map((m) => (m.clientMsgId === clientMsgId ? response.message : m))
            );
          }
        }
      );
    } else {
      // REST fallback
      try {
        if (!customerConversation) {
          await loadCustomerConversation();
        }
        if (customerConversation?._id) {
          const res = await api.post(`/chat/conversations/${customerConversation._id}/messages`, {
            text: cleanText,
            clientMsgId,
            orderContext,
            senderName,
            customerName: senderName,
            customerPhone,
            guestId,
            attachment
          });
          if (res.data?.success && res.data.message) {
            setCustomerMessages((prev) =>
              prev.map((m) => (m.clientMsgId === clientMsgId ? res.data.message : m))
            );
          }
        }
      } catch (err) {
        console.error('REST fallback failed to send chat message:', err);
      }
    }
    return true;
  }, [customerConversation, isConnected, soundEnabled, user, loadCustomerConversation]);

  // Delete message for everyone
  const deleteMessageForEveryone = useCallback(async (messageId, conversationId) => {
    if (!messageId) return;
    const targetConvId = conversationId || customerConversation?._id;
    const guestId = getOrCreateGuestId();

    // Optimistic removal
    setCustomerMessages((prev) =>
      prev.filter((m) => m._id !== messageId && m.clientMsgId !== messageId)
    );

    if (socketRef.current && isConnected) {
      socketRef.current.emit('message:delete', { messageId, conversationId: targetConvId, guestId });
    } else {
      try {
        await api.delete(`/chat/messages/${messageId}`, {
          data: { guestId }
        });
      } catch (err) {
        console.error('Failed to delete message via REST:', err);
      }
    }
  }, [customerConversation, isConnected]);

  // Clear entire customer chat thread
  const clearCustomerChat = useCallback(async () => {
    if (!customerConversation?._id) return;
    const convId = customerConversation._id;
    const guestId = getOrCreateGuestId();

    // Optimistic clear
    setCustomerMessages([]);

    if (socketRef.current && isConnected) {
      socketRef.current.emit('conversation:clear', { conversationId: convId, guestId });
    } else {
      try {
        await api.delete(`/chat/conversations/${convId}/messages`, {
          data: { guestId }
        });
      } catch (err) {
        console.error('Failed to clear chat via REST:', err);
      }
    }
  }, [customerConversation, isConnected]);

  // Send typing event
  const sendTypingStatus = useCallback((isTyping) => {
    if (!socketRef.current || !customerConversation?._id) return;
    const event = isTyping ? 'typing:start' : 'typing:stop';
    socketRef.current.emit(event, {
      conversationId: customerConversation._id,
      senderName: user?.name || localStorage.getItem('fv_chat_guest_name') || 'Customer'
    });
  }, [customerConversation, user]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        isConnected,
        supportOnline,
        adminUnreadCount,
        refreshAdminUnread,
        isWidgetOpen,
        openWidget,
        closeWidget,
        customerConversation,
        customerMessages,
        customerTyping,
        customerUnreadCount,
        sendCustomerMessage,
        deleteMessageForEveryone,
        clearCustomerChat,
        sendTypingStatus,
        soundEnabled,
        toggleSound,
        loadCustomerConversation,
        saveGuestContact,
        getOrCreateGuestId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

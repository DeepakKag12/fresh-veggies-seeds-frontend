import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Check,
  CheckCheck,
  Clock,
  Package,
  Send,
  Volume2,
  VolumeX,
  Archive,
  ArchiveRestore,
  ExternalLink,
  ChevronLeft,
  Info,
  RefreshCw,
  ShoppingBag,
  X,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  Trash2,
  MoreVertical,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { playOutgoingPop } from '../../utils/sound';
import useVoiceDictation from '../../hooks/useVoiceDictation';
import InChatSearchBar, { HighlightedText } from '../../components/chat/InChatSearchBar';
import ChatImageLightbox from '../../components/chat/ChatImageLightbox';

const CANNED_REPLIES = [
  { label: 'Standard Greeting', text: 'Hello! Welcome to Fresh Veggies customer support. How can we help you today?' },
  { label: 'Germination Guide', text: 'For optimal germination, keep the soil mixture consistently moist (not soggy) in warm, indirect sunlight.' },
  { label: 'Dispatch Update', text: 'Your order is currently packed in our moisture-lock pouches and prepared for carrier dispatch.' },
  { label: 'Address Verification', text: 'Could you please confirm your complete street address and 6-digit PIN code?' },
  { label: 'Balcony Soil Mix', text: 'We recommend a potting ratio of 40% garden soil, 40% cocopeat, and 20% vermicompost for potted containers.' },
  { label: 'Discount Offer', text: 'As a valued gardener, you can use coupon code SEEDMAGIC for 10% off your next purchase!' }
];

export const AdminCommunication = () => {
  const [searchParams] = useSearchParams();
  const { socket, isConnected, soundEnabled, toggleSound, refreshAdminUnread } = useChat();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'active' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [typingCustomer, setTypingCustomer] = useState(null);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);

  // Attachment & Lightbox state
  const [pendingImage, setPendingImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // In-Chat Search state
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Header options menu
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const activeConvIdRef = useRef(null);

  // Voice dictation hook
  const { isListening, startListening, stopListening } = useVoiceDictation({
    onTranscript: (spokenPhrase) => {
      setInputText((prev) => (prev ? `${prev} ${spokenPhrase}` : spokenPhrase));
    }
  });

  // Calculate matching messages for in-chat search
  const matchingMessages = useMemo(() => {
    if (!inChatSearchQuery || !inChatSearchQuery.trim()) return [];
    const q = inChatSearchQuery.trim().toLowerCase();
    return messages.filter((m) => m.text && m.text.toLowerCase().includes(q));
  }, [messages, inChatSearchQuery]);

  // Scroll to active search match
  useEffect(() => {
    if (matchingMessages.length > 0 && showInChatSearch) {
      const match = matchingMessages[currentMatchIndex];
      if (match) {
        const id = match._id || match.clientMsgId;
        const el = document.getElementById(`admin-msg-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentMatchIndex, matchingMessages, showInChatSearch]);

  const handleNextMatch = () => {
    if (matchingMessages.length <= 1) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessages.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length <= 1) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessages.length) % matchingMessages.length);
  };

  const handleCloseInChatSearch = () => {
    setShowInChatSearch(false);
    setInChatSearchQuery('');
    setCurrentMatchIndex(0);
  };

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConv(true);
      const res = await api.get(`/chat/conversations?status=${filter}&search=${encodeURIComponent(searchQuery)}`);
      if (res.data?.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle URL query parameters
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const phone = searchParams.get('customerPhone');
    const name = searchParams.get('customerName');

    if (orderId || phone) {
      api.get(`/chat/conversations?search=${encodeURIComponent(phone || orderId)}`).then((res) => {
        if (res.data?.success && res.data.conversations?.length > 0) {
          handleSelectConversation(res.data.conversations[0]);
        } else if (phone || name) {
          api.post('/chat/init', {
            customerName: name || 'Customer',
            customerPhone: phone || '',
            orderContext: orderId ? { orderId, orderNumber: orderId.slice(-6).toUpperCase() } : null
          }).then((initRes) => {
            if (initRes.data?.success && initRes.data.conversation) {
              fetchConversations();
              handleSelectConversation(initRes.data.conversation);
            }
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-scroll messages
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!showInChatSearch) {
      scrollToBottom('auto');
    }
  }, [selectedConv, showInChatSearch]);

  useEffect(() => {
    if (!showInChatSearch) {
      scrollToBottom('smooth');
    }
  }, [messages, typingCustomer, showInChatSearch]);

  // Select active conversation
  const handleSelectConversation = async (conv) => {
    if (activeConvIdRef.current && socket) {
      socket.emit('conversation:leave', { conversationId: activeConvIdRef.current });
    }

    setSelectedConv(conv);
    activeConvIdRef.current = conv._id;
    setLoadingMessages(true);
    setPendingImage(null);
    handleCloseInChatSearch();

    try {
      if (socket) {
        socket.emit('conversation:join', { conversationId: conv._id });
        socket.emit('message:mark_read', { conversationId: conv._id });
      }

      const msgRes = await api.get(`/chat/conversations/${conv._id}/messages`);
      if (msgRes.data?.success) {
        setMessages(msgRes.data.messages || []);
      }

      const ordersRes = await api.get(`/chat/conversations/${conv._id}/orders`);
      if (ordersRes.data?.success) {
        setCustomerOrders(ordersRes.data.orders || []);
      }

      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadAdminCount: 0 } : c))
      );
      refreshAdminUnread();
    } catch (err) {
      console.error('Error loading conversation messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (message) => {
      if (activeConvIdRef.current === message.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id || (message.clientMsgId && m.clientMsgId === message.clientMsgId))) {
            return prev.map((m) => (m.clientMsgId === message.clientMsgId ? message : m));
          }
          return [...prev, message];
        });

        if (message.sender === 'customer') {
          socket.emit('message:mark_read', { conversationId: message.conversationId });
        }
      }
    };

    const handleReadReceipt = ({ conversationId, reader, readAt }) => {
      if (activeConvIdRef.current === conversationId && reader === 'customer') {
        setMessages((prev) =>
          prev.map((m) => (m.sender === 'admin' ? { ...m, status: 'read', readAt } : m))
        );
      }
    };

    const handleTypingStatus = ({ conversationId, isTyping, sender, senderName }) => {
      if (activeConvIdRef.current === conversationId && sender === 'customer') {
        setTypingCustomer(isTyping ? { senderName } : null);
      }
    };

    const handleConversationUpdated = ({ conversation }) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === conversation._id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...conversation };
          const [item] = updated.splice(index, 1);
          return [item, ...updated];
        } else {
          return [conversation, ...prev];
        }
      });
    };

    const handlePresenceUpdate = ({ identity, isOnline }) => {
      setConversations((prev) =>
        prev.map((c) => {
          const matches =
            (c.customerId && `user:${c.customerId}` === identity) ||
            (c.guestId && `guest:${c.guestId}` === identity);
          return matches ? { ...c, isOnline } : c;
        })
      );
      if (selectedConv) {
        const matches =
          (selectedConv.customerId && `user:${selectedConv.customerId}` === identity) ||
          (selectedConv.guestId && `guest:${selectedConv.guestId}` === identity);
        if (matches) {
          setSelectedConv((prev) => ({ ...prev, isOnline }));
        }
      }
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (activeConvIdRef.current === conversationId) {
        setMessages((prev) =>
          prev.filter((m) => m._id !== messageId && m.clientMsgId !== messageId)
        );
      }
    };

    const handleConversationCleared = ({ conversationId }) => {
      if (activeConvIdRef.current === conversationId) {
        setMessages([]);
      }
    };

    const handleConversationDeleted = ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConvIdRef.current === conversationId) {
        setSelectedConv(null);
        setMessages([]);
      }
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('message:read_receipt', handleReadReceipt);
    socket.on('typing:status', handleTypingStatus);
    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('conversation:cleared', handleConversationCleared);
    socket.on('conversation:deleted', handleConversationDeleted);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:read_receipt', handleReadReceipt);
      socket.off('typing:status', handleTypingStatus);
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('conversation:cleared', handleConversationCleared);
      socket.off('conversation:deleted', handleConversationDeleted);
    };
  }, [socket, selectedConv]);

  // Handle typing status from admin
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !selectedConv?._id) return;

    socket.emit('typing:start', {
      conversationId: selectedConv._id,
      senderName: user?.name || 'Fresh Veggies Support'
    });

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: selectedConv._id });
    }, 1500);
  };

  // Image File selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (.jpg, .png, .webp, .gif)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingImage({ file, previewUrl });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clipboard Paste handler (Screenshots)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const previewUrl = URL.createObjectURL(file);
          setPendingImage({ file, previewUrl });
          toast.success('Screenshot pasted ready to send');
          break;
        }
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({ file, previewUrl });
    }
  };

  // Upload image to Cloudinary backend
  const uploadImageAttachment = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await api.post('/upload/chat-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Image upload failed');
  };

  // Send admin message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const hasText = Boolean(inputText.trim());
    const hasImage = Boolean(pendingImage);

    if ((!hasText && !hasImage) || !selectedConv) return;

    const text = inputText.trim();
    const clientMsgId = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const senderName = user?.name || 'Fresh Veggies Support';

    let attachmentData = null;
    if (hasImage) {
      setIsUploadingImage(true);
      try {
        attachmentData = await uploadImageAttachment(pendingImage.file);
      } catch (uploadErr) {
        toast.error('Failed to upload image. Please try again.');
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    // Optimistic UI update
    const optimisticMessage = {
      _id: clientMsgId,
      clientMsgId,
      conversationId: selectedConv._id,
      sender: 'admin',
      senderName,
      text,
      attachment: attachmentData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setPendingImage(null);
    if (isListening) stopListening();

    if (soundEnabled) playOutgoingPop();

    if (socket && isConnected) {
      socket.emit('typing:stop', { conversationId: selectedConv._id });
      socket.emit(
        'message:send',
        {
          conversationId: selectedConv._id,
          text,
          clientMsgId,
          senderName,
          attachment: attachmentData
        },
        (res) => {
          if (res?.success && res.message) {
            setMessages((prev) =>
              prev.map((m) => (m.clientMsgId === clientMsgId ? res.message : m))
            );
          }
        }
      );
    } else {
      // REST fallback
      try {
        const res = await api.post(`/chat/conversations/${selectedConv._id}/messages`, {
          text,
          clientMsgId,
          senderName,
          attachment: attachmentData
        });
        if (res.data?.success && res.data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.clientMsgId === clientMsgId ? res.data.message : m))
          );
        }
      } catch (err) {
        console.error('Failed to send admin message via REST:', err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Archive toggle
  const toggleArchiveConversation = async () => {
    if (!selectedConv?._id) return;
    try {
      const res = await api.patch(`/chat/conversations/${selectedConv._id}/archive`);
      if (res.data?.success) {
        toast.success(
          selectedConv.status === 'archived'
            ? 'Conversation unarchived and active'
            : 'Conversation archived'
        );
        fetchConversations();
        setSelectedConv(null);
      }
    } catch {
      toast.error('Failed to update archive status');
    }
  };

  // Delete message for everyone
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    setMessages((prev) => prev.filter((m) => m._id !== msgId && m.clientMsgId !== msgId));

    if (socket && isConnected) {
      socket.emit('message:delete', { messageId: msgId, conversationId: selectedConv._id });
    } else {
      try {
        await api.delete(`/chat/messages/${msgId}`);
      } catch (err) {
        console.error('Failed to delete message via REST:', err);
      }
    }
    toast.success('Message deleted for everyone');
  };

  // Clear conversation messages
  const handleClearConversation = async () => {
    if (!selectedConv?._id) return;
    if (!window.confirm('Are you sure you want to clear all messages in this conversation for everyone?')) return;
    const convId = selectedConv._id;
    setMessages([]);
    setShowOptionsMenu(false);

    if (socket && isConnected) {
      socket.emit('conversation:clear', { conversationId: convId });
    } else {
      try {
        await api.delete(`/chat/conversations/${convId}/messages`);
      } catch (err) {
        console.error('Failed to clear conversation via REST:', err);
      }
    }
    toast.success('Conversation messages cleared');
  };

  // Permanently delete conversation
  const handleDeleteConversation = async () => {
    if (!selectedConv?._id) return;
    if (!window.confirm(`Permanently delete conversation with ${selectedConv.customerName}? All messages and records will be purged.`)) return;
    const convId = selectedConv._id;
    setShowOptionsMenu(false);

    try {
      await api.delete(`/chat/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      setSelectedConv(null);
      setMessages([]);
      toast.success('Conversation permanently deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete conversation');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const currentMatchMsgId =
    matchingMessages.length > 0 && matchingMessages[currentMatchIndex]
      ? matchingMessages[currentMatchIndex]._id || matchingMessages[currentMatchIndex].clientMsgId
      : null;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-fv-surface select-none">
      {/* ─── LEFT PANEL: Conversations List & Filters ─────────────────────────── */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-gray-800 border-r border-fv-border ${
          selectedConv ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="h-16 px-4 bg-fv-surface/60 dark:bg-gray-800 border-b border-fv-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-fv-heading dark:text-white leading-tight">Live Chat Desk</h2>
              <p className="text-[11px] text-fv-muted flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{isConnected ? 'Socket Connected' : 'Reconnecting...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 transition-colors"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={fetchConversations}
              className="p-2 rounded-xl text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loadingConv ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 bg-fv-surface/40 dark:bg-gray-800/60 border-b border-fv-border">
          <div className="relative">
            <Search className="w-4 h-4 text-fv-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, phone, or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-fv-border rounded-xl text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'active', label: 'Active' },
              { id: 'archived', label: 'Archived' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === tab.id
                    ? 'bg-[#0A4C36] text-white shadow-xs'
                    : 'bg-white dark:bg-gray-700 text-fv-muted hover:text-fv-heading border border-fv-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-fv-border">
          {loadingConv ? (
            <div className="p-8 text-center text-xs text-fv-muted space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-fv-muted space-y-2">
              <MessageSquare className="w-8 h-8 text-fv-muted/50 mx-auto" />
              <p className="font-semibold text-fv-heading dark:text-white">No conversations found</p>
              <p>Customer inquiries from the storefront will appear here instantly.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConv?._id === conv._id;
              const hasUnread = conv.unreadAdminCount > 0;
              const initials = (conv.customerName || 'Customer')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-l-[#0A4C36]'
                      : 'hover:bg-fv-surface/60 dark:hover:bg-gray-700/60'
                  }`}
                >
                  {/* Customer Avatar & Status */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {initials}
                    </div>
                    {conv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800" />
                    )}
                  </div>

                  {/* Summary & Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            hasUnread ? 'text-[#0A4C36] dark:text-emerald-400' : 'text-fv-heading dark:text-white'
                          }`}
                        >
                          {conv.customerName}
                        </h4>
                        {conv.customerPhone && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono shrink-0">
                            · {conv.customerPhone}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-fv-muted font-mono shrink-0 ml-1">
                        {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                      </span>
                    </div>

                    {/* Order Context preview tag */}
                    {conv.orderContext?.orderNumber && (
                      <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono mb-1">
                        <Package className="w-2.5 h-2.5" />
                        <span>#{conv.orderContext.orderNumber}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs truncate ${
                          hasUnread
                            ? 'font-bold text-gray-900 dark:text-white'
                            : 'text-fv-muted dark:text-gray-400'
                        }`}
                      >
                        {conv.lastMessage?.sender === 'admin' && (
                          <span className="inline-flex items-center mr-1 text-fv-muted">
                            {conv.lastMessage.status === 'read' ? (
                              <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </span>
                        )}
                        <span>{conv.lastMessage?.text || (conv.lastMessage?.hasAttachment ? '📷 Photo' : 'No messages yet')}</span>
                      </p>

                      {hasUnread && (
                        <span className="w-5 h-5 rounded-full bg-[#25D366] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unreadAdminCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Active WhatsApp Web Conversation Thread ──────────────── */}
      <div
        className={`flex-1 flex flex-col bg-[#EFEAE2] dark:bg-[#0b141a] relative ${
          !selectedConv ? 'hidden md:flex items-center justify-center' : 'flex'
        }`}
      >
        {!selectedConv ? (
          <div className="text-center p-8 max-w-md space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-inner">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-fv-heading dark:text-white">Fresh Veggies Live Console</h3>
              <p className="text-xs text-fv-muted mt-2 leading-relaxed">
                Select a conversation on the left panel to begin real-time messaging, review order context, and provide instant customer support.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Top Header Bar (Phone Icon Removed completely) */}
            <div className="h-16 bg-[#0A4C36] text-white px-4 flex items-center justify-between shadow-md shrink-0 z-10 relative">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedConv(null)}
                  className="md:hidden p-1.5 rounded-lg text-white hover:bg-emerald-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {(selectedConv.customerName || 'Customer').slice(0, 2).toUpperCase()}
                  </div>
                  {selectedConv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0A4C36]" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-sm leading-tight truncate text-white flex items-center gap-2">
                    <span>{selectedConv.customerName}</span>
                    {selectedConv.customerPhone && (
                      <span className="text-xs font-mono font-normal text-emerald-200">
                        ({selectedConv.customerPhone})
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-emerald-200 truncate">
                    {selectedConv.isOnline ? (
                      <span className="text-emerald-300 font-semibold">● Online now</span>
                    ) : (
                      `Offline · ${selectedConv.customerEmail || 'Guest Chat'}`
                    )}
                  </p>
                </div>
              </div>

              {/* Right Controls: In-Chat Search, Archive, Info Drawer, Options Menu */}
              <div className="flex items-center gap-1">
                {/* In-Chat Message Search Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowInChatSearch((prev) => !prev);
                    if (showInChatSearch) handleCloseInChatSearch();
                  }}
                  className={`p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer ${
                    showInChatSearch ? 'bg-emerald-800 text-white' : ''
                  }`}
                  title="Search in this conversation"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Archive Button */}
                <button
                  type="button"
                  onClick={toggleArchiveConversation}
                  className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer"
                  title={selectedConv.status === 'archived' ? 'Unarchive Conversation' : 'Archive Conversation'}
                >
                  {selectedConv.status === 'archived' ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                </button>

                {/* Customer Details Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                  className={`p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer ${
                    showInfoSidebar ? 'bg-emerald-800 text-white' : ''
                  }`}
                  title="Customer Context & Orders"
                >
                  <Info className="w-4 h-4" />
                </button>

                {/* 3-Dot Options Menu (Clear chat & Delete conversation) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOptionsMenu((prev) => !prev)}
                    className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/80 transition-colors cursor-pointer"
                    title="Conversation Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showOptionsMenu && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-fv-border py-1.5 z-30 animate-fadeIn text-xs text-fv-heading dark:text-white">
                      <button
                        type="button"
                        onClick={handleClearConversation}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Clear All Messages</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteConversation}
                        className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center gap-2 cursor-pointer font-semibold border-t border-fv-border/50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Conversation</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* In-Chat Search Bar Overlay */}
            {showInChatSearch && (
              <InChatSearchBar
                searchQuery={inChatSearchQuery}
                onSearchChange={(q) => {
                  setInChatSearchQuery(q);
                  setCurrentMatchIndex(0);
                }}
                matchCount={matchingMessages.length}
                currentMatchIndex={currentMatchIndex}
                onNextMatch={handleNextMatch}
                onPrevMatch={handlePrevMatch}
                onClose={handleCloseInChatSearch}
              />
            )}

            {/* Main Chat Canvas with WhatsApp Wallpaper */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 flex overflow-hidden relative transition-colors ${
                isDragOver ? 'bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500 ring-inset' : ''
              }`}
            >
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 relative">
                <div
                  className="absolute inset-0 opacity-5 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#0A4C36 1px, transparent 1px)`,
                    backgroundSize: '16px 16px'
                  }}
                />

                {isDragOver && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-emerald-50/80 dark:bg-emerald-950/80 backdrop-blur-xs pointer-events-none">
                    <ImageIcon className="w-12 h-12 text-emerald-600 animate-bounce" />
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mt-2">
                      Drop photo to send to {selectedConv.customerName}
                    </p>
                  </div>
                )}

                {/* Day Divider Pill */}
                <div className="flex justify-center my-3">
                  <span className="bg-white/80 dark:bg-gray-800/80 text-fv-muted text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs border border-fv-border">
                    Conversation Timeline
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="p-8 text-center text-xs text-fv-muted space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                    <p>Loading message history...</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdminMsg = msg.sender === 'admin';
                    const msgId = msg._id || msg.clientMsgId;
                    const isCurrentMatchedMsg = msgId === currentMatchMsgId;

                    return (
                      <div
                        key={msgId}
                        id={`admin-msg-${msgId}`}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'} mb-2 group relative`}
                      >
                        <div
                          className={`relative max-w-[78%] md:max-w-[68%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                            isAdminMsg
                              ? 'bg-[#0A4C36] text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs border border-slate-200 dark:border-slate-700'
                          } ${isCurrentMatchedMsg ? 'ring-2 ring-amber-400 dark:ring-amber-300 shadow-md' : ''}`}
                        >
                          {/* Message Hover Actions (Delete for everyone) */}
                          <div
                            className={`absolute top-1 ${
                              isAdminMsg ? '-left-8' : '-right-8'
                            } opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}
                          >
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg._id || msg.clientMsgId)}
                              className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 shadow-sm border border-fv-border cursor-pointer transition-colors"
                              title="Delete message for everyone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Sender title for customer message */}
                          {!isAdminMsg && (
                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                              {msg.senderName || selectedConv.customerName}
                            </p>
                          )}

                          {/* Embedded Photo Attachment */}
                          {msg.attachment?.url && (
                            <div
                              className="mb-2 overflow-hidden rounded-xl bg-black/5 dark:bg-black/20 cursor-pointer group/img relative"
                              onClick={() => setLightboxImageUrl(msg.attachment.url)}
                              title="Click to view full photo"
                            >
                              <img
                                src={msg.attachment.url}
                                alt={msg.attachment.fileName || 'Attached media'}
                                className="max-h-64 w-full object-cover rounded-xl group-hover/img:scale-102 transition-transform duration-200"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Embedded Order Context Card */}
                          {msg.orderContext?.orderNumber && (
                            <div className="mb-2 p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
                              <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                                <span className="flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5" />
                                  Order #{msg.orderContext.orderNumber}
                                </span>
                                {msg.orderContext.orderId && (
                                  <Link
                                    to={`/admin/orders/${msg.orderContext.orderId}`}
                                    className="text-[11px] hover:underline flex items-center gap-0.5 text-fv-primary dark:text-emerald-300"
                                  >
                                    View <ExternalLink className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                              </div>
                              {msg.orderContext.totalAmount > 0 && (
                                <p className="text-[11px] text-fv-muted mt-0.5">
                                  ₹{msg.orderContext.totalAmount} · {msg.orderContext.orderStatus || 'Processing'}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Text Content with Search Highlight */}
                          {msg.text && (
                            <p className="whitespace-pre-wrap break-words">
                              <HighlightedText
                                text={msg.text}
                                highlight={showInChatSearch ? inChatSearchQuery : ''}
                                isCurrentMatch={isCurrentMatchedMsg}
                              />
                            </p>
                          )}

                          {/* Timestamp and delivery ticks */}
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isAdminMsg ? 'text-emerald-100/80' : 'text-slate-400'
                          }`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {isAdminMsg && (
                              <span className="inline-flex items-center">
                                {msg.status === 'pending' && <Clock className="w-3 h-3 text-emerald-200 animate-spin" />}
                                {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-emerald-200" />}
                                {msg.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                                {msg.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Real-time Customer Typing Indicator */}
                {typingCustomer && (
                  <div className="flex items-start mb-2 animate-fadeIn">
                    <div className="bg-white dark:bg-[#202c33] px-4 py-2.5 rounded-2xl rounded-bl-xs border border-fv-border/50 shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-fv-muted ml-1.5">{selectedConv.customerName} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Customer Intelligence & Recent Orders Right Drawer */}
              {showInfoSidebar && (
                <div className="w-80 bg-white dark:bg-gray-800 border-l border-fv-border p-4 flex flex-col overflow-y-auto space-y-5 animate-slideIn">
                  <div className="flex items-center justify-between pb-2 border-b border-fv-border">
                    <h4 className="font-bold text-sm text-fv-heading dark:text-white">Customer Context</h4>
                    <button
                      type="button"
                      onClick={() => setShowInfoSidebar(false)}
                      className="text-fv-muted hover:text-fv-heading cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customer Card */}
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold flex items-center justify-center text-xl mx-auto shadow-md">
                      {(selectedConv.customerName || 'C').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-fv-heading dark:text-white">{selectedConv.customerName}</h5>
                      <p className="text-xs text-fv-muted">{selectedConv.customerEmail || 'No email provided'}</p>
                      <p className="text-xs text-fv-muted">{selectedConv.customerPhone || 'No phone provided'}</p>
                    </div>
                  </div>

                  {/* Recent Customer Orders */}
                  <div className="space-y-2 pt-2 border-t border-fv-border">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-fv-muted flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-fv-primary" />
                      Recent Orders ({customerOrders.length})
                    </h5>

                    {customerOrders.length === 0 ? (
                      <p className="text-xs text-fv-muted italic">No previous orders found.</p>
                    ) : (
                      <div className="space-y-2">
                        {customerOrders.map((ord) => (
                          <div
                            key={ord._id}
                            className="p-2.5 rounded-xl border border-fv-border bg-fv-surface/40 hover:bg-fv-surface transition-colors text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-fv-heading dark:text-white">
                                #{ord.orderNumber || ord._id.slice(-6).toUpperCase()}
                              </span>
                              <span className="font-bold text-emerald-600">₹{ord.totalAmount}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-fv-muted">
                              <span>Status: {ord.orderStatus}</span>
                              <Link
                                to={`/admin/orders/${ord._id}`}
                                className="text-fv-primary hover:underline flex items-center gap-0.5"
                              >
                                View <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pending Image Attachment Chip above input */}
            {pendingImage && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={pendingImage.previewUrl}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                      {pendingImage.file.name}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      {(pendingImage.file.size / 1024).toFixed(1)} KB · Photo ready to send
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="p-1 rounded-full text-emerald-700 hover:text-red-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Canned Responses Quick Bar */}
            <div className="bg-[#F0F2F5] dark:bg-gray-800/90 border-t border-fv-border px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Quick Replies:
              </span>
              {CANNED_REPLIES.map((canned, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(canned.text);
                    textareaRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-fv-heading dark:text-white hover:text-emerald-700 border border-fv-border whitespace-nowrap transition-colors shadow-2xs cursor-pointer"
                >
                  {canned.label}
                </button>
              ))}
            </div>

            {/* Hidden File Picker Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Input Bar with Voice Dictation & Image Attachment */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white dark:bg-gray-800 border-t border-fv-border flex items-end gap-2 shrink-0 z-10"
            >
              {/* Image / Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                title="Attach photo / screenshot"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={isListening ? 'Listening... speak now...' : 'Type an admin reply (Press Enter to send, Shift+Enter for new line)...'}
                className="flex-1 max-h-32 resize-none bg-fv-surface dark:bg-gray-700 border border-fv-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
              />

              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md ring-4 ring-red-400/40'
                    : 'text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice Dictation (Auto-type)'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 animate-bounce" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && !pendingImage) || isUploadingImage}
                className="w-11 h-11 rounded-xl bg-[#0A4C36] hover:bg-[#073626] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0 cursor-pointer active:scale-95"
                title="Send Message"
                aria-label="Send"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImageUrl && (
        <ChatImageLightbox
          imageUrl={lightboxImageUrl}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}
    </div>
  );
};

export default AdminCommunication;

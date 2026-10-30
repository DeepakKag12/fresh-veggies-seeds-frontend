import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Check,
  CheckCheck,
  Clock,
  Volume2,
  VolumeX,
  ShieldCheck,
  Package,
  User,
  Mic,
  MicOff,
  Paperclip,
  Image as ImageIcon,
  Search,
  Trash2,
  MoreVertical,
  Loader2,
  Headphones
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import useVoiceDictation from '../../hooks/useVoiceDictation';
import InChatSearchBar, { HighlightedText } from './InChatSearchBar';
import ChatImageLightbox from './ChatImageLightbox';

const QUICK_STARTERS = [
  { label: 'Seed Germination Advice', prompt: 'Hi! I need help with seed germination and potting soil mixture.' },
  { label: 'Check Order Status', prompt: 'Hello! Can you help me check the current status of my order?' },
  { label: 'Balcony Gardening Tips', prompt: 'Hi! What are the easiest vegetables and herbs to grow in a balcony?' },
  { label: 'Wholesale & Bulk Inquiry', prompt: 'Hello! I would like to inquire about bulk wholesale pricing.' }
];

export const ChatWidget = () => {
  const {
    isWidgetOpen,
    openWidget,
    closeWidget,
    customerMessages,
    customerTyping,
    customerUnreadCount,
    sendCustomerMessage,
    deleteMessageForEveryone,
    clearCustomerChat,
    sendTypingStatus,
    soundEnabled,
    toggleSound,
    supportOnline,
    saveGuestContact
  } = useChat();

  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [activeOrderContext, setActiveOrderContext] = useState(null);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [guestName, setGuestName] = useState(() => localStorage.getItem('fv_chat_guest_name') || '');
  const [guestPhone, setGuestPhone] = useState(() => localStorage.getItem('fv_chat_guest_phone') || '');
  const [guestNameInput, setGuestNameInput] = useState(() => localStorage.getItem('fv_chat_guest_name') || '');
  const [guestPhoneInput, setGuestPhoneInput] = useState(() => localStorage.getItem('fv_chat_guest_phone') || '');
  const [isSavingContact, setIsSavingContact] = useState(false);

  // Validate compulsory guest contact (Indian 10-digit phone + name)
  const isGuestContactValid = (name, phone) => {
    if (!name || name.trim().length < 2) return false;
    const digits = (phone || '').toString().replace(/\D/g, '').slice(-10);
    return Boolean(digits && /^[6-9]\d{9}$/.test(digits));
  };

  const hasVerifiedContact = Boolean(user || isGuestContactValid(guestName, guestPhone));

  // Media Attachment state
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl }
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // In-Chat Search state
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Header menu state (Clear chat, etc.)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatCanvasRef = useRef(null);

  const handleGuestContactSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanName = guestNameInput.trim();
    const digits = guestPhoneInput.replace(/\D/g, '').slice(-10);

    if (!cleanName || cleanName.length < 2) {
      toast.error('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!digits || !/^[6-9]\d{9}$/.test(digits)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsSavingContact(true);
    try {
      const ok = await saveGuestContact({ name: cleanName, phone: digits });
      if (ok) {
        setGuestName(cleanName);
        setGuestPhone(digits);
        setShowContactDrawer(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 150);
      }
    } finally {
      setIsSavingContact(false);
    }
  };

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
    return customerMessages.filter((m) => m.text && m.text.toLowerCase().includes(q));
  }, [customerMessages, inChatSearchQuery]);

  // Scroll to active search match
  useEffect(() => {
    if (matchingMessages.length > 0 && showSearchBar) {
      const match = matchingMessages[currentMatchIndex];
      if (match) {
        const id = match._id || match.clientMsgId;
        const el = document.getElementById(`customer-msg-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentMatchIndex, matchingMessages, showSearchBar]);

  const handleNextMatch = () => {
    if (matchingMessages.length <= 1) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchingMessages.length);
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length <= 1) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matchingMessages.length) % matchingMessages.length);
  };

  const handleCloseSearch = () => {
    setShowSearchBar(false);
    setInChatSearchQuery('');
    setCurrentMatchIndex(0);
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isWidgetOpen && !showSearchBar) {
      scrollToBottom('auto');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isWidgetOpen, showSearchBar]);

  useEffect(() => {
    if (isWidgetOpen && !showSearchBar) {
      scrollToBottom('smooth');
    }
  }, [customerMessages, customerTyping, isWidgetOpen, showSearchBar]);

  // Handle prefill event from external buttons
  useEffect(() => {
    const handlePrefill = (e) => {
      const { prompt, orderContext } = e.detail || {};
      if (prompt) setInputText(prompt);
      if (orderContext) setActiveOrderContext(orderContext);
    };

    window.addEventListener('in-app-chat-prefill', handlePrefill);
    return () => window.removeEventListener('in-app-chat-prefill', handlePrefill);
  }, []);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Emit typing indicator with debounce
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);
  };

  // Image File Picker handling
  const handleFileSelect = (e) => {
    if (!hasVerifiedContact) {
      toast.error('Please enter your Name and Mobile Number to start chatting.');
      return;
    }

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

  // Clipboard Paste handler (for screenshots)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        if (!hasVerifiedContact) {
          toast.error('Please enter your Name and Mobile Number to start chatting.');
          return;
        }

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
    if (!hasVerifiedContact) {
      toast.error('Please enter your Name and Mobile Number to start chatting.');
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({ file, previewUrl });
    }
  };

  const handleMicClick = () => {
    if (!hasVerifiedContact) {
      toast.error('Please enter your Name and Mobile Number to start chatting.');
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Upload image to Cloudinary backend endpoint
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

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    if (!hasVerifiedContact) {
      toast.error('Please enter your Name and Mobile Number to start chatting.');
      return;
    }

    const hasText = Boolean(inputText.trim());
    const hasImage = Boolean(pendingImage);

    if (!hasText && !hasImage) return;

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

    sendCustomerMessage(inputText, activeOrderContext, attachmentData);

    setInputText('');
    setPendingImage(null);
    setActiveOrderContext(null);
    sendTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isListening) stopListening();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const currentMatchMsgId =
    matchingMessages.length > 0 && matchingMessages[currentMatchIndex]
      ? matchingMessages[currentMatchIndex]._id || matchingMessages[currentMatchIndex].clientMsgId
      : null;

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="chat-widget-launcher fixed right-4 z-50 flex items-center gap-3 sm:bottom-6 sm:right-6">
        {!isWidgetOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openWidget()}
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0A4C36] hover:bg-[#073626] text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-emerald-400/40 cursor-pointer"
            aria-label="Open Live Chat Support"
          >
            {/* Green Pulse Ring */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />

            <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />

            {/* Unread Counter Badge */}
            {customerUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                {customerUnreadCount > 9 ? '9+' : customerUnreadCount}
              </span>
            )}

            {/* Online Status Dot */}
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                supportOnline ? 'bg-emerald-400' : 'bg-emerald-500'
              }`}
              title={supportOnline ? 'Support Online' : 'Support Active'}
            />
          </motion.button>
        )}
      </div>

      {/* WhatsApp-Style Chat Popover */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="chat-widget-popover fixed right-4 z-50 w-[calc(100vw-32px)] sm:right-6 sm:w-[420px] sm:bottom-6 sm:h-[640px] sm:max-h-[88vh] bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* Professional Helpdesk Top Header */}
            <div className="bg-[#0A4C36] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-700/80 border border-emerald-400/30 flex items-center justify-center text-white shadow-inner">
                    <Headphones className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0A4C36]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight text-white">Fresh Veggies Helpdesk</h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-300" title="Verified Support Desk" />
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-tight">
                    {supportOnline ? 'Online now · Instant replies' : 'Support desk active'}
                  </p>
                </div>
              </div>

              {/* Header Controls (Search, Sound, Options, Close) */}
              <div className="flex items-center gap-1">
                {/* Search In Chat Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchBar((prev) => !prev);
                    if (showSearchBar) handleCloseSearch();
                  }}
                  className={`p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors ${
                    showSearchBar ? 'bg-emerald-800 text-white' : ''
                  }`}
                  title="Search In Conversation"
                  aria-label="Search Messages"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors"
                  title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
                  aria-label="Toggle Sound"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* 3-Dot Options Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowHeaderMenu((prev) => !prev)}
                    className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors cursor-pointer"
                    title="Chat Options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showHeaderMenu && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-fv-border py-1 z-30 animate-fadeIn text-xs text-fv-heading dark:text-white">
                      <button
                        type="button"
                        onClick={() => {
                          setShowHeaderMenu(false);
                          if (window.confirm('Clear all messages in this conversation for everyone?')) {
                            clearCustomerChat();
                            toast.success('Chat history cleared');
                          }
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Chat History</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Close Widget */}
                <button
                  type="button"
                  onClick={closeWidget}
                  className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/60 transition-colors"
                  title="Close Live Chat"
                  aria-label="Close Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-Chat Search Bar Overlay */}
            {showSearchBar && (
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
                onClose={handleCloseSearch}
              />
            )}

            {/* Verified Guest Identity Status Bar */}
            {!user && hasVerifiedContact && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium text-emerald-900 dark:text-emerald-200 truncate">
                  <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
                  <span className="truncate">
                    Chatting as <strong>{guestName}</strong> ({guestPhone})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGuestNameInput(guestName);
                    setGuestPhoneInput(guestPhone);
                    setShowContactDrawer(!showContactDrawer);
                  }}
                  className="text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer ml-2 shrink-0 font-medium"
                >
                  {showContactDrawer ? 'Done' : 'Edit'}
                </button>
              </div>
            )}

            {/* Edit Drawer for Guest Contact */}
            {!user && hasVerifiedContact && showContactDrawer && (
              <form
                onSubmit={handleGuestContactSubmit}
                className="bg-white dark:bg-gray-800 p-3 border-b border-fv-border shadow-xs text-xs space-y-2 animate-fadeIn"
              >
                <p className="text-fv-muted text-[11px]">Update your name and phone number for this chat:</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-fv-border bg-fv-surface text-fv-heading text-xs"
                    maxLength={50}
                  />
                  <input
                    type="tel"
                    placeholder="10-digit Phone"
                    value={guestPhoneInput}
                    onChange={(e) => setGuestPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="px-2.5 py-1.5 rounded-lg border border-fv-border bg-fv-surface text-fv-heading text-xs"
                    maxLength={10}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowContactDrawer(false)}
                    className="px-2.5 py-1 rounded text-fv-muted hover:text-fv-heading text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingContact}
                    className="px-3 py-1 rounded bg-[#0A4C36] hover:bg-[#073626] text-white font-medium text-xs cursor-pointer"
                  >
                    {isSavingContact ? 'Saving...' : 'Save Details'}
                  </button>
                </div>
              </form>
            )}

            {/* WhatsApp Chat Canvas */}
            <div
              ref={chatCanvasRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 overflow-y-auto p-4 space-y-3 relative transition-colors ${
                isDragOver ? 'bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500 ring-inset' : ''
              }`}
            >
              {/* WhatsApp Wallpaper subtle pattern */}
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
                    Drop image to attach to chat
                  </p>
                </div>
              )}

              {/* Security Pill */}
              <div className="flex justify-center mb-2">
                <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[11px] px-3 py-1 rounded-md text-center max-w-[92%] border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Messages are secure and connected directly to our support desk.</span>
                </div>
              </div>

              {/* Conversation Date Pill */}
              <div className="flex justify-center my-2">
                <span className="bg-white/90 dark:bg-slate-800/90 text-slate-500 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  Today
                </span>
              </div>

              {/* Empty state greeting if no messages yet */}
              {customerMessages.length === 0 && (
                <div className="text-center py-6 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 mx-auto flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Welcome to Fresh Veggies!</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      How can our horticulture specialists assist your gardening journey today?
                    </p>
                  </div>

                  {/* Quick Starter Chips */}
                  <div className="pt-2 flex flex-col gap-1.5 text-left">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quick questions:</p>
                    {QUICK_STARTERS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInputText(item.prompt);
                          if (!hasVerifiedContact) {
                            toast('Please enter your Name and Mobile Number below to start chatting.');
                          } else {
                            setTimeout(() => inputRef.current?.focus(), 150);
                          }
                        }}
                        className="text-xs text-left bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 p-2.5 rounded-xl border border-fv-border shadow-2xs transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <span className="text-fv-muted group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Bubbles */}
              {customerMessages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                const msgId = msg._id || msg.clientMsgId;
                const isCurrentMatchedMsg = msgId === currentMatchMsgId;

                return (
                  <div
                    key={msgId}
                    id={`customer-msg-${msgId}`}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'} mb-2 group relative`}
                  >
                    <div
                      className={`relative max-w-[85%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                        isCustomer
                          ? 'bg-[#0A4C36] text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs border border-slate-200 dark:border-slate-700'
                      } ${isCurrentMatchedMsg ? 'ring-2 ring-amber-400 dark:ring-amber-300 shadow-md' : ''}`}
                    >
                      {/* Message Hover Actions (Delete for everyone) */}
                      <div
                        className={`absolute top-1 ${
                          isCustomer ? '-left-8' : '-right-8'
                        } opacity-0 group-hover:opacity-100 transition-opacity flex items-center`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this message for everyone?')) {
                              deleteMessageForEveryone(msg._id || msg.clientMsgId);
                            }
                          }}
                          className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 shadow-sm border border-fv-border cursor-pointer transition-colors"
                          title="Delete for everyone"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Sender label for admin response */}
                      {!isCustomer && (
                        <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                          {msg.senderName || 'Fresh Veggies Support'}
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
                            className="max-h-56 w-full object-cover rounded-xl group-hover/img:scale-102 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Embedded Order Context Card */}
                      {msg.orderContext && (
                        <div className="mb-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                            <Package className="w-3.5 h-3.5" />
                            <span>Order #{msg.orderContext.orderNumber || '—'}</span>
                          </div>
                          {msg.orderContext.totalAmount > 0 && (
                            <p className="text-[11px] text-fv-muted mt-0.5">
                              Amount: ₹{msg.orderContext.totalAmount} · Status: {msg.orderContext.orderStatus || 'Processing'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Message Text with Search Highlight */}
                      {msg.text && (
                        <p className="whitespace-pre-wrap break-words">
                          <HighlightedText
                            text={msg.text}
                            highlight={showSearchBar ? inChatSearchQuery : ''}
                            isCurrentMatch={isCurrentMatchedMsg}
                          />
                        </p>
                      )}

                      {/* Timestamp & Status Delivery Ticks */}
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                        isCustomer ? 'text-emerald-100/80' : 'text-slate-400'
                      }`}>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isCustomer && (
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
              })}

              {/* Real-time Typing Bubble */}
              {customerTyping && (
                <div className="flex items-start mb-2 animate-fadeIn">
                  <div className="bg-white dark:bg-[#202c33] px-4 py-2.5 rounded-2xl rounded-bl-xs border border-fv-border/50 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] text-fv-muted ml-1.5">Support is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pending Image Attachment Chip above input */}
            {pendingImage && (
              <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={pendingImage.previewUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                      {pendingImage.file.name}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      {(pendingImage.file.size / 1024).toFixed(1)} KB · Photo ready to send
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="p-1 rounded-full text-emerald-700 hover:text-red-600 hover:bg-emerald-100 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Active Order Context Pill above input */}
            {activeOrderContext && (
              <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 border-t border-emerald-300 dark:border-emerald-800 text-xs flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-1.5 truncate">
                  <Package className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                  <span className="truncate">Attaching Order #{activeOrderContext.orderNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOrderContext(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hidden File Picker Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Input Bar or Pre-Chat Guest Identification Form */}
            {!hasVerifiedContact ? (
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-fv-border shrink-0 shadow-lg">
                <form onSubmit={handleGuestContactSubmit} className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-fv-heading dark:text-white">
                        Start Chatting with Support
                      </h4>
                      <p className="text-[11px] text-fv-muted dark:text-gray-300 leading-snug">
                        No login or OTP required. Enter your name and phone number to chat directly with our team.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={guestNameInput}
                          onChange={(e) => setGuestNameInput(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          maxLength={50}
                          className="w-full pl-9 pr-3 py-2 bg-fv-surface dark:bg-gray-700 border border-fv-border rounded-xl text-xs sm:text-sm text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex">
                        <span className="inline-flex items-center px-2.5 rounded-l-xl border border-r-0 border-fv-border bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          required
                          value={guestPhoneInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setGuestPhoneInput(val);
                          }}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className="w-full pl-3 pr-3 py-2 bg-fv-surface dark:bg-gray-700 border border-fv-border rounded-r-xl text-xs sm:text-sm text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <p className="text-[10px] text-fv-muted mt-1">
                        Compulsory for support follow-up. Zero spam guaranteed.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingContact || !guestNameInput.trim() || guestPhoneInput.length < 10}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0A4C36] hover:bg-[#073626] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingContact ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Start Chatting 🌿</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-white dark:bg-gray-800 border-t border-fv-border flex items-end gap-1.5 shrink-0"
              >
                {/* Paperclip / Image Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  title="Attach photo / screenshot"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={isListening ? 'Listening... speak now...' : 'Type a message...'}
                  className="flex-1 max-h-24 resize-none bg-fv-surface dark:bg-gray-700 border border-fv-border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                />

                {/* Voice-to-Text Microphone Dictation Button */}
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-md ring-4 ring-red-400/40'
                      : 'text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-700'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Voice Dictation (Speech to text)'}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 animate-bounce" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  {isListening && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !pendingImage) || isUploadingImage}
                  className="w-9 h-9 rounded-xl bg-[#0A4C36] hover:bg-[#073626] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shrink-0 cursor-pointer active:scale-95"
                  title="Send Message"
                  aria-label="Send"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImageUrl && (
        <ChatImageLightbox
          imageUrl={lightboxImageUrl}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}
    </>
  );
};

export default ChatWidget;

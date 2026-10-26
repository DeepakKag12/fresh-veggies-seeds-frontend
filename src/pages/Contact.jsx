import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Headphones,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';

const socials = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
];

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Gardening Advice & Sowing Tips',
  'Order Status & Tracking',
  'Bulk / Wholesale Orders',
  'Product Feedback'
];

const FAQS = [
  {
    q: 'How do I track my seed shipment & delivery?',
    a: 'You can monitor your package in real-time from your Orders page. We provide live DTDC Express tracking links and AWB consignment numbers as soon as your parcel is dispatched from our nursery.',
    tag: 'Shipping & Delivery'
  },
  {
    q: 'What is your order cancellation & refund policy?',
    a: 'You can cancel any order with 1-click directly from the Order Details page while its status is "Pending" or "Confirmed". Reserved inventory is restored instantly, and online prepaid payments are refunded within 5-7 business days.',
    tag: 'Orders & Refunds'
  },
  {
    q: 'Do you offer Cash on Delivery (COD) across India?',
    a: 'Yes! We support Cash on Delivery across 25,000+ serviceable postal pincodes throughout India. A dynamic handling surcharge may apply based on your cart value and store settings.',
    tag: 'Payments'
  },
  {
    q: 'What is the average germination rate of your seeds?',
    a: 'All our open-pollinated and heirloom seed batches are tested for a guaranteed 85%+ germination rate. Every product includes climate, sowing depth, and seasonal germination tips.',
    tag: 'Gardening Tips'
  },
  {
    q: 'How do I place bulk orders for nurseries or landscape projects?',
    a: 'Simply select "Bulk / Wholesale Orders" in the contact form above, or click the Live Chat button to chat directly with our commercial wholesale division for custom tiered bulk pricing.',
    tag: 'Wholesale'
  }
];

const Contact = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(null);
  const { settings } = useSettings();
  const store = settings?.store || {};

  const storePhone = store.phone || '9876543210';
  const rawPhone = storePhone.replace(/\D/g, '');
  const telHref = rawPhone ? `tel:+${rawPhone.length === 10 ? '91' + rawPhone : rawPhone}` : 'tel:+919876543210';

  const storeEmail = store.email || 'contact@freshveggies.me';
  const storeAddress = store.address || '123 Garden Street, Indore, Madhya Pradesh 452001';
  const storeHours = store.businessHours || '9:00 AM – 8:00 PM';

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation
    const cleanName = formData.name.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    if (formData.phone && cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number, or leave it blank.');
      return;
    }

    const cleanMessage = formData.message.trim();
    if (!cleanMessage || cleanMessage.length < 10) {
      setErrorMsg('Please enter your message (minimum 10 characters).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/contact', {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        subject: formData.subject,
        message: cleanMessage,
        guestId: localStorage.getItem('fv_chat_guest_id') || undefined
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Thank you! Your message has been sent directly to our live chat support team.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'General Inquiry',
          message: ''
        });
      } else {
        setErrorMsg(res.data?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        'Unable to send your inquiry at this moment. Please try again or reach out via Live Chat.'
      );
    } finally {
      setLoading(false);
    }
  };

  const contactItems = [
    {
      icon: MessageCircle,
      label: 'Live Gardener Desk',
      value: 'Instant In-App Chat',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('open-in-app-chat', {
          detail: { prompt: `Hello! I would like to consult with the ${store.name || 'Fresh Veggies'} gardener team.` }
        }));
      },
      color: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      action: 'Chat with our horticulturist',
    },
    {
      icon: Phone,
      label: 'Phone Support',
      value: storePhone,
      href: telHref,
      color: 'bg-fv-cream text-fv-primary border border-fv-border',
    },
    {
      icon: Mail,
      label: 'Email Support',
      value: storeEmail,
      href: `mailto:${storeEmail}`,
      color: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    },
    {
      icon: MapPin,
      label: 'Nursery & Fulfillment Center',
      value: storeAddress,
      color: 'bg-amber-50 text-amber-900 border border-amber-200',
    },
  ];

  return (
    <div className="min-h-screen bg-fv-page py-6 sm:py-10 md:py-16 pb-36 sm:pb-24">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-10">
        {/* Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-fv-muted">
              <li>
                <Link to="/" className="hover:text-fv-primary hover:underline font-medium">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
              <li aria-current="page" className="font-semibold text-fv-heading">
                Contact & Support
              </li>
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => {
              if (location.state?.from) {
                navigate(location.state.from);
              } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 hover:bg-fv-surface text-xs font-semibold text-fv-heading transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-fv-primary" />
            <span>Back</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-md mb-3">
            <Headphones className="w-3.5 h-3.5 text-slate-500" />
            <span>Customer Support & Inquiries</span>
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-fv-heading tracking-tight">
            We&apos;re Here to Help You
          </h1>
          <p className="mt-2.5 text-xs sm:text-base text-fv-muted leading-relaxed">
            Have questions about plant care, germination tips, soil mixes, or existing orders?
            Our support specialists are always ready to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 mb-8 sm:mb-12 items-start">
          {/* Left Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-8 lg:p-10 border border-fv-border shadow-xs">
            <div className="mb-6">
              <h2 className="text-lg sm:text-2xl font-bold text-fv-heading dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-fv-primary" /> Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-fv-muted mt-1">
                Fill out the form below and our agricultural team will respond within 24 business hours.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg ? (
              <div className="p-6 sm:p-8 bg-fv-cream dark:bg-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-fv-primary">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white">Message Sent to Live Support Desk!</h3>
                  <p className="text-xs sm:text-sm text-fv-muted mt-1 max-w-md mx-auto">{successMsg}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-in-app-chat'));
                    }}
                    className="inline-flex items-center justify-center gap-2 text-xs font-bold text-white bg-[#0A4C36] hover:bg-[#073626] px-5 py-2.5 rounded-full transition-all shadow-md cursor-pointer min-h-[44px]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Live Chat to View Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuccessMsg('')}
                    className="inline-flex items-center justify-center text-xs font-bold text-fv-primary bg-white dark:bg-gray-800 border border-fv-border px-5 py-2.5 rounded-full hover:bg-fv-cream transition-colors min-h-[44px] cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-fv-heading dark:text-gray-200 mb-1.5" htmlFor="contact-name">
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-fv-surface dark:bg-gray-700/50 border border-fv-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-fv-primary text-fv-heading dark:text-white min-h-[44px]"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-fv-heading dark:text-gray-200 mb-1.5" htmlFor="contact-email">
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-fv-surface dark:bg-gray-700/50 border border-fv-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-fv-primary text-fv-heading dark:text-white min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-fv-heading dark:text-gray-200 mb-1.5" htmlFor="contact-phone">
                      Phone Number (Optional)
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-fv-surface dark:bg-gray-700/50 border border-fv-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-fv-primary text-fv-heading dark:text-white min-h-[44px]"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-fv-heading dark:text-gray-200 mb-1.5" htmlFor="contact-subject">
                      Topic / Subject
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-fv-surface dark:bg-gray-700/50 border border-fv-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-fv-primary text-fv-heading dark:text-white min-h-[44px] cursor-pointer"
                    >
                      {SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold text-fv-heading dark:text-gray-200 mb-1.5" htmlFor="contact-message">
                    Your Message / Question *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    placeholder="Tell us how we can help you with seeds, germination tips, soil mixes, or order queries..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-fv-surface dark:bg-gray-700/50 border border-fv-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-fv-primary text-fv-heading dark:text-white resize-y min-h-[100px]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-fv-primary hover:bg-fv-primary-dark text-white font-bold rounded-xl sm:rounded-full text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xs disabled:opacity-70 cursor-pointer min-h-[48px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Contact Details + Business Hours (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Contact Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-8 border border-fv-border shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white mb-5">Support Channels</h2>
              <div className="space-y-4">
                {contactItems.map(({ icon: Icon, label, value, href, color, action, onClick }) => (
                  <div key={label} className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-fv-muted font-medium">{label}</p>
                      {onClick ? (
                        <button
                          type="button"
                          onClick={onClick}
                          className="text-sm font-bold text-fv-heading dark:text-white hover:text-fv-primary transition-colors block text-left truncate mt-0.5 cursor-pointer"
                        >
                          {value}
                        </button>
                      ) : href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-fv-heading dark:text-white hover:text-fv-primary transition-colors block truncate mt-0.5"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-fv-heading dark:text-white leading-snug mt-0.5">{value}</p>
                      )}
                      {action && (
                        onClick ? (
                          <button
                            type="button"
                            onClick={onClick}
                            className="inline-block mt-1 text-xs font-bold text-fv-primary hover:underline cursor-pointer"
                          >
                            {action} &rarr;
                          </button>
                        ) : href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-1 text-xs font-bold text-fv-primary hover:underline"
                          >
                            {action} &rarr;
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Hours & Community */}
            <div className="bg-white dark:bg-gray-800 rounded-[20px] sm:rounded-[24px] p-4 sm:p-8 border border-fv-border shadow-xs">
              <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-fv-primary" />
                Operating Hours
              </h2>
              <p className="text-xs text-fv-muted mb-4">
                Our customer desk is active during standard Indian business hours:
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-fv-muted">Support Desk</span>
                  <span className="font-bold text-fv-heading dark:text-white">{storeHours}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-fv-muted">In-App Live Chat</span>
                  <span className="font-bold text-fv-primary">Daily (9 AM – 9 PM)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-fv-muted">Online Storefront</span>
                  <span className="font-bold text-fv-heading dark:text-white">24/7 Active</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-fv-heading dark:text-white mb-2.5">Follow Our Gardening Community</p>
                <div className="flex items-center gap-2.5">
                  {socials.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="w-9 h-9 rounded-xl border border-fv-border text-fv-muted hover:text-fv-primary hover:border-emerald-300 hover:bg-fv-cream flex items-center justify-center transition-colors min-h-[36px]"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive FAQ Accordion Section */}
        <div className="bg-white dark:bg-gray-800 rounded-[24px] p-6 sm:p-10 border border-fv-border shadow-xs mb-8">
          <div className="max-w-2xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-slate-200 dark:border-slate-700">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Self-Service Help Desk</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-fv-heading dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-fv-muted mt-1">
              Find instant answers regarding order tracking, seed germination guarantees, cancellation rules, and commercial wholesale pricing.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isExpanded = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-fv-border bg-fv-surface/40 hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isExpanded ? null : idx)}
                    aria-expanded={isExpanded}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs sm:text-sm font-bold text-fv-heading dark:text-white">
                        {faq.q}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-fv-muted">
                        {faq.tag}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-fv-primary' : 'text-fv-muted'
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-fv-muted dark:text-gray-300 border-t border-emerald-100 dark:border-emerald-900/40 mt-1 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* In-App Live Advice Banner */}
        <div className="bg-fv-primary rounded-[20px] sm:rounded-[24px] p-5 sm:p-8 md:p-10 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-6 shadow-md mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-fv-yellow" />
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight">Need Immediate Gardening Advice?</h3>
            </div>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Our horticulture specialists are available in real time to guide you on seed sowing,
              soil mixtures, organic pest management, and choosing the best varieties for your balcony.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-in-app-chat', {
                detail: { prompt: 'Hello! I need quick gardening advice for my plants.' }
              }));
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-full bg-fv-yellow hover:brightness-95 px-6 py-3.5 text-sm font-bold text-fv-primary shadow-sm transition-all shrink-0 cursor-pointer w-full sm:w-auto min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4 text-fv-primary" />
            <span>Chat Live with Expert</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Contact;

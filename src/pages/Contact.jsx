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
  MessageSquare
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';

const socials = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
];

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Gardening Advice & Tips',
  'Order Status & Tracking',
  'Bulk / Wholesale Orders',
  'Product Feedback'
];

/**
 * [CHG-012] & [CHG-014] Professional Contact Page with Live Form & Store Settings Integration.
 * Automatically synchronizes with store settings for phone, WhatsApp,
 * email, physical address, and operating business hours, plus a validated
 * contact inquiry form connected to POST /api/contact.
 */
const Contact = () => {
  const { settings } = useSettings();
  const store = settings?.store || {};

  const storePhone = store.phone || '9876543210';
  const rawPhone = storePhone.replace(/\D/g, '');
  const telHref = rawPhone ? `tel:+${rawPhone.length === 10 ? '91' + rawPhone : rawPhone}` : 'tel:+919876543210';

  const storeWhatsapp = store.whatsappNumber || storePhone;
  const rawWhatsapp = (storeWhatsapp || '').replace(/\D/g, '');
  const cleanWhatsapp = rawWhatsapp.length === 10 ? `91${rawWhatsapp}` : rawWhatsapp || '919876543210';
  const whatsappHref = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Hello! I need help with ${store.name || 'Fresh Veggies'} products.`)}`;

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
        message: cleanMessage
      });

      if (res.data?.success) {
        setSuccessMsg(res.data.message || 'Thank you! Your message has been sent successfully.');
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
        'Unable to send your inquiry at this moment. Please try again or reach out on WhatsApp.'
      );
    } finally {
      setLoading(false);
    }
  };

  const contactItems = [
    {
      icon: Phone,
      label: 'Phone Support',
      value: storePhone,
      href: telHref,
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Support',
      value: storeWhatsapp,
      href: whatsappHref,
      color: 'bg-green-50 text-green-700 border border-green-200',
      action: 'Chat with us',
    },
    {
      icon: Mail,
      label: 'Email Support',
      value: storeEmail,
      href: `mailto:${storeEmail}`,
      color: 'bg-sky-50 text-sky-700 border border-sky-200',
    },
    {
      icon: MapPin,
      label: 'Store Address',
      value: storeAddress,
      color: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block text-xs uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full mb-2">
            Customer Support & Advice
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 font-serif tracking-tight">
            Contact Fresh Veggies
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Have questions about our organic vegetable seeds, home garden kits, or orders?
            Our agricultural team is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 items-start">
          {/* Left Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" /> Send Us a Message
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Fill out the form below and our team will get back to you within 24 business hours.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Message Received!</h3>
                  <p className="text-sm text-slate-600 mt-1">{successMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMsg('')}
                  className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="contact-name">
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="contact-email">
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="contact-phone">
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
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="contact-subject">
                      Topic / Subject
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="contact-message">
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
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900 resize-y"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
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
              </form>
            )}
          </div>

          {/* Right Column: Contact Details + Business Hours (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Contact Cards */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Support Channels</h2>
              <div className="space-y-4">
                {contactItems.map(({ icon: Icon, label, value, href, color, action }) => (
                  <div key={label} className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500 font-medium">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-slate-800 hover:text-emerald-700 transition-colors block truncate"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{value}</p>
                      )}
                      {action && href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          {action} &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Hours & Socials */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Operating Hours
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Our support desk is active during standard Indian business hours:
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Customer Desk</span>
                  <span className="font-semibold text-slate-800">{storeHours}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">WhatsApp Chat</span>
                  <span className="font-semibold text-emerald-700">Everyday (9 AM - 9 PM)</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">Online Store</span>
                  <span className="font-semibold text-slate-800">24/7 Available</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">Connect With Our Gardening Community</p>
                <div className="flex items-center gap-2">
                  {socials.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Help CTA (No Emojis) */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-800 rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare className="w-5 h-5 text-emerald-300" />
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">Need Immediate Gardening Advice?</h3>
            </div>
            <p className="text-emerald-100/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Our horticulture specialists are available on WhatsApp to guide you on seed sowing,
              organic pest management, and selecting suitable plant varieties for your balcony or terrace.
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;

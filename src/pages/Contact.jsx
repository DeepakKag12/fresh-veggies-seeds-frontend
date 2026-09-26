import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Twitter, Clock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const socials = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
];

/**
 * [CHG-012] Dynamic Contact Page powered by Admin App Settings.
 * Automatically synchronizes with store settings for phone, WhatsApp,
 * email, physical address, and operating business hours.
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

  const contactItems = [
    {
      icon: Phone,
      label: 'Phone Support',
      value: storePhone,
      href: telHref,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Support',
      value: storeWhatsapp,
      href: whatsappHref,
      color: 'bg-fv-cream text-fv-primary',
      action: 'Chat with us',
    },
    {
      icon: Mail,
      label: 'Email Support',
      value: storeEmail,
      href: `mailto:${storeEmail}`,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      icon: MapPin,
      label: 'Store Address',
      value: storeAddress,
      color: 'bg-red-100 text-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-fv-page py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-fv-heading mb-6 font-serif">
          Contact Us
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Get in Touch */}
          <div className="bg-white rounded-[12px] p-6 border border-fv-border">
            <h2 className="text-xl font-bold text-fv-heading mb-2">Get in Touch</h2>
            <p className="text-sm text-fv-muted mb-6">
              Have questions about our products or need gardening advice? We're here to help!
            </p>
            <div className="space-y-5">
              {contactItems.map(({ icon: Icon, label, value, href, color, action }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-fv-muted mb-0.5">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-fv-heading hover:text-fv-primary transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-fv-heading">{value}</p>
                    )}
                    {action && href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1 text-xs font-semibold text-fv-primary border border-fv-primary px-3 py-1 rounded-full hover:bg-fv-cream transition-colors"
                      >
                        {action}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Hours + Socials */}
          <div className="bg-white rounded-[12px] p-6 border border-fv-border">
            <h2 className="text-xl font-bold text-fv-heading mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-fv-primary" />
              Business Hours
            </h2>
            <p className="text-sm text-fv-muted mb-4">
              We're available to help you during standard operating hours:
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center py-2.5 border-b border-fv-border">
                <span className="text-sm text-fv-ink font-medium">Standard Hours</span>
                <span className="text-sm font-semibold text-fv-heading">{storeHours}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-fv-border">
                <span className="text-sm text-fv-ink font-medium">WhatsApp Assistance</span>
                <span className="text-sm font-semibold text-fv-success">Active Every Day</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-fv-ink font-medium">Online Orders</span>
                <span className="text-sm font-semibold text-fv-heading">Open 24/7</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-fv-heading mb-1">Follow Us</h3>
            <p className="text-xs text-fv-muted mb-3">Stay updated with gardening tips and seasonal offers</p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-fv-border text-fv-ink rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-fv-primary rounded-[18px] p-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">💬 Need Gardening Advice?</h3>
            <p className="text-white/80 text-sm max-w-xl">
              Our team is happy to help with seeds, soil mixes, and grow bag recommendations.
              Reach out directly on WhatsApp for prompt support!
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-fv-primary shadow-sm hover:bg-fv-cream transition-all shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;



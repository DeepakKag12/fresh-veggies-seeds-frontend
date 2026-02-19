import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Twitter, Clock } from 'lucide-react';

const contactItems = [
  {
    icon: Phone,
    label: 'Phone',
    value: '+91 99932 48054',
    href: 'tel:+919993248054',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+91 99932 48054',
    href: 'https://wa.me/919993248054',
    color: 'bg-green-100 text-green-600',
    action: 'Chat with us',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@freshveggies.com',
    href: 'mailto:info@freshveggies.com',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: MapPin,
    label: 'Location',
    value: 'India',
    color: 'bg-red-100 text-red-600',
  },
];

const hours = [
  { day: 'Monday – Saturday', time: '9:00 AM – 7:00 PM' },
  { day: 'Sunday', time: '10:00 AM – 5:00 PM' },
];

const socials = [
  { icon: Facebook, label: 'Facebook', href: 'https://facebook.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter, label: 'Twitter', href: 'https://twitter.com' },
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-4">

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Contact Us
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Get in Touch */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get in Touch</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Have questions about our products or need gardening advice? We're here to help!
            </p>
            <div className="space-y-5">
              {contactItems.map(({ icon: Icon, label, value, href, color, action }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-900 dark:text-white hover:text-green-600 transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
                    )}
                    {action && href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-1 text-xs font-semibold text-green-600 border border-green-500 px-3 py-1 rounded-full hover:bg-green-50 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Business Hours
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              We're available to help you during these hours:
            </p>
            <div className="space-y-3 mb-8">
              {hours.map(({ day, time }) => (
                <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{time}</span>
                </div>
              ))}
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Follow Us</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Stay updated with gardening tips and offers</p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">💬 Need Gardening Help?</h3>
          <p className="text-green-100 text-sm">
            Our team is happy to help with any gardening questions — from seed selection to growing tips.
            Feel free to reach out via WhatsApp for quick support!
          </p>
        </div>

      </div>
    </div>
  );
};

export default Contact;



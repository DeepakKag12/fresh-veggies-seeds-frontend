import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    'Quick Links': [
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' },
      { name: 'Combo Offers', path: '/combos' },
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
    ],
    'Customer Care': [
      { name: 'My Orders', path: '/orders' },
      { name: 'Shopping Cart', path: '/cart' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms & Conditions', path: '/terms' },
      { name: 'Return Policy', path: '/returns' },
    ],
    'Categories': [
      { name: 'Vegetable Seeds', path: '/shop?category=vegetables' },
      { name: 'Fruit Seeds', path: '/shop?category=fruits' },
      { name: 'Herb Seeds', path: '/shop?category=herbs' },
      { name: 'Flower Seeds', path: '/shop?category=flowers' },
      { name: 'Combo Packs', path: '/combos' },
    ],
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <img 
                src="/logo.png" 
                alt="Fresh Veggies" 
                className="h-16 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>
            <p className="text-green-400 text-sm mb-3 font-medium">
              Treat Your Self Organic
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Premium quality organic seeds and gardening supplies for your home garden. 
              Grow fresh, healthy vegetables with our certified organic products.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <a href="tel:+919993248054" className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors">
                <Phone className="w-4 h-4" />
                +91 99932 48054
              </a>
              <a href="mailto:info@freshveggies.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition-colors">
                <Mail className="w-4 h-4" />
                info@freshveggies.com
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>123 Garden Street, Green City, India</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold text-base mb-4 text-white">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-green-400 transition-colors inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media & Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Follow Us:</span>
              <div className="flex gap-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/919993248054"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="text-sm text-gray-400 flex items-center gap-2">
              <span>Payment Methods:</span>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-gray-800 rounded text-xs">COD</div>
                <div className="px-2 py-1 bg-gray-800 rounded text-xs">UPI</div>
                <div className="px-2 py-1 bg-gray-800 rounded text-xs">Card</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-400">
            <p className="flex items-center gap-1">
              © {currentYear} Fresh Veggies. Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> in India
            </p>
            <p>Created by Deepak Kag | All Rights Reserved</p>
          </div>
        </div>
      </div>

      {/* Extra padding for mobile bottom nav */}
      <div className="h-16 md:hidden" />
    </footer>
  );
};

export default Footer;

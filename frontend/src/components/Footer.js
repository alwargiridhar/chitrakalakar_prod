import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_NAME, BRAND_TAGLINE } from '../utils/branding';

function Footer() {
  const footerLinks = {
    Company: [
      { label: 'About Us', href: '/about' },
      { label: 'For Artists', href: '/signup' },
      { label: 'For Users', href: '/signup' },
      { label: 'Contact', href: '/contact' },
    ],
    Community: [
      { label: 'Featured Artworks', href: '/exhibitions' },
      { label: 'Artist Directory', href: '/artists' },
      { label: 'Art Classes', href: '/art-classes' },
      { label: 'How It Works', href: '/contact' },
    ],
    Support: [
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-50 pt-16 pb-8 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/logo.png" 
                alt="ChitraKalakar Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h3 className="font-bold text-base">{BRAND_NAME}</h3>
                <p className="text-xs text-gray-400">{BRAND_TAGLINE}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              One stop solution for all your art requirements. Connecting artists and art lovers through sustainable, artist-centric platforms.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>📧</span>
                <span>info@chitrakalakar.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>📞</span>
                <span>+91 9884984454</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>📍</span>
                <span>India</span>
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-white">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm text-gray-400 hover:text-orange-500 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-700 hover:bg-orange-500 transition-colors flex items-center justify-center">
              <span>f</span>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-700 hover:bg-orange-500 transition-colors flex items-center justify-center">
              <span>📷</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-700 hover:bg-orange-500 transition-colors flex items-center justify-center">
              <span>𝕏</span>
            </a>
          </div>
          <p className="text-sm text-gray-400">© 2025 {BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

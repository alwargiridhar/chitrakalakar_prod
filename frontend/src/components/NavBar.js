import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, BRAND_TAGLINE } from '../utils/branding';

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showExhibitionDropdown, setShowExhibitionDropdown] = useState(false);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowExhibitionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'About', href: '/about' },
    { label: 'Paintings', href: '/paintings' },
    { label: 'Artists', href: '/artists' },
  ];

  const navLinksAfterExhibitions = [
    { label: 'Contact', href: '/contact' },
    { label: 'Art Classes', href: '/art-classes' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="ChitraKalakar Logo" 
              className="w-10 h-10 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">{BRAND_NAME}</h1>
              <p className="text-xs text-gray-500">{BRAND_TAGLINE}</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
                {link.label}
              </Link>
            ))}
            
            {/* Exhibitions Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onMouseEnter={() => setShowExhibitionDropdown(true)}
                onClick={() => setShowExhibitionDropdown(!showExhibitionDropdown)}
                className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors flex items-center gap-1"
              >
                Exhibitions
                <svg className={`w-4 h-4 transition-transform ${showExhibitionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExhibitionDropdown && (
                <div 
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                  onMouseLeave={() => setShowExhibitionDropdown(false)}
                >
                  <Link
                    to="/exhibitions"
                    onClick={() => setShowExhibitionDropdown(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                  >
                    🎨 Active Exhibitions
                  </Link>
                  <Link
                    to="/exhibitions/archived"
                    onClick={() => setShowExhibitionDropdown(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                  >
                    📁 Archived Exhibitions
                  </Link>
                </div>
              )}
            </div>

            {/* Links after Exhibitions */}
            {navLinksAfterExhibitions.map((link) => (
              <Link key={link.href} to={link.href} className="text-sm font-medium text-gray-700 hover:text-orange-500 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-gray-700 mr-2">{user?.name?.split(' ')[0]}</span>
                {isAdmin ? (
                  <Link to="/admin" className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                    Admin Panel
                  </Link>
                ) : user?.role === 'lead_chitrakar' ? (
                  <Link to="/lead-chitrakar" className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600">
                    Lead Chitrakar
                  </Link>
                ) : user?.role === 'kalakar' ? (
                  <Link to="/kalakar" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
                    Kalakar Panel
                  </Link>
                ) : user?.role === 'artist' ? (
                  <Link to="/dashboard" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                    Artist Dashboard
                  </Link>
                ) : (
                  <Link to="/user-dashboard" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                    My Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-50">
                  Login
                </Link>
                <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg text-sm font-medium hover:opacity-90">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-md hover:bg-gray-100">
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                {link.label}
              </Link>
            ))}
            <Link to="/exhibitions" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
              🎨 Active Exhibitions
            </Link>
            <Link to="/exhibitions/archived" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
              📁 Archived Exhibitions
            </Link>
            {navLinksAfterExhibitions.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 space-y-2 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={
                      isAdmin ? '/admin' : 
                      user?.role === 'lead_chitrakar' ? '/lead-chitrakar' :
                      user?.role === 'kalakar' ? '/kalakar' :
                      user?.role === 'artist' ? '/dashboard' :
                      '/user-dashboard'
                    } 
                    onClick={() => setIsOpen(false)} 
                    className="block w-full px-4 py-2 bg-orange-500 text-white text-center rounded-lg"
                  >
                    {isAdmin ? 'Admin Panel' : 
                     user?.role === 'lead_chitrakar' ? 'Lead Chitrakar' :
                     user?.role === 'kalakar' ? 'Kalakar Panel' :
                     user?.role === 'artist' ? 'Artist Dashboard' :
                     'My Dashboard'}
                  </Link>
                  <button onClick={handleLogout} className="block w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full px-4 py-2 border border-orange-500 text-orange-500 text-center rounded-lg">
                    Login
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="block w-full px-4 py-2 bg-orange-500 text-white text-center rounded-lg">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;

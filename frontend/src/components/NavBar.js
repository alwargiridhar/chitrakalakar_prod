import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BRAND_NAME, BRAND_TAGLINE } from '../utils/branding';

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showExhibitionDropdown, setShowExhibitionDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { isAuthenticated, user, profiles, logout, isAdmin, isArtist } = useAuth();
  const navigate = useNavigate();
  const exhibitionDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setShowUserDropdown(false);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exhibitionDropdownRef.current && !exhibitionDropdownRef.current.contains(event.target)) {
        setShowExhibitionDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
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
    { label: 'Communities', href: '/communities' },
    { label: 'Contact', href: '/contact' },
    { label: 'Art Classes', href: '/art-classes' },
  ];

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (isAdmin) return { href: '/admin', label: 'Admin Dashboard' };
    if (profiles?.role === 'lead_chitrakar') return { href: '/lead-chitrakar', label: 'Lead Chitrakar' };
    if (profiles?.role === 'kalakar') return { href: '/kalakar', label: 'Kalakar Panel' };
    if (isArtist) return { href: '/dashboard', label: 'Artist Dashboard' };
    return { href: '/user-dashboard', label: 'My Dashboard' };
  };

  // Get user menu items based on role
  const getUserMenuItems = () => {
    const items = [
      { label: 'Profile', href: '/profile', icon: '👤' },
      { label: getDashboardLink().label, href: getDashboardLink().href, icon: '📊' },
      { label: 'Account Settings', href: '/account', icon: '⚙️' },
    ];

    // Add subscription for artists
    if (isArtist) {
      items.push({ label: 'Subscription', href: '/subscription', icon: '💳' });
    }

    items.push({ label: 'Change Password', href: '/change-password', icon: '🔐' });

    return items;
  };

  // Get avatar initial
  const getAvatarInitial = () => {
    const name = profiles?.full_name || user?.name || 'U';
    return name.charAt(0).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    if (isAdmin) return 'bg-red-500';
    if (profiles?.role === 'lead_chitrakar') return 'bg-purple-500';
    if (profiles?.role === 'kalakar') return 'bg-blue-500';
    if (isArtist) return 'bg-orange-500';
    return 'bg-gray-500';
  };

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
            <div className="relative" ref={exhibitionDropdownRef}>
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
                {/* User Avatar Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    data-testid="user-menu-button"
                  >
                    {/* Avatar Circle */}
                    <div className={`w-10 h-10 rounded-full ${getRoleBadgeColor()} flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden`}>
                      {profiles?.avatar ? (
                        <img src={profiles.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        getAvatarInitial()
                      )}
                    </div>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${getRoleBadgeColor()} flex items-center justify-center text-white font-bold overflow-hidden`}>
                            {profiles?.avatar ? (
                              <img src={profiles.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              getAvatarInitial()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {profiles?.full_name || user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs text-white ${getRoleBadgeColor()}`}>
                              {isAdmin ? 'Admin' : 
                               profiles?.role === 'lead_chitrakar' ? 'Lead Chitrakar' :
                               profiles?.role === 'kalakar' ? 'Kalakar' :
                               isArtist ? 'Artist' : 'User'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {getUserMenuItems().map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            data-testid={`menu-${item.label.toLowerCase().replace(' ', '-')}`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          data-testid="logout-button"
                        >
                          <span className="text-lg">🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

        {/* Mobile Menu */}
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
            
            {/* Mobile User Menu */}
            <div className="pt-2 space-y-2 border-t border-gray-200">
              {/* Install App Button */}
              <button 
                onClick={() => {
                  if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                  } else {
                    alert('To install: Open browser menu → "Add to Home Screen" or "Install App"');
                  }
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-base font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md mx-2"
                style={{ width: 'calc(100% - 16px)' }}
              >
                <span>📲</span>
                Install App
              </button>

              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="px-3 py-3 bg-gray-50 rounded-lg mx-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getRoleBadgeColor()} flex items-center justify-center text-white font-bold overflow-hidden`}>
                        {profiles?.avatar ? (
                          <img src={profiles.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          getAvatarInitial()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{profiles?.full_name || user?.name}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs text-white ${getRoleBadgeColor()}`}>
                          {isAdmin ? 'Admin' : isArtist ? 'Artist' : 'User'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  {getUserMenuItems().map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}

                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <span>🚪</span>
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

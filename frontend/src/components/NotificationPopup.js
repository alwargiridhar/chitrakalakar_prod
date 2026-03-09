import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';

function NotificationPopup() {
  const [notifications, setNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationAPI.getRecent();
        if (response.notifications && response.notifications.length > 0) {
          setNotifications(response.notifications);
          setVisible(true);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      const cycleInterval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000); // Show each notification for 5 seconds

      return () => clearInterval(cycleInterval);
    }
  }, [notifications.length]);

  if (!visible || notifications.length === 0) return null;

  const notification = notifications[currentIndex];

  return (
    <div 
      className="fixed bottom-24 right-6 z-40 animate-slide-in"
      data-testid="notification-popup"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            {notification.type === 'purchase' ? (
              <span className="text-lg">🎉</span>
            ) : (
              <span className="text-lg">📦</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {notification.type === 'purchase' ? (
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-orange-600">{notification.user_name}</span>
                {' '}purchased an artwork
                <span className="text-gray-500"> • {notification.time_ago}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-purple-600">{notification.artist_name}</span>
                {' '}sold a painting
                <span className="text-gray-500"> • {notification.time_ago}</span>
              </p>
            )}
            {notification.artwork_title && (
              <p className="text-xs text-gray-500 truncate mt-1">
                &ldquo;{notification.artwork_title}&rdquo;
              </p>
            )}
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default NotificationPopup;

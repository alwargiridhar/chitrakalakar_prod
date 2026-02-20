import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function InstallAppPage() {
  const [canInstall, setCanInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(standalone);

    // Check if install prompt is available
    if (window.deferredPrompt) {
      setCanInstall(true);
    }

    // Listen for the prompt becoming available
    const handleBeforeInstall = () => {
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (window.deferredPrompt) {
      setInstalling(true);
      try {
        await window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          alert('App installed successfully! Check your home screen.');
        }
        window.deferredPrompt = null;
        setCanInstall(false);
      } catch (error) {
        console.error('Install error:', error);
      }
      setInstalling(false);
    }
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <span className="text-7xl mb-6 block">✅</span>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Already Installed!</h1>
            <p className="text-gray-600 mb-6">
              You're already using ChitraKalakar as an app. Enjoy the full experience!
            </p>
            <Link
              to="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-8 px-4" data-testid="install-app-page">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo192.png" alt="ChitraKalakar" className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Install ChitraKalakar</h1>
          <p className="text-gray-600">Get the app for a better experience</p>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Why Install?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Faster Loading', desc: 'App loads instantly from your home screen' },
              { icon: '📴', title: 'Works Offline', desc: 'Browse artworks even without internet' },
              { icon: '🔔', title: 'Notifications', desc: 'Get updates on new artworks & exhibitions' },
              { icon: '📱', title: 'Native Feel', desc: 'Full-screen experience like a native app' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Install Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {isIOS ? (
            /* iOS Instructions */
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">📱 Install on iPhone/iPad</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Tap the Share button</p>
                    <p className="text-sm text-gray-500">It's the square with an arrow pointing up (⬆️) at the bottom of Safari</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900">Scroll down and tap "Add to Home Screen"</p>
                    <p className="text-sm text-gray-500">You may need to scroll down in the share menu to find it</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Tap "Add" in the top right</p>
                    <p className="text-sm text-gray-500">The app icon will appear on your home screen!</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Make sure you're using Safari browser. Chrome on iOS doesn't support app installation.
                </p>
              </div>
            </div>
          ) : canInstall ? (
            /* Android/Desktop with install prompt */
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎉 Ready to Install!</h2>
              <p className="text-gray-600 mb-6">Click the button below to add ChitraKalakar to your home screen.</p>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-lg font-bold rounded-xl hover:opacity-90 shadow-lg disabled:opacity-50"
                data-testid="install-btn"
              >
                {installing ? 'Installing...' : '📲 Install ChitraKalakar'}
              </button>
            </div>
          ) : (
            /* Android/Desktop manual instructions */
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">📱 Install on Android/Desktop</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-medium text-gray-900">Open browser menu</p>
                    <p className="text-sm text-gray-500">Tap the three dots (⋮) in the top right corner of Chrome</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-medium text-gray-900">Tap "Install app" or "Add to Home Screen"</p>
                    <p className="text-sm text-gray-500">Look for the install option in the menu</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-medium text-gray-900">Confirm installation</p>
                    <p className="text-sm text-gray-500">Tap "Install" or "Add" to complete</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-orange-500 hover:underline">
            ← Back to ChitraKalakar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InstallAppPage;

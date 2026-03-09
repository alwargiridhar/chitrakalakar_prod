import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function DownloadAppPage() {
  const [platform, setPlatform] = useState('unknown');
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      setPlatform('ios');
    } else if (/windows/i.test(userAgent)) {
      setPlatform('windows');
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      setPlatform('mac');
    } else {
      setPlatform('desktop');
    }

    // Check PWA install capability
    if (window.deferredPrompt) {
      setCanInstallPWA(true);
    }
  }, []);

  const handlePWAInstall = async () => {
    if (window.deferredPrompt) {
      const result = await window.deferredPrompt.prompt();
      console.log('Install result:', result);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50" data-testid="download-app-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img 
            src="/logo512.png" 
            alt="ChitraKalakar" 
            className="w-28 h-28 mx-auto mb-6 rounded-3xl shadow-2xl border-4 border-white"
          />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Download ChitraKalakar</h1>
          <p className="text-xl opacity-90">Get the app for the best experience</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Install for PWA-capable browsers */}
        {canInstallPWA && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold text-green-800 mb-3">🎉 Quick Install Available!</h2>
            <p className="text-green-700 mb-4">Your browser supports instant installation</p>
            <button
              onClick={handlePWAInstall}
              className="px-8 py-4 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 shadow-lg"
            >
              📲 Install Now
            </button>
          </div>
        )}

        {/* Platform-specific Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Android */}
          <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${platform === 'android' ? 'border-green-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 2.246a.75.75 0 0 0-1.046 1.046l1.042 1.042A8.478 8.478 0 0 0 12 2.25a8.478 8.478 0 0 0-5.519 2.084l1.042-1.042a.75.75 0 0 0-1.046-1.046L4.019 4.704a.75.75 0 0 0 0 1.061l2.458 2.458a.75.75 0 0 0 1.046-1.046L6.481 6.135A6.978 6.978 0 0 1 12 3.75a6.978 6.978 0 0 1 5.519 2.385l-1.042-1.042a.75.75 0 0 0-1.046 1.046l2.458-2.458a.75.75 0 0 0 0-1.061l-2.458-2.458zM6 9.75A.75.75 0 0 1 6.75 9h10.5a.75.75 0 0 1 .75.75v9a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 6 18.75v-9z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Android</h3>
                {platform === 'android' && <span className="text-sm text-green-600 font-medium">✓ Your device</span>}
              </div>
            </div>
            
            <div className="space-y-3">
              <a
                href="https://pwabuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-green-500 text-white text-center rounded-lg font-medium hover:bg-green-600"
              >
                Download APK (Coming Soon)
              </a>
              <p className="text-xs text-gray-500 text-center">Or install directly from Chrome menu → "Install app"</p>
            </div>
          </div>

          {/* iOS */}
          <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${platform === 'ios' ? 'border-blue-400' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">iPhone / iPad</h3>
                {platform === 'ios' && <span className="text-sm text-blue-600 font-medium">✓ Your device</span>}
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Install via Safari:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Open this page in Safari</li>
                  <li>Tap Share button (⬆️)</li>
                  <li>Tap "Add to Home Screen"</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Installation Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 Manual Installation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chrome Android */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded text-xs flex items-center justify-center">1</span>
                Chrome on Android
              </h3>
              <ol className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">→</span>
                  Open chitrakalakar.com in Chrome
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">→</span>
                  Tap the 3 dots menu (⋮) top right
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">→</span>
                  Tap "Install app" or "Add to Home screen"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">→</span>
                  Tap "Install" to confirm
                </li>
              </ol>
            </div>

            {/* Safari iOS */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded text-xs flex items-center justify-center">2</span>
                Safari on iPhone/iPad
              </h3>
              <ol className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  Open chitrakalakar.com in Safari
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  Tap the Share button (⬆️) at bottom
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  Scroll down, tap "Add to Home Screen"
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">→</span>
                  Tap "Add" in top right
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* App Features */}
        <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">✨ App Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '⚡', title: 'Fast', desc: 'Instant loading' },
              { icon: '📴', title: 'Offline', desc: 'Works without internet' },
              { icon: '🔔', title: 'Notifications', desc: 'Stay updated' },
              { icon: '📱', title: 'Native Feel', desc: 'Full screen experience' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-4 text-center shadow-sm">
                <span className="text-3xl mb-2 block">{feature.icon}</span>
                <h3 className="font-bold text-gray-900">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">⚠️ Troubleshooting</h2>
          <div className="space-y-3 text-yellow-900">
            <div>
              <p className="font-medium">Can't see "Install app" option?</p>
              <p className="text-sm">Make sure you're using Chrome (Android) or Safari (iOS). Other browsers may not support installation.</p>
            </div>
            <div>
              <p className="font-medium">App looks like a website?</p>
              <p className="text-sm">Clear browser cache and reinstall. The app should open in full-screen mode without browser UI.</p>
            </div>
            <div>
              <p className="font-medium">Still having issues?</p>
              <p className="text-sm">Contact us at <a href="mailto:support@chitrakalakar.com" className="underline">support@chitrakalakar.com</a></p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-orange-500 hover:underline text-lg">
            ← Back to ChitraKalakar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DownloadAppPage;

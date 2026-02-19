import React, { useState, useEffect } from 'react';

function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isStandalone || localStorage.getItem('pwa-prompt-dismissed-v2')) {
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt after 60 seconds of browsing
    const timer = setTimeout(() => {
      if (!localStorage.getItem('pwa-prompt-dismissed-v2')) {
        setShowPrompt(true);
      }
    }, 60000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [isStandalone]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed-v2', 'true');
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <>
      {/* Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-4 shadow-2xl z-50 animate-slide-up">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-2xl">📲</span>
            </div>
            <div>
              <h4 className="font-bold text-sm">Install ChitraKalakar</h4>
              <p className="text-xs text-orange-100">Get the app for a better experience</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white"
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-orange-500 rounded-lg text-sm font-bold hover:bg-orange-50 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-[60]"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📲</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Install ChitraKalakar</h3>
              <p className="text-gray-500 text-sm mt-1">Add to your home screen</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  1
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Tap the <strong>Share</strong> button <span className="text-blue-500 text-lg">⬆️</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  2
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Scroll and tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                  3
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Tap <strong>"Add"</strong> to install
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

export default PWAInstallPrompt;

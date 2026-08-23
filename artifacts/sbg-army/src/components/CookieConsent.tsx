import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('sbg_cookie_consent');
    if (!consent) setTimeout(() => setVisible(true), 1500);
  }, []);

  function accept() {
    localStorage.setItem('sbg_cookie_consent', 'accepted');
    localStorage.setItem('sbg_cookie_consent_date', new Date().toISOString());
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('sbg_cookie_consent', 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-[#0f0f1a] border border-orange-500/20 rounded-lg shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍪</span>
            <span className="font-bold text-white text-sm tracking-wide">Cookie Preferences</span>
          </div>
          <button onClick={decline} className="text-gray-500 hover:text-white text-xs">✕</button>
        </div>

        <div className="p-4">
          <p className="text-gray-400 text-xs leading-relaxed mb-3">
            We use cookies to enhance your experience, analyze site traffic, and serve personalized content.
            By clicking "Accept All", you consent to our use of cookies.{' '}
            <a href="/privacy" className="text-orange-400 hover:underline">Privacy Policy</a>
          </p>

          {showDetails && (
            <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { name: 'Essential', desc: 'Required for core functionality', locked: true },
                { name: 'Analytics', desc: 'Help us understand site usage', locked: false },
                { name: 'Marketing', desc: 'Personalized ads and content', locked: false },
              ].map(c => (
                <div key={c.name} className="bg-white/5 rounded p-2 flex items-start gap-2">
                  <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${c.locked ? 'bg-orange-500' : 'bg-gray-600'}`} />
                  <div>
                    <p className="text-white text-xs font-semibold">{c.name}</p>
                    <p className="text-gray-500 text-xs">{c.desc}</p>
                    {c.locked && <p className="text-orange-400 text-xs">Always active</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <button onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-300 text-xs underline">
              {showDetails ? 'Hide details' : 'Manage preferences'}
            </button>
            <div className="flex gap-2">
              <button onClick={decline}
                className="px-4 py-2 text-xs font-bold border border-white/10 rounded text-gray-400 hover:border-white/30 hover:text-white transition-all">
                Decline
              </button>
              <button onClick={accept}
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded hover:opacity-90 transition-all">
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

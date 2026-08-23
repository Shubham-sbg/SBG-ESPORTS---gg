import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const DEFAULT_CONTENT = `<h2>Cookie Policy</h2>
<p>Last updated: January 1, 2025</p>
<p>${PUBLIC_BRAND_NAME} uses cookies and similar tracking technologies to enhance your experience on our website.</p>
<h3>What Are Cookies</h3>
<p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and understand how you use our site.</p>
<h3>Types of Cookies We Use</h3>
<ul><li><strong>Essential Cookies:</strong> Required for the website to function properly</li><li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site</li><li><strong>Preference Cookies:</strong> Remember your settings and preferences</li></ul>
<h3>Managing Cookies</h3>
<p>You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of our site.</p>
<h3>Contact Us</h3>
<p>For questions about our use of cookies, please use our <a href="/contact">Contact Form</a>.</p>`;

export default function CookiePolicyPage() {
  const { db, loading } = useDatabase();
  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const content = (db.settings as any).legalPages?.cookies || DEFAULT_CONTENT;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">Legal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Cookie Policy</h1>
            <p className="text-gray-500 text-sm">How we use cookies and tracking technologies.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 sm:p-8">
            <div className="legal-content text-gray-400 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          <div className="mt-6 flex gap-4 text-sm">
            <a href="/privacy" className="text-orange-400 hover:underline">Privacy Policy</a>
            <a href="/terms" className="text-orange-400 hover:underline">Terms & Conditions</a>
          </div>
        </div>
      </div>
      <style>{`
        .legal-content h2 { color: #fff; font-weight: 700; font-size: 1.2em; margin: 1em 0 0.4em; }
        .legal-content h3 { color: #fff; font-weight: 700; font-size: 1.05em; margin: 0.8em 0 0.3em; }
        .legal-content a { color: #f97316; text-decoration: underline; }
        .legal-content ul { list-style: disc; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .legal-content li { margin-bottom: 0.25rem; }
        .legal-content p { margin-bottom: 0.75rem; }
        .legal-content strong { color: #fff; }
        .legal-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1rem 0; }
      `}</style>
      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

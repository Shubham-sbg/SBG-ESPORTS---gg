import { useEffect, useRef } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { trackPageVisit } from '@/lib/analytics';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

export default function CommunityPage() {
  const { db, loading } = useDatabase();
  const tracked = useRef(false);

  useEffect(() => {
    if (!loading) {
      applyTheme(db.settings);
      if (!tracked.current) {
        trackPageVisit('/community');
        tracked.current = true;
      }
    }
  }, [loading, db.settings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const links = [
    { label: 'Discord', icon: '💬', url: db.settings.socialDiscord, desc: 'Join our Discord server and connect with the community.' },
    { label: 'YouTube', icon: '▶', url: db.settings.socialYoutube, desc: 'Watch highlights, match VODs and announcements.' },
    { label: 'Instagram', icon: '📸', url: db.settings.socialInstagram, desc: 'Follow us for updates, clips and behind-the-scenes.' },
    { label: 'Twitter / X', icon: '𝕏', url: db.settings.socialTwitter, desc: 'Live match updates and team news.' },
  ].filter(l => l.url && l.url.trim() !== '');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <section className="pt-28 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-orange-400 text-xs font-bold tracking-[0.3em] uppercase mb-3">Connect</p>
            <h1 className="font-black text-4xl md:text-5xl text-white tracking-tight">COMMUNITY</h1>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">
              Be part of the {PUBLIC_BRAND_NAME} family. Join us on all platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {links.length > 0 ? links.map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                className="p-6 rounded-2xl border border-white/10 bg-white/3 hover:border-orange-500/40 hover:bg-white/5 transition-all duration-300 group">
                <div className="text-3xl mb-3">{l.icon}</div>
                <h3 className="font-black text-white text-lg group-hover:text-orange-400 transition-colors">{l.label}</h3>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">{l.desc}</p>
              </a>
            )) : (
              <div className="col-span-2 text-center py-16 text-gray-600 text-sm">
                Social links not configured yet. Visit Admin → Settings to add them.
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

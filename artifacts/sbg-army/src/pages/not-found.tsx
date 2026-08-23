import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4 overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Gold top bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" aria-hidden="true" />

      <div className="relative text-center max-w-lg">
        {/* Logo */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div
              className="h-20 w-20 mx-auto rounded-2xl flex items-center justify-center font-black text-3xl text-black"
              style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)', boxShadow: '0 0 40px rgba(212,175,55,0.35)' }}
              aria-hidden="true"
            >
              SBG
            </div>
          </motion.div>
        )}

        {/* 404 */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div
              className="text-[120px] font-black leading-none tracking-tighter mb-0"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 40%, #b8960c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(212,175,55,0.3))',
              }}
              aria-label="Error 404"
            >
              404
            </div>
          </motion.div>
        )}

        {/* Message */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h1 className="text-2xl font-black tracking-widest text-white uppercase mb-3">
              Page Not Found
            </h1>
            <div className="w-16 h-1 mx-auto mb-5" style={{
              background: 'linear-gradient(90deg, transparent, #d4af37, transparent)'
            }} aria-hidden="true" />
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
              Head back to the battlefield.
            </p>
          </motion.div>
        )}

        {/* CTAs */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-3 justify-center flex-wrap"
          >
            <a
              href="/"
              className="px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] focus:outline-none focus:ring-2 focus:ring-gold/60"
              style={{ background: 'linear-gradient(135deg, #d4af37, #f5e27e 50%, #b8960c)' }}
            >
              🏠 Go Home
            </a>
            <a
              href="/tournaments"
              className="px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-gray-300 border border-white/10 hover:border-gold/40 hover:text-gold transition-all focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              🏆 Tournaments
            </a>
            <a
              href="/contact"
              className="px-6 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-gray-300 border border-white/10 hover:border-white/25 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              📧 Contact Us
            </a>
          </motion.div>
        )}

        {/* Quick links */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 pt-8 border-t border-white/5"
          >
            <p className="text-[10px] tracking-[0.4em] text-gray-700 uppercase mb-4">Quick Links</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              {[
                { href: '/roster', label: 'Roster' },
                { href: '/shop', label: 'Shop' },
                { href: '/live', label: 'Live' },
                { href: '/blog', label: 'Blog' },
                { href: '/community', label: 'Community' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-gray-600 hover:text-gold transition-colors font-bold tracking-wider focus:outline-none focus:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

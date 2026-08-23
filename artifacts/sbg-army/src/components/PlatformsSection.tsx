/**
 * PlatformsSection — "Explore Our Other Platforms" section on the SBG ARMY homepage.
 * Admin-controlled via AdminPlatforms. Shows when platforms.enabled = true and has visible platforms.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface PlatformCard {
  id: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  badge: string;
  url: string;
  color: string;
  visible: boolean;
  order: number;
}

interface PlatformsConfig {
  enabled: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  platforms: PlatformCard[];
}

export default function PlatformsSection() {
  const [config, setConfig] = useState<PlatformsConfig | null>(null);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || "") + '/api/db/platforms', { credentials: "include", cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data) && 'platforms' in data) {
          setConfig(data as PlatformsConfig);
        }
      })
      .catch(() => {});
  }, []);

  if (!config || !config.enabled) return null;

  const visiblePlatforms = config.platforms
    .filter(p => p.visible)
    .sort((a, b) => a.order - b.order);

  if (visiblePlatforms.length === 0) return null;

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)'
        }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent)' }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-[10px] font-black tracking-[0.3em] uppercase"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
            🌐 ECOSYSTEM
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide mb-4">
            {config.sectionTitle}
          </h2>
          {config.sectionSubtitle && (
            <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
              {config.sectionSubtitle}
            </p>
          )}
        </motion.div>

        {/* Platform Cards */}
        <div className={`grid gap-6 ${visiblePlatforms.length === 1 ? 'max-w-md mx-auto' : visiblePlatforms.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {visiblePlatforms.map((platform, i) => (
            <motion.a
              key={platform.id}
              href={platform.url}
              target={platform.url.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer block"
              style={{
                background: `linear-gradient(135deg, ${platform.color}0d, rgba(0,0,0,0))`,
                border: `1px solid ${platform.color}20`,
                boxShadow: `0 0 40px ${platform.color}08`,
              }}
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at center top, ${platform.color}10, transparent 70%)` }} />

              {/* Image */}
              {platform.image && (
                <div className="relative h-36 overflow-hidden">
                  <img src={platform.image} alt={platform.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0"
                    style={{ background: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.7))` }} />
                </div>
              )}

              {!platform.image && (
                <div className="h-36 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${platform.color}15, ${platform.color}05)` }}>
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl text-black"
                    style={{ background: `linear-gradient(135deg, ${platform.color}, ${platform.color}aa)` }}>
                    {platform.name.slice(0, 2)}
                  </div>
                </div>
              )}

              {/* Badge */}
              {platform.badge && (
                <div className="absolute top-3 right-3">
                  <span className="text-[9px] font-black px-2 py-1 rounded-full tracking-widest"
                    style={{ background: `${platform.color}30`, color: platform.color, border: `1px solid ${platform.color}40` }}>
                    {platform.badge}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-black text-white text-lg tracking-wide">{platform.name}</h3>
                </div>
                {platform.tagline && (
                  <p className="text-xs font-bold mb-2" style={{ color: platform.color }}>{platform.tagline}</p>
                )}
                {platform.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-4">{platform.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">
                    Explore →
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1"
                    style={{ background: `${platform.color}20`, border: `1px solid ${platform.color}40` }}>
                    <span className="text-xs" style={{ color: platform.color }}>→</span>
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${platform.color}, transparent)` }} />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

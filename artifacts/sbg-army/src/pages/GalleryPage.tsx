import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const CATEGORIES = ['All', 'Tournaments', 'Team', 'Events', 'Behind the Scenes', 'Wins', 'Training', 'Other'];

export default function GalleryPage() {
  const { db, loading } = useDatabase();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const allItems = (db.gallery ?? []).filter(i => i.visible);
  const featured = allItems.filter(i => i.featured);
  const items = filter === 'All' ? allItems : allItems.filter(i => i.category === filter);
  const selectedItem = selected ? allItems.find(i => i.id === selected) : null;

  const usedCats = new Set(allItems.map(i => i.category));
  const tabs = CATEGORIES.filter(c => c === 'All' || usedCats.has(c));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <Navbar settings={db.settings} navigation={db.navigation} />

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4 text-center">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(ellipse at 50% 0%, ${db.settings.primaryColor}15 0%, transparent 60%)`
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-400 text-xs font-bold tracking-widest uppercase mb-6">
            📸 PHOTO GALLERY
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-4">OUR MOMENTS</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Relive the highlights, victories, and memories of ${PUBLIC_BRAND_NAME}.</p>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && filter === 'All' && (
        <section className="px-4 pb-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-black tracking-widest text-yellow-500 uppercase">⭐ Featured</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.slice(0, 3).map(item => (
              <button key={item.id} onClick={() => setSelected(item.id)}
                className="group relative aspect-video rounded-2xl overflow-hidden border border-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300">
                {item.image ? (
                  <Image src={item.image} alt={item.title}
                    objectFit="cover"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">📸</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black text-black mb-2" style={{ background: '#d4af37' }}>⭐ FEATURED</span>
                  <p className="font-black text-white text-sm truncate">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.category} · {item.date}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Category filter */}
      <section className="px-4 pb-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {tabs.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              style={filter === cat
                ? { background: db.settings.primaryColor, color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
              }>
              {cat} {cat === 'All' ? `(${allItems.length})` : `(${allItems.filter(i => i.category === cat).length})`}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 pb-20 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-white font-black text-lg mb-2">No gallery items yet.</p>
            <p className="text-gray-500 text-sm">Upload photos from Admin Panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {items.map(item => (
              <button key={item.id} onClick={() => setSelected(item.id)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/6 bg-white/2 hover:border-white/20 transition-all duration-300"
                style={item.featured ? { borderColor: 'rgba(212,175,55,0.3)', boxShadow: '0 0 12px rgba(212,175,55,0.15)' } : {}}>
                {item.image ? (
                  <Image src={item.image} alt={item.title}
                    objectFit="cover"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-gray-700">📸</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-bold text-white text-xs truncate">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.category}</p>
                </div>
                {item.featured && (
                  <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 rounded-full text-[9px] font-black text-black" style={{ background: '#d4af37' }}>⭐</div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white text-2xl font-black transition-colors">✕</button>
            {selectedItem.image ? (
              <Image src={selectedItem.image} alt={selectedItem.title} objectFit="contain" className="w-full max-h-[75vh] object-contain rounded-2xl" />
            ) : (
              <div className="w-full h-64 bg-white/5 rounded-2xl flex items-center justify-center text-6xl">📸</div>
            )}
            <div className="mt-4 text-center">
              <p className="font-black text-white text-lg">{selectedItem.title}</p>
              <p className="text-sm text-gray-400 mt-1">{selectedItem.category} · {selectedItem.date}</p>
            </div>
          </div>
        </div>
      )}

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

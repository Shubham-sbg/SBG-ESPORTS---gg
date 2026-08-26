import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useRef, useEffect, useState } from 'react';
import { Post } from '@/lib/database';

interface Props {
  posts: Post[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Achievement: '#ffd700',
  Announcement: '#00d4ff',
  Sponsor: '#ff6b00',
  'Match Recap': '#ff0055',
  Update: '#9945ff',
  Event: '#00ff88',
};

export default function NewsSection({ posts }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (lightboxImg) {
      document.body.style.overflow = 'hidden';
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxImg(null); };
      document.addEventListener('keydown', handler);
      return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
    }
    document.body.style.overflow = '';
    return undefined;
  }, [lightboxImg]);

  const visible = posts.filter(p => p.visible).slice(0, 6);

  return (
    <section id="news" ref={sectionRef}
      className={`py-24 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] text-orange-400 uppercase">Latest</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white">NEWS & UPDATES</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
        </div>

        {visible.length === 0 ? (
          <p className="text-center text-gray-500">No posts available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((post, idx) => {
              const catColor = CATEGORY_COLORS[post.category] || '#ff6b00';
              const isExpanded = expandedPost === post.id;
              return (
                <article key={post.id}
                  className="group relative bg-white/3 border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-500 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl flex flex-col"
                  style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="aspect-video bg-gradient-to-br from-black to-gray-900 relative overflow-hidden cursor-pointer"
                    onClick={() => post.thumbnail && setLightboxImg(post.thumbnail)}>
                    {post.thumbnail ? (
                      <>
                        <Image src={post.thumbnail} alt={post.title} loading="lazy" decoding="async" objectFit="cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          🔍
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${catColor}22, transparent)` }}>
                        <span className="text-5xl font-black opacity-30" style={{ color: catColor }}>{post.category.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-lg backdrop-blur-sm"
                      style={{ color: catColor, background: `${catColor}25`, border: `1px solid ${catColor}50` }}>
                      {post.category}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 font-mono">{post.date}</span>
                    </div>
                    <h3 className="text-white font-black text-base mb-2 line-clamp-2 group-hover:text-orange-300 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <div className="flex-1">
                      <p className={`text-gray-400 text-sm leading-relaxed whitespace-pre-line ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {post.description}
                      </p>
                    </div>
                    {post.description && post.description.length > 120 && (
                      <button onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                        className="mt-3 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors self-start">
                        {isExpanded ? 'Show less ↑' : 'Read more →'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-orange-500/30 text-white text-xl font-bold flex items-center justify-center transition-all">✕</button>
          <Image src={lightboxImg} alt="News image" objectFit="contain"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}

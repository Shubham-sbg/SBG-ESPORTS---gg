import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useState } from 'react';
import { Video } from '@/lib/database';

interface Props {
  videos: Video[];
}

function getYoutubeThumbnail(url: string): string {
  const embed = url.includes('youtube.com/embed/') ? url : '';
  const match = embed.match(/embed\/([A-Za-z0-9_-]+)/);
  if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  const direct = url.match(/(?:watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (direct) return `https://img.youtube.com/vi/${direct[1]}/hqdefault.jpg`;
  return '';
}

export default function VideoSection({ videos }: Props) {
  const [modalVideo, setModalVideo] = useState<Video | null>(null);

  const visible = (videos || [])
    .filter(v => v.visible)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (visible.length === 0) return null;

  const getThumb = (v: Video): string => {
    if (v.thumbnail) return v.thumbnail;
    const embed = v.embedUrl || '';
    if (v.videoType === 'youtube' || embed.includes('youtube')) {
      return getYoutubeThumbnail(embed || v.url);
    }
    return '';
  };

  return (
    <section id="videos" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] text-orange-400 uppercase">Content</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white">LATEST VIDEOS</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map(v => {
            const thumb = getThumb(v);
            return (
              <button
                key={v.id}
                onClick={() => setModalVideo(v)}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/3 hover:border-orange-500/30 transition-all duration-300 hover:scale-[1.02] text-left"
              >
                <div className="relative aspect-video bg-black/50 overflow-hidden">
                  {thumb ? (
                    <Image src={thumb} alt={v.title} loading="lazy" decoding="async" objectFit="cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-30">🎬</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-orange-500/80 group-hover:bg-orange-500 backdrop-blur-sm flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-orange-500/30">
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-black/60 text-gray-300 border border-white/10 font-semibold uppercase tracking-wider">
                      {v.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-orange-400 transition-colors">{v.title}</h3>
                  {v.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{v.description}</p>}
                  <p className="text-xs text-gray-600 mt-2">{new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {modalVideo && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setModalVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setModalVideo(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center text-lg hover:bg-white/20 transition-colors"
              aria-label="Close video"
            >
              ✕
            </button>
            <div className="aspect-video bg-black">
              {modalVideo.videoType === 'upload' && modalVideo.url ? (
                <video
                  src={getImageUrl(modalVideo.url)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (modalVideo.embedUrl || modalVideo.url) ? (
                <iframe
                  src={modalVideo.embedUrl || modalVideo.url}
                  className="w-full h-full border-none"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={modalVideo.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">No video source available</div>
              )}
            </div>
            <div className="p-4 bg-[#0d0d0d]">
              <h3 className="font-black text-white">{modalVideo.title}</h3>
              {modalVideo.description && <p className="text-sm text-gray-400 mt-1">{modalVideo.description}</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

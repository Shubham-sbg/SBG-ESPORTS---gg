import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { Creator } from '@/lib/database';

interface Props {
  creators: Creator[];
}

const ROLE_COLORS: Record<string, string> = {
  'YouTube Creator': '#ff0000',
  'Streamer': '#9945ff',
  'Shorts Creator': '#ff6b00',
  'Editor': '#00d4ff',
  'Analyst': '#ffd700',
  'BGMI Creator': '#00ff88',
  'Caster': '#ff69b4',
};

export default function CreatorsSection({ creators }: Props) {
  const visible = creators?.filter(c => c.visible) ?? [];
  if (visible.length === 0) return null;

  return (
    <section id="creators" className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-black tracking-[0.4em] text-orange-400 mb-3 uppercase">Content Army</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            CONTENT <span style={{ color: 'var(--sbg-primary, #ff6b00)' }}>CREATORS</span>
          </h2>
          <p className="text-gray-500 mt-4">The creative force behind SBG ESPORTS' digital presence</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visible.map(creator => {
            const roleColor = ROLE_COLORS[creator.role] ?? '#ff6b00';
            return (
              <div key={creator.id} className="group relative p-6 rounded-2xl border border-white/5 bg-white/3 hover:border-white/10 transition-all duration-500 hover:-translate-y-1 text-center">
                <div className="relative mx-auto mb-5 w-24 h-24">
                  <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, ${roleColor}44, transparent 70%)` }} />
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 bg-white/5 flex items-center justify-center mx-auto"
                    style={{ borderColor: roleColor + '44' }}>
                    {creator.photo
                      ? <Image src={creator.photo} alt={creator.name} loading="lazy" decoding="async" width={96} height={96} objectFit="cover" className="w-full h-full object-cover" />
                      : <span className="text-4xl">🎥</span>
                    }
                  </div>
                </div>

                <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3"
                  style={{ background: roleColor + '22', color: roleColor }}>
                  {creator.role}
                </div>

                <h3 className="font-black text-white text-lg leading-tight">{creator.ign || creator.name}</h3>
                {creator.ign && creator.name && (
                  <p className="text-xs text-gray-500 mt-0.5">{creator.name}</p>
                )}

                {creator.contentTypes.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {creator.contentTypes.slice(0, 3).map(ct => (
                      <span key={ct} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{ct}</span>
                    ))}
                  </div>
                )}

                {creator.social && (
                  <a href={creator.social} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-block text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors">
                    ↗ Follow
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

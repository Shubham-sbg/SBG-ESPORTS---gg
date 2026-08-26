import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useDatabase } from '@/hooks/useDatabase';
import { isFeatureActive } from '@/lib/database';
import Navbar from '@/components/Navbar';
import AdsRenderer from '@/components/AdsRenderer';
import Footer from '@/components/Footer';

export default function ChampionsHomePage() {
  const { db, loading } = useDatabase();

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  const sec = (db as any).features?.sections ?? {};
  const show = (key: string) => isFeatureActive(sec[key]);

  return (
    <div className="min-h-screen bg-black text-white font-serif selection:bg-yellow-500 selection:text-black">
      {show('ads') && <AdsRenderer ads={db.ads || []} />}
      <Navbar settings={db.settings} navigation={db.navigation} />
      
      <main className="max-w-[1400px] mx-auto px-6 py-24 space-y-32">
        <section className="text-center space-y-6 pt-12">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-700">
            {db.settings.organizationName || 'CHAMPIONS'}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light tracking-wide">
            Premium championship sports organization style.
          </p>
        </section>
        
        {show('roster') && db.players?.length > 0 && (
          <section>
            <h2 className="text-3xl font-light uppercase tracking-widest text-center mb-16 border-b border-white/10 pb-4">Our Roster</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {db.players.map((p: any) => (
                <div key={p.id} className="relative aspect-[3/4] group overflow-hidden bg-white/5">
                  <Image src={p.avatar} alt={p.name} objectFit="cover" className="absolute inset-0 w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <h3 className="text-2xl font-bold uppercase tracking-wider">{p.name}</h3>
                    <p className="text-yellow-500 text-sm tracking-widest">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      
      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

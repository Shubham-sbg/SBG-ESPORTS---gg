import { getImageUrl } from '@/lib/imageResolver';
import { Image } from '@/components/shared/Image';
import { useDatabase } from '@/hooks/useDatabase';
import { isFeatureActive } from '@/lib/database';
import Navbar from '@/components/Navbar';
import AdsRenderer from '@/components/AdsRenderer';
import Footer from '@/components/Footer';

export default function ProArenaHomePage() {
  const { db, loading } = useDatabase();

  if (loading) {
    return <div className="min-h-screen bg-[#050505]" />;
  }

  const sec = (db as any).features?.sections ?? {};
  const show = (key: string) => isFeatureActive(sec[key]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-blue-600 selection:text-white">
      {show('ads') && <AdsRenderer ads={db.ads || []} />}
      <Navbar settings={db.settings} navigation={db.navigation} />
      
      <main className="max-w-[1400px] mx-auto px-6 py-24 space-y-32">
        <section className="text-center space-y-6 pt-12">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
            {db.settings.organizationName || 'SBG PRO ARENA'}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            High-end competitive esports team design.
          </p>
        </section>
        
        {show('roster') && db.players?.length > 0 && (
          <section>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Active Roster</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {db.players.map((p: any) => (
                <div key={p.id} className="bg-[#111113] border border-white/5 rounded-2xl p-6 transition-transform hover:-translate-y-2">
                  <div className="aspect-square bg-gray-800 rounded-xl mb-6 overflow-hidden">
                    <Image src={p.avatar} alt={p.name} objectFit="cover" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <h3 className="text-xl font-bold uppercase">{p.name}</h3>
                  <p className="text-blue-500 font-medium">{p.role}</p>
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

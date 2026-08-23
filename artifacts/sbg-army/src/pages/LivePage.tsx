import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

interface CountdownTime { days: number; hours: number; minutes: number; seconds: number; }

function useCountdown(target: Date): CountdownTime {
  const [time, setTime] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

const UPCOMING_MATCHES = [
  { title: '{PUBLIC_BRAND_NAME} vs. TEAM ZEUS', game: 'Free Fire', date: new Date(Date.now() + 2 * 24 * 3600 * 1000), event: 'Pro League Season 4', ytLiveId: '' },
  { title: '{PUBLIC_BRAND_NAME} vs. GHOST CLAN', game: 'BGMI', date: new Date(Date.now() + 5 * 24 * 3600 * 1000), event: 'Regional Qualifier', ytLiveId: '' },
  { title: '{PUBLIC_BRAND_NAME} vs. NOVA SQUAD', game: 'Valorant', date: new Date(Date.now() + 8 * 24 * 3600 * 1000), event: 'Open Cup', ytLiveId: '' },
];

const PAST_MATCHES = [
  { title: '{PUBLIC_BRAND_NAME} vs. STORM OPS', game: 'Free Fire', date: 'June 1, 2025', result: '🥇 WIN', ytVideoId: 'dQw4w9WgXcQ' },
  { title: '{PUBLIC_BRAND_NAME} vs. SHADOW FC', game: 'BGMI', date: 'May 28, 2025', result: '🥇 WIN', ytVideoId: 'dQw4w9WgXcQ' },
  { title: '{PUBLIC_BRAND_NAME} vs. BLADE SQUAD', game: 'Valorant', date: 'May 20, 2025', result: '🥈 LOSS', ytVideoId: 'dQw4w9WgXcQ' },
];

function CountdownBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="bg-white/5 border border-orange-500/20 rounded-lg px-3 py-2 min-w-[56px]">
        <span className="text-2xl md:text-3xl font-black text-orange-400 font-mono tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <p className="text-gray-500 text-xs mt-1 tracking-widest uppercase">{label}</p>
    </div>
  );
}

function MatchCard({ match }: { match: typeof UPCOMING_MATCHES[0] }) {
  const countdown = useCountdown(match.date);
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/20 transition-all">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-orange-400 tracking-widest uppercase bg-orange-500/10 px-2 py-1 rounded">{match.game}</span>
          <p className="text-gray-500 text-xs mt-1">{match.event}</p>
        </div>
        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded text-green-400 text-xs font-bold animate-pulse">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          UPCOMING
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-white font-black text-lg mb-1">{match.title}</h3>
        <p className="text-gray-500 text-sm mb-4">{match.date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        <div className="flex gap-3 mb-5">
          <CountdownBlock label="Days" value={countdown.days} />
          <CountdownBlock label="Hrs" value={countdown.hours} />
          <CountdownBlock label="Min" value={countdown.minutes} />
          <CountdownBlock label="Sec" value={countdown.seconds} />
        </div>
        {match.ytLiveId ? (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${match.ytLiveId}?autoplay=1&mute=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          <div className="aspect-video bg-black/50 border border-white/5 rounded-lg flex flex-col items-center justify-center gap-3">
            <span className="text-4xl">📺</span>
            <p className="text-gray-500 text-sm">Live stream will appear here when match starts</p>
            <a href="https://youtube.com/@sbgarmy" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors">
              🔔 Subscribe for notifications
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function getTwitchChannel(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:twitch\.tv\/)([a-zA-Z0-9_]{4,25})/);
  return match ? match[1] : null;
}

function StreamCard({ stream }: { stream: any }) {
  const isLive = stream.status === 'live';
  const isScheduled = stream.status === 'scheduled';
  
  // Date parsing
  const dateObj = stream.scheduledAt ? new Date(stream.scheduledAt) : new Date();
  const countdown = useCountdown(dateObj);
  
  const ytId = getYouTubeId(stream.streamUrl);
  const twitchChannel = getTwitchChannel(stream.streamUrl);
  
  // Determine color theme for platform
  const platformColors: Record<string, { label: string; text: string; bg: string; border: string }> = {
    youtube: { label: 'YouTube', text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    twitch: { label: 'Twitch', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    facebook: { label: 'Facebook', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    other: { label: 'Live Broadcast', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  };
  
  const pc = platformColors[stream.platform] || platformColors.other;

  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-yellow-500/20 transition-all flex flex-col justify-between h-full">
      {/* Card Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {stream.game && (
            <span className="text-xs font-black text-yellow-400 tracking-widest uppercase bg-yellow-500/10 px-2 py-1 rounded">
              {stream.game}
            </span>
          )}
          <span className={`text-[10px] font-bold ${pc.text} ${pc.bg} px-2 py-1 rounded border ${pc.border}`}>
            {pc.label}
          </span>
        </div>
        
        {isLive ? (
          <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full text-red-400 text-xs font-black tracking-widest animate-pulse">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            LIVE NOW
          </div>
        ) : isScheduled ? (
          <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full text-yellow-400 text-xs font-black tracking-widest">
            🗓️ SCHEDULED
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-gray-500/10 border border-gray-500/20 px-2.5 py-1 rounded-full text-gray-400 text-xs font-black tracking-widest">
            ⏹️ ENDED
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-white font-black text-lg mb-1 line-clamp-2 leading-snug">{stream.title}</h3>
        {stream.description && (
          <p className="text-gray-400 text-xs mb-4 line-clamp-2">{stream.description}</p>
        )}
        
        {isScheduled && stream.scheduledAt && (
          <div className="mb-4">
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-2">Starts In:</p>
            <div className="flex gap-2">
              <CountdownBlock label="Days" value={countdown.days} />
              <CountdownBlock label="Hrs" value={countdown.hours} />
              <CountdownBlock label="Min" value={countdown.minutes} />
              <CountdownBlock label="Sec" value={countdown.seconds} />
            </div>
            <p className="text-xs text-yellow-400/80 mt-3 font-medium">
              📅 {new Date(stream.scheduledAt).toLocaleString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* Stream player embedding or beautiful preview */}
        <div className="mt-auto pt-4">
          {isLive && ytId ? (
            <div className="aspect-video rounded-xl overflow-hidden border border-white/5 shadow-lg bg-black">
              <iframe 
                className="w-full h-full" 
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
              />
            </div>
          ) : isLive && twitchChannel ? (
            <div className="aspect-video rounded-xl overflow-hidden border border-white/5 shadow-lg bg-black">
              <iframe
                className="w-full h-full"
                src={`https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}&muted=true&autoplay=true`}
                allowFullScreen
              />
            </div>
          ) : (
            <div className="aspect-video bg-black/60 border border-white/5 rounded-xl relative overflow-hidden group">
              {stream.thumbnail ? (
                <img src={stream.thumbnail} alt={stream.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-300" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#12121a] to-black/80 flex items-center justify-center">
                  <span className="text-4xl filter grayscale opacity-40">🎮</span>
                </div>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/30 group-hover:bg-black/50 transition-all duration-300">
                <a 
                  href={stream.streamUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-lg hover:scale-105 transition-all"
                >
                  <span>▶ WATCH STREAM</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  const { db, loading } = useDatabase();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!loading) applyTheme(db.settings);
  }, [loading, db.settings]);

  // Read live streams from database
  const livestreams = db?.livestreams || [];
  const visibleStreams = livestreams.filter((s: any) => s.visible !== false);
  const hasCustomStreams = visibleStreams.length > 0;

  // Filter into tabs
  const liveOrScheduled = visibleStreams.filter((s: any) => s.status === 'live' || s.status === 'scheduled');
  const pastStreams = visibleStreams.filter((s: any) => s.status === 'ended');

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-5 py-2 mb-6">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-bold tracking-widest uppercase">Live & Upcoming</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-wider mb-4">
              <span className="text-white">MATCH </span>
              <span className="text-red-400" style={{ textShadow: '0 0 30px #ef444488' }}>STREAMS</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Watch ${PUBLIC_BRAND_NAME} compete live. Tune in for real-time action, countdowns to upcoming matches, and VODs of past performances.
            </p>
            <a href="https://youtube.com/@sbgarmy" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
              ▶ Subscribe on YouTube
            </a>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-white/5 pb-0">
            {(['upcoming', 'past'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-bold tracking-widest uppercase transition-all border-b-2 -mb-px ${
                  activeTab === tab ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {tab === 'upcoming' ? '📅 Upcoming & Live' : '📼 Past Broadcasts / VODs'}
              </button>
            ))}
          </div>

          {activeTab === 'upcoming' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {hasCustomStreams ? (
                liveOrScheduled.length > 0 ? (
                  liveOrScheduled.map((s: any) => <StreamCard key={s.id} stream={s} />)
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500 border border-white/5 bg-white/[0.01] rounded-2xl">
                    <span className="text-4xl mb-3 block">🗓️</span>
                    <p className="text-sm font-bold">No live or scheduled broadcasts right now</p>
                    <p className="text-xs mt-1 text-gray-600">Check back later or subscribe to our channels to receive live notifications!</p>
                  </div>
                )
              ) : (
                UPCOMING_MATCHES.map((m, i) => <MatchCard key={i} match={m} />)
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hasCustomStreams ? (
                pastStreams.length > 0 ? (
                  pastStreams.map((s: any) => <StreamCard key={s.id} stream={s} />)
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500 border border-white/5 bg-white/[0.01] rounded-2xl">
                    <span className="text-4xl mb-3 block">📼</span>
                    <p className="text-sm font-bold">No past broadcasts found</p>
                    <p className="text-xs mt-1 text-gray-600">Archived streams will show up here after they conclude.</p>
                  </div>
                )
              ) : (
                PAST_MATCHES.map((m, i) => {
                  const ytId = getYouTubeId(`https://youtube.com/watch?v=${m.ytVideoId}`);
                  return (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/20 transition-all">
                      <div className="aspect-video bg-black relative cursor-pointer group">
                        <img src={`https://img.youtube.com/vi/${m.ytVideoId}/hqdefault.jpg`} alt={m.title}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-white text-2xl ml-1">▶</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">{m.game}</span>
                          <span className={`text-xs font-bold ${m.result.includes('WIN') ? 'text-green-400' : 'text-red-400'}`}>{m.result}</span>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">{m.title}</h3>
                        <p className="text-gray-500 text-xs">{m.date}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

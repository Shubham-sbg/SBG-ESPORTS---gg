import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useListTournaments } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { Radio, Calendar, ExternalLink } from "lucide-react";

function Countdown({ targetDate }: { targetDate: string }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const calc = () => setDiff(Math.max(0, new Date(targetDate).getTime() - Date.now()));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [targetDate]);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (diff === 0) return <span className="text-green-400 text-xs font-semibold font-inter">Live Now!</span>;

  return (
    <div className="flex gap-2">
      {[{ v: days, l: "D" }, { v: hours, l: "H" }, { v: mins, l: "M" }, { v: secs, l: "S" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <div className="bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)] rounded px-2 py-1 font-orbitron text-orange-400 text-sm font-bold min-w-[2rem] text-center">
            {String(v).padStart(2, "0")}
          </div>
          <span className="text-slate-600 text-xs mt-0.5">{l}</span>
        </div>
      ))}
    </div>
  );
}

function extractYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export default function LivePage() {
  const { data: tournaments = [] } = useListTournaments();

  const liveMatches = (tournaments as any[]).filter((t: any) => t.status === "ongoing" && t.streamUrl);
  const upcoming = (tournaments as any[]).filter((t: any) => t.status === "upcoming").slice(0, 6);
  const completed = (tournaments as any[]).filter((t: any) => t.status === "completed" && t.streamUrl).slice(0, 4);

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs tracking-[0.3em] uppercase font-semibold">Live</span>
          </div>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">Match Center</h1>
          <p className="text-slate-400 font-inter">Watch live matches and upcoming tournament streams.</p>
        </motion.div>

        {liveMatches.length > 0 && (
          <section className="mb-16">
            <h2 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Now
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {liveMatches.map((t: any) => {
                const ytId = extractYouTubeId(t.streamUrl);
                return (
                  <motion.div key={t.id} className="glass rounded-xl overflow-hidden border border-[rgba(239,68,68,0.2)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {ytId ? (
                      <div className="relative pb-[56.25%]">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=0`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={t.title}
                        />
                      </div>
                    ) : (
                      <a href={t.streamUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-48 bg-[rgba(239,68,68,0.05)] gap-2 text-red-400 font-semibold font-inter text-sm hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                        <ExternalLink className="w-4 h-4" /> Watch on External Platform
                      </a>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-live px-2 py-0.5 rounded-full text-xs">LIVE</span>
                        <span className="text-orange-400 text-xs font-inter">{t.game}</span>
                      </div>
                      <h3 className="font-orbitron text-white font-bold text-sm">{t.title}</h3>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-16">
            <h2 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" /> Upcoming Matches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map((t: any) => (
                <motion.div key={t.id} className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.1)] flex items-center justify-between gap-4"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-orange-400 text-xs font-inter mb-0.5">{t.game}</div>
                    <div className="font-orbitron text-white text-sm font-bold truncate">{t.title}</div>
                    <div className="text-slate-500 text-xs font-inter mt-1">{formatDate(t.startDate)}</div>
                  </div>
                  <Countdown targetDate={t.startDate} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="font-orbitron text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Radio className="w-5 h-5 text-slate-400" /> Past Streams
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {completed.map((t: any) => {
                const ytId = extractYouTubeId(t.streamUrl);
                return (
                  <motion.div key={t.id} className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] card-hover" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {ytId ? (
                      <div className="relative pb-[56.25%]">
                        <iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full" allowFullScreen title={t.title} />
                      </div>
                    ) : (
                      <div className="h-32 bg-[rgba(255,255,255,0.02)] flex items-center justify-center">
                        <Radio className="w-8 h-8 text-slate-700" />
                      </div>
                    )}
                    <div className="p-3">
                      <span className="badge-completed px-2 py-0.5 rounded-full text-xs">Completed</span>
                      <p className="font-orbitron text-white text-xs font-bold mt-2 line-clamp-1">{t.title}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {liveMatches.length === 0 && upcoming.length === 0 && (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-inter">No live matches right now. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

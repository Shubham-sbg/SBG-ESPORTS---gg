import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListTournaments } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { Trophy, Calendar, Users, ChevronRight } from "lucide-react";

const STATUSES = ["All", "upcoming", "ongoing", "completed"];
const GAMES = ["All", "Free Fire", "BGMI", "Valorant", "COD Mobile"];

export default function TournamentsPage() {
  const [status, setStatus] = useState("All");
  const [game, setGame] = useState("All");
  const { data: tournaments = [], isLoading } = useListTournaments();

  const filtered = (tournaments as any[]).filter((t: any) => {
    const matchStatus = status === "All" || t.status === status;
    const matchGame = game === "All" || t.game?.toLowerCase() === game.toLowerCase();
    return matchStatus && matchGame;
  });

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Compete & Win</p>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">Tournaments</h1>
          <p className="text-slate-400 max-w-xl mx-auto font-inter">All active, upcoming, and completed tournaments organized by SBG ARMY.</p>
        </motion.div>

        <div className="flex flex-col gap-4 mb-10">
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter capitalize transition-all ${status === s ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {GAMES.map((g) => (
              <button key={g} onClick={() => setGame(g)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter transition-all ${game === g ? "bg-[rgba(255,107,0,0.2)] text-orange-400 border border-[rgba(255,107,0,0.3)]" : "glass border border-[rgba(255,255,255,0.06)] text-slate-500 hover:text-slate-300"}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass rounded-xl h-72 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-inter">No tournaments found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t: any, i: number) => (
              <motion.div key={t.id} className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] card-hover group"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                <div className="relative h-44 bg-gradient-to-br from-[rgba(255,107,0,0.08)] to-transparent flex items-center justify-center overflow-hidden">
                  {t.banner ? (
                    <img src={t.banner} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Trophy className="w-16 h-16 text-orange-400/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.status === "ongoing" ? "badge-live" : t.status === "completed" ? "badge-completed" : "badge-upcoming"}`}>
                      {t.status === "ongoing" && <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-1 animate-pulse" />}
                      {t.status}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-orange-400 text-xs font-inter mb-1">{t.game}</div>
                  <h3 className="font-orbitron text-white font-bold mb-3 line-clamp-2">{t.title}</h3>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-inter">
                      <Calendar className="w-3 h-3 text-orange-400/50" />
                      {formatDate(t.startDate)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-inter">
                      <Users className="w-3 h-3 text-orange-400/50" />
                      {t.registeredTeams || 0}/{t.maxTeams || "∞"} teams
                    </div>
                  </div>
                  {t.prizePool && (
                    <div className="mb-4 px-3 py-2 rounded-lg bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.1)]">
                      <span className="text-xs text-slate-500 font-inter">Prize Pool: </span>
                      <span className="text-orange-400 font-semibold text-sm font-orbitron">{t.prizePool}</span>
                    </div>
                  )}
                  <Link href={`/tournaments/${t.id}`}>
                    <a className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold text-white bg-[rgba(255,107,0,0.15)] border border-[rgba(255,107,0,0.2)] hover:bg-[rgba(255,107,0,0.25)] transition-all font-inter">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

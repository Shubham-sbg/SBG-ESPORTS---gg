import { motion } from "framer-motion";
import { useGetPlatformStats, useListPlayers } from "@workspace/api-client-react";
import { formatNumber } from "@/lib/utils";
import { Trophy, Star, Zap, Award, Users, Target } from "lucide-react";

const ACHIEVEMENTS = [
  { title: "National Champions 2023", game: "Free Fire", position: "1st Place", event: "Free Fire India Open" },
  { title: "Regional Champions 2024", game: "BGMI", position: "1st Place", event: "BGMI Pro League" },
  { title: "Cup Winners 2023", game: "COD Mobile", position: "1st Place", event: "COD Mobile Championship" },
  { title: "Top 3 Finish", game: "Valorant", position: "2nd Place", event: "Valorant Invitational" },
  { title: "Online Tournament Win", game: "Free Fire", position: "1st Place", event: "Community Cup Series" },
  { title: "Invitational Champions", game: "BGMI", position: "1st Place", event: "Creator Invitational 2024" },
];

export default function HallOfFamePage() {
  const { data: stats } = useGetPlatformStats();
  const { data: players = [] } = useListPlayers({ status: "active" });

  const topPlayers = (players as any[])
    .filter((p: any) => p.kd && p.wins)
    .sort((a: any, b: any) => (b.wins || 0) - (a.wins || 0))
    .slice(0, 6);

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-16 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Legacy</p>
          <h1 className="font-orbitron text-4xl sm:text-6xl font-black text-white mb-4">Hall of Fame</h1>
          <p className="text-slate-400 max-w-xl mx-auto font-inter">Celebrating the champions and milestones that define SBG ARMY's legacy.</p>
        </motion.div>

        {/* Stats */}
        <section className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, label: "Total Players", value: stats?.totalPlayers, color: "#ff6b00" },
              { icon: Trophy, label: "Tournaments", value: stats?.totalTournaments, color: "#e94560" },
              { icon: Target, label: "Monthly Visitors", value: stats?.monthlyVisitors, color: "#7c3aed" },
              { icon: Award, label: "Achievements", value: ACHIEVEMENTS.length, color: "#eab308" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} className="glass rounded-xl p-6 text-center border border-[rgba(255,255,255,0.06)]"
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    <Icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <div className="font-orbitron text-3xl font-black text-white mb-1">{s.value !== undefined ? formatNumber(s.value) : "—"}+</div>
                  <div className="text-slate-500 text-xs font-inter">{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Achievements */}
        <section className="mb-20">
          <motion.h2 className="font-orbitron text-2xl font-black text-white mb-8 flex items-center gap-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Trophy className="w-6 h-6 text-orange-400" /> Championship Records
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div key={i} className="glass rounded-xl p-6 border border-[rgba(255,107,0,0.08)] relative overflow-hidden card-hover"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
                <div className="flex items-start justify-between mb-3">
                  <Trophy className="w-8 h-8 text-orange-400" />
                  <span className="px-2 py-0.5 rounded text-xs font-semibold badge-upcoming">{a.position}</span>
                </div>
                <h3 className="font-orbitron text-white font-bold mb-1">{a.title}</h3>
                <p className="text-slate-500 text-xs font-inter mb-2">{a.event}</p>
                <span className="px-2 py-0.5 rounded text-xs text-orange-400 bg-[rgba(255,107,0,0.08)] font-inter">{a.game}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Legends */}
        {topPlayers.length > 0 && (
          <section>
            <motion.h2 className="font-orbitron text-2xl font-black text-white mb-8 flex items-center gap-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <Star className="w-6 h-6 text-yellow-400" /> Elite Players
            </motion.h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {topPlayers.map((player: any, i: number) => (
                <motion.div key={player.id} className="glass rounded-xl p-4 text-center border border-[rgba(255,255,255,0.06)] relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  {i === 0 && <div className="absolute top-2 right-2"><Star className="w-3.5 h-3.5 text-yellow-400 fill-current" /></div>}
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 bg-[rgba(255,107,0,0.1)] border-2 border-[rgba(255,107,0,0.2)] flex items-center justify-center overflow-hidden">
                    {player.image ? <img src={player.image} alt={player.playerName} className="w-full h-full object-cover" /> :
                      <span className="font-orbitron font-bold text-orange-400">{player.playerName?.[0]}</span>}
                  </div>
                  <div className="font-orbitron text-white text-xs font-bold truncate">{player.playerName}</div>
                  <div className="text-slate-500 text-xs font-inter mt-0.5">{player.game}</div>
                  <div className="mt-2 font-orbitron text-orange-400 text-sm font-bold">{player.wins} Wins</div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

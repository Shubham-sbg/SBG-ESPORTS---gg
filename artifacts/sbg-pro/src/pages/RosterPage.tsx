import { useState } from "react";
import { motion } from "framer-motion";
import { useListPlayers } from "@workspace/api-client-react";
import { Search, Instagram, Youtube, ChevronRight } from "lucide-react";

const GAMES = ["All", "Free Fire", "BGMI", "Valorant", "COD Mobile"];

export default function RosterPage() {
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState("All");
  const { data: players = [], isLoading } = useListPlayers();

  const filtered = (players as any[]).filter((p: any) => {
    const matchGame = selectedGame === "All" || p.game?.toLowerCase() === selectedGame.toLowerCase();
    const matchSearch = !search || p.playerName?.toLowerCase().includes(search.toLowerCase()) || p.role?.toLowerCase().includes(search.toLowerCase());
    return matchGame && matchSearch && p.status !== "inactive";
  });

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Elite Squad</p>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">Team Roster</h1>
          <p className="text-slate-400 max-w-xl mx-auto font-inter">Meet the players who represent SBG ARMY across all competitive titles.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg input-dark text-sm font-inter"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {GAMES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGame(g)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter transition-all ${
                  selectedGame === g
                    ? "bg-[#ff6b00] text-white"
                    : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 h-64 skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-inter">No players found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((player: any, i: number) => (
              <motion.div
                key={player.id}
                className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] card-hover group"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              >
                <div className="relative h-48 bg-gradient-to-br from-orange-500/10 to-transparent flex items-center justify-center overflow-hidden">
                  {player.image ? (
                    <img src={player.image} alt={player.playerName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[rgba(255,107,0,0.15)] border-2 border-[rgba(255,107,0,0.3)] flex items-center justify-center">
                      <span className="font-orbitron text-3xl font-black text-orange-400">{player.playerName?.[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded text-xs badge-active">{player.status}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="font-orbitron text-white font-bold mb-1">{player.playerName}</div>
                  {player.realName && <div className="text-slate-500 text-xs font-inter mb-2">{player.realName}</div>}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-orange-400 font-inter">{player.role}</span>
                    <span className="text-xs text-slate-500 font-inter">{player.game}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    {[
                      { label: "K/D", value: player.kd?.toFixed(2) || "—" },
                      { label: "Wins", value: player.wins || "0" },
                      { label: "Matches", value: player.matches || "0" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-[rgba(255,255,255,0.03)] rounded-lg p-2">
                        <div className="font-orbitron text-white text-sm font-bold">{stat.value}</div>
                        <div className="text-slate-600 text-xs font-inter">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  {(player.instagram || player.youtube) && (
                    <div className="flex gap-2">
                      {player.instagram && (
                        <a href={player.instagram} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-orange-400 hover:border-[rgba(255,107,0,0.2)] transition-all font-inter">
                          <Instagram className="w-3 h-3" /> IG
                        </a>
                      )}
                      {player.youtube && (
                        <a href={player.youtube} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-red-400 hover:border-[rgba(239,68,68,0.2)] transition-all font-inter">
                          <Youtube className="w-3 h-3" /> YT
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

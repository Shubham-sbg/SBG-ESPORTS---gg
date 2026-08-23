import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Player {
  id: number;
  playerName: string;
  realName?: string;
  game: string;
  role: string;
  rank?: string;
  kd?: number;
  wins?: number;
  matches?: number;
  image?: string;
  instagram?: string;
  youtube?: string;
  status: string;
}

export default function PlayerCard3D({ player, index = 0 }: { player: Player; index?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setHovered(false);
  };

  const gameColor = { "Free Fire": "#ff6b00", BGMI: "#e94560", Valorant: "#ff4655", "COD Mobile": "#7c3aed" }[player.game] || "#ff6b00";

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setHovered(true)}
      style={{
        rotateX, rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="relative cursor-pointer select-none"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-0.5 rounded-2xl opacity-0 transition-opacity duration-300 blur-sm"
        style={{ background: `radial-gradient(circle at 50% 50%, ${gameColor}40, transparent 70%)` }}
        animate={{ opacity: hovered ? 1 : 0 }}
      />

      <div
        className="relative rounded-2xl overflow-hidden border transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          backdropFilter: "blur(10px)",
          borderColor: hovered ? `${gameColor}40` : "rgba(255,255,255,0.06)",
          boxShadow: hovered ? `0 20px 60px ${gameColor}20, 0 0 0 1px ${gameColor}20` : "none",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${gameColor}80, transparent)` }} />

        {/* Player image / avatar */}
        <div className="relative h-52 overflow-hidden" style={{ background: `linear-gradient(135deg, ${gameColor}10, transparent)` }}>
          {player.image ? (
            <motion.img
              src={player.image}
              alt={player.playerName}
              className="w-full h-full object-cover"
              animate={{ scale: hovered ? 1.05 : 1 }}
              transition={{ duration: 0.4 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                className="w-24 h-24 rounded-full flex items-center justify-center border-2"
                style={{ background: `${gameColor}15`, borderColor: `${gameColor}40` }}
                animate={{ scale: hovered ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="font-orbitron text-4xl font-black" style={{ color: gameColor }}>
                  {player.playerName?.[0]?.toUpperCase()}
                </span>
              </motion.div>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,20,0.95) 0%, rgba(10,10,20,0.2) 50%, transparent 100%)" }} />

          {/* Floating status badge */}
          <div className="absolute top-3 right-3">
            <motion.span
              className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm"
              style={{ background: `${gameColor}20`, color: gameColor, border: `1px solid ${gameColor}40` }}
              animate={{ y: hovered ? -2 : 0 }}
            >
              {player.game}
            </motion.span>
          </div>
        </div>

        {/* Info */}
        <div className="p-5" style={{ transform: "translateZ(20px)" }}>
          <motion.div animate={{ y: hovered ? -2 : 0 }} transition={{ duration: 0.3 }}>
            <h3 className="font-orbitron text-white font-black text-base mb-0.5">{player.playerName}</h3>
            {player.realName && <p className="text-slate-500 text-xs font-inter mb-2">{player.realName}</p>}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-inter" style={{ color: gameColor }}>{player.role}</span>
              {player.rank && <span className="text-xs text-slate-500 font-inter">{player.rank}</span>}
            </div>
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-3 gap-2"
            animate={{ y: hovered ? -1 : 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            {[
              { label: "K/D", value: player.kd?.toFixed(2) ?? "—" },
              { label: "Wins", value: player.wins ?? "—" },
              { label: "Played", value: player.matches ?? "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-2 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="font-orbitron text-white text-sm font-bold">{stat.value}</div>
                <div className="text-slate-600 text-xs font-inter">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

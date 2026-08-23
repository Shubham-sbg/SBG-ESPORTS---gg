import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetTournament } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { Calendar, Users, Trophy, ArrowLeft, ExternalLink, Play } from "lucide-react";

export default function TournamentDetailPage({ id }: { id: number }) {
  const { data: t, isLoading } = useGetTournament(id);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#060611" }}><div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!t) return <div className="min-h-screen flex items-center justify-center text-slate-500" style={{ background: "#060611" }}>Tournament not found.</div>;

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/tournaments">
          <a className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-400 text-sm mb-8 transition-colors font-inter">
            <ArrowLeft className="w-4 h-4" /> Back to Tournaments
          </a>
        </Link>

        {(t as any).banner && (
          <div className="rounded-xl overflow-hidden h-64 mb-8">
            <img src={(t as any).banner} alt={(t as any).title} className="w-full h-full object-cover" />
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(t as any).status === "ongoing" ? "badge-live" : (t as any).status === "completed" ? "badge-completed" : "badge-upcoming"}`}>
              {(t as any).status}
            </span>
            <span className="text-orange-400 text-xs font-inter">{(t as any).game}</span>
          </div>
          <h1 className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-6">{(t as any).title}</h1>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Start Date", value: formatDate((t as any).startDate), icon: Calendar },
              { label: "End Date", value: (t as any).endDate ? formatDate((t as any).endDate) : "TBD", icon: Calendar },
              { label: "Teams", value: `${(t as any).registeredTeams || 0}/${(t as any).maxTeams || "∞"}`, icon: Users },
              { label: "Prize Pool", value: (t as any).prizePool || "TBA", icon: Trophy },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
                  <Icon className="w-4 h-4 text-orange-400 mb-2" />
                  <div className="text-xs text-slate-500 font-inter mb-1">{item.label}</div>
                  <div className="font-orbitron text-white text-sm font-bold">{item.value}</div>
                </div>
              );
            })}
          </div>

          {(t as any).description && (
            <div className="glass rounded-xl p-6 border border-[rgba(255,255,255,0.06)] mb-6">
              <h2 className="font-orbitron text-white font-bold mb-3">About This Tournament</h2>
              <p className="text-slate-400 font-inter leading-relaxed text-sm">{(t as any).description}</p>
            </div>
          )}

          {(t as any).format && (
            <div className="glass rounded-xl p-6 border border-[rgba(255,255,255,0.06)] mb-6">
              <h2 className="font-orbitron text-white font-bold mb-3">Format</h2>
              <p className="text-slate-400 font-inter text-sm">{(t as any).format}</p>
            </div>
          )}

          {(t as any).rules && (
            <div className="glass rounded-xl p-6 border border-[rgba(255,255,255,0.06)] mb-6">
              <h2 className="font-orbitron text-white font-bold mb-3">Rules</h2>
              <p className="text-slate-400 font-inter text-sm whitespace-pre-wrap">{(t as any).rules}</p>
            </div>
          )}

          {(t as any).streamUrl && (
            <a
              href={(t as any).streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors font-inter text-sm"
            >
              <Play className="w-4 h-4" /> Watch Live Stream
            </a>
          )}
        </motion.div>
      </div>
    </div>
  );
}

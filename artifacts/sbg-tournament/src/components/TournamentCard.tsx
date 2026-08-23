import { Link } from 'wouter';
import { Trophy, Users, Calendar, Gamepad2, Clock } from 'lucide-react';
import type { Tournament } from '@/lib/types';

const RED  = '#e8192c';
const GOLD = '#d4af37';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  draft:        { label: 'Draft',        color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  registration: { label: 'Open',         color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  ongoing:      { label: 'Live 🔴',      color: RED,       bg: `${RED}15` },
  completed:    { label: 'Completed',    color: GOLD,      bg: `${GOLD}12` },
  cancelled:    { label: 'Cancelled',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const FORMAT_LABEL: Record<string, string> = {
  single_elimination: 'KO Bracket',
  double_elimination: 'Double Elim.',
  round_robin:        'Round Robin',
};

interface Props { tournament: Tournament; compact?: boolean }

export default function TournamentCard({ tournament: t, compact }: Props) {
  const st = STATUS_STYLE[t.status] ?? STATUS_STYLE.draft;

  return (
    <Link href={`/tournament/${t.id}`}
      className="block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(232,25,44,0.2)] group"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Banner */}
      <div className="relative h-36 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a0a0a)' }}>
        {t.banner
          ? <img src={t.banner} alt={t.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
          : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy size={48} style={{ color: `${RED}40` }} />
            </div>
          )
        }
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}>
            {st.label}
          </span>
        </div>
        {t.featured && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
              style={{ color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}35` }}>
              ⭐ Featured
            </span>
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-12"
          style={{ background: 'linear-gradient(to top, rgba(3,3,3,0.9), transparent)' }} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Game + format */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: `${RED}15`, color: RED, border: `1px solid ${RED}25` }}>
            <Gamepad2 size={10} /> {t.game}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-500"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {FORMAT_LABEL[t.format] ?? t.format}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-gray-500"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.gameMode}
          </span>
        </div>

        <h3 className="font-black text-white text-base leading-snug group-hover:text-red-400 transition-colors line-clamp-2">
          {t.title}
        </h3>

        {/* Prize pool */}
        <div className="text-gold-gradient font-black text-xl">{t.prizePool}</div>

        {compact ? null : (
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <Users size={11} style={{ color: RED }} />
              Max {t.maxTeams} teams
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={11} style={{ color: RED }} />
              {t.startDate}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: GOLD }} />
              Reg by {t.registrationDeadline}
            </div>
            <div className="flex items-center gap-1.5">
              {t.entryFee === 0
                ? <span className="text-green-500 font-bold">FREE ENTRY</span>
                : <span className="font-bold text-white">₹{t.entryFee}</span>
              }
            </div>
          </div>
        )}

        {t.status === 'registration' && (
          <div className="pt-1">
            <div className="w-full py-2.5 rounded-xl text-center text-[11px] font-black uppercase tracking-widest transition-all group-hover:scale-[1.02] text-black"
              style={{ background: `linear-gradient(135deg, ${RED}, #b00020)`, boxShadow: `0 4px 16px ${RED}40` }}>
              Register Now →
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

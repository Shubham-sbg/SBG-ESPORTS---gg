import { useState, useEffect } from 'react';
import type { RecruitmentOpening } from '@/lib/database';
import { useDatabase } from '@/hooks/useDatabase';

export default function RecruitmentPopup() {
  const [isOpen, setIsOpen]     = useState(false);
  const [openings, setOpenings] = useState<RecruitmentOpening[]>([]);
  const { db } = useDatabase();

  useEffect(() => {
    // Check if dismissed in this browser session
    try {
      const dismissed = sessionStorage.getItem('sbg_recruitment_popup_dismissed');
      if (dismissed === 'true') return;
    } catch {
      /* ignore storage error */
    }

    // Fetch active featured openings
    fetch((import.meta.env.VITE_API_URL || "https://sbg-esportsgg.onrender.com") + '/api/recruitment/openings')
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.openings) && data.openings.length > 0) {
          const featured = data.openings.filter((o: RecruitmentOpening) => o.featured !== false && o.status === 'Open');
          if (featured.length > 0) {
            setOpenings(featured);
            // Slight delay so the page loads smoothly first
            setTimeout(() => setIsOpen(true), 1200);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('sbg_recruitment_popup_dismissed', 'true');
    } catch {
      /* ignore storage error */
    }
  };

  if (!isOpen || openings.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1017] border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full relative shadow-2xl shadow-amber-500/10 space-y-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close recruitment popup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm transition-all">
          ✕
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1 text-amber-400 text-xs font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            {db?.settings?.recruitmentPopupSubtitle || 'WE ARE RECRUITING'}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider" dangerouslySetInnerHTML={{ __html: db?.settings?.recruitmentPopupTitle || 'JOIN <span class="text-amber-400" style="text-shadow: 0 0 20px #d4af37aa">SBG ESPORTS</span>' }} />
          <p className="text-xs text-gray-400 max-w-sm mx-auto">{db?.settings?.recruitmentPopupText || "We are actively scouting talent for official esports rosters & content teams."}</p>
        </div>

        {/* Featured Openings List */}
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {openings.map(opening => (
            <div
              key={opening.id}
              className="bg-white/3 border border-white/8 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {opening.position}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">{opening.game}</span>
                </div>
                <h4 className="font-bold text-white text-xs truncate mt-1">{opening.title}</h4>
              </div>

              <a
                href={`/join-team?openingId=${opening.id}`}
                onClick={handleClose}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-md shadow-amber-500/20 flex-shrink-0">
                Apply
              </a>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all">
            Maybe Later
          </button>
          <a
            href="/join-team"
            onClick={handleClose}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-widest text-center rounded-xl hover:opacity-90 transition-all shadow-lg shadow-amber-500/20">
            View All Openings 🚀
          </a>
        </div>
      </div>
    </div>
  );
}

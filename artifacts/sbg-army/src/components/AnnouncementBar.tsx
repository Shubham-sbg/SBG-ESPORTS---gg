import { useState } from 'react';
import { Settings } from '@/lib/database';

interface Props { settings: Settings; }

export default function AnnouncementBar({ settings }: Props) {
  const [visible, setVisible] = useState(true);
  const text = settings?.announcementText;
  if (!visible || !text?.trim()) return null;

  return (
    <div className="relative z-[60] bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 text-white text-center py-2 px-8 text-xs font-bold tracking-wide overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
      <div className="flex items-center justify-center gap-2 flex-wrap relative z-10">
        <span className="text-yellow-300 animate-pulse">📢</span>
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors text-base leading-none"
        aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

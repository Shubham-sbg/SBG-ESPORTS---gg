import React from 'react';

export type AspectRatioOption = 'original' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16';

export interface ImageRatioControlProps {
  value: AspectRatioOption;
  onChange: (ratio: AspectRatioOption) => void;
  className?: string;
}

export const RATIO_OPTIONS: { key: AspectRatioOption; label: string; aspect: string }[] = [
  { key: 'original', label: 'Original', aspect: 'Auto' },
  { key: '1:1', label: '1:1', aspect: 'Square' },
  { key: '4:3', label: '4:3', aspect: 'Standard' },
  { key: '16:9', label: '16:9', aspect: 'Widescreen' },
  { key: '3:2', label: '3:2', aspect: 'Photo' },
  { key: '9:16', label: '9:16', aspect: 'Portrait' },
];

export default function ImageRatioControl({ value, onChange, className = '' }: ImageRatioControlProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Aspect Ratio
      </label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {RATIO_OPTIONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => onChange(r.key)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
              value === r.key
                ? 'bg-yellow-500 text-black border-yellow-400 font-bold shadow-sm'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            <span>{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

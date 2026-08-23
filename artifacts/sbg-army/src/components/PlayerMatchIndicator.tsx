import React, { useState } from 'react';

export interface PlayerMatchData {
  score: number; // 0 - 100
  matchingSkills: string[];
  missingRequirements: string[];
  openingTitle?: string;
}

interface PlayerMatchIndicatorProps {
  match: PlayerMatchData;
  compact?: boolean;
  className?: string;
}

export default function PlayerMatchIndicator({ match, compact = false, className = '' }: PlayerMatchIndicatorProps) {
  const [activeView, setActiveView] = useState<'ring' | 'bar'>('ring');

  const { score, matchingSkills, missingRequirements } = match;

  // Determine status color styling based on score
  const isHighMatch = score >= 80;
  const isMediumMatch = score >= 60 && score < 80;

  const scoreColorClass = isHighMatch
    ? 'text-emerald-400'
    : isMediumMatch
    ? 'text-amber-400'
    : 'text-red-400';

  const scoreBgClass = isHighMatch
    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    : isMediumMatch
    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
    : 'bg-red-500/10 border-red-500/30 text-red-400';

  const ringGradientStart = isHighMatch ? '#10b981' : isMediumMatch ? '#f59e0b' : '#ef4444';
  const ringGradientEnd = isHighMatch ? '#06b6d4' : isMediumMatch ? '#d97706' : '#f43f5e';

  // SVG Radial Ring Parameters
  const radius = 38;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`} id="player-match-compact-container">
        <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
          <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 90 90">
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke={`url(#compact-ring-gradient-${score})`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
            <defs>
              <linearGradient id={`compact-ring-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={ringGradientStart} />
                <stop offset="100%" stopColor={ringGradientEnd} />
              </linearGradient>
            </defs>
          </svg>
          <span className={`absolute text-[10px] font-black ${scoreColorClass}`}>{score}%</span>
        </div>

        {missingRequirements.length > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {missingRequirements.length} Missing
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      id="player-match-indicator-container"
      className={`bg-slate-900/80 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4 ${className}`}
    >
      {/* Header & Score Summary */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
            <span className="text-amber-400 text-base">🎯</span> Player Match Indicator
          </span>
          {match.openingTitle && (
            <span className="text-[11px] font-semibold text-gray-400 truncate max-w-[180px]">
              ({match.openingTitle})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle between Ring & Bar View */}
          <div id="match-breakdown-toggle" className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveView('ring')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                activeView === 'ring' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Ring
            </button>
            <button
              type="button"
              onClick={() => setActiveView('bar')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                activeView === 'bar' ? 'bg-amber-500 text-black shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Bar
            </button>
          </div>

          <span
            id="player-match-score-badge"
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${scoreBgClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${isHighMatch ? 'bg-emerald-400 animate-pulse' : isMediumMatch ? 'bg-amber-400' : 'bg-red-400 animate-ping'}`} />
            {score}% MATCH
          </span>
        </div>
      </div>

      {/* Main Visual Display: Ring or Bar Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-black/30 border border-white/5 rounded-xl p-3.5">
        {/* Ring Chart View */}
        {activeView === 'ring' ? (
          <div id="player-match-ring-chart" className="sm:col-span-5 flex flex-col items-center justify-center p-2">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={`url(#match-ring-gradient-${score})`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id={`match-ring-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={ringGradientStart} />
                    <stop offset="100%" stopColor={ringGradientEnd} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-black tracking-tight ${scoreColorClass}`}>{score}%</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Match Score</span>
              </div>
            </div>
          </div>
        ) : (
          /* Bar Chart View */
          <div id="player-match-bar-chart" className="sm:col-span-5 flex flex-col justify-center space-y-2 p-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-300">Requirement Fit</span>
              <span className={`font-black ${scoreColorClass}`}>{score}%</span>
            </div>
            <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-1 text-[8px] font-black text-black"
                style={{
                  width: `${Math.max(10, score)}%`,
                  background: `linear-gradient(90deg, ${ringGradientStart}, ${ringGradientEnd})`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1.5 text-center">
                <span className="text-emerald-400 font-bold block">{matchingSkills.length} Passed</span>
                <span className="text-gray-400 text-[9px]">Matched Items</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded p-1.5 text-center">
                <span className="text-red-400 font-bold block">{missingRequirements.length} Missing</span>
                <span className="text-gray-400 text-[9px]">Requirement Gap</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Breakdown & Quick Stats */}
        <div className="sm:col-span-7 space-y-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
          <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
            <span>Match Overview</span>
            <span className="text-[10px] text-gray-400 font-normal">
              {matchingSkills.length} / {matchingSkills.length + missingRequirements.length} Criteria
            </span>
          </div>

          <div className="flex gap-2 text-xs">
            <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-2">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Matched</span>
              <span className="text-lg font-black text-white">{matchingSkills.length}</span>
            </div>
            <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              <span className="text-[10px] text-red-400 font-bold uppercase block">Missing</span>
              <span className="text-lg font-black text-red-400">{missingRequirements.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MISSING REQUIREMENTS HIGHLIGHT SECTION (Highlighted in Red for quick identification) */}
      {missingRequirements.length > 0 ? (
        <div
          id="missing-requirements-section"
          className="bg-red-950/30 border-2 border-red-500/40 rounded-xl p-3.5 space-y-2 shadow-lg shadow-red-950/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-red-400 font-black text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>⚠ Missing Requirements ({missingRequirements.length})</span>
            </div>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded">
              Action Required
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {missingRequirements.map((m, idx) => (
              <div
                key={idx}
                className="px-2.5 py-1 bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
              >
                <span className="text-red-400 font-bold text-sm leading-none">✕</span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-center text-xs font-semibold text-emerald-400 flex items-center justify-center gap-2">
          <span>✓ All core opening requirements met!</span>
        </div>
      )}

      {/* MATCHING CRITERIA SECTION */}
      {matchingSkills.length > 0 && (
        <div id="matching-skills-section" className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-3 space-y-2">
          <div className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">✓</span>
            <span>Matched Criteria ({matchingSkills.length})</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {matchingSkills.map((m, idx) => (
              <div
                key={idx}
                className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-1"
              >
                <span className="text-emerald-400 text-[10px]">✓</span>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-gray-400 italic pt-1 border-t border-white/5 flex items-center justify-between">
        <span>ⓘ Requirement match algorithm provides scouting support.</span>
        <span className="font-semibold text-gray-400">SBG Match Engine v2.0</span>
      </div>
    </div>
  );
}

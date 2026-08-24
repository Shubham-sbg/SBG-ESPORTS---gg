import { useRef, useEffect, useState, useCallback } from 'react';
import { FacilitySection as FacilitySectionType, FacilityStat, Settings } from '@/lib/database';
import { apiUrl } from '@/lib/api';

interface Props {
  facility?: FacilitySectionType[];
  facilityStats?: FacilityStat[];
  settings?: Settings;
  disableDirectFetch?: boolean;
}

export default function FacilitySection({
  facility: propFacility,
  facilityStats: propFacilityStats,
  settings: propSettings,
  disableDirectFetch = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Database API Data State
  const [facilityData, setFacilityData] = useState<FacilitySectionType[]>(propFacility || []);
  const [statsData, setStatsData] = useState<FacilityStat[]>(propFacilityStats || []);
  const [settingsData, setSettingsData] = useState<Settings | undefined>(propSettings);

  const [loading, setLoading] = useState<boolean>(
    !disableDirectFetch && propFacility === undefined && propFacilityStats === undefined
  );
  const [error, setError] = useState<string | null>(null);

  // Intersection observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Sync state if incoming props update
  useEffect(() => {
    if (propFacility !== undefined) setFacilityData(propFacility);
    if (propFacilityStats !== undefined) setStatsData(propFacilityStats);
    if (propSettings !== undefined) setSettingsData(propSettings);
  }, [propFacility, propFacilityStats, propSettings]);

  // Fetch directly from database API only if props were not provided
  const fetchFacilityDataFromApi = useCallback(async () => {
    if (disableDirectFetch) return;
    if (propFacility !== undefined || propFacilityStats !== undefined) return;
    
    setLoading(true);
    setError(null);
    try {
      const [facRes, statsRes, setRes] = await Promise.all([
        fetch(apiUrl('/api/db/facility')),
        fetch(apiUrl('/api/db/facilityStats')),
        fetch(apiUrl('/api/db/settings')),
      ]);

      if (!facRes.ok || !statsRes.ok) {
        throw new Error(`Database API returned HTTP error (${facRes.status}/${statsRes.status})`);
      }

      const facJson = await facRes.json();
      const statsJson = await statsRes.json();
      const settingsJson = setRes.ok ? await setRes.json() : undefined;

      if (Array.isArray(facJson)) setFacilityData(facJson);
      if (Array.isArray(statsJson)) setStatsData(statsJson);
      if (settingsJson && typeof settingsJson === 'object') {
        setSettingsData(settingsJson);
      }
    } catch (err: any) {
      console.warn('FacilitySection: API load notice:', err?.message || err);
      setError(err?.message || 'Unable to connect to database API. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [disableDirectFetch, propFacility, propFacilityStats]);

  useEffect(() => {
    fetchFacilityDataFromApi();
  }, [fetchFacilityDataFromApi]);

  const activeSettings = settingsData || propSettings;
  const badge = activeSettings?.facilityBadge || 'EXCELLENCE';
  const title = activeSettings?.facilityTitle || 'OUR FACILITY';
  const subtitle = activeSettings?.facilitySubtitle;
  const headerIcon = activeSettings?.facilityIcon;

  const stats = (statsData || [])
    .filter(s => s.visible !== false && (s as any).enabled !== false && (s as any).published !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const features = (facilityData || [])
    .filter(f => f.visible !== false && (f as any).enabled !== false && (f as any).published !== false)
    .sort((a, b) => a.order - b.order);

  // --------------------------------------------------------------------------
  // Loading State UI
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <section id="facility" className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16 space-y-3 animate-pulse">
          <div className="w-28 h-3 bg-white/10 rounded-full mx-auto" />
          <div className="w-64 h-10 bg-white/10 rounded-xl mx-auto" />
          <div className="w-96 max-w-full h-4 bg-white/5 rounded mx-auto" />
          <div className="w-24 h-1 bg-white/10 mx-auto mt-4 rounded-full" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/3 text-center space-y-3">
              <div className="w-8 h-8 bg-white/10 rounded-full mx-auto" />
              <div className="w-20 h-10 bg-white/10 rounded-lg mx-auto" />
              <div className="w-24 h-3 bg-white/5 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Features Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-5 p-6 rounded-2xl border border-white/5 bg-white/3">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex-shrink-0" />
              <div className="space-y-2 flex-1 pt-1">
                <div className="w-40 h-5 bg-white/10 rounded" />
                <div className="w-full h-3 bg-white/5 rounded" />
                <div className="w-3/4 h-3 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // --------------------------------------------------------------------------
  // Error State UI
  // --------------------------------------------------------------------------
  if (error) {
    return (
      <section id="facility" className="py-20 max-w-4xl mx-auto px-4 text-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-4">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl flex items-center justify-center text-2xl mx-auto">
            ⚠️
          </div>
          <h3 className="text-xl font-black text-white tracking-wide">Facility Data Retrieval Error</h3>
          <p className="text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
            {error}
          </p>
          <div className="pt-2">
            <button
              onClick={() => fetchFacilityDataFromApi()}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 mx-auto">
              <span>🔄</span> Retry Database Connection
            </button>
          </div>
        </div>
      </section>
    );
  }

  // --------------------------------------------------------------------------
  // Empty State / Hidden Check
  // --------------------------------------------------------------------------
  if (stats.length === 0 && features.length === 0) {
    return null;
  }

  // --------------------------------------------------------------------------
  // Main Facility Section
  // --------------------------------------------------------------------------
  return (
    <section
      id="facility"
      ref={sectionRef}
      className={`py-24 transition-all duration-1000 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.3em] text-orange-400 uppercase">{badge}</span>
          <h2 className="text-4xl md:text-5xl font-black tracking-widest mt-2 text-white flex items-center justify-center gap-3 flex-wrap">
            {headerIcon && <span className="text-3xl md:text-4xl">{headerIcon}</span>}
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-2 max-w-2xl mx-auto font-medium">{subtitle}</p>
          )}
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mt-4" />
        </div>

        {/* Stats Grid */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map(stat => (
              <div
                key={stat.id}
                className="text-center p-6 rounded-2xl border border-white/5 bg-white/3 hover:border-orange-500/30 hover:bg-white/5 transition-all">
                {stat.icon && <div className="text-2xl mb-2">{stat.icon}</div>}
                <div className="text-4xl md:text-5xl font-black mb-2" style={{ color: stat.color || '#ff6b00' }}>
                  {stat.value || `${stat.numericEnd ?? ''}${stat.suffix ?? ''}`}
                </div>
                <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Feature Cards Grid */}
        {features.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(feat => (
              <div
                key={feat.id}
                className="flex gap-5 p-6 rounded-2xl border border-white/5 bg-white/3 hover:border-orange-500/30 hover:bg-white/5 transition-all duration-300">
                {feat.image ? (
                  <img
                    src={feat.image}
                    alt={feat.title}
                    loading="lazy"
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="text-3xl flex-shrink-0 w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    {feat.icon || '🎮'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">{feat.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

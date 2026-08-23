import { useState, useEffect } from 'react';
import { Ad, getDB } from '@/lib/database';

interface Props {
  ads: Ad[];
}

function isAdActive(ad: Ad): boolean {
  if (!ad.enabled) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (ad.startDate) {
    const start = new Date(ad.startDate);
    start.setHours(0, 0, 0, 0);
    if (today < start) return false;
  }
  if (ad.endDate) {
    const end = new Date(ad.endDate);
    end.setHours(23, 59, 59, 999);
    if (today > end) return false;
  }
  return true;
}

function isDismissed(adId: string): boolean {
  try {
    const key = `ad_dismissed_${adId}`;
    const val = localStorage.getItem(key);
    if (!val) return false;
    const dismissedAt = parseInt(val, 10);
    return Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function setDismissed(adId: string) {
  try {
    localStorage.setItem(`ad_dismissed_${adId}`, String(Date.now()));
  } catch {}
}

function AdContent({ ad, className = '' }: { ad: Ad; className?: string }) {
  if (ad.imageUrl) {
    const img = <img src={ad.imageUrl} alt={ad.title || 'Advertisement'} className={`object-contain ${className}`} />;
    return ad.link ? (
      <a href={ad.link} target="_blank" rel="noopener noreferrer">{img}</a>
    ) : img;
  }
  if (ad.videoUrl) {
    return <video src={ad.videoUrl} autoPlay muted loop playsInline className={`object-cover ${className}`} />;
  }
  if (ad.script) {
    return <div dangerouslySetInnerHTML={{ __html: ad.script }} />;
  }
  if (ad.iframeSrc) {
    return <iframe src={ad.iframeSrc} className={`border-none ${className}`} title={ad.title || 'Ad'} />;
  }
  if (ad.title && ad.link) {
    return (
      <a href={ad.link} target="_blank" rel="noopener noreferrer"
        className="text-orange-400 underline text-sm font-bold">
        {ad.title}
      </a>
    );
  }
  return null;
}

export default function AdsRenderer({ ads }: Props) {
  const safeAds = ads || [];
  const activeAds = safeAds.filter(isAdActive);

  // Dynamically inject configured Ad Network Scripts (Google AdSense / HilltopAds / Custom)
  useEffect(() => {
    try {
      const db = getDB();
      const providers = db.settings?.adProviders;
      if (!providers || providers.globalAdsEnabled === false) return;

      // 1. Google AdSense Injection
      if (
        (providers.activeProvider === 'adsense' || providers.activeProvider === 'both') &&
        providers.adsense?.enabled &&
        providers.adsense.publisherId
      ) {
        const pubId = providers.adsense.publisherId.trim();
        const scriptId = 'sbg-adsense-script';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId.startsWith('ca-pub-') ? pubId : `ca-pub-${pubId}`}`;
          document.head.appendChild(script);
        }
      }

      // 2. HilltopAds Script Injection
      if (
        (providers.activeProvider === 'hilltopads' || providers.activeProvider === 'both') &&
        providers.hilltopads?.enabled
      ) {
        if (providers.hilltopads.popunderScript && !document.getElementById('sbg-hilltop-popunder')) {
          const div = document.createElement('div');
          div.id = 'sbg-hilltop-popunder';
          div.innerHTML = providers.hilltopads.popunderScript;
          document.body.appendChild(div);
        }
      }

      // 3. Custom Provider Injection
      if (providers.activeProvider === 'custom' && providers.customProvider?.enabled) {
        if (providers.customProvider.headerScript && !document.getElementById('sbg-custom-ad-header')) {
          const div = document.createElement('div');
          div.id = 'sbg-custom-ad-header';
          div.innerHTML = providers.customProvider.headerScript;
          document.head.appendChild(div);
        }
      }
    } catch {
      // Safe fallback if script injection encounters browser restrictions
    }
  }, []);

  const popupAds = activeAds.filter(a =>
    a.adType === 'popup' || a.placement === 'popup'
  );

  const bannerAds = activeAds.filter(a =>
    (a.adType === 'banner' || a.placement === 'header' || a.placement === 'hero') &&
    a.adType !== 'popup' && a.placement !== 'popup'
  );

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initial = new Set<string>();
    popupAds.forEach(ad => {
      if (isDismissed(ad.id)) initial.add(ad.id);
    });
    setDismissedIds(initial);
  }, [popupAds.map(a => a.id).join(',')]);

  const dismissPopup = (adId: string) => {
    setDismissed(adId);
    setDismissedIds(prev => new Set([...prev, adId]));
  };

  const visiblePopup = popupAds.find(a => !dismissedIds.has(a.id));

  return (
    <>
      {bannerAds.length > 0 && (
        <div className="w-full z-40 relative bg-black/70 border-b border-orange-500/10">
          {bannerAds.map(ad => (
            <div key={ad.id} className="flex items-center justify-center py-2 px-4">
              <AdContent ad={ad} className="max-h-16 max-w-full" />
            </div>
          ))}
        </div>
      )}

      {visiblePopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative bg-[#0d0d0d] border border-orange-500/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <button
              onClick={() => dismissPopup(visiblePopup.id)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center text-base leading-none hover:bg-white/20 transition-colors"
              aria-label="Close advertisement"
            >
              ✕
            </button>
            {(visiblePopup.imageUrl || visiblePopup.videoUrl) ? (
              <AdContent ad={visiblePopup} className="w-full max-h-[70vh]" />
            ) : (
              <div className="p-8 text-center">
                <p className="text-white font-bold text-lg mb-4">{visiblePopup.title || 'Advertisement'}</p>
                {visiblePopup.link && (
                  <a href={visiblePopup.link} target="_blank" rel="noopener noreferrer"
                    onClick={() => dismissPopup(visiblePopup.id)}
                    className="inline-block px-6 py-2 bg-orange-500 text-black font-bold rounded-lg text-sm hover:bg-orange-400 transition-colors">
                    Learn More
                  </a>
                )}
                {visiblePopup.script && <div dangerouslySetInnerHTML={{ __html: visiblePopup.script }} />}
                {visiblePopup.iframeSrc && (
                  <iframe src={visiblePopup.iframeSrc} className="w-full min-h-48 border-none mt-4 rounded-lg" title={visiblePopup.title || 'Ad'} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

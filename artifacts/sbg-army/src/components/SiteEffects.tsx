/**
 * SiteEffects — zero-UI side-effect component mounted once at app root.
 *
 * Responsibilities:
 *  1. SEO  – keeps <title>, <meta>, <link rel="canonical"> in sync with
 *             db.settings (metaTitle, metaDescription, seoKeywords, seoOgImage, analyticsId).
 *  2. Code – injects/updates enabled customCode snippets (CSS in <style>,
 *             JS in <script>, HTML appended to <body>) whenever the DB changes.
 *
 * Re-applies on every `sbg-db-updated` custom event emitted by the WS client.
 */
import { useEffect } from 'react';
import { getDB } from '@/lib/database';

// ── helpers ──────────────────────────────────────────────────────────────────

function setMeta(name: string, content: string) {
  if (!content) return;
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
  el.content = content;
}

function setOgMeta(property: string, content: string) {
  if (!content) return;
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
  el.content = content;
}

function injectAnalytics(id: string) {
  if (!id || document.getElementById('sbg-analytics')) return;
  const s = document.createElement('script');
  s.id = 'sbg-analytics';
  s.async = true;
  if (id.startsWith('GTM-')) {
    s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  } else {
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    s.onload = () => {
      const w = window as any;
      w.dataLayer = w.dataLayer || [];
      w.gtag = function () { w.dataLayer.push(arguments); };
      w.gtag('js', new Date());
      w.gtag('config', id);
    };
  }
  document.head.appendChild(s);
}

const SNIPPET_CSS_ID = 'sbg-custom-css';
const SNIPPET_HTML_ID = 'sbg-custom-html';

function applySnippets(snippets: any[]) {
  const enabled = (snippets || []).filter((s: any) => s.enabled);

  // CSS — single <style> block
  const cssCode = enabled.filter((s: any) => s.type === 'css').map((s: any) => s.code).join('\n');
  let styleEl = document.getElementById(SNIPPET_CSS_ID) as HTMLStyleElement | null;
  if (cssCode) {
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = SNIPPET_CSS_ID; document.head.appendChild(styleEl); }
    styleEl.textContent = cssCode;
  } else {
    styleEl?.remove();
  }

  // JS — re-inject only new/changed snippets (keyed by id)
  enabled.filter((s: any) => s.type === 'js').forEach((s: any) => {
    const elId = `sbg-cc-js-${s.id}`;
    if (document.getElementById(elId)) return; // already injected
    const el = document.createElement('script');
    el.id = elId;
    el.textContent = `try{${s.code}}catch(e){console.warn('[SBG custom snippet error]',e)}`;
    document.body.appendChild(el);
  });

  // HTML — replace entire block
  let htmlEl = document.getElementById(SNIPPET_HTML_ID);
  const htmlCode = enabled.filter((s: any) => s.type === 'html').map((s: any) => s.code).join('\n');
  if (htmlCode) {
    if (!htmlEl) { htmlEl = document.createElement('div'); htmlEl.id = SNIPPET_HTML_ID; htmlEl.style.display = 'none'; document.body.appendChild(htmlEl); }
    htmlEl.innerHTML = htmlCode;
  } else {
    htmlEl?.remove();
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function SiteEffects() {
  useEffect(() => {
    const apply = () => {
      const db = getDB();
      const s = db.settings;

      // 1. Document title
      if (s.metaTitle) document.title = s.metaTitle;

      // 2. Standard meta
      setMeta('description', s.metaDescription ?? '');
      setMeta('keywords', (s as any).seoKeywords ?? '');
      
      // Google Search Console Meta
      if ((s as any).gscVerification) {
        setMeta('google-site-verification', (s as any).gscVerification);
      }

      // 3. Open Graph
      setOgMeta('og:title', s.metaTitle ?? s.organizationName ?? '');
      setOgMeta('og:description', s.metaDescription ?? '');
      setOgMeta('og:image', (s as any).seoOgImage ?? '');
      setOgMeta('og:type', 'website');

      // 4. Twitter card
      setOgMeta('twitter:card', 'summary_large_image');
      setOgMeta('twitter:title', s.metaTitle ?? s.organizationName ?? '');
      setOgMeta('twitter:description', s.metaDescription ?? '');
      setOgMeta('twitter:image', (s as any).seoOgImage ?? '');

      // 5. Analytics (injected once)
      if (s.analyticsId) injectAnalytics(s.analyticsId);

      // 6. Custom code snippets
      applySnippets((db as any).customCode ?? []);
    };

    apply();
    window.addEventListener('sbg-db-updated', apply);
    return () => window.removeEventListener('sbg-db-updated', apply);
  }, []);

  return null;
}

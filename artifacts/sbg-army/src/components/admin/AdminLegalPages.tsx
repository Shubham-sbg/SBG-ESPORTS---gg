import { useState, useRef, useCallback } from 'react';
import { getDB, saveDB } from '@/lib/database';
import { ADMIN_BRAND_NAME } from '@/lib/brandConfig';

const GOLD = '#d4af37';

interface Props { onRefresh: () => void; }

type LegalKey = 'privacyPolicy' | 'terms' | 'cookies' | 'refund' | 'dmca' | 'disclaimer';

const TABS: { key: LegalKey; label: string }[] = [
  { key: 'privacyPolicy', label: 'Privacy Policy' },
  { key: 'terms',         label: 'Terms & Conditions' },
  { key: 'cookies',       label: 'Cookie Policy' },
  { key: 'refund',        label: 'Refund Policy' },
  { key: 'dmca',          label: 'DMCA' },
  { key: 'disclaimer',    label: 'Disclaimer' },
];

const TEMPLATES: Record<LegalKey, string> = {
  privacyPolicy: `<h2>Privacy Policy</h2>
<p>Last updated: January 1, 2025</p>
<p>${ADMIN_BRAND_NAME} ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy describes how we collect, use, and share information about you when you use our website and services.</p>
<h3>Information We Collect</h3>
<p>We may collect information you provide directly to us, such as your name, email address, and gaming username when you register for tournaments or contact us.</p>
<h3>How We Use Your Information</h3>
<ul><li>To provide, maintain, and improve our services</li><li>To communicate with you about tournaments and events</li><li>To comply with legal obligations</li></ul>
<h3>Contact Us</h3>
<p>If you have any questions about this Privacy Policy, please contact us at our official channels.</p>`,

  terms: `<h2>Terms & Conditions</h2>
<p>Last updated: January 1, 2025</p>
<p>By accessing or using the ${ADMIN_BRAND_NAME} website and services, you agree to be bound by these Terms & Conditions.</p>
<h3>Use of Service</h3>
<p>You must be at least 13 years old to use our services. You agree to use our platform only for lawful purposes and in accordance with these Terms.</p>
<h3>Tournament Participation</h3>
<ul><li>All participants must abide by fair play rules</li><li>Cheating or exploiting will result in immediate disqualification</li><li>Prize distributions are at the organizer's discretion</li></ul>
<h3>Intellectual Property</h3>
<p>All content, logos, and branding on this site are the property of ${ADMIN_BRAND_NAME}. Unauthorized use is prohibited.</p>
<h3>Limitation of Liability</h3>
<p>${ADMIN_BRAND_NAME} shall not be liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>`,

  cookies: `<h2>Cookie Policy</h2>
<p>Last updated: January 1, 2025</p>
<p>${ADMIN_BRAND_NAME} uses cookies and similar tracking technologies to enhance your experience on our website.</p>
<h3>What Are Cookies</h3>
<p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and understand how you use our site.</p>
<h3>Types of Cookies We Use</h3>
<ul><li><strong>Essential Cookies:</strong> Required for the website to function properly</li><li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site</li><li><strong>Preference Cookies:</strong> Remember your settings and preferences</li></ul>
<h3>Managing Cookies</h3>
<p>You can control cookies through your browser settings. Disabling certain cookies may affect the functionality of our site.</p>`,

  refund: `<h2>Refund Policy</h2>
<p>Last updated: January 1, 2025</p>
<p>This Refund Policy outlines the terms under which ${ADMIN_BRAND_NAME} processes refunds for tournament entry fees and merchandise purchases.</p>
<h3>Tournament Entry Fees</h3>
<ul><li>Refunds are available up to 48 hours before the tournament start time</li><li>No refunds will be issued after the tournament has begun</li><li>In case of tournament cancellation, full refunds will be processed within 7 business days</li></ul>
<h3>Merchandise</h3>
<p>Merchandise refund requests must be submitted within 7 days of delivery. Items must be unused and in original condition.</p>
<h3>How to Request a Refund</h3>
<p>Contact our support team via WhatsApp or email with your order details and reason for the refund request.</p>`,

  dmca: `<h2>DMCA Policy</h2>
<p>Last updated: January 1, 2025</p>
<p>${ADMIN_BRAND_NAME} respects the intellectual property rights of others and expects users to do the same. This policy outlines our procedures for addressing copyright infringement claims under the Digital Millennium Copyright Act (DMCA).</p>
<h3>Reporting Infringement</h3>
<p>If you believe that content on our platform infringes your copyright, please provide the following information to our designated agent:</p>
<ul><li>Identification of the copyrighted work claimed to be infringed</li><li>Identification of the infringing material and its location</li><li>Your contact information</li><li>A statement of good faith belief that the use is not authorized</li><li>A statement of accuracy under penalty of perjury</li></ul>
<h3>Counter-Notice</h3>
<p>If you believe your content was removed in error, you may submit a counter-notice to our designated agent.</p>`,

  disclaimer: `<h2>Disclaimer</h2>
<p>Last updated: January 1, 2025</p>
<p>The information provided on the ${ADMIN_BRAND_NAME} website is for general informational purposes only. While we strive to keep the information up to date and correct, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or availability of the information.</p>
<h3>No Professional Advice</h3>
<p>Nothing on this website constitutes professional, legal, financial, or any other form of professional advice. Always consult a qualified professional for specific advice.</p>
<h3>External Links</h3>
<p>Our website may contain links to external sites. We have no control over the content of those sites and accept no responsibility for them.</p>
<h3>Esports Content</h3>
<p>Match results, player statistics, and tournament information are provided as-is and may not reflect real-time data. ${ADMIN_BRAND_NAME} is not responsible for errors or omissions in this information.</p>`,
};

function insertAroundSelection(
  ta: HTMLTextAreaElement,
  before: string,
  after: string,
  defaultText: string
): string {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const val = ta.value;
  const selected = val.substring(start, end) || defaultText;
  return val.substring(0, start) + before + selected + after + val.substring(end);
}

function insertAtCursor(ta: HTMLTextAreaElement, text: string): string {
  const start = ta.selectionStart;
  const val = ta.value;
  return val.substring(0, start) + text + val.substring(start);
}

export default function AdminLegalPages({ onRefresh }: Props) {
  const db = getDB();
  const [activeTab, setActiveTab] = useState<LegalKey>('privacyPolicy');
  const [contents, setContents] = useState<Record<LegalKey, string>>(() => {
    const lp = db.settings.legalPages ?? {};
    const init: Partial<Record<LegalKey, string>> = {};
    for (const t of TABS) {
      init[t.key] = lp[t.key] ?? '';
    }
    return init as Record<LegalKey, string>;
  });
  const [saved, setSaved] = useState<Record<LegalKey, boolean>>({} as Record<LegalKey, boolean>);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const updateContent = (key: LegalKey, value: string) => {
    setContents(prev => ({ ...prev, [key]: value }));
  };

  const applyFormat = useCallback((type: string) => {
    const ta = taRef.current;
    if (!ta) return;
    let newVal = contents[activeTab];
    if (type === 'bold') {
      newVal = insertAroundSelection(ta, '<strong>', '</strong>', 'bold text');
    } else if (type === 'italic') {
      newVal = insertAroundSelection(ta, '<em>', '</em>', 'italic text');
    } else if (type === 'h2') {
      newVal = insertAroundSelection(ta, '<h2>', '</h2>', 'Heading 2');
    } else if (type === 'h3') {
      newVal = insertAroundSelection(ta, '<h3>', '</h3>', 'Heading 3');
    } else if (type === 'link') {
      const url = prompt('Enter URL:', 'https://');
      if (!url) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.substring(start, end) || 'link text';
      newVal = ta.value.substring(0, start) + `<a href="${url}">${selected}</a>` + ta.value.substring(end);
    } else if (type === 'bullet') {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = ta.value.substring(start, end) || 'list item';
      newVal = ta.value.substring(0, start) + `<ul><li>${selected}</li></ul>` + ta.value.substring(end);
    } else if (type === 'hr') {
      newVal = insertAtCursor(ta, '\n<hr/>\n');
    } else if (type === 'clear') {
      newVal = '';
    }
    updateContent(activeTab, newVal);
    // Restore focus
    setTimeout(() => ta.focus(), 0);
  }, [activeTab, contents]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cur = getDB();
      if (!cur.settings.legalPages) cur.settings.legalPages = {};
      cur.settings.legalPages[activeTab] = contents[activeTab];
      await saveDB(cur);
      onRefresh();
      setSaved(prev => ({ ...prev, [activeTab]: true }));
      setTimeout(() => setSaved(prev => ({ ...prev, [activeTab]: false })), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleTemplate = () => {
    updateContent(activeTab, TEMPLATES[activeTab]);
  };

  const existsInDB = (key: LegalKey): boolean => {
    const lp = getDB().settings.legalPages ?? {};
    return !!(lp[key]);
  };

  const toolbarBtns = [
    { id: 'bold',   label: 'B',    title: 'Bold' },
    { id: 'italic', label: 'I',    title: 'Italic' },
    { id: 'h2',     label: 'H2',   title: 'Heading 2' },
    { id: 'h3',     label: 'H3',   title: 'Heading 3' },
    { id: 'link',   label: '🔗',   title: 'Insert Link' },
    { id: 'bullet', label: '•—',   title: 'Bullet List' },
    { id: 'hr',     label: '—',    title: 'Horizontal Rule' },
    { id: 'clear',  label: '✕',    title: 'Clear All' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest" style={{ color: GOLD }}>Legal Pages</h2>
          <p className="text-sm text-gray-400 mt-0.5">Edit rich-text HTML for each legal page</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setShowPreview(false); }}
            className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200"
            style={
              activeTab === t.key
                ? { background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, color: '#000' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Editor Panel */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          {toolbarBtns.map(btn => (
            <button
              key={btn.id}
              onClick={() => applyFormat(btn.id)}
              title={btn.title}
              className="px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {btn.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowPreview(v => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
              style={showPreview
                ? { background: `${GOLD}20`, border: `1px solid ${GOLD}50`, color: GOLD }
                : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }
              }
            >
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Editor + Preview */}
        <div className={`flex flex-col ${showPreview ? 'md:flex-row' : ''}`}>
          {/* Textarea */}
          <div className={`p-4 ${showPreview ? 'md:w-1/2' : 'w-full'}`}>
            <textarea
              ref={taRef}
              value={contents[activeTab]}
              onChange={e => updateContent(activeTab, e.target.value)}
              className="w-full h-96 rounded-xl px-4 py-2.5 text-white text-sm font-mono leading-relaxed resize-y focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                minHeight: '24rem',
              }}
              placeholder={`Enter HTML content for ${TABS.find(t => t.key === activeTab)?.label}...`}
            />
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="md:w-1/2 p-4 border-t md:border-t-0 md:border-l" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: GOLD }}>Live Preview</p>
              <div
                className="h-96 overflow-y-auto rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="legal-preview"
                  style={{
                    color: '#d1d5db',
                    fontSize: '14px',
                    lineHeight: '1.7',
                  }}
                  dangerouslySetInnerHTML={{ __html: contents[activeTab] || '<p style="color:#6b7280">Nothing to preview yet.</p>' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTemplate}
              className="px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}
            >
              Insert Template
            </button>
            {existsInDB(activeTab) && (
              <span className="text-xs text-gray-500">
                Last saved: content exists in database
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all hover:scale-105 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b8960c)`, color: '#000' }}
          >
            {saving ? 'Saving…' : saved[activeTab] ? '✓ Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Inline styles for preview */}
      <style>{`
        .legal-preview h2 { color: #fff; font-weight: 700; font-size: 1.2em; margin: 1em 0 0.4em; }
        .legal-preview h3 { color: #fff; font-weight: 700; font-size: 1.05em; margin: 0.8em 0 0.3em; }
        .legal-preview a { color: #f5e27e; text-decoration: underline; }
        .legal-preview ul { list-style: disc; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .legal-preview li { margin-bottom: 0.25rem; }
        .legal-preview p { margin-bottom: 0.75rem; }
        .legal-preview strong { color: #fff; }
        .legal-preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1rem 0; }
      `}</style>
    </div>
  );
}

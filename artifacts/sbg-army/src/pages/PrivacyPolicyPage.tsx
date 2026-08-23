import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const HARDCODED_SECTIONS = [
  { title: '1. Who We Are', content: `<p>${PUBLIC_BRAND_NAME} is a professional esports organization based in India. Our website provides information about our teams, tournaments, merchandise, and player services.</p>` },
  { title: '2. Information We Collect', content: `<ul class="list-disc list-inside space-y-1 mt-2 ml-2"><li><strong class="text-white">Account Information:</strong> Name, email, username, and password (hashed).</li><li><strong class="text-white">Profile Data:</strong> Game UID, rank, WhatsApp, country, avatar.</li><li><strong class="text-white">Transaction Data:</strong> Order details and payment confirmations.</li><li><strong class="text-white">Usage Data:</strong> Pages visited, device type, browser type.</li></ul>` },
  { title: '3. How We Use Your Information', content: `<ul class="list-disc list-inside space-y-1 ml-2"><li>To provide and maintain our services.</li><li>To process and fulfill merchandise orders.</li><li>To communicate with you about orders and tournaments.</li><li>To analyze website usage and improve our services.</li></ul>` },
  { title: '4. Data Storage & Security', content: `<p>Your data is stored securely. We implement encryption for data at rest and TLS for data in transit, with regular automated backups.</p>` },
  { title: '5. Cookies', content: `<p>We use essential, analytics, and preference cookies. See our <a href="/cookie-policy" class="text-orange-400 hover:underline">Cookie Policy</a> for details.</p>` },
  { title: '6. Third-Party Services', content: `<ul class="list-disc list-inside space-y-1 ml-2"><li><strong class="text-white">Supabase:</strong> Database, authentication, and file storage.</li><li><strong class="text-white">Google Analytics:</strong> Website analytics.</li><li><strong class="text-white">Google OAuth:</strong> Optional sign-in method.</li></ul>` },
  { title: '7. Your Rights', content: `<p>You have the right to access, correct, delete, and export your personal data. Contact us via the <a href="/contact" class="text-orange-400 hover:underline">Contact Form</a>.</p>` },
  { title: '8. Data Retention', content: `<p>We retain personal data for as long as your account is active. After deletion, data is permanently removed within 30 days.</p>` },
  { title: '9. Children\'s Privacy', content: `<p>Our services are not directed to children under 13. Contact us immediately if you believe a child has provided us personal information.</p>` },
  { title: '10. Contact Us', content: `<p>For privacy-related requests, please use our <a href="/contact" class="text-orange-400 hover:underline">Contact Form</a>.</p>` },
];

export default function PrivacyPolicyPage() {
  const { db, loading } = useDatabase();
  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const customContent = (db.settings as any).legalPages?.privacyPolicy;

  const section = (title: string, content: string) => (
    <section key={title} className="mb-8">
      <h2 className="text-base sm:text-lg font-black text-white tracking-wide mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-orange-500 rounded-full inline-block flex-shrink-0" />
        {title}
      </h2>
      <div className="text-gray-400 text-sm leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />
      <div className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-4">
              <span className="text-blue-400 text-xs font-bold tracking-widest uppercase">Legal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Effective: June 4, 2025</p>
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 sm:p-8">
            {customContent ? (
              <div className="legal-content text-gray-400 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: customContent }} />
            ) : (
              HARDCODED_SECTIONS.map(s => section(s.title, s.content))
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <a href="/terms" className="text-orange-400 hover:underline">Terms & Conditions</a>
            <a href="/cookie-policy" className="text-orange-400 hover:underline">Cookie Policy</a>
          </div>
        </div>
      </div>
      <style>{`
        .legal-content h2 { color: #fff; font-weight: 700; font-size: 1.2em; margin: 1em 0 0.4em; }
        .legal-content h3 { color: #fff; font-weight: 700; font-size: 1.05em; margin: 0.8em 0 0.3em; }
        .legal-content a { color: #f97316; text-decoration: underline; }
        .legal-content ul { list-style: disc; margin-left: 1.25rem; margin-bottom: 0.75rem; }
        .legal-content li { margin-bottom: 0.25rem; }
        .legal-content p { margin-bottom: 0.75rem; }
        .legal-content strong { color: #fff; }
        .legal-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1rem 0; }
      `}</style>
      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

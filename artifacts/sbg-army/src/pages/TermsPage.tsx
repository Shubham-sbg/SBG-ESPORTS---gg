import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const HARDCODED_SECTIONS = [
  { num: '1', title: 'Acceptance of Terms', content: `<p>By accessing sbgarmy.com or creating an account, you agree to these Terms & Conditions and our <a href="/privacy" class="text-orange-400 hover:underline">Privacy Policy</a>. If you do not agree, please do not use our services.</p>` },
  { num: '2', title: 'User Accounts', content: `<ul class="list-disc list-inside space-y-1 ml-2"><li>You must be at least 13 years old to create an account.</li><li>You are responsible for maintaining the security of your account credentials.</li><li>You must not share your account with others or use another person's account.</li><li>You must provide accurate and complete information during registration.</li><li>We reserve the right to suspend or terminate accounts that violate these terms.</li></ul>` },
  { num: '3', title: 'Merchandise & Shop', content: `<ul class="list-disc list-inside space-y-1 ml-2"><li>All sales are final. Returns accepted only for defective or incorrect items within 7 days of delivery.</li><li>Prices are listed in Indian Rupees (INR) and include GST where applicable.</li><li>Payment is accepted via UPI. Orders are processed only after payment confirmation.</li><li>Custom-printed items (name/number jerseys) are non-refundable once in production.</li></ul>` },
  { num: '4', title: 'Esports Tournaments & Events', content: `<ul class="list-disc list-inside space-y-1 ml-2"><li>Tournament participation requires compliance with all game-specific rules and anti-cheat policies.</li><li>${PUBLIC_BRAND_NAME} reserves the right to disqualify players found using cheats, hacks, or exploits.</li><li>Prize money distributions are at the sole discretion of ${PUBLIC_BRAND_NAME} management.</li></ul>` },
  { num: '5', title: 'Intellectual Property', content: `<p>All content on this website — including logos, graphics, video content, and written content — is the exclusive property of ${PUBLIC_BRAND_NAME} or its content partners and is protected by copyright law. Unauthorized reproduction, distribution, or commercial use is strictly prohibited.</p>` },
  { num: '6', title: 'Prohibited Conduct', content: `<p>You agree not to: use the site for unlawful purposes, harass other users or staff, upload malicious code or spam, attempt unauthorized access to our systems, impersonate ${PUBLIC_BRAND_NAME} staff, or use bots to scrape our platform.</p>` },
  { num: '7', title: 'Limitation of Liability', content: `<p>${PUBLIC_BRAND_NAME} is not liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>` },
  { num: '8', title: 'Disclaimer of Warranties', content: `<p>Our website and services are provided "as is" without warranties of any kind, either express or implied.</p>` },
  { num: '9', title: 'Changes to Terms', content: `<p>We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.</p>` },
  { num: '10', title: 'Governing Law & Disputes', content: `<p>These Terms are governed by the laws of India. Any disputes shall be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 1996.</p>` },
  { num: '11', title: 'Contact', content: `<p>For questions about these Terms, please use our <a href="/contact" class="text-orange-400 hover:underline">Contact Form</a>.</p>` },
];

export default function TermsPage() {
  const { db, loading } = useDatabase();
  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const customContent = (db.settings as any).legalPages?.terms;

  const section = (num: string, title: string, content: string) => (
    <section key={num} className="mb-8">
      <h2 className="text-base sm:text-lg font-black text-white tracking-wide mb-3 flex items-center gap-2">
        <span className="text-orange-500 font-black flex-shrink-0">{num}.</span>
        {title}
      </h2>
      <div className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
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
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Terms & Conditions</h1>
            <p className="text-gray-500 text-sm">Last updated: June 4, 2025 · Governing Law: India</p>
          </div>

          {!customContent && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-8 text-sm text-orange-300">
              By accessing or using the ${PUBLIC_BRAND_NAME} website and services, you agree to be bound by these Terms & Conditions. Please read them carefully.
            </div>
          )}

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 sm:p-8">
            {customContent ? (
              <div className="legal-content text-gray-400 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: customContent }} />
            ) : (
              HARDCODED_SECTIONS.map(s => section(s.num, s.title, s.content))
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <a href="/privacy" className="text-orange-400 hover:underline">Privacy Policy</a>
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

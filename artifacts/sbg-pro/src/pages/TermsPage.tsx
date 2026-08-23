import { motion } from "framer-motion";

const sections = [
  { title: "Acceptance of Terms", content: "By accessing and using the SBG ARMY platform, you accept and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our platform." },
  { title: "User Accounts", content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate our policies." },
  { title: "Acceptable Use", content: "You agree not to use our platform for any unlawful purpose or in any way that could harm our platform or other users. Prohibited activities include posting harmful content, attempting to gain unauthorized access, engaging in harassment, or violating any applicable laws or regulations." },
  { title: "Intellectual Property", content: "All content on the SBG ARMY platform, including logos, text, graphics, images, videos, and software, is owned by SBG ARMY or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our explicit permission." },
  { title: "Recruitment Applications", content: "Submission of a recruitment application does not guarantee selection. SBG ARMY reserves the right to accept or reject applications at its sole discretion. Selected candidates will be contacted via the contact information provided. We are not liable for any decisions made based on incomplete or inaccurate application information." },
  { title: "Store and Purchases", content: "All purchases made through our store are final unless the product is defective or damaged. Custom orders (such as personalized jerseys) cannot be returned once processed. Prices are subject to change without notice. We are not responsible for delivery delays caused by third-party logistics providers." },
  { title: "Tournament Participation", content: "Participation in SBG ARMY tournaments is subject to specific tournament rules that will be provided separately. We reserve the right to disqualify participants who engage in cheating, hacking, or unsportsmanlike conduct. Prize distributions are subject to verification processes." },
  { title: "Disclaimers", content: "Our platform is provided 'as is' without warranties of any kind. We do not guarantee continuous, uninterrupted access to our platform. We are not liable for any damages arising from the use or inability to use our platform." },
  { title: "Limitation of Liability", content: "SBG ARMY and its team members shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our platform, even if we have been advised of the possibility of such damages." },
  { title: "Modifications", content: "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the platform constitutes acceptance of the modified terms." },
  { title: "Contact", content: "For questions about these Terms of Service, contact us at support@sbgarmy.in." },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-3xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-orbitron text-4xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-slate-500 font-inter text-sm">Last updated: January 2025</p>
          <div className="mt-6 p-4 rounded-xl bg-[rgba(255,107,0,0.05)] border border-[rgba(255,107,0,0.1)]">
            <p className="text-slate-400 font-inter text-sm leading-relaxed">
              These Terms of Service govern your use of the SBG ARMY platform. Please read these terms carefully before using our services.
            </p>
          </div>
        </motion.div>
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <h2 className="font-orbitron text-white font-bold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded flex items-center justify-center bg-[rgba(255,107,0,0.1)] text-orange-400 text-xs font-bold">{i + 1}</span>
                {section.title}
              </h2>
              <p className="text-slate-400 font-inter text-sm leading-relaxed pl-8">{section.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

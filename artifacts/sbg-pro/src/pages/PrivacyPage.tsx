import { motion } from "framer-motion";

const sections = [
  { title: "Information We Collect", content: "We collect information you provide directly to us, such as when you create an account, apply to join our team, make a purchase, or contact us. This includes your name, email address, phone number, game usernames, and payment information. We also automatically collect certain technical information when you visit our platform, including IP addresses, browser type, and usage data." },
  { title: "How We Use Your Information", content: "We use the information we collect to operate and improve our platform, process transactions, send communications, respond to inquiries, enforce our terms of service, and comply with legal obligations. We may use your contact information to send you updates about our team, tournaments, and exclusive offers if you have opted in to receive such communications." },
  { title: "Information Sharing", content: "We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your consent, except to trusted third parties who assist us in operating our platform, conducting our business, or servicing you — provided those parties agree to keep this information confidential. We may also release information when required by law." },
  { title: "Data Security", content: "We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems. All sensitive information is encrypted via Secure Socket Layer (SSL) technology." },
  { title: "Cookies", content: "Our platform uses cookies to enhance your experience, analyze site traffic, and for marketing purposes. You can choose to disable cookies through your browser settings. However, this may affect certain features of our platform. We use essential cookies for platform functionality and analytics cookies to understand how visitors interact with our website." },
  { title: "Third-Party Services", content: "Our platform may contain links to third-party websites. We have no control over the content and practices of those sites and are not responsible for their privacy policies. We may integrate with third-party services such as YouTube, Instagram, and payment processors, each with their own privacy policies." },
  { title: "Children's Privacy", content: "Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us." },
  { title: "Your Rights", content: "You have the right to access, update, or delete your personal information. You may also object to processing, request restriction of processing, or request portability of your data. To exercise these rights, please contact us through the channels provided on our Contact page." },
  { title: "Changes to This Policy", content: "We reserve the right to update this privacy policy at any time. Changes will be effective immediately upon posting to the website. Your continued use of the platform after any changes indicates your acceptance of the new privacy policy." },
  { title: "Contact Us", content: "If you have questions about this privacy policy or our data practices, please contact us at support@sbgarmy.in. We will respond to your inquiry within 48 hours." },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-3xl mx-auto">
        <motion.div className="mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-orbitron text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-500 font-inter text-sm">Last updated: January 2025</p>
          <div className="mt-6 p-4 rounded-xl bg-[rgba(255,107,0,0.05)] border border-[rgba(255,107,0,0.1)]">
            <p className="text-slate-400 font-inter text-sm leading-relaxed">
              SBG ARMY ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.
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

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, Shield, Users, Trophy, Radio, ShoppingBag, BookOpen, Star, UserPlus, Mail, LogIn } from "lucide-react";
import { Show, useUser, useClerk } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";

const NAV_LINKS = [
  { label: "Roster", href: "/roster", icon: Users },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Live", href: "/live", icon: Radio },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Blog", href: "/blog", icon: BookOpen },
  { label: "Hall of Fame", href: "/hall-of-fame", icon: Star },
  { label: "Join Us", href: "/join", icon: UserPlus },
  { label: "Contact", href: "/contact", icon: Mail },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe({ retry: false });
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const isAdmin = me?.role && ["super_owner", "owner", "admin", "manager"].includes(me.role);
  const isStaff = me?.role && ["staff", "moderator"].includes(me.role);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060611" }}>
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[rgba(6,6,17,0.95)] backdrop-blur-xl border-b border-[rgba(255,107,0,0.15)]" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-3 group">
                <img src={`${basePath}/logo.svg`} alt="SBG ARMY" className="h-8 w-auto" />
                <span className="font-orbitron font-bold text-white text-sm tracking-widest hidden sm:block group-hover:text-orange-400 transition-colors">
                  SBG ARMY
                </span>
              </a>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  <a
                    className={`px-3 py-2 rounded-md text-xs font-medium font-inter tracking-wide transition-all duration-200 ${
                      location === link.href
                        ? "text-orange-400 bg-[rgba(255,107,0,0.1)]"
                        : "text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                    }`}
                  >
                    {link.label}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link href="/admin">
                  <a className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-orange-400 border border-[rgba(255,107,0,0.3)] hover:bg-[rgba(255,107,0,0.1)] transition-all">
                    <Shield className="w-3 h-3" />
                    Admin
                  </a>
                </Link>
              )}
              {isStaff && !isAdmin && (
                <Link href="/staff">
                  <a className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-blue-400 border border-[rgba(59,130,246,0.3)] hover:bg-[rgba(59,130,246,0.1)] transition-all">
                    Staff
                  </a>
                </Link>
              )}
              <Show when="signed-in">
                <button
                  onClick={() => signOut({ redirectUrl: `${basePath}/` })}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 border border-[rgba(255,255,255,0.1)] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all"
                >
                  {user?.firstName || "Account"}
                </button>
              </Show>
              <Show when="signed-out">
                <Link href="/sign-in">
                  <a className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[#ff6b00] hover:bg-[#e55e00] transition-colors">
                    <LogIn className="w-3 h-3" />
                    Sign In
                  </a>
                </Link>
              </Show>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(6,6,17,0.98)", backdropFilter: "blur(20px)", paddingTop: "4rem" }}
          >
            <div className="p-6 flex flex-col gap-2">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <a
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        location === link.href
                          ? "text-orange-400 bg-[rgba(255,107,0,0.1)] border border-[rgba(255,107,0,0.2)]"
                          : "text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </a>
                  </Link>
                );
              })}
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] flex flex-col gap-2">
                {isAdmin && (
                  <Link href="/admin">
                    <a className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-orange-400 bg-[rgba(255,107,0,0.08)] border border-[rgba(255,107,0,0.2)]">
                      <Shield className="w-4 h-4" /> Admin Panel
                    </a>
                  </Link>
                )}
                <Show when="signed-out">
                  <Link href="/sign-in">
                    <a className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-[#ff6b00] justify-center">
                      <LogIn className="w-4 h-4" /> Sign In
                    </a>
                  </Link>
                </Show>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link href="/">
                <a className="flex items-center gap-3 mb-4">
                  <img src={`${basePath}/logo.svg`} alt="SBG ARMY" className="h-10" />
                  <span className="font-orbitron font-bold text-white text-lg tracking-widest">SBG ARMY</span>
                </a>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Professional esports organization competing across Free Fire, BGMI, Valorant, and COD Mobile. Building champions since day one.
              </p>
              <div className="flex items-center gap-3 mt-6">
                {[
                  { href: "https://youtube.com/@sbgarmy", label: "YouTube" },
                  { href: "https://instagram.com/sbgarmy", label: "Instagram" },
                  { href: "#", label: "Discord" },
                  { href: "#", label: "Telegram" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md text-xs text-slate-400 border border-[rgba(255,255,255,0.08)] hover:text-orange-400 hover:border-[rgba(255,107,0,0.3)] transition-all"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-orbitron text-white text-xs font-bold tracking-widest uppercase mb-4">Platform</h4>
              <ul className="space-y-2">
                {[
                  ["Roster", "/roster"], ["Tournaments", "/tournaments"], ["Live", "/live"],
                  ["Hall of Fame", "/hall-of-fame"], ["Join Team", "/join"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>
                      <a className="text-slate-500 text-sm hover:text-orange-400 transition-colors">{label}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-orbitron text-white text-xs font-bold tracking-widest uppercase mb-4">Support</h4>
              <ul className="space-y-2">
                {[
                  ["Blog", "/blog"], ["Shop", "/shop"], ["Contact", "/contact"],
                  ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <Link href={href}>
                      <a className="text-slate-500 text-sm hover:text-orange-400 transition-colors">{label}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} SBG ARMY. All rights reserved.
            </p>
            <p className="text-slate-700 text-xs">
              Built for champions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

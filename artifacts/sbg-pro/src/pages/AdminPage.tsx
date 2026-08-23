import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  useGetPlatformStats, useGetPlatformActivity,
  useListPlayers, useCreatePlayer, useUpdatePlayer, useDeletePlayer,
  useListTournaments, useCreateTournament, useUpdateTournament,
  useListPosts, useCreatePost, useUpdatePost, useDeletePost,
  useListProducts, useCreateProduct,
  useListOrders,
  useListApplications, useUpdateApplication,
  useListContactMessages,
  useListUsers, useUpdateUser,
  useListSponsors, useCreateSponsor,
} from "@workspace/api-client-react";
import { formatDate, formatCurrency, formatRelativeTime, formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, Trophy, FileText, ShoppingBag, Package, Mail,
  Shield, LogOut, Settings, Radio, Star, UserPlus, BarChart3, Lock,
  Plus, Edit, Trash2, Check, X, Eye, ChevronRight, Globe, Palette,
  Navigation, Phone, Search, AlertTriangle, Megaphone, Tag, CreditCard,
  Activity, Database, Cpu, Bell
} from "lucide-react";

// ─── Sidebar ───────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "settings-hero", label: "Hero & Branding", icon: Palette, group: "Site Settings" },
  { id: "settings-nav", label: "Navigation", icon: Navigation, group: "Site Settings" },
  { id: "settings-contact", label: "Contact Management", icon: Phone, group: "Site Settings" },
  { id: "settings-seo", label: "SEO Settings", icon: Globe, group: "Site Settings" },
  { id: "settings-announce", label: "Announcements", icon: Megaphone, group: "Site Settings" },
  { id: "settings-ads", label: "Ads Management", icon: BarChart3, group: "Site Settings" },
  { id: "players", label: "Players", icon: Users, group: "Content" },
  { id: "tournaments", label: "Tournaments", icon: Trophy, group: "Content" },
  { id: "posts", label: "Blog & News", icon: FileText, group: "Content" },
  { id: "sponsors", label: "Sponsors", icon: Star, group: "Content" },
  { id: "products", label: "Products", icon: ShoppingBag, group: "Commerce" },
  { id: "orders", label: "Orders", icon: Package, group: "Commerce" },
  { id: "memberships", label: "Memberships", icon: CreditCard, group: "Commerce" },
  { id: "applications", label: "Applications", icon: UserPlus, group: "Community" },
  { id: "contact-msgs", label: "Messages", icon: Mail, group: "Community" },
  { id: "users", label: "Users", icon: Users, group: "Community" },
  { id: "audit-logs", label: "Audit Logs", icon: Lock, group: "Security" },
  { id: "analytics", label: "Analytics", icon: Activity, group: "Monitoring" },
];

type Section = typeof SECTIONS[number]["id"];

// ─── Shared Input ──────────────────────────────────────────────────────────
function Input({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>}
      <input {...props} className={`w-full px-3 py-2 rounded-lg text-sm font-inter input-dark ${props.className || ""}`} />
    </div>
  );
}
function TextArea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      {label && <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>}
      <textarea {...props} className={`w-full px-3 py-2 rounded-lg text-sm font-inter input-dark resize-none ${props.className || ""}`} />
    </div>
  );
}
function Select({ label, children, ...props }: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div className="w-full">
      {label && <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>}
      <select {...props} className={`w-full px-3 py-2 rounded-lg text-sm font-inter input-dark ${props.className || ""}`}>{children}</select>
    </div>
  );
}
function Btn({ variant = "primary", children, ...props }: { variant?: "primary" | "danger" | "ghost" | "success" } & React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const cls = { primary: "bg-[#ff6b00] hover:bg-[#e55e00] text-white", danger: "bg-red-600 hover:bg-red-700 text-white", ghost: "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white", success: "bg-green-600 hover:bg-green-700 text-white" }[variant];
  return <button {...props} className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter transition-all flex items-center gap-1.5 ${cls} ${props.className || ""} disabled:opacity-50`}>{children}</button>;
}
function Badge({ status }: { status: string }) {
  const cls: Record<string, string> = { pending: "badge-upcoming", approved: "badge-active", rejected: "bg-red-500/10 text-red-400 border border-red-500/20", new: "badge-live", read: "bg-[rgba(255,255,255,0.05)] text-slate-400 border border-[rgba(255,255,255,0.1)]", active: "badge-active", inactive: "bg-[rgba(255,255,255,0.05)] text-slate-500 border border-[rgba(255,255,255,0.08)]" };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls[status] || cls["inactive"]}`}>{status}</span>;
}
function StatCard({ icon: Icon, label, value, color = "#ff6b00" }: { icon: any; label: string; value: any; color?: string }) {
  return (
    <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
      <div className="font-orbitron text-2xl font-black text-white">{value ?? "—"}</div>
      <div className="text-slate-500 text-xs font-inter mt-1">{label}</div>
    </div>
  );
}

// ─── Settings Section (Site Settings, live save via API) ──────────────────
function SettingsSection({ settingKey, settingVal, onSave, label, type = "text" }: any) {
  const [val, setVal] = useState(settingVal || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const save = async () => {
    setSaving(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/settings/${encodeURIComponent(settingKey)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `${label} updated` });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    setSaving(false);
  };
  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="text-slate-400 text-xs font-inter block mb-1">{label}</label>
        {type === "textarea" ? (
          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg input-dark text-sm font-inter resize-none" />
        ) : (
          <input type={type} value={val} onChange={(e) => setVal(e.target.value)} className="w-full px-3 py-2 rounded-lg input-dark text-sm font-inter" />
        )}
      </div>
      <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────
function DashboardSection() {
  const { data: stats } = useGetPlatformStats();
  const { data: activity = [] } = useGetPlatformActivity();
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Players" value={stats?.totalPlayers} />
        <StatCard icon={Trophy} label="Tournaments" value={stats?.totalTournaments} color="#e94560" />
        <StatCard icon={FileText} label="Posts" value={stats?.totalPosts} color="#7c3aed" />
        <StatCard icon={Package} label="Orders" value={stats?.totalOrders} color="#22c55e" />
        <StatCard icon={UserPlus} label="Pending Apps" value={stats?.pendingApplications} color="#eab308" />
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} color="#06b6d4" />
        <StatCard icon={Star} label="Sponsors" value={stats?.totalSponsors} color="#f97316" />
        <StatCard icon={BarChart3} label="Monthly Visitors" value={stats?.monthlyVisitors ? formatNumber(stats.monthlyVisitors) : "—"} color="#8b5cf6" />
      </div>
      <h3 className="font-orbitron text-white text-sm font-bold mb-4">Recent Activity</h3>
      <div className="space-y-2">
        {(activity as any[]).length === 0 ? (
          <div className="text-slate-500 text-sm font-inter py-8 text-center">No recent activity</div>
        ) : (activity as any[]).map((a: any) => (
          <div key={a.id} className="glass rounded-lg p-4 border border-[rgba(255,255,255,0.04)] flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold font-inter">{a.title}</div>
              <div className="text-slate-500 text-xs font-inter">{a.description}</div>
            </div>
            <div className="text-slate-600 text-xs font-inter flex-shrink-0">{formatRelativeTime(a.timestamp)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hero & Branding Settings ──────────────────────────────────────────────
function HeroBrandingSection() {
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-2">Hero & Branding</h2>
      <p className="text-slate-500 text-xs font-inter mb-6">Changes apply instantly without redeployment.</p>
      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-white font-semibold font-inter text-sm">Hero Section</h3>
          <SettingsSection settingKey="hero.title" label="Hero Title" type="text" />
          <SettingsSection settingKey="hero.subtitle" label="Hero Subtitle" type="textarea" />
          <SettingsSection settingKey="hero.primaryButtonText" label="Primary Button Text" type="text" />
          <SettingsSection settingKey="hero.primaryButtonLink" label="Primary Button Link" type="text" />
          <SettingsSection settingKey="hero.secondaryButtonText" label="Secondary Button Text" type="text" />
          <SettingsSection settingKey="hero.backgroundVideo" label="Background Video URL" type="text" />
        </div>
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-white font-semibold font-inter text-sm">Branding</h3>
          <SettingsSection settingKey="branding.teamName" label="Team Name" type="text" />
          <SettingsSection settingKey="branding.logoUrl" label="Logo URL" type="text" />
          <SettingsSection settingKey="branding.faviconUrl" label="Favicon URL" type="text" />
          <SettingsSection settingKey="branding.primaryColor" label="Primary Color (hex)" type="text" />
          <SettingsSection settingKey="branding.accentColor" label="Accent Color (hex)" type="text" />
        </div>
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-white font-semibold font-inter text-sm">Social Links</h3>
          {[["social.youtube", "YouTube URL"], ["social.instagram", "Instagram URL"], ["social.discord", "Discord Invite URL"], ["social.telegram", "Telegram URL"], ["social.twitter", "X (Twitter) URL"], ["social.facebook", "Facebook URL"]].map(([k, l]) => (
            <SettingsSection key={k} settingKey={k} label={l} type="text" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Announcement Section ─────────────────────────────────────────────────
function AnnouncementsSection() {
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Announcements Bar</h2>
      <div className="max-w-2xl space-y-4">
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <SettingsSection settingKey="announce.text" label="Announcement Text (leave blank to hide)" type="text" />
          <SettingsSection settingKey="announce.link" label="Announcement Link (optional)" type="text" />
          <SettingsSection settingKey="announce.bgColor" label="Background Color (hex, default: #ff6b00)" type="text" />
        </div>
      </div>
    </div>
  );
}

// ─── Contact Management Section ───────────────────────────────────────────
function ContactManagementSection() {
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-2">Contact Management</h2>
      <p className="text-slate-500 text-xs font-inter mb-2">No owner/admin email is shown to public users. Only support contact details below are displayed.</p>
      <div className="mb-6 p-3 rounded-lg bg-[rgba(255,107,0,0.06)] border border-[rgba(255,107,0,0.15)]">
        <p className="text-orange-400 text-xs font-inter">Changes update the website instantly without any code changes or redeployment.</p>
      </div>
      <div className="max-w-2xl space-y-4">
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-white font-semibold font-inter text-sm">Public Contact Details</h3>
          <SettingsSection settingKey="contact.supportEmail" label="Support Email (shown to public)" type="email" />
          <SettingsSection settingKey="contact.supportPhone" label="Support Phone Number" type="text" />
          <SettingsSection settingKey="contact.whatsapp" label="WhatsApp Number" type="text" />
          <SettingsSection settingKey="contact.businessEmail" label="Business Email" type="email" />
          <SettingsSection settingKey="contact.sponsorshipEmail" label="Sponsorship Email" type="email" />
        </div>
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-white font-semibold font-inter text-sm">Community Links</h3>
          <SettingsSection settingKey="contact.discord" label="Discord Server Link" type="text" />
          <SettingsSection settingKey="contact.telegram" label="Telegram Group/Channel Link" type="text" />
        </div>
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-white font-semibold font-inter text-sm mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-orange-400" /> Private (Super Admin Only)
          </h3>
          <SettingsSection settingKey="contact.ownerEmail" label="Owner Email (hidden from public)" type="email" />
          <p className="text-slate-600 text-xs font-inter mt-2">This email is never displayed publicly.</p>
        </div>
      </div>
    </div>
  );
}

// ─── SEO Settings ─────────────────────────────────────────────────────────
function SEOSection() {
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">SEO Settings</h2>
      <div className="max-w-2xl space-y-4">
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4">
          <h3 className="text-white font-semibold font-inter text-sm">Global SEO</h3>
          <SettingsSection settingKey="seo.defaultTitle" label="Default Meta Title" type="text" />
          <SettingsSection settingKey="seo.defaultDescription" label="Default Meta Description" type="textarea" />
          <SettingsSection settingKey="seo.defaultOgImage" label="Default OG Image URL" type="text" />
          <SettingsSection settingKey="seo.keywords" label="Global Keywords (comma separated)" type="text" />
          <SettingsSection settingKey="seo.googleAnalyticsId" label="Google Analytics ID" type="text" />
          <SettingsSection settingKey="seo.googleAdsenseId" label="Google AdSense Publisher ID" type="text" />
        </div>
      </div>
    </div>
  );
}

// ─── Ads Management ────────────────────────────────────────────────────────
function AdsSection() {
  const { toast } = useToast();
  const [newAd, setNewAd] = useState({ name: "", type: "banner", code: "", placement: "header" });
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAds = async () => {
    setLoading(true);
    try { const r = await fetch(`${base}/api/ads/all`); setAds(await r.json()); } catch { }
    setLoading(false);
  };

  useState(() => { loadAds(); });

  const createAd = async () => {
    try {
      const r = await fetch(`${base}/api/ads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAd) });
      if (r.ok) { toast({ title: "Ad created" }); loadAds(); setNewAd({ name: "", type: "banner", code: "", placement: "header" }); }
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const toggleAd = async (id: number, active: boolean) => {
    await fetch(`${base}/api/ads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    loadAds();
  };

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Ads Management</h2>
      <div className="max-w-3xl space-y-6">
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <h3 className="text-white font-semibold font-inter text-sm mb-4">Create New Ad</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input label="Ad Name" value={newAd.name} onChange={(e) => setNewAd({ ...newAd, name: e.target.value })} placeholder="e.g. Header Banner" />
            <Select label="Type" value={newAd.type} onChange={(e) => setNewAd({ ...newAd, type: e.target.value })}>
              <option value="banner">Banner</option>
              <option value="popup">Popup</option>
              <option value="adsense">Google AdSense</option>
              <option value="sponsor">Sponsor Ad</option>
            </Select>
            <Select label="Placement" value={newAd.placement} onChange={(e) => setNewAd({ ...newAd, placement: e.target.value })}>
              <option value="header">Header</option>
              <option value="footer">Footer</option>
              <option value="sidebar">Sidebar</option>
              <option value="in-content">In Content</option>
              <option value="popup">Popup</option>
            </Select>
          </div>
          <TextArea label="Ad Code / HTML" value={newAd.code} onChange={(e) => setNewAd({ ...newAd, code: e.target.value })} rows={3} placeholder="<script>...</script> or image/link HTML" />
          <Btn onClick={createAd} className="mt-3"><Plus className="w-3.5 h-3.5" />Create Ad</Btn>
        </div>
        <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <table className="w-full text-xs font-inter">
            <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
              {["Name", "Type", "Placement", "Status", "Actions"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {ads.map((ad: any) => (
                <tr key={ad.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-4 py-3 text-white">{ad.name}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{ad.type}</td>
                  <td className="px-4 py-3 text-slate-400 capitalize">{ad.placement}</td>
                  <td className="px-4 py-3"><Badge status={ad.active ? "active" : "inactive"} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAd(ad.id, ad.active)} className={`text-xs px-2 py-1 rounded font-inter ${ad.active ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10"}`}>
                      {ad.active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Players CRUD ──────────────────────────────────────────────────────────
function PlayersSection() {
  const { data: players = [], refetch } = useListPlayers();
  const { mutate: createPlayer } = useCreatePlayer();
  const { mutate: updatePlayer } = useUpdatePlayer();
  const { mutate: deletePlayer } = useDeletePlayer();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ playerName: "", game: "Free Fire", role: "Fragger", status: "active" });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const save = () => {
    const data = editing ? { ...editing, ...form } : form;
    if (editing) {
      updatePlayer({ id: editing.id, data: form } as any, { onSuccess: () => { toast({ title: "Player updated" }); refetch(); setEditing(null); setShowForm(false); } });
    } else {
      createPlayer(form as any, { onSuccess: () => { toast({ title: "Player created" }); refetch(); setShowForm(false); setForm({ playerName: "", game: "Free Fire", role: "Fragger", status: "active" }); } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-white">Players</h2>
        <Btn onClick={() => { setShowForm(true); setEditing(null); }}><Plus className="w-3.5 h-3.5" />Add Player</Btn>
      </div>
      {showForm && (
        <div className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.2)] mb-6">
          <h3 className="text-white font-semibold font-inter text-sm mb-4">{editing ? "Edit Player" : "New Player"}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Player Name *" value={form.playerName} onChange={(e) => setForm({ ...form, playerName: e.target.value })} />
            <Input label="Real Name" value={form.realName || ""} onChange={(e) => setForm({ ...form, realName: e.target.value })} />
            <Select label="Game *" value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })}>
              {["Free Fire", "BGMI", "Valorant", "COD Mobile"].map((g) => <option key={g}>{g}</option>)}
            </Select>
            <Input label="Role" value={form.role || ""} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input label="Game UID" value={form.uid || ""} onChange={(e) => setForm({ ...form, uid: e.target.value })} />
            <Input label="Rank" value={form.rank || ""} onChange={(e) => setForm({ ...form, rank: e.target.value })} />
            <Input label="K/D Ratio" type="number" step="0.01" value={form.kd || ""} onChange={(e) => setForm({ ...form, kd: parseFloat(e.target.value) })} />
            <Input label="Wins" type="number" value={form.wins || ""} onChange={(e) => setForm({ ...form, wins: parseInt(e.target.value) })} />
            <Input label="Matches" type="number" value={form.matches || ""} onChange={(e) => setForm({ ...form, matches: parseInt(e.target.value) })} />
            <Input label="Image URL" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <Input label="Instagram URL" value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            <Input label="YouTube URL" value={form.youtube || ""} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="trial">Trial</option>
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Btn onClick={save}>Save</Btn>
            <Btn variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Btn>
          </div>
        </div>
      )}
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter min-w-[700px]">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["Player", "Game", "Role", "K/D", "Wins", "Status", "Actions"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {(players as any[]).map((p: any) => (
              <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-white font-semibold">{p.playerName}</td>
                <td className="px-4 py-3 text-slate-400">{p.game}</td>
                <td className="px-4 py-3 text-slate-400">{p.role}</td>
                <td className="px-4 py-3 text-orange-400 font-orbitron">{p.kd?.toFixed(2) || "—"}</td>
                <td className="px-4 py-3 text-white font-orbitron">{p.wins || 0}</td>
                <td className="px-4 py-3"><Badge status={p.status} /></td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setEditing(p); setForm({ ...p }); setShowForm(true); }} className="text-slate-400 hover:text-orange-400 p-1.5 rounded hover:bg-[rgba(255,107,0,0.08)] transition-all"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deletePlayer({ id: p.id } as any, { onSuccess: () => { toast({ title: "Deleted" }); refetch(); } })} className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-[rgba(239,68,68,0.08)] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tournaments CRUD ──────────────────────────────────────────────────────
function TournamentsSection() {
  const { data: tournaments = [], refetch } = useListTournaments();
  const { mutate: createT } = useCreateTournament();
  const { mutate: updateT } = useUpdateTournament();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ title: "", game: "Free Fire", status: "upcoming", startDate: "" });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const save = () => {
    if (editing) {
      updateT({ id: editing.id, data: form } as any, { onSuccess: () => { toast({ title: "Updated" }); refetch(); setShowForm(false); } });
    } else {
      createT(form as any, { onSuccess: () => { toast({ title: "Created" }); refetch(); setShowForm(false); setForm({ title: "", game: "Free Fire", status: "upcoming", startDate: "" }); } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-white">Tournaments</h2>
        <Btn onClick={() => { setShowForm(true); setEditing(null); }}><Plus className="w-3.5 h-3.5" />Add Tournament</Btn>
      </div>
      {showForm && (
        <div className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.2)] mb-6">
          <h3 className="text-white font-semibold font-inter text-sm mb-4">{editing ? "Edit" : "New"} Tournament</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="col-span-2" />
            <Select label="Game *" value={form.game} onChange={(e) => setForm({ ...form, game: e.target.value })}>
              {["Free Fire", "BGMI", "Valorant", "COD Mobile"].map((g) => <option key={g}>{g}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["upcoming", "ongoing", "completed"].map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Input label="Prize Pool" value={form.prizePool || ""} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
            <Input label="Max Teams" type="number" value={form.maxTeams || ""} onChange={(e) => setForm({ ...form, maxTeams: parseInt(e.target.value) })} />
            <Input label="Start Date *" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Input label="Stream URL" value={form.streamUrl || ""} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} className="col-span-2" />
            <Input label="Banner Image URL" value={form.banner || ""} onChange={(e) => setForm({ ...form, banner: e.target.value })} className="col-span-2" />
            <TextArea label="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="col-span-2" />
            <TextArea label="Rules" value={form.rules || ""} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={3} className="col-span-2" />
          </div>
          <div className="flex gap-2 mt-4"><Btn onClick={save}>Save</Btn><Btn variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Btn></div>
        </div>
      )}
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter min-w-[700px]">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["Title", "Game", "Status", "Prize", "Teams", "Start Date", "Actions"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {(tournaments as any[]).map((t: any) => (
              <tr key={t.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-white font-semibold max-w-[200px] truncate">{t.title}</td>
                <td className="px-4 py-3 text-slate-400">{t.game}</td>
                <td className="px-4 py-3"><Badge status={t.status} /></td>
                <td className="px-4 py-3 text-orange-400">{t.prizePool || "—"}</td>
                <td className="px-4 py-3 text-slate-400">{t.registeredTeams || 0}/{t.maxTeams || "∞"}</td>
                <td className="px-4 py-3 text-slate-400">{formatDate(t.startDate)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setEditing(t); setForm({ ...t }); setShowForm(true); }} className="text-slate-400 hover:text-orange-400 p-1.5 rounded transition-all"><Edit className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Posts CRUD ────────────────────────────────────────────────────────────
function PostsSection() {
  const { data: posts = [], refetch } = useListPosts();
  const { mutate: createP } = useCreatePost();
  const { mutate: updateP } = useUpdatePost();
  const { mutate: deleteP } = useDeletePost();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ title: "", category: "announcement", content: "", excerpt: "", published: false, featured: false, authorName: "SBG ARMY" });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const save = () => {
    if (editing) {
      updateP({ id: editing.id, data: form } as any, { onSuccess: () => { toast({ title: "Post updated" }); refetch(); setShowForm(false); } });
    } else {
      createP(form as any, { onSuccess: () => { toast({ title: "Post created" }); refetch(); setShowForm(false); } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-white">Blog & News</h2>
        <Btn onClick={() => { setShowForm(true); setEditing(null); }}><Plus className="w-3.5 h-3.5" />New Post</Btn>
      </div>
      {showForm && (
        <div className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.2)] mb-6">
          <h3 className="text-white font-semibold font-inter text-sm mb-4">{editing ? "Edit" : "New"} Post</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="col-span-2" />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["announcement", "news", "match-report", "update", "tournament", "community"].map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Author Name" value={form.authorName || ""} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
            <Input label="Featured Image URL" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="col-span-2" />
            <TextArea label="Excerpt" value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="col-span-2" />
            <TextArea label="Content" value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className="col-span-2" />
            <Input label="Tags (comma separated)" value={form.tags || ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="col-span-2" />
            <div className="flex items-center gap-4 col-span-2">
              <label className="flex items-center gap-2 text-slate-400 text-xs font-inter cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="w-4 h-4 rounded" />
                Publish
              </label>
              <label className="flex items-center gap-2 text-slate-400 text-xs font-inter cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 rounded" />
                Featured
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4"><Btn onClick={save}>Save</Btn><Btn variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Btn></div>
        </div>
      )}
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["Title", "Category", "Published", "Featured", "Views", "Date", "Actions"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {(posts as any[]).map((p: any) => (
              <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-white font-semibold max-w-[200px] truncate">{p.title}</td>
                <td className="px-4 py-3 text-slate-400 capitalize">{p.category}</td>
                <td className="px-4 py-3">{p.published ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-slate-600" />}</td>
                <td className="px-4 py-3">{p.featured ? <Check className="w-4 h-4 text-yellow-400" /> : <X className="w-4 h-4 text-slate-600" />}</td>
                <td className="px-4 py-3 text-slate-400">{p.views}</td>
                <td className="px-4 py-3 text-slate-400">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setEditing(p); setForm({ ...p }); setShowForm(true); }} className="text-slate-400 hover:text-orange-400 p-1.5 rounded transition-all"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteP({ id: p.id } as any, { onSuccess: () => { toast({ title: "Deleted" }); refetch(); } })} className="text-slate-500 hover:text-red-400 p-1.5 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products Section ──────────────────────────────────────────────────────
function ProductsSection() {
  const { data: products = [], refetch } = useListProducts();
  const { mutate: createProd } = useCreateProduct();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ name: "", price: 0, category: "apparel", inStock: true });
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-white">Products</h2>
        <Btn onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add Product</Btn>
      </div>
      {showForm && (
        <div className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.2)] mb-6">
          <h3 className="text-white font-semibold font-inter text-sm mb-4">New Product</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2" />
            <Input label="Price (₹) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} />
            <Input label="Original Price (₹)" type="number" value={form.originalPrice || ""} onChange={(e) => setForm({ ...form, originalPrice: parseFloat(e.target.value) })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["apparel", "accessories", "jersey", "merchandise"].map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Badge Text" value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
            <Input label="Image URL" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="col-span-2" />
            <Input label="Available Sizes (comma separated)" value={form.sizes || ""} onChange={(e) => setForm({ ...form, sizes: e.target.value })} />
            <Input label="Available Colors (comma separated)" value={form.colors || ""} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
            <Input label="Stock Count" type="number" value={form.stockCount || ""} onChange={(e) => setForm({ ...form, stockCount: parseInt(e.target.value) })} />
            <TextArea label="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="col-span-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <Btn onClick={() => createProd(form as any, { onSuccess: () => { toast({ title: "Product created" }); refetch(); setShowForm(false); } })}>Create</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </div>
      )}
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["Name", "Category", "Price", "Stock", "Actions"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {(products as any[]).map((p: any) => (
              <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-white font-semibold">{p.name}</td>
                <td className="px-4 py-3 text-slate-400 capitalize">{p.category}</td>
                <td className="px-4 py-3 text-orange-400 font-orbitron">{formatCurrency(p.price)}</td>
                <td className="px-4 py-3"><Badge status={p.inStock ? "active" : "inactive"} /></td>
                <td className="px-4 py-3"><button className="text-slate-400 hover:text-orange-400 p-1.5 rounded"><Edit className="w-3.5 h-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Orders Section ────────────────────────────────────────────────────────
function OrdersSection() {
  const { data: orders = [] } = useListOrders();
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Orders ({(orders as any[]).length})</h2>
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter min-w-[800px]">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["Order ID", "Product", "Customer", "Amount", "Status", "Payment", "Date"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {(orders as any[]).map((o: any) => (
              <tr key={o.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-slate-400 font-orbitron">#{o.id}</td>
                <td className="px-4 py-3 text-white">{o.productName}</td>
                <td className="px-4 py-3 text-slate-400">{o.customerName}</td>
                <td className="px-4 py-3 text-orange-400 font-orbitron">{formatCurrency(o.totalAmount)}</td>
                <td className="px-4 py-3"><Badge status={o.status} /></td>
                <td className="px-4 py-3 text-slate-500 capitalize">{o.paymentMethod}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(orders as any[]).length === 0 && <div className="text-center py-10 text-slate-500 font-inter text-sm">No orders yet</div>}
      </div>
    </div>
  );
}

// ─── Applications Section ──────────────────────────────────────────────────
function ApplicationsSection() {
  const { data: applications = [], refetch } = useListApplications();
  const { mutate: updateApp } = useUpdateApplication();
  const { toast } = useToast();
  const [note, setNote] = useState<Record<number, string>>({});

  const setStatus = (id: number, status: string) => {
    updateApp({ id, data: { status, adminNote: note[id] || "" } } as any, {
      onSuccess: () => { toast({ title: `Application ${status}` }); refetch(); }
    });
  };

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Recruitment Applications ({(applications as any[]).filter((a: any) => a.status === "pending").length} pending)</h2>
      <div className="space-y-4">
        {(applications as any[]).length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-inter">No applications yet</div>
        ) : (applications as any[]).map((app: any) => (
          <div key={app.id} className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-white font-semibold font-inter">{app.fullName}</div>
                <div className="text-slate-500 text-xs font-inter">{app.email} {app.whatsapp && `• WA: ${app.whatsapp}`}</div>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-xs text-orange-400 bg-[rgba(255,107,0,0.08)]">{app.game}</span>
                  <span className="px-2 py-0.5 rounded text-xs text-slate-400 bg-[rgba(255,255,255,0.05)]">{app.role}</span>
                  {app.rank && <span className="px-2 py-0.5 rounded text-xs text-slate-400 bg-[rgba(255,255,255,0.05)]">{app.rank}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge status={app.status} />
                <div className="text-slate-600 text-xs font-inter">{formatRelativeTime(app.createdAt)}</div>
              </div>
            </div>
            {app.achievements && <p className="text-slate-500 text-xs font-inter mb-2">Achievements: {app.achievements}</p>}
            {app.about && <p className="text-slate-500 text-xs font-inter mb-3">"{app.about}"</p>}
            {app.status === "pending" && (
              <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                <input value={note[app.id] || ""} onChange={(e) => setNote({ ...note, [app.id]: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg input-dark text-xs font-inter" placeholder="Admin note (optional)" />
                <Btn variant="success" onClick={() => setStatus(app.id, "approved")}><Check className="w-3 h-3" />Approve</Btn>
                <Btn variant="danger" onClick={() => setStatus(app.id, "rejected")}><X className="w-3 h-3" />Reject</Btn>
              </div>
            )}
            {app.adminNote && <div className="mt-2 text-xs text-slate-500 font-inter italic">Note: {app.adminNote}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact Messages ──────────────────────────────────────────────────────
function MessagesSection() {
  const { data: msgs = [] } = useListContactMessages();
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Contact Messages ({(msgs as any[]).filter((m: any) => m.status === "new").length} new)</h2>
      <div className="space-y-3">
        {(msgs as any[]).length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-inter">No messages</div>
        ) : (msgs as any[]).map((msg: any) => (
          <div key={msg.id} className={`glass rounded-xl p-5 border ${msg.status === "new" ? "border-[rgba(255,107,0,0.2)]" : "border-[rgba(255,255,255,0.06)]"}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-white font-semibold font-inter text-sm">{msg.name}</div>
                <div className="text-slate-500 text-xs font-inter">{msg.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={msg.status} />
                <span className="text-slate-600 text-xs font-inter">{formatRelativeTime(msg.createdAt)}</span>
              </div>
            </div>
            <div className="text-orange-400 text-xs font-inter mb-1">{msg.category}</div>
            <p className="text-slate-400 text-sm font-inter">{msg.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Users Section ─────────────────────────────────────────────────────────
function UsersSection() {
  const { data: users = [] } = useListUsers();
  const { mutate: updateUser } = useUpdateUser();
  const { toast } = useToast();

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Users ({(users as any[]).length})</h2>
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["User", "Email", "Role", "Country", "Joined", "Actions"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {(users as any[]).map((u: any) => (
              <tr key={u.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-white">{u.displayName || u.username}</td>
                <td className="px-4 py-3 text-slate-400">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => updateUser({ id: u.id, data: { role: e.target.value } } as any, { onSuccess: () => toast({ title: "Role updated" }) })}
                    className="px-2 py-1 rounded input-dark text-xs font-inter">
                    {["user", "moderator", "staff", "manager", "admin", "owner", "super_owner"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.country || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-slate-500">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sponsors Section ──────────────────────────────────────────────────────
function SponsorsSection() {
  const { data: sponsors = [], refetch } = useListSponsors();
  const { mutate: createSponsor } = useCreateSponsor();
  const { toast } = useToast();
  const [form, setForm] = useState<any>({ name: "", tier: "silver", website: "" });
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-white">Sponsors</h2>
        <Btn onClick={() => setShowForm(!showForm)}><Plus className="w-3.5 h-3.5" />Add Sponsor</Btn>
      </div>
      {showForm && (
        <div className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.2)] mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sponsor Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>
              <option value="platinum">Platinum</option><option value="gold">Gold</option>
              <option value="silver">Silver</option><option value="bronze">Bronze</option>
            </Select>
            <Input label="Website URL" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input label="Logo URL" value={form.logo || ""} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
            <TextArea label="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="col-span-2" />
          </div>
          <div className="flex gap-2 mt-4">
            <Btn onClick={() => createSponsor(form as any, { onSuccess: () => { toast({ title: "Sponsor added" }); refetch(); setShowForm(false); } })}>Add</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(sponsors as any[]).map((s: any) => (
          <div key={s.id} className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.06)] flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.03)] flex items-center justify-center overflow-hidden">
              {s.logo ? <img src={s.logo} alt={s.name} className="w-full h-full object-contain" /> : <Star className="w-5 h-5 text-slate-600" />}
            </div>
            <div>
              <div className="text-white text-sm font-semibold font-inter">{s.name}</div>
              <div className="text-slate-500 text-xs font-inter capitalize">{s.tier} sponsor</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Audit Logs ────────────────────────────────────────────────────────────
function AuditLogsSection() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch(`${base}/api/audit-logs?limit=100`).then((r) => r.json()).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  });

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Audit Logs</h2>
      <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs font-inter">
          <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
            {["Time", "User", "Action", "Entity", "IP"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No audit logs yet</td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                <td className="px-4 py-3 text-slate-500">{formatRelativeTime(log.createdAt)}</td>
                <td className="px-4 py-3 text-slate-400">{log.userEmail || log.userId || "System"}</td>
                <td className="px-4 py-3 text-orange-400">{log.action}</td>
                <td className="px-4 py-3 text-slate-400">{log.entityType} {log.entityId && `#${log.entityId}`}</td>
                <td className="px-4 py-3 text-slate-600">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Analytics Section ─────────────────────────────────────────────────────
function AnalyticsSection() {
  const { data: stats } = useGetPlatformStats();
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats?.totalUsers} />
        <StatCard icon={BarChart3} label="Monthly Visitors" value={stats?.monthlyVisitors ? formatNumber(stats.monthlyVisitors) : "—"} color="#7c3aed" />
        <StatCard icon={Package} label="Total Orders" value={stats?.totalOrders} color="#22c55e" />
        <StatCard icon={CreditCard} label="Revenue" value="Track via orders" color="#eab308" />
      </div>
      <div className="glass rounded-xl p-6 border border-[rgba(255,255,255,0.06)]">
        <h3 className="font-orbitron text-white font-bold mb-4 text-sm">Platform Overview</h3>
        <div className="space-y-3">
          {[
            { label: "Players Registered", value: stats?.totalPlayers || 0, max: 100 },
            { label: "Tournaments Created", value: stats?.totalTournaments || 0, max: 50 },
            { label: "Blog Posts Published", value: stats?.totalPosts || 0, max: 100 },
            { label: "Sponsors Onboarded", value: stats?.totalSponsors || 0, max: 20 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs font-inter mb-1">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-orange-400 font-semibold">{item.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.04)]">
                <div className="h-full rounded-full bg-[#ff6b00] transition-all" style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────
export default function AdminPage() {
  const [active, setActive] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const renderSection = () => {
    switch (active) {
      case "dashboard": return <DashboardSection />;
      case "settings-hero": return <HeroBrandingSection />;
      case "settings-contact": return <ContactManagementSection />;
      case "settings-seo": return <SEOSection />;
      case "settings-announce": return <AnnouncementsSection />;
      case "settings-ads": return <AdsSection />;
      case "settings-nav": return <div><h2 className="font-orbitron text-xl font-bold text-white mb-6">Navigation</h2><div className="max-w-2xl space-y-4"><div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] space-y-4"><SettingsSection settingKey="nav.showLive" label="Show 'Live' nav item" type="text" /><SettingsSection settingKey="nav.showShop" label="Show 'Shop' nav item" type="text" /><SettingsSection settingKey="nav.customLink1Label" label="Custom Link 1 Label" type="text" /><SettingsSection settingKey="nav.customLink1Url" label="Custom Link 1 URL" type="text" /></div></div></div>;
      case "players": return <PlayersSection />;
      case "tournaments": return <TournamentsSection />;
      case "posts": return <PostsSection />;
      case "sponsors": return <SponsorsSection />;
      case "products": return <ProductsSection />;
      case "orders": return <OrdersSection />;
      case "memberships": return <div><h2 className="font-orbitron text-xl font-bold text-white mb-4">Memberships & Coupons</h2><p className="text-slate-500 font-inter text-sm">Membership plans and coupon management coming soon.</p></div>;
      case "applications": return <ApplicationsSection />;
      case "contact-msgs": return <MessagesSection />;
      case "users": return <UsersSection />;
      case "audit-logs": return <AuditLogsSection />;
      case "analytics": return <AnalyticsSection />;
      default: return <DashboardSection />;
    }
  };

  const groups = [...new Set(SECTIONS.map((s) => s.group))];

  return (
    <div className="min-h-screen flex" style={{ background: "#060611" }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-14"} flex-shrink-0 transition-all duration-300 border-r border-[rgba(255,255,255,0.06)] flex flex-col`} style={{ background: "#08081A" }}>
        <div className="h-14 flex items-center px-3 border-b border-[rgba(255,255,255,0.06)] gap-2">
          <Link href="/"><a><img src={`${basePath}/logo.svg`} alt="SBG" className="h-7 w-auto" /></a></Link>
          {sidebarOpen && <span className="font-orbitron text-white text-xs font-bold tracking-widest">ADMIN</span>}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-4">
          {groups.map((group) => (
            <div key={group}>
              {sidebarOpen && <div className="text-slate-700 text-[10px] font-semibold tracking-widest uppercase px-2 mb-1">{group}</div>}
              {SECTIONS.filter((s) => s.group === group).map((s) => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setActive(s.id as Section)}
                    className={`nav-item w-full ${active === s.id ? "active" : ""} ${!sidebarOpen ? "justify-center" : ""}`}
                    title={!sidebarOpen ? s.label : undefined}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {sidebarOpen && <span className="truncate">{s.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => signOut({ redirectUrl: `${basePath}/` })}
            className={`nav-item w-full text-red-400 hover:bg-[rgba(239,68,68,0.08)] ${!sidebarOpen ? "justify-center" : ""}`}>
            <LogOut className="w-4 h-4" />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 gap-4" style={{ background: "#08081A" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-1.5 rounded transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <Link href="/"><a className="text-xs text-slate-500 hover:text-orange-400 font-inter transition-colors flex items-center gap-1"><Globe className="w-3.5 h-3.5" />View Site</a></Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-[rgba(255,255,255,0.06)]">
              <div className="w-5 h-5 rounded-full bg-[rgba(255,107,0,0.2)] flex items-center justify-center">
                <span className="text-orange-400 text-xs font-bold">{user?.firstName?.[0] || "A"}</span>
              </div>
              <span className="text-white text-xs font-inter">{user?.firstName || "Admin"}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderSection()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

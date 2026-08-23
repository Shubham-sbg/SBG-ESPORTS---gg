import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  useListContactMessages, useListApplications, useUpdateApplication,
  useGetPlatformStats,
} from "@workspace/api-client-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Mail, UserPlus, AlertTriangle, Shield, LogOut,
  Check, X, ChevronRight, Globe, Clock, Users, Flag
} from "lucide-react";

type StaffSection = "dashboard" | "messages" | "applications" | "reports" | "moderation";

const SECTIONS = [
  { id: "dashboard" as StaffSection, label: "Dashboard", icon: LayoutDashboard },
  { id: "messages" as StaffSection, label: "Support Messages", icon: Mail },
  { id: "applications" as StaffSection, label: "Applications", icon: UserPlus },
  { id: "reports" as StaffSection, label: "Bug Reports", icon: AlertTriangle },
  { id: "moderation" as StaffSection, label: "Moderation", icon: Shield },
];

function Badge({ status }: { status: string }) {
  const cls: Record<string, string> = { pending: "badge-upcoming", approved: "badge-active", rejected: "bg-red-500/10 text-red-400 border border-red-500/20", new: "badge-live", read: "bg-[rgba(255,255,255,0.05)] text-slate-400 border border-[rgba(255,255,255,0.08)]" };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${cls[status] || "bg-[rgba(255,255,255,0.05)] text-slate-400"}`}>{status}</span>;
}

function DashboardSection() {
  const { data: stats } = useGetPlatformStats();
  const { data: msgs = [] } = useListContactMessages();
  const { data: apps = [] } = useListApplications();

  const newMsgs = (msgs as any[]).filter((m: any) => m.status === "new").length;
  const pendingApps = (apps as any[]).filter((a: any) => a.status === "pending").length;

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Staff Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Mail, label: "New Messages", value: newMsgs, color: "#ff6b00" },
          { icon: UserPlus, label: "Pending Applications", value: pendingApps, color: "#eab308" },
          { icon: Users, label: "Total Users", value: stats?.totalUsers || 0, color: "#22c55e" },
          { icon: Flag, label: "Open Reports", value: 0, color: "#e94560" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${stat.color}15` }}>
                <Icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
              </div>
              <div className="font-orbitron text-2xl font-black text-white">{stat.value}</div>
              <div className="text-slate-500 text-xs font-inter mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <h3 className="font-orbitron text-white text-sm font-bold mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-orange-400" /> Recent Messages</h3>
          {(msgs as any[]).slice(0, 5).length === 0
            ? <p className="text-slate-500 text-sm font-inter">No messages</p>
            : (msgs as any[]).slice(0, 5).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div>
                  <div className="text-white text-xs font-semibold font-inter">{m.name}</div>
                  <div className="text-slate-500 text-xs font-inter line-clamp-1">{m.message}</div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <Badge status={m.status} />
                </div>
              </div>
            ))}
        </div>
        <div className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <h3 className="font-orbitron text-white text-sm font-bold mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-orange-400" /> Recent Applications</h3>
          {(apps as any[]).slice(0, 5).length === 0
            ? <p className="text-slate-500 text-sm font-inter">No applications</p>
            : (apps as any[]).slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div>
                  <div className="text-white text-xs font-semibold font-inter">{a.fullName}</div>
                  <div className="text-slate-500 text-xs font-inter">{a.game} · {a.role}</div>
                </div>
                <Badge status={a.status} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function MessagesSection() {
  const { data: msgs = [] } = useListContactMessages();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? (msgs as any[]) : (msgs as any[]).filter((m: any) => m.status === filter);

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Support Messages</h2>
      <div className="flex gap-2 mb-6">
        {["all", "new", "read", "resolved"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-inter capitalize transition-all ${filter === f ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
            {f} {f === "new" ? `(${(msgs as any[]).filter((m: any) => m.status === "new").length})` : ""}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-inter">No messages</div>
        ) : filtered.map((msg: any) => (
          <div key={msg.id} className={`glass rounded-xl p-5 border ${msg.status === "new" ? "border-[rgba(255,107,0,0.2)]" : "border-[rgba(255,255,255,0.06)]"}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-white font-semibold font-inter text-sm">{msg.name}</div>
                <div className="text-slate-500 text-xs font-inter">{msg.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={msg.status} />
                <span className="text-slate-600 text-xs font-inter flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(msg.createdAt)}</span>
              </div>
            </div>
            <div className="text-orange-400 text-xs font-inter mb-1">{msg.category}</div>
            <p className="text-slate-400 text-sm font-inter">{msg.message}</p>
            {msg.status === "new" && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-all font-inter">
                  <Check className="w-3 h-3" /> Mark Read
                </button>
                <a href={`mailto:${msg.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-all font-inter">
                  <Mail className="w-3 h-3" /> Reply
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const pending = (applications as any[]).filter((a: any) => a.status === "pending");
  const processed = (applications as any[]).filter((a: any) => a.status !== "pending");

  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Recruitment Applications ({pending.length} pending)</h2>
      <div className="space-y-4 mb-8">
        {pending.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-inter">No pending applications</div>
        ) : pending.map((app: any) => (
          <div key={app.id} className="glass rounded-xl p-5 border border-[rgba(255,107,0,0.15)]">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="text-white font-semibold font-inter">{app.fullName}</div>
                <div className="text-slate-500 text-xs font-inter">{app.email} {app.whatsapp && `· WhatsApp: ${app.whatsapp}`}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-xs text-orange-400 bg-[rgba(255,107,0,0.08)]">{app.game}</span>
                  <span className="px-2 py-0.5 rounded text-xs text-slate-400 bg-[rgba(255,255,255,0.05)]">{app.role}</span>
                  {app.rank && <span className="px-2 py-0.5 rounded text-xs text-slate-400 bg-[rgba(255,255,255,0.05)]">{app.rank}</span>}
                  {app.experience && <span className="px-2 py-0.5 rounded text-xs text-slate-400 bg-[rgba(255,255,255,0.05)]">{app.experience}y exp</span>}
                </div>
              </div>
              <span className="text-slate-600 text-xs font-inter flex-shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(app.createdAt)}</span>
            </div>
            {app.achievements && <div className="mb-2"><span className="text-slate-500 text-xs font-inter">Achievements: </span><span className="text-slate-300 text-xs font-inter">{app.achievements}</span></div>}
            {app.about && <p className="text-slate-500 text-xs font-inter italic mb-3">"{app.about}"</p>}
            <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.04)]">
              <input value={note[app.id] || ""} onChange={(e) => setNote({ ...note, [app.id]: e.target.value })}
                className="flex-1 px-3 py-1.5 rounded-lg input-dark text-xs font-inter" placeholder="Admin note (optional)" />
              <button onClick={() => setStatus(app.id, "approved")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all font-inter">
                <Check className="w-3 h-3" /> Approve
              </button>
              <button onClick={() => setStatus(app.id, "rejected")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all font-inter">
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
      {processed.length > 0 && (
        <div>
          <h3 className="font-orbitron text-white text-sm font-bold mb-4">Processed Applications</h3>
          <div className="glass rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
            <table className="w-full text-xs font-inter">
              <thead><tr className="border-b border-[rgba(255,255,255,0.06)]">
                {["Name", "Game", "Role", "Status", "Date"].map((h) => <th key={h} className="text-left text-slate-500 px-4 py-3">{h}</th>)}
              </tr></thead>
              <tbody>
                {processed.map((a: any) => (
                  <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-4 py-2.5 text-white">{a.fullName}</td>
                    <td className="px-4 py-2.5 text-slate-400">{a.game}</td>
                    <td className="px-4 py-2.5 text-slate-400">{a.role}</td>
                    <td className="px-4 py-2.5"><Badge status={a.status} /></td>
                    <td className="px-4 py-2.5 text-slate-500">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportsSection() {
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Bug Reports & Issues</h2>
      <div className="glass rounded-xl p-8 border border-[rgba(255,255,255,0.06)] text-center">
        <AlertTriangle className="w-12 h-12 text-orange-400/30 mx-auto mb-4" />
        <p className="text-white font-semibold font-inter mb-2">Issue Tracker</p>
        <p className="text-slate-500 text-sm font-inter">Bug report system is being set up. Reports submitted through the contact form with category "Technical Support" will appear here.</p>
      </div>
    </div>
  );
}

function ModerationSection() {
  return (
    <div>
      <h2 className="font-orbitron text-xl font-bold text-white mb-6">Moderation Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Content Review", desc: "Review flagged content from the community", icon: Flag },
          { title: "User Reports", desc: "Handle reports submitted by users", icon: Users },
          { title: "Comment Moderation", desc: "Moderate blog comments and reactions", icon: Shield },
          { title: "Spam Filter", desc: "Review auto-filtered spam messages", icon: AlertTriangle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
              <Icon className="w-6 h-6 text-orange-400 mb-3" />
              <h3 className="text-white font-semibold font-inter text-sm mb-1">{item.title}</h3>
              <p className="text-slate-500 text-xs font-inter">{item.desc}</p>
              <div className="mt-3 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 text-xs font-inter" style={{ background: "rgba(255,107,0,0.06)", color: "#fb923c" }}>
                <Check className="w-3 h-3" /> All clear
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [active, setActive] = useState<StaffSection>("dashboard");
  const { user } = useUser();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const renderSection = () => {
    switch (active) {
      case "dashboard": return <DashboardSection />;
      case "messages": return <MessagesSection />;
      case "applications": return <ApplicationsSection />;
      case "reports": return <ReportsSection />;
      case "moderation": return <ModerationSection />;
      default: return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#060611" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[rgba(255,255,255,0.06)] flex flex-col" style={{ background: "#08081A" }}>
        <div className="h-14 flex items-center px-4 border-b border-[rgba(255,255,255,0.06)] gap-2">
          <Link href="/"><a><img src={`${basePath}/logo.svg`} alt="SBG" className="h-7 w-auto" /></a></Link>
          <span className="font-orbitron text-white text-xs font-bold tracking-widest">STAFF</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`nav-item w-full ${active === s.id ? "active" : ""}`}>
                <Icon className="w-4 h-4" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => signOut({ redirectUrl: `${basePath}/` })} className="nav-item w-full text-red-400 hover:bg-[rgba(239,68,68,0.08)]">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 gap-4" style={{ background: "#08081A" }}>
          <span className="text-slate-400 text-xs font-inter capitalize">{active.replace("-", " ")}</span>
          <div className="flex items-center gap-3">
            <Link href="/"><a className="text-xs text-slate-500 hover:text-orange-400 font-inter transition-colors flex items-center gap-1"><Globe className="w-3.5 h-3.5" />View Site</a></Link>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-[rgba(255,255,255,0.06)]">
              <span className="w-5 h-5 rounded-full bg-[rgba(255,107,0,0.2)] flex items-center justify-center text-orange-400 text-xs font-bold">{user?.firstName?.[0] || "S"}</span>
              <span className="text-white text-xs font-inter">{user?.firstName || "Staff"}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {renderSection()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { useUser } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { User, Trophy, Target, Settings, Shield } from "lucide-react";

export default function PlayerPortalPage() {
  const { user } = useUser();
  const { data: me } = useGetMe({ retry: false });

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-5xl mx-auto">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-orbitron text-3xl font-black text-white mb-2">Player Portal</h1>
          <p className="text-slate-400 font-inter text-sm">Your personal dashboard</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="glass rounded-xl p-6 border border-[rgba(255,107,0,0.1)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(255,107,0,0.1)] border-2 border-[rgba(255,107,0,0.3)] flex items-center justify-center mb-4 overflow-hidden">
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-orange-400" />
                )}
              </div>
              <h2 className="font-orbitron text-white font-bold">{user?.fullName || user?.username || "Player"}</h2>
              <p className="text-slate-500 text-xs font-inter mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="mt-3 px-3 py-1 rounded-full bg-[rgba(255,107,0,0.1)] text-orange-400 text-xs font-semibold font-inter capitalize">
                {(me as any)?.role || "user"}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {[
              { icon: Trophy, label: "Tournaments Played", value: "—" },
              { icon: Target, label: "Win Rate", value: "—" },
              { icon: Shield, label: "Rank", value: "—" },
              { icon: User, label: "Team", value: "—" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass rounded-xl p-5 border border-[rgba(255,255,255,0.06)] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(255,107,0,0.08)] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-inter">{stat.label}</div>
                    <div className="font-orbitron text-white font-bold mt-0.5">{stat.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 glass rounded-xl p-6 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-orange-400" />
            <h2 className="font-orbitron text-white font-bold">Account Settings</h2>
          </div>
          <p className="text-slate-500 font-inter text-sm">
            Profile customization and advanced settings are coming soon. Your profile data is securely stored and managed through Clerk authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

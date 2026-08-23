import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListPosts } from "@workspace/api-client-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Search, BookOpen, Eye } from "lucide-react";

const CATEGORIES = ["All", "announcement", "news", "match-report", "update", "tournament", "community"];

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { data: posts = [], isLoading } = useListPosts();

  const filtered = (posts as any[]).filter((p: any) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.find((p: any) => p.featured) || filtered[0];
  const rest = filtered.filter((p: any) => p.id !== featured?.id);

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Latest Updates</p>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">News & Blog</h1>
          <p className="text-slate-400 max-w-xl mx-auto font-inter">Stay up to date with SBG ARMY news, match reports, and announcements.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg input-dark text-sm font-inter" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-inter capitalize transition-all ${category === c ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass rounded-xl h-64 skeleton" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-inter">No posts found.</div>
        ) : (
          <>
            {featured && (
              <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/blog/${featured.id}`}>
                  <a className="glass rounded-xl overflow-hidden border border-[rgba(255,107,0,0.1)] flex flex-col lg:flex-row group">
                    <div className="lg:w-1/2 h-64 lg:h-auto bg-gradient-to-br from-[rgba(255,107,0,0.08)] to-transparent flex items-center justify-center overflow-hidden">
                      {featured.image ? (
                        <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <BookOpen className="w-16 h-16 text-orange-400/20" />
                      )}
                    </div>
                    <div className="lg:w-1/2 p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 rounded text-xs text-orange-400 bg-[rgba(255,107,0,0.08)] font-inter capitalize">{featured.category}</span>
                        {featured.featured && <span className="px-2 py-0.5 rounded text-xs text-yellow-400 bg-[rgba(234,179,8,0.08)] font-inter">Featured</span>}
                      </div>
                      <h2 className="font-orbitron text-2xl font-black text-white mb-3">{featured.title}</h2>
                      <p className="text-slate-400 text-sm font-inter leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-inter">
                        <span>{featured.authorName}</span>
                        <span>{formatDate(featured.createdAt)}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{featured.views}</span>
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rest.map((post: any, i: number) => (
                <motion.div key={post.id} className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] card-hover group"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={`/blog/${post.id}`}>
                    <a>
                      <div className="h-44 bg-[rgba(255,255,255,0.02)] flex items-center justify-center overflow-hidden">
                        {post.image ? (
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <BookOpen className="w-10 h-10 text-slate-700" />
                        )}
                      </div>
                      <div className="p-5">
                        <span className="px-2 py-0.5 rounded text-xs text-orange-400 bg-[rgba(255,107,0,0.08)] font-inter capitalize">{post.category}</span>
                        <h3 className="font-orbitron text-white font-bold text-sm mt-2 mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 font-inter mb-3">{post.excerpt}</p>
                        <div className="flex items-center justify-between text-xs text-slate-600 font-inter">
                          <span>{formatRelativeTime(post.createdAt)}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views}</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

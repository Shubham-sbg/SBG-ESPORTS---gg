import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetPost } from "@workspace/api-client-react";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Eye, Calendar, User } from "lucide-react";

export default function PostDetailPage({ id }: { id: number }) {
  const { data: post, isLoading } = useGetPost(id);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#060611" }}><div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center text-slate-500" style={{ background: "#060611" }}>Post not found.</div>;

  const p = post as any;

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/blog"><a className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-400 text-sm mb-8 transition-colors font-inter"><ArrowLeft className="w-4 h-4" /> Back to Blog</a></Link>

        {p.image && (
          <div className="rounded-xl overflow-hidden h-64 sm:h-80 mb-8">
            <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
          </div>
        )}

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-2 py-0.5 rounded text-xs text-orange-400 bg-[rgba(255,107,0,0.08)] font-inter capitalize">{p.category}</span>
            {p.featured && <span className="px-2 py-0.5 rounded text-xs text-yellow-400 bg-[rgba(234,179,8,0.08)] font-inter">Featured</span>}
          </div>
          <h1 className="font-orbitron text-3xl sm:text-4xl font-black text-white mb-6">{p.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-inter mb-8 pb-8 border-b border-[rgba(255,255,255,0.06)]">
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{p.authorName || "SBG ARMY"}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(p.createdAt)}</span>
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{p.views} views</span>
          </div>

          {p.excerpt && <p className="text-slate-300 text-lg font-inter leading-relaxed mb-8 italic border-l-2 border-orange-500 pl-6">{p.excerpt}</p>}

          {p.content && (
            <div className="text-slate-400 font-inter leading-relaxed text-sm space-y-4 prose prose-invert max-w-none prose-headings:font-orbitron prose-headings:text-white prose-a:text-orange-400">
              {p.content.split("\n\n").map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {p.tags && (
            <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex flex-wrap gap-2">
                {p.tags.split(",").map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs text-slate-500 border border-[rgba(255,255,255,0.06)] font-inter">#{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </motion.article>
      </div>
    </div>
  );
}

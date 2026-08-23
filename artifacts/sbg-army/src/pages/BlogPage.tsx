import { useState, useEffect } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { applyTheme } from '@/lib/applyTheme';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { NewsPost } from '@/lib/database';
import { PUBLIC_BRAND_NAME } from '@/lib/brandConfig';

const CATEGORIES = ['All', 'Announcement', 'Match', 'Highlight', 'Other'];

export default function BlogPage() {
  const { db, loading } = useDatabase();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NewsPost | null>(null);

  useEffect(() => { if (!loading) applyTheme(db.settings); }, [loading, db.settings]);

  const posts = (db.posts || []).filter(p => p.visible);
  const filtered = posts.filter(p => {
    const matchCat = filter === 'All' || p.category === filter.toLowerCase();
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.content || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  if (selected) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar settings={db.settings} navigation={db.navigation} />
        <div className="pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4">
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-8">
              ← Back to Blog
            </button>
            {selected.image && (
              <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                <img src={selected.image} alt={selected.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded capitalize">{selected.category}</span>
              <span className="text-gray-500 text-xs">{new Date(selected.createdAt ?? selected.date ?? Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-6">{selected.title}</h1>
            {selected.description && <p className="text-gray-400 text-lg leading-relaxed mb-6">{selected.description}</p>}
            <div className="prose-content text-gray-400 leading-relaxed text-sm whitespace-pre-line">{selected.content}</div>
          </div>
        </div>
        <Footer settings={db.settings} navigation={db.navigation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar settings={db.settings} navigation={db.navigation} />
      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-5 py-2 mb-6">
              <span className="text-orange-400 text-sm font-bold tracking-widest uppercase">Latest Updates</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-wider mb-4">
              <span className="text-white">SBG </span>
              <span className="text-orange-400">BLOG</span>
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">News, announcements, match recaps, and inside stories from the {PUBLIC_BRAND_NAME} universe.</p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filter === c ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📰</div>
              <p className="text-gray-500 text-lg font-bold">No posts found</p>
              <p className="text-gray-600 text-sm mt-1">Check back soon for updates!</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featured && (
                <button onClick={() => setSelected(featured)}
                  className="w-full mb-8 bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/20 transition-all group text-left">
                  <div className="grid grid-cols-1 md:grid-cols-5">
                    {featured.image && (
                      <div className="md:col-span-3 aspect-video md:aspect-auto">
                        <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <div className={`${featured.image ? 'md:col-span-2' : 'md:col-span-5'} p-6 md:p-8 flex flex-col justify-center`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded capitalize">{featured.category}</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Featured</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-3 group-hover:text-orange-400 transition-colors">{featured.title}</h2>
                      {featured.description && <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{featured.description}</p>}
                      <p className="text-gray-600 text-xs mt-4">{new Date(featured.createdAt ?? featured.date ?? Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Post Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post) => (
                    <button key={post.id} onClick={() => setSelected(post)}
                      className="text-left bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/20 transition-all group">
                      {post.image && (
                        <div className="aspect-video overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded capitalize">{post.category}</span>
                        </div>
                        <h3 className="text-white font-black text-lg mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">{post.title}</h3>
                        {post.description && <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{post.description}</p>}
                        <p className="text-gray-600 text-xs mt-3">{new Date(post.createdAt ?? post.date ?? Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer settings={db.settings} navigation={db.navigation} />
    </div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListProducts } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Search, ShoppingCart, Tag } from "lucide-react";

const CATEGORIES = ["All", "apparel", "accessories", "jersey", "merchandise"];

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useListProducts();

  const filtered = (products as any[]).filter((p: any) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen py-16 px-4" style={{ background: "#060611" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div className="mb-12 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-orange-400 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Official Store</p>
          <h1 className="font-orbitron text-4xl sm:text-5xl font-black text-white mb-4">SBG Army Shop</h1>
          <p className="text-slate-400 max-w-xl mx-auto font-inter">Official merchandise and gear from SBG ARMY.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg input-dark text-sm font-inter" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-inter capitalize transition-all ${category === c ? "bg-[#ff6b00] text-white" : "glass border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass rounded-xl h-80 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-inter">No products found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product: any, i: number) => (
              <motion.div key={product.id} className="glass rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)] card-hover group"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/shop/${product.id}`}>
                  <a>
                    <div className="relative h-52 bg-gradient-to-br from-[rgba(255,107,0,0.05)] to-transparent flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <ShoppingCart className="w-12 h-12 text-orange-400/20" />
                      )}
                      {product.badge && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-semibold bg-[#ff6b00] text-white">{product.badge}</div>
                      )}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center">
                          <span className="text-slate-300 text-xs font-semibold font-inter">Out of Stock</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="text-slate-500 text-xs capitalize font-inter mb-1">{product.category}</div>
                      <h3 className="font-orbitron text-white text-sm font-bold line-clamp-2 mb-2">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-400 font-bold text-base font-orbitron">{formatCurrency(product.price)}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-slate-600 text-xs line-through font-inter">{formatCurrency(product.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from 'wouter';
import { Swords } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="pt-24 min-h-[80vh] flex items-center justify-center">
      <div className="text-center px-4">
        <Swords size={64} className="mx-auto mb-6 opacity-10" />
        <h1 className="text-7xl font-black text-white mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">This page doesn't exist.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white"
          style={{ background: 'linear-gradient(135deg, #e8192c, #b00020)' }}>
          ← Go Home
        </Link>
      </div>
    </div>
  );
}

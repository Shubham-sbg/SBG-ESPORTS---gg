import { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        className="min-h-screen bg-[#060606] flex items-center justify-center px-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center max-w-md">
          {/* Gold top bar */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" aria-hidden="true" />

          {/* Logo */}
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center font-black text-2xl text-black"
            style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)', boxShadow: '0 0 40px rgba(212,175,55,0.3)' }}
            aria-hidden="true"
          >
            SBG
          </div>

          {/* Error icon */}
          <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>

          <h1 className="text-2xl font-black tracking-widest text-white mb-2 uppercase">
            Something Went Wrong
          </h1>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <p className="text-xs text-gray-700 mb-8">
            Try refreshing the page. If this keeps happening, contact our support team.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] focus:outline-none focus:ring-2 focus:ring-gold/60"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5e27e 50%, #b8960c 100%)' }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: undefined }); }}
              className="px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-gray-400 border border-white/10 hover:border-white/25 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              ↩ Try Again
            </button>
            <a
              href="/"
              className="px-8 py-3 rounded-xl text-sm font-black tracking-widest uppercase text-gray-400 border border-white/10 hover:border-white/25 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              🏠 Go Home
            </a>
          </div>

          {/* Support link */}
          <a
            href="/contact"
            className="mt-6 inline-block text-xs text-gray-600 hover:text-gold transition-colors focus:outline-none focus:underline"
          >
            Report this issue →
          </a>
        </div>
      </div>
    );
  }
}

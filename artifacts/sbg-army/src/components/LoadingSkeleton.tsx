/** Reusable skeleton shimmer block */
function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-white/[0.04] animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/** Full-page loading skeleton for HomePage */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" aria-busy="true" aria-label="Loading content">
      {/* Navbar placeholder */}
      <div className="fixed top-0 left-0 right-0 h-[70px] bg-[#080808]/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center px-6 gap-4">
        <SkeletonBlock className="h-10 w-10 rounded-xl" />
        <SkeletonBlock className="h-4 w-24" />
        <div className="flex-1" />
        <SkeletonBlock className="h-8 w-28 hidden md:block" />
        <SkeletonBlock className="h-8 w-24 hidden md:block" />
      </div>

      {/* Hero skeleton */}
      <div className="min-h-screen flex items-center justify-center pt-[70px]">
        <div className="text-center w-full max-w-4xl mx-auto px-4">
          <SkeletonBlock className="h-4 w-48 mx-auto mb-8" />
          <SkeletonBlock className="h-24 md:h-32 w-3/4 mx-auto mb-6" />
          <SkeletonBlock className="h-4 w-56 mx-auto mb-10" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SkeletonBlock className="h-14 w-48" />
            <SkeletonBlock className="h-14 w-56" />
            <SkeletonBlock className="h-14 w-44" />
          </div>
        </div>
      </div>

      {/* Roster skeleton */}
      <div className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <SkeletonBlock className="h-3 w-20 mx-auto mb-3" />
          <SkeletonBlock className="h-10 w-48 mx-auto mb-4" />
          <SkeletonBlock className="h-1 w-24 mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 overflow-hidden p-5 space-y-3">
              <SkeletonBlock className="h-20 w-20 rounded-2xl mx-auto" />
              <SkeletonBlock className="h-3 w-16 mx-auto" />
              <SkeletonBlock className="h-6 w-28 mx-auto" />
              <SkeletonBlock className="h-3 w-20 mx-auto" />
              <SkeletonBlock className="h-6 w-16 mx-auto rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Card skeleton for player cards */
export function PlayerCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden p-5 space-y-3" aria-hidden="true">
      <SkeletonBlock className="h-20 w-20 rounded-2xl mx-auto" />
      <SkeletonBlock className="h-3 w-16 mx-auto" />
      <SkeletonBlock className="h-6 w-28 mx-auto" />
      <SkeletonBlock className="h-3 w-20 mx-auto" />
      <SkeletonBlock className="h-6 w-16 mx-auto rounded-md" />
    </div>
  );
}

/** Inline section skeleton */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 w-full" aria-hidden="true">
      {[...Array(rows)].map((_, i) => (
        <SkeletonBlock key={i} className={`h-12 w-full ${i === rows - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Lightweight page skeleton for route transitions */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col pt-24 px-4 max-w-7xl mx-auto space-y-6">
      <SkeletonBlock className="h-10 w-48 mx-auto" />
      <SkeletonBlock className="h-4 w-72 mx-auto" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <SkeletonBlock className="h-64 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default SkeletonBlock;

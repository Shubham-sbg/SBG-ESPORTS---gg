import React, { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/imageResolver';

export type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
  emptyFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  objectFit?: ObjectFit;
  aspectRatio?: string;
  showSkeleton?: boolean;
  wrapperClassName?: string;
}

/**
 * Centralized Image component:
 * - Automatically resolves URLs via `getImageUrl`
 * - Handles loading state with smooth transitions & optional skeleton
 * - Handles empty states gracefully
 * - Handles error states with fallback URLs or custom placeholders
 * - Enforces correct object-fit and aspect-ratio preservation without distortion
 */
export const Image: React.FC<ImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackSrc,
  emptyFallback,
  errorFallback,
  objectFit = 'cover',
  aspectRatio,
  showSkeleton = true,
  wrapperClassName,
  onLoad,
  onError,
  style,
  ...rest
}) => {
  const resolvedSrc = src ? getImageUrl(src) : '';
  const [loaded, setLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string>(resolvedSrc);

  useEffect(() => {
    const nextSrc = src ? getImageUrl(src) : '';
    setCurrentSrc(nextSrc);
    setHasError(false);
    setLoaded(false);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
      setLoaded(true);
    }
    onError?.(e);
  };

  // Infer object-fit from className if present, otherwise default to prop
  const inferredFit: ObjectFit = className.includes('object-contain')
    ? 'contain'
    : className.includes('object-fill')
    ? 'fill'
    : className.includes('object-none')
    ? 'none'
    : className.includes('object-scale-down')
    ? 'scale-down'
    : objectFit || 'cover';

  // Determine objectFit style
  const fitStyle: React.CSSProperties = {
    objectFit: inferredFit,
    ...(aspectRatio ? { aspectRatio } : {}),
    ...style,
  };

  // Empty state: No src provided
  if (!src || !currentSrc) {
    if (emptyFallback) {
      return <>{emptyFallback}</>;
    }
    return (
      <div
        className={`flex items-center justify-center bg-white/5 border border-white/10 text-gray-500 overflow-hidden ${className}`}
        style={fitStyle}
        role="img"
        aria-label={alt || 'No image available'}
      >
        <svg
          className="w-1/3 max-w-[32px] max-h-[32px] opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Error state: image failed to load and no working fallbackSrc
  if (hasError) {
    if (errorFallback) {
      return <>{errorFallback}</>;
    }
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-white/0 border border-white/10 text-gray-400 overflow-hidden ${className}`}
        style={fitStyle}
        role="img"
        aria-label={alt || 'Image placeholder'}
      >
        <span className="text-[10px] font-black tracking-widest text-gold/60 uppercase">SBG</span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      loading={rest.loading || 'lazy'}
      decoding={rest.decoding || 'async'}
      className={`${className} transition-all duration-300 ${!loaded && showSkeleton ? 'opacity-70 animate-pulse' : 'opacity-100'}`}
      style={fitStyle}
      {...rest}
    />
  );
};

export default Image;

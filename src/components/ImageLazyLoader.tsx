import React, { useState, useEffect } from 'react';
import { Glasses, ImageIcon, RefreshCw } from 'lucide-react';

interface ImageLazyLoaderProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  aspectRatio?: string;
  zoomOnHover?: boolean;
  priority?: boolean;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onClick?: (e: React.MouseEvent) => void;
}

export const ImageLazyLoader: React.FC<ImageLazyLoaderProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  objectFit = 'cover',
  aspectRatio,
  zoomOnHover = false,
  priority = false,
  referrerPolicy = 'no-referrer',
  onClick,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src, retryCount]);

  const fitClass =
    objectFit === 'contain'
      ? 'object-contain'
      : objectFit === 'fill'
      ? 'object-fill'
      : 'object-cover';

  const zoomClass = zoomOnHover
    ? 'group-hover:scale-110 transition-transform duration-700 ease-out'
    : '';

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoaded(false);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div
      onClick={onClick}
      style={{ aspectRatio }}
      className={`relative overflow-hidden bg-zinc-950/80 flex items-center justify-center select-none ${className}`}
    >
      {/* Skeleton Blur Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/90 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent animate-shimmer" />
          <Glasses className="w-8 h-8 text-zinc-700/60 animate-bounce" />
        </div>
      )}

      {/* Error Fallback Container */}
      {hasError ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-zinc-900/90 text-zinc-500 gap-2">
          <Glasses className="w-8 h-8 text-amber-500/50 stroke-[1.5]" />
          <span className="text-[11px] text-zinc-400 font-medium text-center">
            بارگذاری تصویر ناموفق بود
          </span>
          <button
            onClick={handleRetry}
            className="mt-1 inline-flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 transition-colors"
          >
            <RefreshCw className="w-3 h-3 animate-spin-hover" />
            <span>تلاش مجدد</span>
          </button>
        </div>
      ) : (
        <img
          src={retryCount > 0 ? `${src}?retry=${retryCount}` : src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy={referrerPolicy}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full ${fitClass} ${zoomClass} ${imgClassName} transition-all duration-500 ease-out ${
            isLoaded
              ? 'opacity-100 filter-none scale-100'
              : 'opacity-0 blur-md scale-105'
          }`}
        />
      )}
    </div>
  );
};

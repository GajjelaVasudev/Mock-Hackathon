import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Leaf } from 'lucide-react';
import { ActivityImage } from '../types';
import { getMediaUrl } from '../utils/media';

interface NatureImageProps {
  image?: ActivityImage | null;
  imageUrl?: string | null;
  alt?: string;
  category?: string;
  type?: string;
  aspectRatio?: string; // e.g. '16/9' or '21/9'
  height?: string | number;
  borderRadius?: string;
  showAttribution?: boolean;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Priority loading hint.
   * Pass true (or index < 4) for above-the-fold cards.
   * Pass false for below-the-fold cards (default = lazy).
   */
  priority?: boolean;
  /**
   * Context hint: 'card' → use mediumUrl (700px)
   *               'detail' → use full url (1280px)
   *               'thumb' → use smallUrl (400px)
   */
  sizeHint?: 'card' | 'detail' | 'thumb';
}

/**
 * Resolve the best src URL for the given size hint.
 * Priority order:
 *   card   → mediumUrl  → url  → smallUrl
 *   detail → url        → mediumUrl → smallUrl
 *   thumb  → smallUrl   → mediumUrl → url
 */
function resolveSrc(
  image: ActivityImage | null | undefined,
  imageUrl: string | null | undefined,
  sizeHint: 'card' | 'detail' | 'thumb',
): string | null {
  if (!image && !imageUrl) return null;

  let raw: string | null = null;
  if (image) {
    if (sizeHint === 'card') {
      raw = image.mediumUrl || image.url || image.smallUrl || null;
    } else if (sizeHint === 'detail') {
      raw = image.url || image.mediumUrl || image.smallUrl || null;
    } else {
      // thumb
      raw = image.smallUrl || image.mediumUrl || image.url || null;
    }
  }
  if (!raw && imageUrl) raw = imageUrl;
  return raw ?? null;
}

/**
 * Build a srcSet attribute string for responsive images using all three tiers.
 */
function buildSrcSet(image: ActivityImage | null | undefined): string | undefined {
  if (!image) return undefined;
  const parts: string[] = [];
  if (image.smallUrl) parts.push(`${getMediaUrl(image.smallUrl)} 400w`);
  if (image.mediumUrl) parts.push(`${getMediaUrl(image.mediumUrl)} 700w`);
  if (image.url) parts.push(`${getMediaUrl(image.url)} 1280w`);
  return parts.length > 1 ? parts.join(', ') : undefined;
}

export const NatureImage: React.FC<NatureImageProps> = ({
  image,
  imageUrl,
  alt = 'BNHS Nature Activity',
  category = 'Nature',
  type = 'Walk',
  aspectRatio = '16/9',
  height,
  borderRadius = '12px',
  showAttribution = false,
  className = '',
  style = {},
  priority = false,
  sizeHint = 'card',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const rawSrc = resolveSrc(image, imageUrl, sizeHint);

  // Reset states when the source URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);

    // If the img element is already done loading (cache hit), trigger isLoaded immediately
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [rawSrc]);

  const activeSrc = !hasError && rawSrc ? getMediaUrl(rawSrc) : null;
  const srcSet = !hasError ? buildSrcSet(image) : undefined;

  // Curated nature-themed gradients based on category/type for skeleton + fallback
  const getNatureGradient = () => {
    const key = `${category} ${type} ${alt}`.toLowerCase();
    if (key.includes('flamingo') || key.includes('wetland')) {
      return 'linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #0d9488 100%)';
    }
    if (key.includes('marine') || key.includes('sea') || key.includes('ocean')) {
      return 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)';
    }
    if (key.includes('tree') || key.includes('forest') || key.includes('botanical')) {
      return 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)';
    }
    return 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)';
  };

  return (
    <div
      className={`nature-image-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: height || 'auto',
        // Lock the aspect ratio box so the skeleton prevents layout shift
        aspectRatio: height ? undefined : aspectRatio,
        borderRadius,
        overflow: 'hidden',
        // Skeleton background — matches the gradient colour for a smooth reveal
        background: getNatureGradient(),
        opacity: activeSrc ? 1 : 0.9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Skeleton shimmer animation — visible until the photograph loads */}
      {activeSrc && !isLoaded && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 60%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'bnhsShimmer 1.6s infinite linear',
          }}
        />
      )}

      {activeSrc ? (
        <>
          <img
            ref={imgRef}
            src={activeSrc}
            srcSet={srcSet}
            // Let the browser pick the right size: cards are roughly 1/3 viewport wide on
            // desktop and full-width on mobile. The detail page is full-width.
            sizes={
              sizeHint === 'detail'
                ? '100vw'
                : sizeHint === 'thumb'
                ? '120px'
                : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
            }
            alt={image?.alt || alt}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            // Priority images (first few cards / hero) load eagerly with high fetch priority
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'low'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              // Fade-in once loaded — no layout shift since the container already holds its space
              transition: 'opacity 0.3s ease',
              opacity: isLoaded ? 1 : 0,
              zIndex: 2,
            }}
          />

          {/* Optional Photographer Attribution Pill */}
          {showAttribution && (image?.photographer || image?.source) && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(4px)',
                color: '#f8fafc',
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 3,
              }}
            >
              <span>Photo by {image?.photographer || 'Contributor'}</span>
              {image?.source && <span style={{ opacity: 0.75 }}>· {image.source}</span>}
              {image?.attributionUrl && (
                <a
                  href={image.attributionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#a7f3d0', display: 'inline-flex', alignItems: 'center' }}
                  title={`View original on ${image.source === 'unsplash' ? 'Unsplash' : 'Pexels'}`}
                >
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        /* Fallback banner — only shown if no image URL or all URLs failed */
        <div
          style={{
            width: '100%',
            height: '100%',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            BNHS Field Event
          </div>

          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <Leaf size={22} color="#ffffff" />
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
            🌿 BNHS Nature Activity
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.9, marginTop: '2px' }}>
            {type.toUpperCase()} · {category}
          </div>
        </div>
      )}
    </div>
  );
};

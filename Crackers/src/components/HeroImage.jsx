import React, { useState } from 'react';

/**
 * HeroImage Component
 * 
 * Optimized hero section with responsive image and fallback
 * - Responsive sizing
 * - Gradient skeleton loader
 * - Error handling with color fallback
 * - SEO-friendly alt text
 */
const HeroImage = React.memo(({
  src,
  alt = 'Hero banner',
  onLoad,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const wrapperStyle = {
    position: 'relative',
    width: '100%',
    height: '400px',
    borderRadius: '16px',
    overflow: 'hidden'
  };

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div style={wrapperStyle}>
      {/* Skeleton Loader */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            borderRadius: '16px'
          }}
        />
      )}

      {/* Image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '16px',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.2s ease'
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error Fallback */}
      {hasError && (
        <div
          style={{
            width: '100%',
            height: '400px',
            background: 'linear-gradient(135deg, var(--primary-red), var(--primary-gold))',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '600',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Hero Image Unavailable
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
});

HeroImage.displayName = 'HeroImage';

export default HeroImage;

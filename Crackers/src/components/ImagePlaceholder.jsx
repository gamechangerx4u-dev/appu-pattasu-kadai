import React, { useState } from 'react';

/**
 * ImagePlaceholder Component
 * 
 * Handles image loading states and fallbacks gracefully
 * - Shows skeleton/placeholder while loading
 * - Displays fallback on error
 * - Optimized for e-commerce product images
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.width - CSS width value (default: '100%')
 * @param {string} props.height - CSS height value (default: '220px')
 * @param {string} props.objectFit - CSS object-fit (default: 'contain')
 * @param {boolean} props.lazy - Enable lazy loading (default: true)
 * @param {function} props.onLoad - Callback when image loads
 * @param {function} props.onError - Callback when image fails to load
 */
const ImagePlaceholder = React.memo(({
  src,
  alt = 'Product image',
  width = '100%',
  height = '220px',
  objectFit = 'contain',
  lazy = true,
  onLoad,
  onError,
  className = 'product-card-img'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const wrapperStyle = {
    position: 'relative',
    width,
    height,
    borderRadius: '8px',
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

  const placeholderStyle = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
    borderRadius: '8px',
    display: isLoading ? 'block' : 'none'
  };

  const imageStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit,
    opacity: !isLoading && !hasError ? 1 : 0,
    transition: 'opacity 0.2s ease',
    borderRadius: '8px'
  };

  const errorStyle = {
    position: 'absolute',
    inset: 0,
    background: '#f5f5f5',
    display: hasError ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    color: '#6c757d',
    fontSize: '0.85rem',
    textAlign: 'center',
    padding: '1rem'
  };

  return (
    <div style={wrapperStyle}>
      {/* Skeleton Loader */}
      <div style={placeholderStyle} />

      {/* Image */}
      {!hasError && (
        <img
          className={className}
          src={src}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error Fallback */}
      {hasError && (
        <div style={errorStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
          <div>Image unavailable</div>
        </div>
      )}

      {/* Shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
});

ImagePlaceholder.displayName = 'ImagePlaceholder';

export default ImagePlaceholder;

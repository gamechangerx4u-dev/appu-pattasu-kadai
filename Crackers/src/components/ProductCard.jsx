import React from 'react';
import { Heart, Plus, Scale, Star } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';

const ProductCard = React.memo(({ product, onAddToCart, onAddToWishlist, inWishlist }) => {
  const discountPercent = Math.round(((product.marketPrice - product.ourPrice) / product.marketPrice) * 100);

  return (
    <div style={{ 
      background: 'white', 
      border: '1px solid var(--dark-surface-border)', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      padding: '1rem',
      height: '100%'
    }}>
      {/* Discount Tag */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, 
        background: 'var(--primary-red)', color: 'white', 
        padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold',
        borderBottomRightRadius: '8px', zIndex: 1
      }}>
        {discountPercent}%<br/>Off
      </div>

      {/* Heart Icon */}
      <button 
        onClick={() => onAddToWishlist(product)}
        style={{ 
          position: 'absolute', top: '10px', right: '10px', 
          background: 'none', border: 'none', cursor: 'pointer', zIndex: 1,
          color: 'var(--primary-red)'
        }}
      >
        <Heart fill={inWishlist ? 'var(--primary-red)' : 'none'} size={24} strokeWidth={1.5} />
      </button>

      {/* Image */}
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <ImagePlaceholder
          src={product.image}
          alt={product.name}
          width="100%"
          height="220px"
          lazy={true}
        />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, textAlign: 'center' }}>
        <h3 className="product-card-title" style={{ fontSize: '1rem', color: '#111', marginBottom: '0.25rem' }}>{product.name}</h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          (1 Pieces)
        </div>
        
        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '0.5rem', color: 'var(--primary-gold)' }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
        </div>
        
        {/* Price */}
        <div style={{ marginBottom: '0.25rem' }}>
          <span className="product-card-price" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-red)' }}>
            ₹{product.ourPrice.toFixed(2)}
          </span>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            MRP: ₹{product.marketPrice.toFixed(2)}
          </span>
        </div>

        {/* Scale Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: '#F0F0F0', borderRadius: '50%', padding: '6px', color: '#888' }}>
            <Scale size={20} />
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={() => onAddToCart(product)}
            style={{ 
              width: '100%', background: 'var(--primary-red)', color: 'white', 
              border: 'none', borderRadius: '24px', padding: '0.75rem', 
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer',
              position: 'relative'
            }}
          >
            <span>Add to cart</span>
            <Plus size={18} style={{ position: 'absolute', right: '12px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  // Return true if props are equal (skip re-render), false if different (re-render)
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.inWishlist === nextProps.inWishlist &&
    prevProps.onAddToCart === nextProps.onAddToCart &&
    prevProps.onAddToWishlist === nextProps.onAddToWishlist
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

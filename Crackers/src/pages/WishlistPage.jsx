import React from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';

const WishlistPage = ({ wishlistItems, onAddToCart, removeFromWishlist }) => {
  return (
    <div className="container" style={{ padding: '4rem 20px', minHeight: '80vh' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your <span className="text-gradient">Wishlist</span></h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Don't forget to add these items to your cart before proceeding to checkout!
      </p>
      
      {wishlistItems.length === 0 ? (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Your wishlist is empty.</h3>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '2rem' 
        }}>
          {wishlistItems.map((product) => (
            <div key={product.id} className="glass" style={{ borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', padding: '1rem', background: 'var(--dark-surface)', textAlign: 'center' }}>
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'contain' }} />
                <button 
                  onClick={() => removeFromWishlist(product.id)}
                  style={{ 
                    position: 'absolute', top: '10px', right: '10px', 
                    background: 'rgba(230, 57, 70, 0.2)', border: 'none', borderRadius: '50%', 
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--primary-red)'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', flexGrow: 1 }}>{product.name}</h3>
                
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-gold)', marginBottom: '1rem' }}>
                  ₹{product.ourPrice}
                </div>
                
                <button 
                  className="btn btn-gold" 
                  style={{ width: '100%' }} 
                  onClick={() => {
                    onAddToCart(product);
                    removeFromWishlist(product.id);
                  }}
                >
                  <ShoppingCart size={18} /> Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;

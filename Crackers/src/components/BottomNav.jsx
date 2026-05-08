import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Store, Search, Heart, User, Menu } from 'lucide-react';

const BottomNav = ({ toggleSidebar, wishlistCount }) => {
  const location = useLocation();

  const getIconColor = (path) => {
    return location.pathname === path ? 'var(--primary-red)' : 'var(--text-muted)';
  };

  return (
    <div 
      className="mobile-only glass" 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0.75rem 0',
        zIndex: 100,
        borderTop: '1px solid var(--glass-border)',
        borderRadius: '16px 16px 0 0',
        paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'
      }}
    >
      <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: getIconColor('/') }}>
        <Store size={24} />
        <span style={{ fontSize: '0.7rem' }}>Store</span>
      </Link>
      
      <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <Menu size={24} />
        <span style={{ fontSize: '0.7rem' }}>Categories</span>
      </button>

      <Link to="/wishlist" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: getIconColor('/wishlist'), position: 'relative' }}>
        <Heart size={24} />
        <span style={{ fontSize: '0.7rem' }}>Wishlist</span>
        {wishlistCount > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '5px',
            background: 'var(--primary-red)', color: 'white',
            borderRadius: '50%', width: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', fontWeight: 'bold'
          }}>
            {wishlistCount}
          </span>
        )}
      </Link>

      <Link to="/account" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: getIconColor('/account') }}>
        <User size={24} />
        <span style={{ fontSize: '0.7rem' }}>Account</span>
      </Link>
    </div>
  );
};

export default BottomNav;

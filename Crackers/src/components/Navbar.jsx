import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Menu } from 'lucide-react';
import SearchBar from './SearchBar';

const Navbar = ({ cartCount, wishlistCount, toggleSidebar, searchQuery, setSearchQuery }) => {
  return (
    <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '0.5rem 0' }}>
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button className="mobile-only-block" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Menu size={28} />
          </button>
          <Link to="/" className="flex items-center gap-4">
            <img src="/logo.jpg" alt="Appu Crackers Logo" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 className="text-gradient desktop-only" style={{ fontSize: '1.5rem', margin: 0 }}>Appu Crackers</h1>
          </Link>
        </div>

        <div className="desktop-only" style={{ flex: 1, maxWidth: '500px', margin: '0 2rem' }}>
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
        
        <ul className="flex items-center gap-8">
          <li className="desktop-only">
            <Link to="/wishlist" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Heart size={24} />
              {wishlistCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: 'var(--primary-red)', color: 'white',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 'bold'
                }}>
                  {wishlistCount}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingCart size={24} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: 'var(--primary-gold)', color: '#111',
                  borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 'bold'
                }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

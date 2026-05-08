import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, Mail } from 'lucide-react';
import data from '../data/db.json';
import PriceFilter from './PriceFilter';

const Sidebar = ({ isOpen, toggleSidebar, minPrice, maxPrice, setMinPrice, setMaxPrice }) => {
  const navigate = useNavigate();
  const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-');
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            zIndex: 1000
          }}
        />
      )}

      {/* Drawer */}
      <div 
        className="glass"
        style={{
          position: 'fixed', top: 0, left: isOpen ? 0 : '-100%',
          width: '80%', maxWidth: '300px', height: '100%',
          zIndex: 1001, transition: 'left 0.3s ease-in-out',
          display: 'flex', flexDirection: 'column',
          padding: '2rem 1.5rem',
          overflowY: 'auto'
        }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--primary-gold)' }}>Menu</h2>
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
            <X size={28} />
          </button>
        </div>

        <PriceFilter 
          minPrice={minPrice} 
          maxPrice={maxPrice} 
          setMinPrice={setMinPrice} 
          setMaxPrice={setMaxPrice} 
        />

        <h3 style={{ color: 'var(--primary-gold)', marginBottom: '1rem', marginTop: '1rem' }}>Categories</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
          <li>
            <button
              type="button"
              aria-label="All Crackers"
              onClick={() => { navigate('/'); toggleSidebar(); }}
              style={{ width: '100%', textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              All Crackers
            </button>
          </li>
          {data.categories.map(cat => (
            <li key={cat}>
              <button
                type="button"
                aria-label={`Category ${cat}`}
                onClick={() => { navigate(`/product-category/${slugify(cat)}`); toggleSidebar(); }}
                style={{ width: '100%', textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>CONTACT DETAILS</h3>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <Phone size={16} /> +91 76039 09818
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
            <Mail size={16} /> info@appucrackers.com
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

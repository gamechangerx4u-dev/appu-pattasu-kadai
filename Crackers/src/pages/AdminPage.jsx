import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AdminPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Replace with Supabase Auth in Phase 2
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      fetchProducts();
    } else {
      alert('Invalid password');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    navigate('/');
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto' }}>
        <h1 style={{ textAlign: 'center', color: 'var(--primary-gold)' }}>Admin Login</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--glass-border)',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleLogin}
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--primary-red)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-gold)' }}>Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary-red)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* TODO: Implement in Phase 2 */}
      <div style={{ background: 'var(--glass-bg)', padding: '2rem', borderRadius: '1rem' }}>
        <h2>Product Management</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          CRUD features coming in Phase 2:
        </p>
        <ul style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
          <li>✓ Add new products with image upload</li>
          <li>✓ Edit existing products</li>
          <li>✓ Delete products</li>
          <li>✓ Manage categories</li>
        </ul>
      </div>

      {loading && <p>Loading...</p>}
      {products.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Current Products: {products.length}</h3>
          <p style={{ color: 'var(--text-muted)' }}>See console for full data</p>
        </div>
      )}
    </div>
  );
};

export default AdminPage;

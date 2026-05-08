import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text" 
        placeholder="Search for crackers..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '1rem 1rem 1rem 3rem',
          borderRadius: '24px',
          border: '1px solid var(--primary-red)',
          background: 'var(--dark-surface)',
          color: 'var(--text-main)',
          fontSize: '1rem',
          outline: 'none',
          boxShadow: '0 4px 12px rgba(230, 57, 70, 0.1)'
        }}
      />
      <Search 
        size={20} 
        style={{ 
          position: 'absolute', 
          left: '1rem', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--primary-red)' 
        }} 
      />
    </div>
  );
};

export default SearchBar;

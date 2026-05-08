import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryList = React.memo(({ categories, activeCategory }) => {
  const navigate = useNavigate();
  
  const slugify = useCallback((text) => (text || '').toString().toLowerCase().replace(/\s+/g, '-'), []);
  
  const handleNavigate = useCallback((slug) => {
    navigate(slug);
  }, [navigate]);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-gold)' }}>Product Categories</h3>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <li>
          <button 
            type="button"
            aria-pressed={activeCategory === 'All'}
            onClick={() => navigate('/')}
            style={{ 
              background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
              color: activeCategory === 'All' ? 'var(--primary-red)' : 'var(--text-main)',
              fontWeight: activeCategory === 'All' ? 'bold' : 'normal',
              fontSize: '1rem', padding: '0.25rem 0', width: '100%'
            }}
          >
            All Crackers
          </button>
        </li>
        {categories.map((category) => (
          <li key={category}>
            <button
              type="button"
              aria-pressed={activeCategory.toLowerCase() === category.toLowerCase()}
              onClick={() => navigate(`/product-category/${slugify(category)}`)}
              style={{ 
                background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                color: activeCategory.toLowerCase() === category.toLowerCase() ? 'var(--primary-red)' : 'var(--text-main)',
                fontWeight: activeCategory.toLowerCase() === category.toLowerCase() ? 'bold' : 'normal',
                fontSize: '1rem', padding: '0.25rem 0', width: '100%'
              }}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.activeCategory === nextProps.activeCategory &&
    prevProps.categories.length === nextProps.categories.length
  );
});

CategoryList.displayName = 'CategoryList';

export default CategoryList;

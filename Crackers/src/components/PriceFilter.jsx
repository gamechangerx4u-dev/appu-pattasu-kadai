import React, { useState, useEffect, useCallback } from 'react';

const PriceFilter = React.memo(({ minPrice, maxPrice, setMinPrice, setMaxPrice }) => {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  const handleFilter = useCallback(() => {
    setMinPrice(localMin);
    setMaxPrice(localMax);
  }, [localMin, localMax, setMinPrice, setMaxPrice]);

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-gold)' }}>Price Filter</h3>
      <div className="flex justify-between gap-4" style={{ marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min price</label>
          <input 
            type="number" 
            value={localMin} 
            onChange={e => setLocalMin(Number(e.target.value))}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.2rem' }}>-</div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max price</label>
          <input 
            type="number" 
            value={localMax} 
            onChange={e => setLocalMax(Number(e.target.value))}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)' }}
          />
        </div>
      </div>
      
      <div style={{ margin: '1.5rem 0' }}>
        <input 
          type="range" 
          min="0" 
          max="10000" 
          value={localMax} 
          onChange={e => setLocalMax(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary-red)' }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span style={{ fontSize: '0.9rem' }}>Price: ₹{localMin} — ₹{localMax}</span>
        <button className="btn btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: 'var(--dark-surface)' }} onClick={handleFilter}>
          Filter
        </button>
      </div>
    </div>
  );
});

PriceFilter.displayName = 'PriceFilter';

export default PriceFilter;

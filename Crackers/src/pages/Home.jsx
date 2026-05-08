import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryList from '../components/CategoryList';
import ProductCard from '../components/ProductCard';
import PriceFilter from '../components/PriceFilter';
import SearchBar from '../components/SearchBar';
import { ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import data from '../data/db.json';
import { supabase, hasSupabase } from '../lib/supabaseClient';

const Home = ({ onAddToCart, onAddToWishlist, wishlist, minPrice, maxPrice, setMinPrice, setMaxPrice, searchQuery, setSearchQuery }) => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  // Helper to convert 'night-time' back to 'Night Time' to match DB
  const unslugify = (slug) => {
    if (!slug) return 'All';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const [products, setProducts] = useState(data.products || []);
  const [categories, setCategories] = useState(data.categories || []);

  useEffect(() => {
    if (!hasSupabase) return;

    let isMounted = true;
    const fetchData = async () => {
      try {
        const { data: prodData, error: prodErr } = await supabase.from('products').select('*');
        const { data: catData, error: catErr } = await supabase.from('categories').select('name');
        if (prodErr) console.warn('Supabase products error', prodErr);
        if (catErr) console.warn('Supabase categories error', catErr);
        if (isMounted) {
          if (prodData) setProducts(prodData);
          if (catData) setCategories(catData.map(c => c.name || c));
        }
      } catch (e) {
        console.error('Failed to fetch from Supabase', e);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const activeCategory = unslugify(categorySlug);

  const filteredProducts = useMemo(() => {
    let list = activeCategory === 'All' ? products : products.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase());
    if (searchQuery.trim() !== '') {
      list = list.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list.filter(p => (p.ourPrice || 0) >= minPrice && (p.ourPrice || 0) <= maxPrice);
  }, [products, activeCategory, searchQuery, minPrice, maxPrice]);

  return (
    <div>
      <Helmet>
        <title>{activeCategory === 'All' ? 'All Crackers — Appu Crackers' : `${activeCategory} — Appu Crackers`}</title>
        <meta name="description" content={`Shop ${activeCategory === 'All' ? 'all crackers' : activeCategory} at Appu Crackers — quality crackers and festive favorites.`} />
      </Helmet>
      <div className="mobile-only-block">
        <Hero />
      </div>
      <section className="container" style={{ padding: '2rem 40px' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/')}>
            Home
          </span>
          {activeCategory !== 'All' && (
            <>
              <ChevronRight size={16} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                {activeCategory}
              </span>
            </>
          )}
        </div>

        <div className="mobile-only-block" style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>
            Explore Our <span className="text-gradient">Collections</span>
          </h2>
        </div>
        
        <div className="mobile-only-block">
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>

        <div className="flex gap-8" style={{ alignItems: 'flex-start' }}>
          <div className="desktop-only flex-col" style={{ flex: '0 0 280px', position: 'sticky', top: '100px' }}>
            <PriceFilter 
              minPrice={minPrice} maxPrice={maxPrice} 
              setMinPrice={setMinPrice} setMaxPrice={setMaxPrice} 
            />
            <CategoryList 
              categories={categories} 
              activeCategory={activeCategory} 
            />
          </div>
        
          <div style={{ flex: 1 }}>
            <div className="desktop-only" style={{ marginBottom: '2rem' }}>
              <Hero />
            </div>
            
            <div className="product-grid">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                  inWishlist={wishlist.some(item => item.id === product.id)}
                />
              ))}
              {filteredProducts.length === 0 && (
                <div style={{ padding: '2rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No products found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BannerCarousel from '../components/BannerCarousel';
import Seo from '../components/Seo';
import CategoryList from '../components/CategoryList';
import ProductCard from '../components/ProductCard';
import PriceFilter from '../components/PriceFilter';
import SearchBar from '../components/SearchBar';
import { ChevronRight } from 'lucide-react';

const Home = ({
  onAddToCart,
  onAddToWishlist,
  wishlist,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  searchQuery,
  setSearchQuery,
  products = [],
  categories = [],
  loading = false,
}) => {
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  // Helper to convert 'night-time' back to 'Night Time' to match DB
  const unslugify = (slug) => {
    if (!slug) return 'All';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const activeCategory = unslugify(categorySlug);

  const filteredProducts = useMemo(() => {
    let list = activeCategory === 'All' ? products : products.filter(p => {
      const cats = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : (p.category ? [p.category] : []);
      return cats.some(c => c.toLowerCase() === activeCategory.toLowerCase());
    });
    if (searchQuery.trim() !== '') {
      list = list.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return list.filter(p => (p.ourPrice || 0) >= minPrice && (p.ourPrice || 0) <= maxPrice);
  }, [products, activeCategory, searchQuery, minPrice, maxPrice]);

  const pagePath = activeCategory === 'All' ? '/' : `/product-category/${categorySlug}`;
  const pageTitle = activeCategory === 'All' ? null : activeCategory;
  const pageDescription = activeCategory === 'All'
    ? undefined
    : `Shop ${activeCategory} crackers online at Appu Crackers. Premium Sivakasi fireworks for Diwali and celebrations.`;

  return (
    <div>
      <Seo
        title={pageTitle}
        description={pageDescription}
        path={pagePath}
      />
      <BannerCarousel />
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
            <div className="product-grid">
              {loading && products.length === 0 && (
                <div style={{ padding: '2rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading products...
                </div>
              )}
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                  inWishlist={wishlist.some(item => item.id === product.id)}
                />
              ))}
              {!loading && filteredProducts.length === 0 && (
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

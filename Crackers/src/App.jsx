import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import { loadCatalog } from './lib/catalog';
import { useToast } from './context/ToastContext';

// Lazy load pages for code splitting
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));

// Loading component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', margin: '0 auto 1rem', border: '3px solid var(--primary-gold)', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p>Loading...</p>
    </div>
  </div>
);

function App() {
  const toast = useToast();
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        const catalog = await loadCatalog();
        if (!isMounted) return;
        setProducts(catalog.products);
        setCategories(catalog.categories);
      } catch (error) {
        console.error('Failed to load catalog data:', error);
        toast.error('Could not load products right now. Please refresh the page.');
      } finally {
        if (isMounted) {
          setCatalogLoading(false);
        }
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback((product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  }, []);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <HelmetProvider>
      <Router>
      <Navbar 
        cartCount={cartCount} 
        wishlistCount={wishlistCount} 
        toggleSidebar={() => setIsSidebarOpen(true)} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(false)} 
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        categories={categories}
      />

      <Routes>
        <Route path="/" element={
          <Home 
            onAddToCart={addToCart} 
            onAddToWishlist={toggleWishlist}
            wishlist={wishlist}
            minPrice={minPrice}
            maxPrice={maxPrice}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            products={products}
            categories={categories}
            loading={catalogLoading}
          />
        } />
        <Route path="/product-category/:categorySlug" element={
          <Home 
            onAddToCart={addToCart} 
            onAddToWishlist={toggleWishlist}
            wishlist={wishlist}
            minPrice={minPrice}
            maxPrice={maxPrice}
            setMinPrice={setMinPrice}
            setMaxPrice={setMaxPrice}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            products={products}
            categories={categories}
            loading={catalogLoading}
          />
        } />
        <Route path="/cart" element={
          <Suspense fallback={<PageLoader />}>
            <CartPage 
              cartItems={cart} 
              updateQuantity={updateQuantity} 
              removeFromCart={removeFromCart} 
            />
          </Suspense>
        } />
        <Route path="/payment" element={
          <Suspense fallback={<PageLoader />}>
            <PaymentPage clearCart={clearCart} />
          </Suspense>
        } />
        <Route path="/payment/success" element={
          <Suspense fallback={<PageLoader />}>
            <PaymentSuccessPage />
          </Suspense>
        } />
        <Route path="/payment/failed" element={
          <Suspense fallback={<PageLoader />}>
            <PaymentFailedPage />
          </Suspense>
        } />
        <Route path="/wishlist" element={
          <Suspense fallback={<PageLoader />}>
            <WishlistPage 
              wishlistItems={wishlist} 
              onAddToCart={addToCart}
              removeFromWishlist={removeFromWishlist}
            />
          </Suspense>
        } />
        <Route path="/account" element={
          <div className="container" style={{ padding: '4rem 20px', minHeight: '80vh', textAlign: 'center' }}>
            <h2>My <span className="text-gradient">Account</span></h2>
            <div className="glass" style={{ padding: '3rem', marginTop: '2rem', borderRadius: '16px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Account features coming soon.</p>
            </div>
          </div>
        } />
        <Route path="/admin" element={
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        } />
      </Routes>
      
      <BottomNav 
        toggleSidebar={() => setIsSidebarOpen(true)} 
        wishlistCount={wishlistCount} 
      />
      </Router>
    </HelmetProvider>
  );
}

export default App;

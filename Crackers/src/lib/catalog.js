const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

const normalizeProduct = (product) => ({
  ...product,
  id: String(product.id),
  ourPrice: Number(product.our_price ?? product.ourPrice ?? 0),
  marketPrice: Number(product.market_price ?? product.marketPrice ?? 0),
  stock: Number(product.stock ?? 0),
  categories: Array.isArray(product.categories) ? product.categories.map(String) : (product.category ? [String(product.category)] : []),
});

const normalizeCategory = (category) => {
  if (typeof category === 'string') return category;
  return category?.name || '';
};

export const loadCatalog = async () => {
  const backend = getBackendUrl();
  // Debug: log configured backend so we can verify at runtime
  try {
    // eslint-disable-next-line no-console
    console.log('loadCatalog backend=', backend);
  } catch (e) {}
  if (!backend) {
    throw new Error('Backend API is not configured');
  }

  let productsResp, categoriesResp;
  try {
    [productsResp, categoriesResp] = await Promise.all([
      fetch(`${backend}/api/products`),
      fetch(`${backend}/api/categories`),
    ]);
  } catch (err) {
    // Log more details for debugging
    // eslint-disable-next-line no-console
    console.error('Failed to fetch catalog from backend', { backend, err });
    throw err;
  }

  if (!productsResp.ok) throw new Error('Failed to fetch products from backend');
  if (!categoriesResp.ok) throw new Error('Failed to fetch categories from backend');

  const [productsData, categoriesData] = await Promise.all([
    productsResp.json(),
    categoriesResp.json(),
  ]);

  const products = (productsData || []).map(normalizeProduct);
  const categories = (categoriesData || []).map(normalizeCategory).filter(Boolean);
  return { products, categories };
};

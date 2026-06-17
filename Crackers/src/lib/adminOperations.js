import { getAdminHeaders, isBackendConfigured } from './adminAuth';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      ...getAdminHeaders(),
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Request failed');
  return body;
};

const toProductPayload = (productData) => ({
  ...productData,
  our_price: Number(productData.our_price ?? productData.ourPrice ?? 0),
  market_price: Number(productData.market_price ?? productData.marketPrice ?? 0),
  stock: Number(productData.stock ?? 0),
  categories: productData.categories || [],
});

const uploadToBackend = async (kind, file) => {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', file);

  const adminHeaders = getAdminHeaders();
  const headers = {};
  if (adminHeaders.Authorization) headers.Authorization = adminHeaders.Authorization;

  const response = await fetch(`${getBackendUrl()}/api/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Upload failed');
  return body.url;
};

// ==================
// PRODUCT CRUD
// ==================

export const addProduct = async (productData) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return requestJson('/api/products', {
    method: 'POST',
    body: JSON.stringify(toProductPayload(productData)),
  });
};

export const updateProduct = async (id, productData) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return requestJson(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(toProductPayload(productData)),
  });
};

export const deleteProduct = async (id) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  await requestJson(`/api/products/${id}`, { method: 'DELETE' });
};

export const fetchAllProducts = async () => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return requestJson('/api/products', { method: 'GET', headers: getAdminHeaders() });
};

// ==================
// CATEGORY CRUD
// ==================

export const addCategory = async (name) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return requestJson('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

export const deleteCategory = async (id) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  await requestJson(`/api/categories/${id}`, { method: 'DELETE' });
};

export const reorderCategories = async (ids) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return requestJson('/api/categories/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
};

export const fetchAllCategories = async () => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return requestJson('/api/categories', { method: 'GET', headers: getAdminHeaders() });
};

// ==================
// IMAGE UPLOAD
// ==================

export const uploadProductImage = async (file) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return uploadToBackend('product-image', file);
};

// ==================
// BULK OPERATIONS
// ==================

export const updateStock = async (productId, newStock) => updateProduct(productId, { stock: newStock });

// ==================
// ADMIN QR HANDLERS
// ==================

export const uploadAdminQR = async (file) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return uploadToBackend('admin-qr', file);
};

export const getAdminQR = async () => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  const response = await fetch(`${getBackendUrl()}/api/admin/qr`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Failed to load admin QR');
  return body.url || null;
};

export const getBankDetails = async () => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  const response = await fetch(`${getBackendUrl()}/api/admin/bank-details`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Failed to load bank details');
  return body.bank_details || {};
};

export const updateBankDetails = async (bankDetails) => {
  const body = await requestJson('/api/admin/bank-details', {
    method: 'PATCH',
    body: JSON.stringify({ bank_details: bankDetails }),
  });
  return body.bank_details || bankDetails;
};

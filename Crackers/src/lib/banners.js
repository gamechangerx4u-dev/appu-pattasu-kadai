import { getAdminHeaders, isBackendConfigured } from './adminAuth';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export const fetchBanners = async () => {
  const backend = getBackendUrl();
  if (!backend) return [];

  const response = await fetch(`${backend}/api/banners`);
  const body = await response.json().catch(() => []);
  if (!response.ok) throw new Error(body?.error || 'Failed to fetch banners');
  return body || [];
};

const adminJson = async (path, options = {}) => {
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

export const fetchAllBanners = async () => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return adminJson('/api/banners/all');
};

export const createBanner = async ({ image_url, media_id }) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return adminJson('/api/banners', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url, media_id, active: true }),
  });
};

export const deleteBanner = async (id) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return adminJson(`/api/banners/${id}`, { method: 'DELETE' });
};

export const toggleBannerActive = async (id, active) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return adminJson(`/api/banners/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
};

export const reorderBanners = async (ids) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');
  return adminJson('/api/banners/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
};

export const uploadBannerImage = async (file) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  const formData = new FormData();
  formData.append('kind', 'hero-banner');
  formData.append('file', file);

  const headers = {};
  const adminHeaders = getAdminHeaders();
  if (adminHeaders.Authorization) headers.Authorization = adminHeaders.Authorization;

  const response = await fetch(`${getBackendUrl()}/api/uploads`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Upload failed');
  return body;
};

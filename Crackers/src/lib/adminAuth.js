const ADMIN_TOKEN_KEY = 'crackers-admin-token';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const setAdminToken = (token) => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
};

export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const isBackendConfigured = () => Boolean(getBackendUrl());

export const getAdminHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const loginAdmin = async (password) => {
  if (isBackendConfigured()) {
    const response = await fetch(`${getBackendUrl()}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body?.error || 'Login failed');
    if (body?.token) setAdminToken(body.token);
    return body;
  }

  throw new Error('Backend API is not configured');
};

export const updateAdminPassword = async ({ currentPassword, newPassword }) => {
  if (!isBackendConfigured()) {
    throw new Error('Backend API is not configured');
  }

  const response = await fetch(`${getBackendUrl()}/api/admin/password`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Failed to update password');
  return body;
};

export const logoutAdmin = () => {
  clearAdminToken();
};

import { getAdminHeaders, isBackendConfigured } from './adminAuth';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

const uploadToBackend = async (kind, file) => {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', file);

  const response = await fetch(`${getBackendUrl()}/api/uploads`, {
    method: 'POST',
    body: formData,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Upload failed');
  // return full body so caller can persist both url and server path
  return body;
};

export const uploadFile = async (bucket, _path, file) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  const kindMap = {
    'order-receipts': 'order-receipt',
    'order-pdfs': 'order-pdf',
  };

  const kind = kindMap[bucket];
  if (!kind) throw new Error('Invalid upload bucket');
  return uploadToBackend(kind, file);
};

export const createOrder = async ({ user_id, customer_name, phone, email, address, items, subtotal, gst, discount, total, payment_method, receiptFile, pdfFile }) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  let receipt_url = null;
  let pdf_url = null;
  let receipt_path = null;
  let pdf_path = null;

  try {
    if (receiptFile) {
      const receiptPath = `order-receipts/temp-${Date.now()}-${receiptFile.name}`;
      const resp = await uploadFile('order-receipts', receiptPath, receiptFile);
      receipt_url = resp?.url || null;
      receipt_path = resp?.path || null;
    }

    if (pdfFile) {
      const pdfPath = `order-pdfs/temp-${Date.now()}-${pdfFile.name}`;
      const resp = await uploadFile('order-pdfs', pdfPath, pdfFile);
      pdf_url = resp?.url || null;
      pdf_path = resp?.path || null;
    }
  } catch (err) {
    console.warn('Failed to upload order files before backend create', err);
  }

  const url = `${getBackendUrl()}/api/orders`;
  const payload = { user_id, customer_name, phone, email, address, items, subtotal, gst, discount, total, payment_method, receipt_url, pdf_url, receipt_path, pdf_path };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to create order via backend');
  }
  return resp.json();
};

export const fetchOrders = async () => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  const response = await fetch(`${getBackendUrl()}/api/orders`, {
    headers: getAdminHeaders(),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Failed to fetch orders');
  return body || [];
};

export const updateOrderStatus = async (orderId, status) => {
  if (!isBackendConfigured()) throw new Error('Backend API is not configured');

  const response = await fetch(`${getBackendUrl()}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAdminHeaders(),
    body: JSON.stringify({ status }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || 'Failed to update order status');
  return body;
};

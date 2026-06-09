export function getPublicApiUrl(req) {
  const configured = (process.env.PUBLIC_API_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  if (req) return `${req.protocol}://${req.get('host')}`;
  return '';
}

export function buildOrderPdfUrl(req, orderId) {
  return `${getPublicApiUrl(req)}/api/orders/${orderId}/pdf`;
}

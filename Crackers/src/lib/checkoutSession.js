const CHECKOUT_KEY = 'checkout';
const COMPLETED_ORDER_KEY = 'completed_order';

export function getCheckout() {
  const raw = sessionStorage.getItem(CHECKOUT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCheckout() {
  sessionStorage.removeItem(CHECKOUT_KEY);
}

export function saveCompletedOrder(orderData) {
  sessionStorage.setItem(COMPLETED_ORDER_KEY, JSON.stringify(orderData));
  clearCheckout();
}

export function getCompletedOrder() {
  const raw = sessionStorage.getItem(COMPLETED_ORDER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearCompletedOrder() {
  sessionStorage.removeItem(COMPLETED_ORDER_KEY);
}

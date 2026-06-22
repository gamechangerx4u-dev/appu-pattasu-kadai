import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { getCompletedOrder } from '../lib/checkoutSession';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fromState = location.state?.order;
    const fromSession = getCompletedOrder();
    const resolved = fromState || fromSession;

    if (!resolved?.site_txn) {
      navigate('/cart', { replace: true });
      return;
    }

    setOrder(resolved);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.state, navigate]);

  if (!order) return null;

  return (
    <div className="container" style={{ padding: '4rem 20px', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="glass"
        style={{
          padding: '3rem 2rem',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.45s ease, opacity 0.45s ease',
        }}
      >
        <div
          style={{
            width: '88px',
            height: '88px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'rgba(74, 222, 128, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'scaleIn 0.5s ease-out both',
          }}
        >
          <CheckCircle2 size={52} color="#16a34a" strokeWidth={2.2} />
        </div>

        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Payment <span className="text-gradient">Successful</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your order has been placed and the invoice was generated successfully.
        </p>

        <div
          style={{
            background: 'var(--dark-surface)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Order ID</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '0.03em' }}>{order.site_txn}</div>
          {order.total != null ? (
            <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
              Total paid: <strong style={{ color: 'var(--text-main)' }}>₹{Number(order.total).toFixed(2)}</strong>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {order.pdf_url ? (
            <a
              href={order.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              Download Invoice
            </a>
          ) : null}
          <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { getCheckout } from '../lib/checkoutSession';

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const failure = location.state?.failure || {};
  const message = failure.message || 'We could not complete your payment. Please try again.';
  const siteTxn = failure.site_txn || '';
  const canRetry = Boolean(getCheckout());

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

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
            background: 'rgba(230, 57, 70, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'scaleIn 0.5s ease-out both',
          }}
        >
          <XCircle size={52} color="#e63946" strokeWidth={2.2} />
        </div>

        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Payment <span style={{ color: '#e63946' }}>Failed</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{message}</p>

        {siteTxn ? (
          <div
            style={{
              background: 'var(--dark-surface)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--glass-border)',
              fontSize: '0.95rem',
            }}
          >
            Reference: <strong>{siteTxn}</strong>
            <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              Your order may have been created, but the invoice could not be generated. Contact us with this ID if payment was deducted.
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {canRetry ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/payment', { replace: true })}
            >
              Try Again
            </button>
          ) : (
            <Link to="/cart" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Back to Cart
            </Link>
          )}
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;

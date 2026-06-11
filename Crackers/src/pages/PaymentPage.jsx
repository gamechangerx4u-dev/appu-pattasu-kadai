import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateInvoicePdf } from '../lib/pdfGenerator';
import { loadBrandLogo } from '../lib/loadBrandLogo';
import { uploadFile } from '../lib/orders';
import { compressImage } from '../utils/imageCompressor';

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    resolve(result.includes(',') ? result.split(',')[1] : result);
  };
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const PaymentPage = ({ clearCart }) => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';
  const [checkout, setCheckout] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [adminQR, setAdminQR] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('checkout');
    if (!stored) return navigate('/cart');
    const parsed = JSON.parse(stored);
    setCheckout(parsed);
    setCustomerName(parsed?.customer_name || '');
    setPaymentPhone(parsed?.phone || '');

    // try to load admin QR from backend
    (async () => {
      try {
        if (!backendUrl) return;
        const response = await fetch(`${backendUrl}/api/admin/qr`);
        const body = await response.json().catch(() => ({}));
        if (response.ok && body?.url) setAdminQR(body.url);
      } catch {
        // ignore
      }
    })();
  }, [navigate, backendUrl]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(f.type)) return alert('Only PNG/JPEG images allowed');
    // compress before storing
    compressImage(f, { maxWidth: 1200, quality: 0.8 })
      .then((compressed) => setReceiptFile(compressed))
      .catch((err) => {
        console.warn('Compression failed, using original file', err);
        setReceiptFile(f);
      });
  };

  const handleGenerate = async () => {
    if (!checkout) return;
    if (!customerName.trim()) return alert('Please enter your name');
    if (!receiptFile) return alert('Please upload the payment receipt image');
    if (!paymentPhone.trim()) return alert('Please enter the mobile number used for the payment');
    if (checkout.subtotal < 3000) return alert('Minimum subtotal ₹3,000 required to proceed');

    setLoading(true);
    setErrorMsg('');
    try {
      console.log('Payment: starting invoice generation', { subtotal: checkout.subtotal, gst: checkout.gst, total: checkout.total });
      // Upload receipt first
      const receiptResp = await uploadFile('order-receipts', `order-receipts/temp-${Date.now()}-${receiptFile.name}`, receiptFile);
      const receipt_url = receiptResp?.url || null;
      const receipt_path = receiptResp?.path || null;

      // Create initial order without pdf (server will assign site_txn)
      const createResp = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: checkout.user_id || null,
          customer_name: customerName || checkout.customer_name || 'Guest',
          phone: paymentPhone,
          email: checkout.email,
          address: checkout.address,
          items: checkout.items,
          subtotal: checkout.subtotal,
          gst: checkout.gst,
          discount: checkout.discount,
          total: checkout.total,
          payment_method: 'GPay',
          receipt_url,
          receipt_path
        })
      });
      if (!createResp.ok) {
        const err = await createResp.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to create order');
      }
      const order = await createResp.json();
      console.log('Payment: initial order created', order);

      const logoDataUrl = await loadBrandLogo();

      const receiptDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(receiptFile);
      });

      const pdfBlob = await generateInvoicePdf({
        site_txn: order.site_txn,
        customer_name: customerName || checkout.customer_name || 'Guest',
        phone: paymentPhone,
        email: checkout.email,
        address: checkout.address,
        items: checkout.items,
        subtotal: checkout.subtotal,
        gst: checkout.gst,
        discount: checkout.discount,
        total: checkout.total,
        payment_method: 'GPay',
        receiptDataUrl,
        logoDataUrl,
      });

      const pdfBase64 = await blobToBase64(pdfBlob);
      const pdfFilename = `invoice-${order.site_txn}.pdf`;

      const pdfPatchResp = await fetch(`${backendUrl}/api/orders/${order.id}/pdf`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf_base64: pdfBase64,
          pdf_filename: pdfFilename,
        }),
      });

      if (!pdfPatchResp.ok) {
        const err = await pdfPatchResp.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to save invoice PDF');
      }

      const updatedOrder = await pdfPatchResp.json();
      const pdf_url = updatedOrder?.pdf_url || `${backendUrl}/api/orders/${order.id}/pdf`;

      sessionStorage.setItem('last_order_txn', order.site_txn);
      try {
        const updated = { ...(checkout || {}), customer_name: customerName };
        sessionStorage.setItem('checkout', JSON.stringify(updated));
      } catch (e) {
        // ignore session storage failures
      }

      const shopOwnerNumber = '9876543210';
      let message = `*Order Confirmed*\nTransaction: ${order.site_txn}\nName: ${order.customer_name || 'Guest'}\nPhone: ${order.phone}\nAddress: ${order.address}\nTotal: ₹${Number(order.total).toFixed(2)}\nItems: ${order.items ? order.items.length : 0}\n`;
      if (pdf_url) message += `\nInvoice: ${pdf_url}\n`;
      message += '\nThank you!';
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/91${shopOwnerNumber}?text=${encoded}`, '_blank');
      alert(`Order created: ${order.site_txn}. Invoice emailed and available at: ${pdf_url}`);

      if (pdf_url) {
        try {
          const link = document.createElement('a');
          link.href = pdf_url;
          const sanitize = (s) => String(s || '').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_');
          const namePart = sanitize(order.customer_name || checkout.customer_name || customerName || 'customer');
          link.download = `Invoice-${order.site_txn || 'order'}-${namePart}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.warn('Auto-download failed', err);
        }
      }

      if (typeof clearCart === 'function') {
        clearCart();
      }
    } catch (err) {
      console.error('Payment: failed to create order', err);
      setErrorMsg(err?.message || 'Failed to create order');
      console.error(err);
      alert('Failed to create order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!checkout) return null;

  return (
    <div className="container" style={{ padding: '4rem 20px', minHeight: '80vh' }}>
      <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Payment</h2>
      <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
        <p style={{ marginBottom: '1rem' }}>Free delivery across Tamil Nadu. Minimum subtotal ₹3,000.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h4>Scan & Pay (GPay)</h4>
            {adminQR ? (
              <img src={adminQR} alt="GPay QR" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px' }} />
            ) : (
              <div style={{ padding: '1rem', background: '#f3f3f3', borderRadius: '8px' }}>QR not available. Admin must upload QR from AdminPage.</div>
            )}
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div style={{ padding: '1rem', marginBottom: '1rem', background: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Order Summary</h4>
              {/* Items table */}
              <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: '0.5rem 0.25rem', width: '48%' }}>Item</th>
                      <th style={{ padding: '0.5rem 0.25rem', width: '12%', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '0.5rem 0.25rem', width: '20%', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '0.5rem 0.25rem', width: '20%', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(checkout.items) ? checkout.items : []).map((it, idx) => {
                      const qty = Number(it.quantity || 1);
                      const price = Number(it.ourPrice || it.price || 0);
                      const lineTotal = qty * price;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                          <td style={{ padding: '0.5rem 0.25rem' }}>{it.name}</td>
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>{qty}</td>
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                          <td style={{ padding: '0.5rem 0.25rem', textAlign: 'right', fontWeight: 600 }}>₹{lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}> <span>Subtotal</span> <strong>₹{Number(checkout.subtotal || 0).toFixed(2)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}> <span>GST</span> <strong>₹{Number(checkout.gst || 0).toFixed(2)}</strong></div>
              {checkout.discount ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}> <span>Discount</span> <strong>-₹{Number(checkout.discount).toFixed(2)}</strong></div>
              ) : null}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e64b4b' }}>₹{Number(checkout.total || (checkout.subtotal || 0) + (checkout.gst || 0) - (checkout.discount || 0)).toFixed(2)}</span>
              </div>
            </div>

            <h4>Upload Payment Receipt</h4>
            <input type="file" accept="image/*" onChange={onFileChange} />
            <div style={{ marginTop: '1rem' }}>
              <input type="text" placeholder="Your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ padding: '0.75rem', width: '100%', borderRadius: '8px', marginBottom: '0.6rem' }} />
              <input type="tel" placeholder="Mobile number used for payment" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} style={{ padding: '0.75rem', width: '100%', borderRadius: '8px' }} />
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              {errorMsg ? <div style={{ color: '#b00020', marginBottom: '0.5rem' }}>{errorMsg}</div> : null}
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ width: '100%' }}>{loading ? 'Processing...' : 'Generate Invoice & Complete Order'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

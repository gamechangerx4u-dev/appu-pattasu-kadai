import React, { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';

const CartPage = ({ cartItems, updateQuantity, removeFromCart }) => {
  const [couponCode, setCouponCode] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerName, setCustomerName] = useState('');

  const subtotal = cartItems.reduce((total, item) => total + (item.ourPrice * item.quantity), 0);
  // Simple discount logic: If coupon is 'DIWALI25', 10% off
  const discount = couponCode === 'DIWALI25' ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const handleCheckout = () => {
    if (cartItems.length === 0) return alert("Your cart is empty!");

    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedEmail = customerEmail.trim();
    const trimmedAddress = customerAddress.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail || !trimmedAddress) {
      return alert('Please enter your name, phone number, email, and address before proceeding.');
    }

    if (subtotal < 3000) {
      return alert('Minimum subtotal of ₹3,000 is required to proceed.');
    }

    // Save checkout details to session and navigate to payment page
    const checkout = {
      items: cartItems,
      subtotal,
      discount,
      total,
      coupon: couponCode === 'DIWALI25' ? couponCode : '',
      customer_name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      address: trimmedAddress,
      user_id: null
    };
    sessionStorage.setItem('checkout', JSON.stringify(checkout));
    window.location.href = '/payment';
  };

  return (
    <div className="container" style={{ padding: '4rem 20px', minHeight: '80vh' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Shopping <span className="text-gradient">Cart</span></h2>
      
      {cartItems.length === 0 ? (
        <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Your cart is currently empty.</h3>
        </div>
      ) : (
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 600px' }}>
            <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between" style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'contain', background: 'var(--dark-surface)', borderRadius: '8px' }} />
                    <div>
                      <h4 style={{ fontSize: '1.1rem' }}>{item.name}</h4>
                      <div style={{ color: 'var(--primary-gold)', fontWeight: 'bold' }}>₹{item.ourPrice}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" style={{ background: 'var(--dark-surface)', padding: '0.5rem', borderRadius: '8px' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Minus size={16}/></button>
                      <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}><Plus size={16}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'rgba(230, 57, 70, 0.1)', border: 'none', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary-red)', cursor: 'pointer' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ flex: '1 1 350px' }}>
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h3>
              
              <div className="flex justify-between" style={{ marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between" style={{ marginBottom: '1rem', color: '#4ADE80' }}>
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <div className="flex justify-between" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  <span>Total</span>
                  <span className="text-gradient">₹{total.toFixed(2)}</span>
                </div>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Including GST
                </p>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Coupon Code (Try DIWALI25)" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div className="flex" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)' }}
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)' }}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)' }}
                  />
                  <textarea
                    placeholder="Delivery Address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    rows={3}
                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--dark-surface)', color: 'var(--text-main)', resize: 'vertical' }}
                  />
                </div>
              </div>
              
              <button className="btn btn-primary animate-pulse" style={{ width: '100%' }} onClick={handleCheckout}>
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;

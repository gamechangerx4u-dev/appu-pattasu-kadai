import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  site_txn: { type: String, unique: true, index: true },
  user_id: String,
  customer_name: String,
  phone: String,
  email: String,
  address: String,
  items: { type: Array, default: [] },
  subtotal: Number,
  gst: Number,
  discount: Number,
  total: Number,
  payment_method: String,
  receipt_url: String,
  pdf_url: String,
  receipt_path: String,
  pdf_path: String,
  invoice_pdf: { type: Buffer, select: false },
  invoice_pdf_filename: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

OrderSchema.pre('save', function setTxn() {
  if (!this.site_txn) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.site_txn = `CRACKERS-${y}${m}${day}-${rand}`;
  }
});

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

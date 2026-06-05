import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  category: { type: String, default: '' },
  categories: { type: [String], default: [] },
  image: { type: String, default: '' },
  our_price: { type: Number, default: 0 },
  market_price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

ProductSchema.pre('save', function () {
  if (!this.id) this.id = String(Date.now());
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

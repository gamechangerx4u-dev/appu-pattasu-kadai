import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

CategorySchema.pre('save', function () {
  if (!this.id) this.id = String(Date.now());
});

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

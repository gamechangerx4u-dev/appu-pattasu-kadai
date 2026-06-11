import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  image_url: { type: String, required: true },
  media_id: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

BannerSchema.pre('save', function setId() {
  if (!this.id) this.id = String(Date.now());
});

export const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

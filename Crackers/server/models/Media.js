import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['product-image', 'admin-qr', 'order-receipt'],
    required: true,
    index: true,
  },
  filename: { type: String, default: '' },
  content_type: { type: String, default: 'image/jpeg' },
  data: { type: Buffer, required: true, select: false },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

export const Media = mongoose.models.Media || mongoose.model('Media', MediaSchema);

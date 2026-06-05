import mongoose from 'mongoose';

const AdminAuthSchema = new mongoose.Schema({
  id: { type: String, default: 'admin_config', unique: true, index: true },
  passwordHash: { type: String, required: true },
  salt: { type: String, required: true },
}, { versionKey: false });

export const AdminAuth = mongoose.models.AdminAuth || mongoose.model('AdminAuth', AdminAuthSchema);

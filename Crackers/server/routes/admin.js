import express from 'express';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAdminToken, requireAdminAuth, validateAdminPassword, hashPassword } from '../lib/adminAuth.js';
import { AdminAuth } from '../models/AdminAuth.js';

const router = express.Router();
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(serverDir, '..', 'uploads');

router.post('/login', async (req, res) => {
  try {
    const password = String(req.body?.password || '');
    const isValid = await validateAdminPassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    return res.json({ token: createAdminToken() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/password', requireAdminAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');

    const isCurrentValid = await validateAdminPassword(currentPassword);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const { salt, hash } = hashPassword(newPassword);
    await AdminAuth.findOneAndUpdate(
      { id: 'admin_config' },
      { passwordHash: hash, salt },
      { upsert: true }
    );

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/qr', async (req, res) => {
  try {
    const relativePath = path.join('admin-qr', 'active-gpay-qr.png');
    const filePath = path.join(uploadsRoot, relativePath);
    if (!fsSync.existsSync(filePath)) {
      return res.json({ url: null });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.json({ url: `${baseUrl}/uploads/${relativePath.split(path.sep).join('/')}` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

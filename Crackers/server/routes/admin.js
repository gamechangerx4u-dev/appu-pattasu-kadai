import express from 'express';
import { createAdminToken, requireAdminAuth, validateAdminPassword, hashPassword } from '../lib/adminAuth.js';
import { AdminAuth } from '../models/AdminAuth.js';
import { buildMediaUrl, getLatestMediaByKind } from '../lib/mediaStorage.js';
import { getSiteSettings, SiteSettings } from '../models/SiteSettings.js';

const router = express.Router();

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
    const media = await getLatestMediaByKind('admin-qr');
    if (!media?._id) {
      return res.json({ url: null });
    }

    return res.json({ url: buildMediaUrl(req, String(media._id)) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/bank-details', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    return res.json({ bank_details: settings.bank_details || {} });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/bank-details', requireAdminAuth, async (req, res) => {
  try {
    const incoming = req.body?.bank_details || req.body || {};
    const bank_details = {
      account_holder: String(incoming.account_holder || '').trim(),
      bank_name: String(incoming.bank_name || '').trim(),
      account_number: String(incoming.account_number || '').trim(),
      ifsc_code: String(incoming.ifsc_code || '').trim().toUpperCase(),
      branch: String(incoming.branch || '').trim(),
    };

    const settings = await SiteSettings.findOneAndUpdate(
      { id: 'site_settings' },
      { bank_details, updated_at: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ bank_details: settings.bank_details || bank_details });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

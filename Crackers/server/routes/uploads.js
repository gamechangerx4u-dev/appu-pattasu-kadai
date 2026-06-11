import express from 'express';
import multer from 'multer';
import { verifyAdminToken } from '../lib/adminAuth.js';
import { buildMediaUrl, saveMedia } from '../lib/mediaStorage.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const hasAdminToken = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-admin-token'];
  return verifyAdminToken(token);
};

const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const kind = String(req.body?.kind || '');
    const filename = safeName(req.file.originalname || 'file');
    const contentType = req.file.mimetype || 'application/octet-stream';

    let mediaKind;
    let needsAdminAuth = false;
    let replaceExisting = false;

    switch (kind) {
      case 'product-image':
        mediaKind = 'product-image';
        needsAdminAuth = true;
        if (!allowedImageTypes.has(contentType)) {
          return res.status(400).json({ error: 'Only PNG, JPEG, JPG, or WEBP images are allowed' });
        }
        break;
      case 'admin-qr':
        mediaKind = 'admin-qr';
        needsAdminAuth = true;
        replaceExisting = true;
        if (!allowedImageTypes.has(contentType)) {
          return res.status(400).json({ error: 'Only PNG, JPEG, JPG, or WEBP images are allowed' });
        }
        break;
      case 'order-receipt':
        mediaKind = 'order-receipt';
        if (!allowedImageTypes.has(contentType)) {
          return res.status(400).json({ error: 'Only PNG, JPEG, JPG, or WEBP images are allowed' });
        }
        break;
      case 'hero-banner':
        mediaKind = 'hero-banner';
        needsAdminAuth = true;
        if (!allowedImageTypes.has(contentType)) {
          return res.status(400).json({ error: 'Only PNG, JPEG, JPG, or WEBP images are allowed' });
        }
        break;
      case 'order-pdf':
        return res.status(400).json({ error: 'PDF uploads are disabled. Save invoices through /api/orders/:id/pdf.' });
      default:
        return res.status(400).json({ error: 'Invalid upload kind' });
    }

    if (needsAdminAuth && !hasAdminToken(req)) {
      return res.status(401).json({ error: 'Admin authorization required' });
    }

    const media = await saveMedia({
      kind: mediaKind,
      buffer: req.file.buffer,
      contentType,
      filename,
      replaceExisting,
    });

    const mediaId = String(media._id);
    const url = buildMediaUrl(req, mediaId);

    return res.json({
      id: mediaId,
      url,
      path: mediaId,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

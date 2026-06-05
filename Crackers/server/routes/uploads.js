import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { verifyAdminToken } from '../lib/adminAuth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(serverDir, '..', 'uploads');

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const writeFile = async (targetPath, buffer) => {
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, buffer);
};

const buildUrl = (req, relativePath) => `${req.protocol}://${req.get('host')}/uploads/${relativePath.split(path.sep).join('/')}`;

const hasAdminToken = (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-admin-token'];
  return verifyAdminToken(token);
};

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const kind = String(req.body?.kind || '');
    const filename = safeName(req.file.originalname || 'file');

    let relativePath;
    let needsAdminAuth = false;

    switch (kind) {
      case 'product-image':
        relativePath = path.join('product-images', `${Date.now()}-${filename}`);
        needsAdminAuth = true;
        break;
      case 'admin-qr':
        relativePath = path.join('admin-qr', 'active-gpay-qr.png');
        needsAdminAuth = true;
        break;
      case 'order-receipt':
        relativePath = path.join('order-receipts', `${Date.now()}-${filename}`);
        break;
      case 'order-pdf':
        relativePath = path.join('order-pdfs', `${Date.now()}-${filename}`);
        break;
      default:
        return res.status(400).json({ error: 'Invalid upload kind' });
    }

    if (needsAdminAuth) {
      if (!hasAdminToken(req)) {
        return res.status(401).json({ error: 'Admin authorization required' });
      }
    }

    const targetPath = path.join(uploadsRoot, relativePath);
    await writeFile(targetPath, req.file.buffer);

    return res.json({
      url: buildUrl(req, relativePath),
      path: relativePath,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import { getMediaById, toMediaBuffer } from '../lib/mediaStorage.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const media = await getMediaById(req.params.id);
    if (!media?.data) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const buffer = toMediaBuffer(media.data);
    res.setHeader('Content-Type', media.content_type || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    if (media.filename) {
      res.setHeader('Content-Disposition', `inline; filename="${media.filename}"`);
    }
    res.send(buffer);
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

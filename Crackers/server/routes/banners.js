import express from 'express';
import { Banner } from '../models/Banner.js';
import { requireAdminAuth } from '../lib/adminAuth.js';

const router = express.Router();

const serializeBanner = (banner) => ({
  ...banner,
  id: banner.id || String(banner._id),
});

router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({ active: true })
      .sort({ order: 1, created_at: 1 })
      .lean();
    res.json(banners.map(serializeBanner));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', requireAdminAuth, async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, created_at: 1 })
      .lean();
    res.json(banners.map(serializeBanner));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const count = await Banner.countDocuments();
    const banner = await Banner.create({
      image_url: req.body.image_url || '',
      media_id: req.body.media_id || '',
      order: Number(req.body.order ?? count),
      active: req.body.active !== false,
    });
    res.status(201).json(serializeBanner(banner.toObject()));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/reorder', requireAdminAuth, async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
    if (!ids.length) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    await Promise.all(
      ids.map((id, index) => Banner.findOneAndUpdate({ id }, { order: index }))
    );

    const banners = await Banner.find().sort({ order: 1, created_at: 1 }).lean();
    res.json(banners.map(serializeBanner));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id', requireAdminAuth, async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.active === 'boolean') updates.active = req.body.active;
    if (req.body.order !== undefined) updates.order = Number(req.body.order);

    const banner = await Banner.findOneAndUpdate(
      { id: String(req.params.id) },
      updates,
      { new: true }
    ).lean();

    if (!banner) return res.status(404).json({ error: 'Banner not found' });
    res.json(serializeBanner(banner));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await Banner.findOneAndDelete({ id: String(req.params.id) }).lean();
    if (!deleted) return res.status(404).json({ error: 'Banner not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

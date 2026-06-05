import express from 'express';
import { Category } from '../models/Category.js';
import { requireAdminAuth } from '../lib/adminAuth.js';

const router = express.Router();

const serializeCategory = (category) => ({
  ...category,
  id: category.id || String(category._id),
});

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    res.json(categories.map(serializeCategory));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await Category.create({ name });
    res.status(201).json(serializeCategory(category.toObject()));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/reorder', requireAdminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }

    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { id: String(id) },
        update: { $set: { order: index } }
      }
    }));

    await Category.bulkWrite(bulkOps);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ id: String(req.params.id) }).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

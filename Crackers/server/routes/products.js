import express from 'express';
import { Product } from '../models/Product.js';
import { requireAdminAuth } from '../lib/adminAuth.js';

const router = express.Router();

const normalizeProductBody = (body = {}) => {
  let categories = [];
  if (Array.isArray(body.categories)) {
    categories = body.categories.map(String).filter(Boolean);
  } else if (body.category) {
    categories = [String(body.category)];
  }

  return {
    id: body.id ? String(body.id) : undefined,
    name: body.name || '',
    category: categories[0] || '',
    categories,
    image: body.image || '',
    our_price: Number(body.our_price ?? body.ourPrice ?? 0),
    market_price: Number(body.market_price ?? body.marketPrice ?? 0),
    stock: Number(body.stock ?? 0),
  };
};

const serializeProduct = (product) => ({
  ...product,
  id: product.id || String(product._id),
});

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: 1 }).lean();
    res.json(products.map(serializeProduct));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAdminAuth, async (req, res) => {
  try {
    const product = await Product.create(normalizeProductBody(req.body));
    res.status(201).json(serializeProduct(product.toObject()));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAdminAuth, async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { id: String(req.params.id) },
      normalizeProductBody(req.body),
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(serializeProduct(updated));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: String(req.params.id) }).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { requireAdminAuth } from '../lib/adminAuth.js';
import { sendOrderEmail } from '../lib/email.js';

const router = express.Router();

const serializeOrder = (order) => ({
  ...order,
  id: order.id || String(order._id),
});

router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];

    // Verify stock and update in a loop (inside the transaction session)
    for (const item of items) {
      const productId = item.id;
      const quantity = Number(item.quantity || 1);
      if (!productId) continue;

      // Fetch product within transaction session
      const product = await Product.findOne({ id: String(productId) }).session(session);
      if (!product) {
        throw new Error(`Product with ID "${productId}" not found.`);
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${quantity}.`);
      }

      // Decrement stock
      product.stock -= quantity;
      await product.save({ session });
    }

    // Create the order inside the session
    const order = await Order.create([{
      user_id: req.body.user_id || null,
      customer_name: req.body.customer_name || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      items,
      subtotal: Number(req.body.subtotal || 0),
      gst: Number(req.body.gst || 0),
      discount: Number(req.body.discount || 0),
      total: Number(req.body.total || 0),
      payment_method: req.body.payment_method || '',
      receipt_url: req.body.receipt_url || '',
      pdf_url: req.body.pdf_url || '',
      receipt_path: req.body.receipt_path || '',
      pdf_path: req.body.pdf_path || '',
      status: req.body.status || 'pending',
      site_txn: req.body.site_txn,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const createdOrder = order[0].toObject();

    // Send order email asynchronously in the background
    void sendOrderEmail(createdOrder);

    res.status(201).json(serializeOrder(createdOrder));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating order within transaction:', error);
    res.status(400).json({ error: error.message });
  }
});

router.get('/', requireAdminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 }).lean();
    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Public: attach pdf_url/pdf_path to an existing order (used after client uploads PDF)
router.patch('/:id/pdf', async (req, res) => {
  try {
    const { pdf_url, pdf_path } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { pdf_url: pdf_url || '', pdf_path: pdf_path || '' }, { new: true }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error attaching pdf to order:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

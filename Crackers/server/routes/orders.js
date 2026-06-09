import express from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { requireAdminAuth } from '../lib/adminAuth.js';
import { sendOrderEmail } from '../lib/email.js';
import { decrementProductStock } from '../lib/productLookup.js';

const router = express.Router();

const serializeOrder = (order) => ({
  ...order,
  id: order.id || String(order._id),
});

const normalizeOrderItems = (items = []) => {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('Order must include at least one item.');
  }

  return items.map((item, index) => {
    const productId = item?.id ?? item?._id ?? item?.productId;
    if (!productId) {
      throw new Error(`Order item at index ${index} is missing a product id.`);
    }

    return {
      ...item,
      id: String(productId),
      quantity: Number(item.quantity || 1),
    };
  });
};

const createOrderWithStockUpdate = async (orderPayload) => {
  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const items = normalizeOrderItems(orderPayload.items);

      for (const item of items) {
        await decrementProductStock(item.id, item.quantity, session);
      }

      const [order] = await Order.create([{
        ...orderPayload,
        items,
      }], { session });

      createdOrder = order.toObject();
    });

    return createdOrder;
  } finally {
    await session.endSession();
  }
};

router.post('/', async (req, res) => {
  try {
    const orderPayload = {
      user_id: req.body.user_id || null,
      customer_name: req.body.customer_name || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      address: req.body.address || '',
      items: req.body.items,
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
    };

    const createdOrder = await createOrderWithStockUpdate(orderPayload);

    void sendOrderEmail(createdOrder, { includePdf: Boolean(createdOrder.pdf_url) });

    res.status(201).json(serializeOrder(createdOrder));
  } catch (error) {
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

router.patch('/:id/pdf', async (req, res) => {
  try {
    const { pdf_url, pdf_path } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { pdf_url: pdf_url || '', pdf_path: pdf_path || '' },
      { new: true }
    ).lean();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    void sendOrderEmail(order, { includePdf: true, resend: true });

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Error attaching pdf to order:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { requireAdminAuth } from '../lib/adminAuth.js';
import { sendOrderEmail } from '../lib/email.js';
import { decrementProductStock } from '../lib/productLookup.js';
import { buildOrderPdfUrl } from '../lib/publicUrl.js';

const router = express.Router();

const serializeOrder = (order) => {
  const { invoice_pdf, ...safeOrder } = order;
  return {
    ...safeOrder,
    id: safeOrder.id || String(safeOrder._id),
  };
};

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
      payment_details: {
        utr_reference: String(req.body.payment_details?.utr_reference || req.body.utr_reference || '').trim(),
        customer_bank: String(req.body.payment_details?.customer_bank || req.body.customer_bank || '').trim(),
        payer_name: String(req.body.payment_details?.payer_name || req.body.payer_name || '').trim(),
      },
      receipt_url: req.body.receipt_url || '',
      pdf_url: req.body.pdf_url || '',
      receipt_path: req.body.receipt_path || '',
      pdf_path: req.body.pdf_path || '',
      status: req.body.status || 'pending',
      site_txn: req.body.site_txn,
    };

    const createdOrder = await createOrderWithStockUpdate(orderPayload);

    try {
      await sendOrderEmail(createdOrder);
    } catch (emailError) {
      console.error('Order created but email failed:', emailError);
    }

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

router.get('/:id/pdf', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('invoice_pdf invoice_pdf_filename site_txn')
      .lean();

    if (!order?.invoice_pdf) {
      return res.status(404).json({ error: 'Invoice PDF not found' });
    }

    const filename = order.invoice_pdf_filename || `invoice-${order.site_txn || 'order'}.pdf`;
    const pdfBuffer = Buffer.isBuffer(order.invoice_pdf)
      ? order.invoice_pdf
      : Buffer.from(order.invoice_pdf.buffer || order.invoice_pdf);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error fetching order PDF:', error);
    res.status(400).json({ error: error.message });
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
    const { pdf_base64, pdf_filename } = req.body;
    if (!pdf_base64) {
      return res.status(400).json({ error: 'pdf_base64 is required' });
    }

    const pdfBuffer = Buffer.from(pdf_base64, 'base64');
    if (!pdfBuffer.length) {
      return res.status(400).json({ error: 'Invalid PDF payload' });
    }

    const existing = await Order.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const filename = pdf_filename || `invoice-${existing.site_txn || 'order'}.pdf`;
    const pdfUrl = buildOrderPdfUrl(req, req.params.id);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        invoice_pdf: pdfBuffer,
        invoice_pdf_filename: filename,
        pdf_url: pdfUrl,
        pdf_path: '',
      },
      { new: true }
    ).lean();

    try {
      await sendOrderEmail(order, {
        includePdf: true,
        resend: true,
        pdfBuffer,
        pdfFilename: filename,
      });
    } catch (emailError) {
      console.error('PDF saved but email failed:', emailError);
    }

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Error attaching pdf to order:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;

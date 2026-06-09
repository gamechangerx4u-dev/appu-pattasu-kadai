import mongoose from 'mongoose';
import { Product } from '../models/Product.js';

export async function findProductByIdentifier(productId, session) {
  const id = String(productId || '').trim();
  if (!id) return null;

  const query = Product.findOne({
    $or: [
      { id },
      ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
    ],
  });

  if (session) query.session(session);
  return query;
}

export async function ensureProductIds() {
  const missing = await Product.find({
    $or: [{ id: { $exists: false } }, { id: null }, { id: '' }],
  }).select('_id');

  if (!missing.length) return 0;

  await Promise.all(
    missing.map((product) =>
      Product.updateOne({ _id: product._id }, { $set: { id: String(product._id) } })
    )
  );

  console.log(`Backfilled product id for ${missing.length} product(s)`);
  return missing.length;
}

export async function decrementProductStock(productId, quantity, session) {
  const product = await findProductByIdentifier(productId, session);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found.`);
  }

  const qty = Number(quantity || 1);
  if (qty < 1) {
    throw new Error(`Invalid quantity for product "${product.name}".`);
  }

  const updated = await Product.findOneAndUpdate(
    { _id: product._id, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true, session }
  );

  if (!updated) {
    throw new Error(
      `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${qty}.`
    );
  }

  return updated;
}

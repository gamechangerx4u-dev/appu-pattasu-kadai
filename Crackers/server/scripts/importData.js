import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { connectMongoose } from '../lib/mongoose.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

dotenv.config();

async function importData() {
  try {
    await connectMongoose();

    const file = path.resolve(process.cwd(), 'src/data/db.json');

    if (!fs.existsSync(file)) {
      console.log('Import skipped: src/data/db.json not found.');
      process.exit(0);
    }

    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);

    const products = (data.products || []).map((product) => ({
      id: String(product.id),
      name: product.name,
      category: product.category,
      image: product.image || '',
      market_price: Number(product.marketPrice || product.market_price || 0),
      our_price: Number(product.ourPrice || product.our_price || 0),
      stock: Number(product.stock || 0),
    }));

    const categories = Array.from(new Set([
      ...(data.categories || []).map((category) => String(category).trim()).filter(Boolean),
      ...products.map((product) => product.category).filter(Boolean),
    ])).map((name, index) => ({
      id: String(1000 + index),
      name,
    }));

    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
    ]);

    if (categories.length) {
      await Category.insertMany(categories);
    }

    if (products.length) {
      await Product.insertMany(products);
    }

    console.log(`Imported ${products.length} products and ${categories.length} categories`);
    process.exit(0);
  } catch (err) {
    console.error('Import failed', err);
    process.exit(1);
  }
}

importData();

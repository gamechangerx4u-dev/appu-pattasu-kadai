import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMongoose } from './lib/mongoose.js';
import adminRouter from './routes/admin.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import ordersRouter from './routes/orders.js';
import uploadsRouter from './routes/uploads.js';
import { seedAdminPassword } from './lib/adminAuth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(serverDir, 'uploads');

app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/admin', adminRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/uploads', uploadsRouter);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectMongoose();
    await seedAdminPassword();
    app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();

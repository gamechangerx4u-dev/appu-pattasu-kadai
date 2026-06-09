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
import { validateEnv, getAllowedOrigins } from './lib/env.js';
import { ensureProductIds } from './lib/productLookup.js';
import { verifyEmailTransport } from './lib/email.js';

dotenv.config();
validateEnv();

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(serverDir, 'uploads');

app.use('/uploads', express.static(uploadsRoot));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    smtp: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    env: process.env.NODE_ENV || 'development',
  });
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
    await ensureProductIds();
    await seedAdminPassword();
    await verifyEmailTransport();
    app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
})();

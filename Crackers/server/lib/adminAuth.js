import crypto from 'crypto';
import { AdminAuth } from '../models/AdminAuth.js';

const getAdminSecret = () => process.env.ADMIN_TOKEN_SECRET || 'crackers-admin-secret';

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
};

export const verifyPassword = (password, salt, hash) => {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

export const createAdminToken = () => {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = JSON.stringify({ exp });
  const signature = crypto.createHmac('sha256', getAdminSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
};

export const verifyAdminToken = (token) => {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const separatorIndex = decoded.lastIndexOf('.');
    if (separatorIndex <= 0) return false;

    const payload = decoded.slice(0, separatorIndex);
    const signature = decoded.slice(separatorIndex + 1);
    const expectedSignature = crypto.createHmac('sha256', getAdminSecret()).update(payload).digest('hex');
    if (signature !== expectedSignature) return false;

    const parsed = JSON.parse(payload);
    return typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
};

export const requireAdminAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.headers['x-admin-token'];

  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Admin authorization required' });
  }

  return next();
};

export const validateAdminPassword = async (password) => {
  try {
    const auth = await AdminAuth.findOne({ id: 'admin_config' });
    if (!auth) return false;
    return verifyPassword(password, auth.salt, auth.passwordHash);
  } catch (err) {
    console.error('validateAdminPassword error:', err);
    return false;
  }
};

export const seedAdminPassword = async () => {
  try {
    const count = await AdminAuth.countDocuments({ id: 'admin_config' });
    if (count === 0) {
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const { salt, hash } = hashPassword(defaultPassword);
      await AdminAuth.create({
        id: 'admin_config',
        passwordHash: hash,
        salt
      });
      console.log('Admin password seeded successfully into database.');
    }
  } catch (err) {
    console.error('Error seeding admin password:', err);
  }
};

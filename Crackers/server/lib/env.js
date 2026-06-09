const requiredInProduction = ['MONGODB_URI', 'ADMIN_TOKEN_SECRET'];

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = requiredInProduction.filter((key) => !process.env[key]);

  if (isProduction && missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP is not configured — order emails will not be sent.');
  }

  if (isProduction && !process.env.ALLOWED_ORIGINS) {
    console.warn('ALLOWED_ORIGINS is not set — CORS will allow all origins.');
  }
}

export function getAllowedOrigins() {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length) return configured;

  return ['http://localhost:5173', 'http://localhost:4000', 'http://127.0.0.1:5173'];
}

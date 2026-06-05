import dotenv from 'dotenv';
import { connectMongoose } from './lib/mongoose.js';

dotenv.config();

(async () => {
  try {
    await connectMongoose();
    console.log('Test connection successful');
    process.exit(0);
  } catch (err) {
    console.error('Test connection failed', err);
    process.exit(1);
  }
})();

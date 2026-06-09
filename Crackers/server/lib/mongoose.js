import mongoose from 'mongoose';

export async function connectMongoose() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (mongoose.connection.readyState === 1) return mongoose;

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Mongoose connected');
    return mongoose;
  } catch (err) {
    console.error('Mongoose connection error:', err);
    throw err;
  }
}

export default mongoose;

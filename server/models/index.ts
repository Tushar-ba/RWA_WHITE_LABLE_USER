import mongoose from 'mongoose';

// Connect to MongoDB
export async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      dbName: 'vaulted_assets'
    });

    console.log('✅ Connected to MongoDB with Mongoose');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export default mongoose;
import { EnhancedMongoStorage } from './enhanced-mongo.storage';


// Create storage instance - Use Enhanced MongoDB with all required methods
function createStorage(): EnhancedMongoStorage {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  console.log('🚀 Using Enhanced MongoDB storage with populate-like functionality');
  return new EnhancedMongoStorage();
}

// Create storage with async connection
async function createStorageWithFallback(): Promise<EnhancedMongoStorage> {
  const storage = createStorage();
  await storage.connect();
  return storage;
}

// Export a promise that resolves to the storage instance
export const storagePromise = createStorageWithFallback();

// For backward compatibility, export a storage getter
export let storage: EnhancedMongoStorage;

// Initialize storage instance immediately
storagePromise.then((storageInstance) => {
  storage = storageInstance;
  console.log('✅ Storage instance initialized and ready');
}).catch((error) => {
  console.error('❌ Failed to initialize storage instance:', error);
});
export { MongoStorage } from './mongo.storage.js';
export { MongooseStorage } from './mongoose.storage';
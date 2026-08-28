import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas. Shared by the API server, the worker, and the seed
 * script. Uses a single connection per process; mongoose buffers ops until it
 * resolves. Throws (fatal) if MONGODB_URI is missing — nothing works without it.
 */
export async function connectMongo(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set — copy .env.example to .env and fill it in.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  const { name, host } = mongoose.connection;
  console.log(`[mongo] connected to ${host}/${name}`);
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

import mongoose from 'mongoose';

// Cache the connection promise across invocations. On Vercel each serverless
// function may reuse a warm container, so we must not reconnect every request.
let cached = global.__mongoConn;
if (!cached) cached = global.__mongoConn = { promise: null };

/**
 * Connect to MongoDB Atlas (idempotent). Safe to call on every request — it
 * reuses the existing connection when one is already open/connecting.
 */
export async function connectMongo(uri = process.env.MONGODB_URI) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!uri) {
    throw new Error('MONGODB_URI is not set — copy .env.example to .env and fill it in.');
  }
  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then((m) => {
        console.log(`[mongo] connected to ${m.connection.host}/${m.connection.name}`);
        return m.connection;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on next request
        throw err;
      });
  }
  return cached.promise;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
  cached.promise = null;
}

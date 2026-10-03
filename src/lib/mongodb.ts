import mongoose, { type Mongoose } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

let memoryServer: MongoMemoryServer | null = null;

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function getMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }

  return memoryServer.getUri();
}

async function connectToDatabase() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = await getMongoUri();

    cached = globalWithMongoose.mongoose = {
      conn: null,
      promise: mongoose.connect(mongoUri, opts).then((mongooseInstance) => mongooseInstance),
    };
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;

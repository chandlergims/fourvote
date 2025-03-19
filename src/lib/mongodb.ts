import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://link:JkGebcKbho5TvUu6@cluster0.hxfim.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// Define the type for our cached mongoose connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnecting: boolean;
  lastReconnectAttempt: number;
}

// Define the global type with mongoose property
declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { 
  conn: null, 
  promise: null,
  isConnecting: false,
  lastReconnectAttempt: 0
};

if (!global.mongoose) {
  global.mongoose = cached;
}

// Configure mongoose for better performance under high load
mongoose.set('bufferCommands', false); // Disable command buffering
mongoose.set('autoIndex', false); // Disable automatic index creation in production

// Connection options optimized for high traffic
const connectionOptions = {
  bufferCommands: false,
  maxPoolSize: 100, // Increase connection pool size
  minPoolSize: 10, // Maintain minimum connections
  socketTimeoutMS: 45000, // Socket timeout
  connectTimeoutMS: 30000, // Connection timeout
  serverSelectionTimeoutMS: 30000, // Server selection timeout
  heartbeatFrequencyMS: 10000, // Heartbeat frequency
  retryWrites: true,
  retryReads: true,
};

// Reconnection logic with exponential backoff
async function reconnect() {
  const now = Date.now();
  const RECONNECT_INTERVAL = 5000; // 5 seconds minimum between reconnection attempts
  
  if (cached.isConnecting || (now - cached.lastReconnectAttempt < RECONNECT_INTERVAL)) {
    return cached.promise;
  }
  
  cached.isConnecting = true;
  cached.lastReconnectAttempt = now;
  
  console.log('Attempting to reconnect to MongoDB...');
  
  try {
    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions).then((mongoose) => {
      console.log('Successfully reconnected to MongoDB');
      return mongoose;
    });
    
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to reconnect to MongoDB:', error);
    throw error;
  } finally {
    cached.isConnecting = false;
  }
}

// Add event listeners for connection issues
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Will attempt to reconnect...');
  cached.conn = null;
  cached.promise = null;
});

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, connectionOptions).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  } else if (!mongoose.connection.readyState) {
    // If we have a promise but connection is closed, reconnect
    return reconnect();
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Clear the failed connection attempt
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

export default dbConnect;

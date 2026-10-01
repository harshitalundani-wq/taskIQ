import mongoose from 'mongoose';
import dns from 'dns';

// Ensure SRV DNS records resolve reliably across Windows / ISP network environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Use default system DNS if restricted
}

// Connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  console.log('MongoDB Event: Connection established successfully');
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB Event: Connection to database lost');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB Event Error: ${err.message}`);
});

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set in environment variables.');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

export default connectDB;

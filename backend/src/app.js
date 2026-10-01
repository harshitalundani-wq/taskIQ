import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { verifyEmailConfig } from './utils/email.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Database readiness check middleware
app.use((req, res, next) => {
  if (req.path === '/') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database service unavailable. Please check database connection.',
    });
  }
  next();
});

// Base & Health Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Event Manager API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Event Manager API is running',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server ONLY after MongoDB connection succeeds
const startServer = async () => {
  try {
    // 1. Fully connect to MongoDB first
    await connectDB();

    // 2. Perform test database query to confirm reachability
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`MongoDB Verification Query: Database is reachable (${collections.length} collections detected)`);

    // 3. Verify Email configuration
    await verifyEmailConfig();

    // 4. Start listening for incoming HTTP requests
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;

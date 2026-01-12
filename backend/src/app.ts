import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import groupRoutes from './routes/groups';
import invitationRoutes from './routes/invitations';
import foodItemRoutes from './routes/foodItems';
import analyticsRoutes from './routes/analytics';
import categoryRoutes from './routes/categories';
import locationRoutes from './routes/locations';
import shoppingRoutes from './routes/shopping';
import wishRoutes from './routes/wish';
import uploadRoutes from './routes/upload';

// Load environment variables
dotenv.config();

// Create Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.WEB_APP_URL || 'https://expiry-alert.link']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006'],
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (for uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((_req, _res, next) => {
    next();
  });
}

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/shopping-items', shoppingRoutes);
app.use('/api/wish-items', wishRoutes);
app.use('/api/upload', uploadRoutes);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

export default app;


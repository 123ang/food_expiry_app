import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.WEB_APP_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS configuration. Mobile apps usually send no Origin; browsers must match the allowlist.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, !isProduction);
    }

    const developmentOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006'];
    const effectiveOrigins = isProduction ? allowedOrigins : [...developmentOrigins, ...allowedOrigins];

    if (effectiveOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (!isProduction && (origin.startsWith('exp://') || origin.startsWith('expiryalert://'))) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: false,
}));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 300 : 3000,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 25 : 250,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);

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
  });
});

// Password reset web page (linked from email)
app.get('/reset-password', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled rejection:', err.name, err.message);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught exception:', err.name, err.message);
});

export default app;

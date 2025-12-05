import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import assetRoutes from './routes/asset.routes';
import importRoutes from './routes/import.routes';
import adminRoutes from './routes/admin.routes';
import { UPLOAD_ROOT } from './lib/upload';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from './middleware/auth.middleware';
import { getDashboard } from './controllers/dashboard.controller';

const app = express();

// Basic rate limiting for auth + uploads
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.UPLOAD_RATE_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT));

// Debug Middleware
app.use((req, res, next) => {
  console.log(`📥 Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/import', uploadLimiter, importRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/dashboard', authenticateToken, getDashboard);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;

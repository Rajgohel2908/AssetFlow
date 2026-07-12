import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routes
import authRoutes from './routes/auth.routes.js';
import departmentRoutes from './routes/department.routes.js';
import assetCategoryRoutes from './routes/assetCategory.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import assetRoutes from './routes/asset.routes.js';
import allocationRoutes from './routes/allocation.routes.js';
import transferRequestRoutes from './routes/transferRequest.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityLogRoutes from './routes/activityLog.routes.js';

const app = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
    credentials: true, // Required for httpOnly refresh token cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AssetFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

const API = '/api';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/departments`, departmentRoutes);
app.use(`${API}/asset-categories`, assetCategoryRoutes);
app.use(`${API}/employees`, employeeRoutes);
app.use(`${API}/assets`, assetRoutes);
app.use(`${API}/allocations`, allocationRoutes);
app.use(`${API}/transfer-requests`, transferRequestRoutes);
app.use(`${API}/resources`, resourceRoutes);
app.use(`${API}/bookings`, bookingRoutes);
app.use(`${API}/maintenance-requests`, maintenanceRoutes);
app.use(`${API}/audit-cycles`, auditRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/activity-logs`, activityLogRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') ?? 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  // Custom ApiError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors?.length ? { errors: err.errors } : {}),
    });
  }

  // Custom status code from assertTransition
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Unhandled errors — don't leak stack traces in production
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

export default app;

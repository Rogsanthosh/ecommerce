require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const { swaggerSpec } = require('./config/swagger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { mainGuard, honeypot404 } = require('./middleware/security');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CLOUDFLARE-STYLE GUARD (first line of defence) ─────────────────────────
app.use(mainGuard);

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // allow swagger UI
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── PERFORMANCE MIDDLEWARE ───────────────────────────────────────────────────
// Compress responses (gzip) - reduces bandwidth by ~70%
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6,
}));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // strict for login
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── LOGGING ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── PERFORMANCE HEADERS ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Powered-By', 'ShopZone API');
  next();
});

// ─── UPTIME ROBOT PING ──────────────────────────────────────────────────────────
app.get('/ping', (req, res) => res.send('pong'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// ─── API DOCS (Swagger) ───────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ShopZone API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
  },
}));

// Swagger JSON spec endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'ShopZone eCommerce API',
    version: '1.0.0',
    docs: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      admin: '/api/admin',
      health: '/health',
    },
  });
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(honeypot404); // track 404 frequency per IP (scanner detection)
app.use(errorHandler);

// ─── START SERVER ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║       🛍️  ShopZone API Server          ║
╠════════════════════════════════════════╣
║  Status  : Running                     ║
║  Port    : ${PORT}                         ║
║  Mode    : ${process.env.NODE_ENV || 'development'}              ║
║  Docs    : http://localhost:${PORT}/api/docs║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;

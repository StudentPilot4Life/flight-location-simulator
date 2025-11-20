/**
 * Server Entry Point
 *
 * Express server that provides REST API for controlling GPS data broadcasting
 */

import express from 'express';
import cors from 'cors';
import gpsRoutes from './routes/gps.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/gps', gpsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message,
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log('=====================================');
  console.log('Flight Location Simulator Server');
  console.log('=====================================');
  console.log(`REST API listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /api/gps/status    - Get server status');
  console.log('  POST /api/gps/start     - Start GPS broadcasting');
  console.log('  POST /api/gps/stop      - Stop GPS broadcasting');
  console.log('  POST /api/gps/position  - Update position');
  console.log('  PUT  /api/gps/config    - Update configuration');
  console.log('=====================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

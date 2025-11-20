/**
 * GPS API Routes
 *
 * REST API endpoints for controlling the GPS data server
 */

import express from 'express';
import { getGPSServerInstance } from '../services/GPSDataServer.js';
import { GPSPosition } from '../../src/types/gps.js';

const router = express.Router();

/**
 * GET /api/gps/status
 * Get the current server status
 */
router.get('/status', (req, res) => {
  const server = getGPSServerInstance();
  res.json({
    isRunning: server.getIsRunning(),
    config: server.getConfig(),
    currentPosition: server.getCurrentPosition(),
  });
});

/**
 * POST /api/gps/start
 * Start the GPS data server
 */
router.post('/start', async (req, res) => {
  const server = getGPSServerInstance();

  if (server.getIsRunning()) {
    return res.status(400).json({ error: 'Server is already running' });
  }

  try {
    await server.start();
    res.json({
      message: 'GPS server started successfully',
      config: server.getConfig(),
    });
  } catch (error) {
    console.error('Failed to start GPS server:', error);
    res.status(500).json({
      error: 'Failed to start GPS server',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/gps/stop
 * Stop the GPS data server
 */
router.post('/stop', (req, res) => {
  const server = getGPSServerInstance();

  if (!server.getIsRunning()) {
    return res.status(400).json({ error: 'Server is not running' });
  }

  server.stop();
  res.json({ message: 'GPS server stopped successfully' });
});

/**
 * POST /api/gps/position
 * Update the current GPS position
 */
router.post('/position', (req, res) => {
  const server = getGPSServerInstance();

  if (!server.getIsRunning()) {
    return res.status(400).json({
      error: 'Server is not running. Start the server first.',
    });
  }

  const position: GPSPosition = req.body;

  // Validate required fields
  if (
    typeof position.latitude !== 'number' ||
    typeof position.longitude !== 'number' ||
    typeof position.altitude !== 'number' ||
    typeof position.heading !== 'number' ||
    typeof position.groundSpeed !== 'number'
  ) {
    return res.status(400).json({
      error: 'Invalid position data',
      details:
        'Required fields: latitude, longitude, altitude, heading, groundSpeed',
    });
  }

  // Validate ranges
  if (position.latitude < -90 || position.latitude > 90) {
    return res
      .status(400)
      .json({ error: 'Latitude must be between -90 and 90' });
  }

  if (position.longitude < -180 || position.longitude > 180) {
    return res
      .status(400)
      .json({ error: 'Longitude must be between -180 and 180' });
  }

  if (position.heading < 0 || position.heading >= 360) {
    return res
      .status(400)
      .json({ error: 'Heading must be between 0 and 359' });
  }

  // Set default values for optional fields
  const completePosition: GPSPosition = {
    ...position,
    verticalSpeed: position.verticalSpeed ?? 0,
    timestamp: Date.now(),
  };

  server.updatePosition(completePosition);

  res.json({
    message: 'Position updated successfully',
    position: completePosition,
  });
});

/**
 * PUT /api/gps/config
 * Update server configuration
 */
router.put('/config', (req, res) => {
  const server = getGPSServerInstance();
  console.log('Received config update request:', req.body); // Debug log
  const { port, targetIP, updateRate } = req.body;

  const updates: any = {};
  console.log('Extracted values - port:', port, 'targetIP:', targetIP, 'updateRate:', updateRate); // Debug log

  if (port !== undefined) {
    if (typeof port !== 'number' || port < 1 || port > 65535) {
      return res
        .status(400)
        .json({ error: 'Port must be a number between 1 and 65535' });
    }
    updates.port = port;
  }

  if (targetIP !== undefined) {
    console.log('Processing targetIP:', targetIP, 'type:', typeof targetIP); // Debug log
    if (typeof targetIP !== 'string') {
      console.log('Target IP is not a string!'); // Debug log
      return res.status(400).json({ error: 'Target IP must be a string' });
    }
    // Basic IP validation (allow empty string to clear)
    if (targetIP.length > 0) {
      const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipPattern.test(targetIP)) {
        console.log('Target IP failed regex validation'); // Debug log
        return res.status(400).json({ error: 'Invalid IP address format. Expected format: 192.168.1.100' });
      }
    }
    console.log('Adding targetIP to updates:', targetIP); // Debug log
    updates.targetIP = targetIP;
  }

  if (updateRate !== undefined) {
    if (typeof updateRate !== 'number' || updateRate < 1 || updateRate > 10) {
      return res
        .status(400)
        .json({ error: 'Update rate must be between 1 and 10 Hz' });
    }
    updates.updateRate = updateRate;
  }

  console.log('Final updates object:', updates, 'keys:', Object.keys(updates)); // Debug log
  if (Object.keys(updates).length === 0) {
    console.log('ERROR: No updates in object, returning error'); // Debug log
    return res.status(400).json({ error: 'No valid configuration provided' });
  }

  if (server.getIsRunning() && updates.port !== undefined) {
    return res.status(400).json({
      error: 'Cannot change port while server is running. Stop the server first.',
    });
  }

  server.updateConfig(updates);

  res.json({
    message: 'Configuration updated successfully',
    config: server.getConfig(),
  });
});

export default router;

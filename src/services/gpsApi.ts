/**
 * GPS API Service
 *
 * Client-side service for communicating with the GPS data server API
 */

import { GPSPosition } from '../types/gps';

const API_BASE_URL = 'http://localhost:5001/api/gps';

export interface ServerStatus {
  isRunning: boolean;
  config: {
    port: number;
    targetIP: string;
    updateRate: number;
  };
  currentPosition: GPSPosition | null;
}

export interface ServerConfig {
  port?: number;
  targetIP?: string;
  updateRate?: number;
}

/**
 * Get the current server status
 */
export async function getServerStatus(): Promise<ServerStatus> {
  const response = await fetch(`${API_BASE_URL}/status`);
  if (!response.ok) {
    throw new Error('Failed to get server status');
  }
  return response.json();
}

/**
 * Start the GPS data server
 */
export async function startServer(initialPosition?: GPSPosition): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ position: initialPosition }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start server');
  }
}

/**
 * Stop the GPS data server
 */
export async function stopServer(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/stop`, {
    method: 'POST',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop server');
  }
}

/**
 * Update the current GPS position
 */
export async function updatePosition(position: GPSPosition): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/position`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(position),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update position');
  }
}

/**
 * Update server configuration
 */
export async function updateConfig(config: ServerConfig): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update configuration');
  }
}

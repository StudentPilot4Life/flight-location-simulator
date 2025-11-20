/**
 * GPS Data Server
 *
 * Broadcasts GPS position data using the GDL 90 protocol over UDP.
 * This allows EFBs like ForeFlight to receive simulated position data.
 */

import dgram from 'dgram';
import { GPSPosition } from '../../src/types/gps.js';
import {
  createHeartbeatMessage,
  createOwnshipReport,
  createGeometricAltitude,
} from '../utils/gdl90Encoder.js';

export interface GPSServerConfig {
  port: number;
  targetIP: string; // Direct IP address to send to (e.g., ForeFlight device)
  updateRate: number; // Updates per second (1-10 Hz)
}

export class GPSDataServer {
  private socket: dgram.Socket | null = null;
  private config: GPSServerConfig;
  private isRunning = false;
  private currentPosition: GPSPosition | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private positionInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<GPSServerConfig> = {}) {
    this.config = {
      port: config.port ?? 4000,
      targetIP: config.targetIP ?? '',
      updateRate: config.updateRate ?? 1, // 1 Hz default
    };
  }

  /**
   * Start the GPS data server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('GPS server is already running');
    }

    if (!this.config.targetIP) {
      throw new Error('Target IP address is required. Please set the ForeFlight device IP.');
    }

    return new Promise((resolve, reject) => {
      this.socket = dgram.createSocket('udp4');

      this.socket.on('error', (err) => {
        console.error('GPS server error:', err);
        this.stop();
        reject(err);
      });

      this.socket.bind(() => {
        if (!this.socket) return;

        try {
          this.isRunning = true;

          console.log('\nGPS Data Server Configuration:');
          console.log(`  Target IP: ${this.config.targetIP}`);
          console.log(`  Target Port: ${this.config.port}`);
          console.log(`  Update rate: ${this.config.updateRate} Hz`);
          console.log('\nSending GDL 90 data directly to ForeFlight device.\n');

          // Send heartbeat every second (as per GDL 90 spec)
          this.startHeartbeat();

          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Stop the GPS data server
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isRunning = false;
    console.log('GPS Data Server stopped');
  }

  /**
   * Update the current position
   */
  updatePosition(position: GPSPosition): void {
    this.currentPosition = position;

    // If not already broadcasting position updates, start
    if (this.isRunning && !this.positionInterval) {
      this.startPositionBroadcast();
    }
  }

  /**
   * Get the current position
   */
  getCurrentPosition(): GPSPosition | null {
    return this.currentPosition;
  }

  /**
   * Check if server is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get server configuration
   */
  getConfig(): GPSServerConfig {
    return { ...this.config };
  }

  /**
   * Update server configuration
   */
  updateConfig(config: Partial<GPSServerConfig>): void {
    const oldUpdateRate = this.config.updateRate;
    this.config = { ...this.config, ...config };

    // If update rate changed and we're broadcasting, restart position updates
    if (
      this.isRunning &&
      this.positionInterval &&
      oldUpdateRate !== this.config.updateRate
    ) {
      clearInterval(this.positionInterval);
      this.startPositionBroadcast();
    }
  }

  /**
   * Start sending heartbeat messages
   */
  private startHeartbeat(): void {
    // Send heartbeat every 1 second (GDL 90 specification)
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 1000);

    // Send initial heartbeat immediately
    this.sendHeartbeat();
  }

  /**
   * Start broadcasting position updates
   */
  private startPositionBroadcast(): void {
    const intervalMs = 1000 / this.config.updateRate;

    this.positionInterval = setInterval(() => {
      if (this.currentPosition) {
        this.sendPosition(this.currentPosition);
      }
    }, intervalMs);

    // Send initial position immediately
    if (this.currentPosition) {
      this.sendPosition(this.currentPosition);
    }
  }

  /**
   * Send heartbeat message
   */
  private sendHeartbeat(): void {
    if (!this.socket || !this.isRunning) return;

    const message = createHeartbeatMessage();
    this.sendMessage(message);
  }

  /**
   * Send position data
   */
  private sendPosition(position: GPSPosition): void {
    if (!this.socket || !this.isRunning) return;

    // Send ownship report
    const ownshipReport = createOwnshipReport(position);
    this.sendMessage(ownshipReport);

    // Send geometric altitude
    const geometricAlt = createGeometricAltitude(position.altitude);
    this.sendMessage(geometricAlt);
  }

  /**
   * Send a message via UDP
   */
  private sendMessage(message: Buffer): void {
    if (!this.socket || !this.isRunning) return;

    this.socket.send(
      message,
      this.config.port,
      this.config.targetIP,
      (err) => {
        if (err) {
          console.error('Error sending message:', err);
        }
      }
    );
  }
}

// Singleton instance
let serverInstance: GPSDataServer | null = null;

/**
 * Get the GPS server instance (singleton)
 */
export function getGPSServerInstance(): GPSDataServer {
  if (!serverInstance) {
    serverInstance = new GPSDataServer();
  }
  return serverInstance;
}

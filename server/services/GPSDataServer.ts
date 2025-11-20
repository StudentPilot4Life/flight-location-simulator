/**
 * GPS Data Server
 *
 * Broadcasts GPS position data using ForeFlight's XGPS protocol over UDP.
 * This allows ForeFlight to receive simulated position data over the network.
 */

import dgram from 'dgram';
import { GPSPosition } from '../../src/types/gps.js';
import { createXGPSMessage } from '../utils/xgpsEncoder.js';

export interface GPSServerConfig {
  port: number;
  targetIP: string; // Direct IP address to send to (e.g., ForeFlight device)
  updateRate: number; // Updates per second (1-10 Hz)
  simulatorName: string; // Name that appears in ForeFlight
}

export class GPSDataServer {
  private socket: dgram.Socket | null = null;
  private config: GPSServerConfig;
  private isRunning = false;
  private currentPosition: GPSPosition | null = null;
  private positionInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<GPSServerConfig> = {}) {
    this.config = {
      port: config.port ?? 49002, // ForeFlight XGPS port
      targetIP: config.targetIP ?? '',
      updateRate: config.updateRate ?? 1, // 1 Hz as per ForeFlight spec
      simulatorName: config.simulatorName ?? 'FlightSim',
    };
    // Set a default position (center of US) so device appears immediately
    this.currentPosition = {
      latitude: 39.8283,
      longitude: -98.5795,
      altitude: 5000,
      heading: 0,
      groundSpeed: 0,
      verticalSpeed: 0,
      timestamp: Date.now(),
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
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.socket.on('error', (err) => {
        console.error('GPS server error:', err);
        this.stop();
        reject(err);
      });

      // Bind to any available port
      this.socket.bind(() => {
        if (!this.socket) return;

        try {
          // Enable broadcast mode
          this.socket.setBroadcast(true);

          this.isRunning = true;

          const address = this.socket.address();
          console.log('\n=== ForeFlight GPS Server Started ===');
          console.log(`  Protocol: XGPS (ForeFlight Network GPS)`);
          console.log(`  Socket bound to: ${address.address}:${address.port}`);
          console.log(`  Target IP: ${this.config.targetIP}`);
          console.log(`  Target Port: ${this.config.port} (ForeFlight XGPS port)`);
          console.log(`  Update rate: ${this.config.updateRate} Hz`);
          console.log(`  Simulator name: ${this.config.simulatorName}`);
          console.log('\nForeFlight Setup:');
          console.log('  1. Ensure your iPad and PC are on the same WiFi network');
          console.log('  2. Open ForeFlight → More → Devices');
          console.log('  3. Enable the simulator device that appears');
          console.log('=========================================\n');

          // Start position broadcasts immediately (1 Hz as per ForeFlight spec)
          this.startPositionBroadcast();

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

    if (this.positionInterval) {
      clearInterval(this.positionInterval);
      this.positionInterval = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isRunning = false;
    console.log('ForeFlight GPS Server stopped');
  }

  /**
   * Update the current position
   */
  updatePosition(position: GPSPosition): void {
    this.currentPosition = position;
    // Position interval is already running, it will pick up the new position automatically
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
   * Send position data using XGPS protocol
   */
  private sendPosition(position: GPSPosition): void {
    if (!this.socket || !this.isRunning) return;

    // Send XGPS message
    const xgpsMessage = createXGPSMessage(position, this.config.simulatorName);
    this.sendMessage(xgpsMessage);
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
          console.error('Error sending UDP packet:', err);
          console.error(`  Target: ${this.config.targetIP}:${this.config.port}`);
          console.error(`  Message size: ${message.length} bytes`);
        } else {
          // Log successful sends (only occasionally to avoid spam)
          if (Math.random() < 0.1) { // 10% of sends
            console.log(`✓ UDP packet sent to ${this.config.targetIP}:${this.config.port} (${message.length} bytes)`);
          }
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

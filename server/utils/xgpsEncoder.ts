/**
 * XGPS Protocol Encoder
 *
 * Encodes GPS data into ForeFlight's XGPS format for network GPS transmission.
 * ForeFlight uses a simple UDP string protocol on port 49002.
 */

import { GPSPosition } from '../../src/types/gps.js';

/**
 * Convert feet to meters
 */
function feetToMeters(feet: number): number {
  return feet * 0.3048;
}

/**
 * Convert knots to meters per second
 */
function knotsToMetersPerSecond(knots: number): number {
  return knots * 0.514444;
}

/**
 * Create XGPS GPS message
 * Format: XGPS<name>,<lon>,<lat>,<alt_m>,<track_deg>,<speed_m/s>
 */
export function createXGPSMessage(position: GPSPosition, simulatorName: string = 'FlightSim'): Buffer {
  const altitudeMeters = feetToMeters(position.altitude);
  const speedMps = knotsToMetersPerSecond(position.groundSpeed);

  // Format: XGPS<name>,<lon>,<lat>,<alt_m>,<track_deg>,<speed_m/s>
  const message = `XGPS${simulatorName},${position.longitude.toFixed(8)},${position.latitude.toFixed(8)},${altitudeMeters.toFixed(1)},${position.heading.toFixed(2)},${speedMps.toFixed(1)}`;

  return Buffer.from(message, 'utf-8');
}

/**
 * Create XTRAFFIC traffic message (optional - for showing traffic)
 * Format: XTRAFFIC<name>,<icao>,<lat>,<lon>,<alt_ft>,<vspeed_fpm>,<airborne>,<track>,<speed_kts>,<callsign>
 */
export function createXTRAFFICMessage(
  icaoAddress: number,
  lat: number,
  lon: number,
  altitudeFeet: number,
  verticalSpeed: number,
  track: number,
  speedKnots: number,
  callsign: string = 'SIM',
  simulatorName: string = 'FlightSim'
): Buffer {
  const airborne = altitudeFeet > 0 ? 1 : 0;

  const message = `XTRAFFIC${simulatorName},${icaoAddress},${lat.toFixed(8)},${lon.toFixed(8)},${altitudeFeet.toFixed(1)},${verticalSpeed.toFixed(1)},${airborne},${track.toFixed(1)},${speedKnots.toFixed(1)},${callsign}`;

  return Buffer.from(message, 'utf-8');
}

/**
 * Create XATT attitude message (optional - for attitude display)
 * Format: XATT<name>,<heading_true>,<pitch>,<roll>
 */
export function createXATTMessage(
  heading: number,
  pitch: number = 0,
  roll: number = 0,
  simulatorName: string = 'FlightSim'
): Buffer {
  const message = `XATT${simulatorName},${heading.toFixed(1)},${pitch.toFixed(1)},${roll.toFixed(1)}`;

  return Buffer.from(message, 'utf-8');
}

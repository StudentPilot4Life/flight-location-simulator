/**
 * GDL 90 Protocol Encoder
 *
 * Encodes GPS and flight data into GDL 90 format for transmission to EFBs.
 * The GDL 90 protocol uses a binary format with specific byte layouts.
 */

import { GPSPosition } from '../../src/types/gps.js';
import { GDL90MessageId } from '../../src/types/gdl90.js';

/**
 * GDL 90 special bytes
 */
const FLAG_BYTE = 0x7e;
const ESCAPE_BYTE = 0x7d;

/**
 * Calculate CRC for GDL 90 message
 */
function calculateCRC(data: Buffer): number {
  let crc = 0;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return crc & 0xffff;
}

/**
 * Escape special bytes in GDL 90 message
 */
function escapeData(data: Buffer): Buffer {
  const escaped: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte === FLAG_BYTE || byte === ESCAPE_BYTE) {
      escaped.push(ESCAPE_BYTE);
      escaped.push(byte ^ 0x20);
    } else {
      escaped.push(byte);
    }
  }
  return Buffer.from(escaped);
}

/**
 * Encode latitude to GDL 90 format (24-bit signed integer)
 */
function encodeLatitude(lat: number): Buffer {
  // Convert degrees to semicircles (180 degrees = 2^23)
  const semicircles = Math.round((lat / 180) * Math.pow(2, 23));
  const buffer = Buffer.alloc(3);
  buffer.writeIntBE(semicircles, 0, 3);
  return buffer;
}

/**
 * Encode longitude to GDL 90 format (24-bit signed integer)
 */
function encodeLongitude(lon: number): Buffer {
  // Convert degrees to semicircles (180 degrees = 2^23)
  const semicircles = Math.round((lon / 180) * Math.pow(2, 23));
  const buffer = Buffer.alloc(3);
  buffer.writeIntBE(semicircles, 0, 3);
  return buffer;
}

/**
 * Encode altitude to GDL 90 format (12-bit value)
 */
function encodeAltitude(altitudeFeet: number): number {
  // Altitude is encoded in 25-foot increments, offset by -1000 feet
  return Math.max(0, Math.min(0xffe, Math.round((altitudeFeet + 1000) / 25)));
}

/**
 * Encode velocity to GDL 90 format
 */
function encodeVelocity(speedKnots: number): number {
  // Velocity is encoded in knots, 12-bit value
  return Math.max(0, Math.min(0xffe, Math.round(speedKnots)));
}

/**
 * Encode vertical velocity to GDL 90 format
 */
function encodeVerticalVelocity(vsFpm: number): number {
  // Vertical velocity is encoded in 64 fpm increments, signed 12-bit
  const encoded = Math.round(vsFpm / 64);
  // Convert to 12-bit signed value
  if (encoded < 0) {
    return (0x800 | (Math.abs(encoded) & 0x7ff)) & 0xfff;
  }
  return Math.max(0, Math.min(0x7ff, encoded));
}

/**
 * Encode track/heading to GDL 90 format
 */
function encodeTrackHeading(heading: number): number {
  // Track/heading is encoded as angle/1.4 degrees (8-bit value)
  return Math.round((heading / 1.4) * (256 / 360)) & 0xff;
}

/**
 * Create GDL 90 Heartbeat message
 */
export function createHeartbeatMessage(): Buffer {
  const payload = Buffer.alloc(7);
  payload[0] = GDL90MessageId.HEARTBEAT;

  // Status byte 1: GPS position valid
  payload[1] = 0x81; // UAT initialized, GPS position valid

  // Status byte 2
  payload[2] = 0x00;

  // Timestamp (seconds since midnight UTC, 17-bit value)
  const now = new Date();
  const secondsSinceMidnight =
    now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  payload[3] = (secondsSinceMidnight >> 16) & 0x01;
  payload[4] = (secondsSinceMidnight >> 8) & 0xff;
  payload[5] = secondsSinceMidnight & 0xff;

  // Message counts
  payload[6] = 0x00;

  // Calculate CRC
  const crc = calculateCRC(payload);
  const message = Buffer.alloc(9);
  payload.copy(message, 0);
  message[7] = (crc >> 8) & 0xff;
  message[8] = crc & 0xff;

  // Escape and frame
  const escaped = escapeData(message);
  const framed = Buffer.alloc(escaped.length + 2);
  framed[0] = FLAG_BYTE;
  escaped.copy(framed, 1);
  framed[framed.length - 1] = FLAG_BYTE;

  return framed;
}

/**
 * Create GDL 90 Ownship Report message
 */
export function createOwnshipReport(position: GPSPosition): Buffer {
  const payload = Buffer.alloc(28);
  let offset = 0;

  // Message ID
  payload[offset++] = GDL90MessageId.OWNSHIP_REPORT;

  // Status byte (bits for alert status, address type, etc.)
  payload[offset++] = 0x00;

  // Address type (0 = ADS-B with ICAO address)
  payload[offset++] = 0x00;

  // Aircraft address (24-bit) - using dummy address
  payload[offset++] = 0xab;
  payload[offset++] = 0xcd;
  payload[offset++] = 0xef;

  // Latitude (24-bit)
  const latBytes = encodeLatitude(position.latitude);
  latBytes.copy(payload, offset);
  offset += 3;

  // Longitude (24-bit)
  const lonBytes = encodeLongitude(position.longitude);
  lonBytes.copy(payload, offset);
  offset += 3;

  // Altitude (12-bit) and misc indicators (4-bit)
  const altEncoded = encodeAltitude(position.altitude);
  payload[offset++] = (altEncoded >> 4) & 0xff;
  payload[offset] = ((altEncoded & 0x0f) << 4) | 0x0b; // misc = airborne
  offset++;

  // NIC (Navigation Integrity Category) and NACp (Navigation Accuracy Category)
  payload[offset++] = 0xa8; // NIC = 10, NACp = 8 (good accuracy)

  // Horizontal velocity (12-bit)
  const velEncoded = encodeVelocity(position.groundSpeed);
  payload[offset++] = (velEncoded >> 4) & 0xff;

  // Vertical velocity (12-bit) combined with remaining velocity bits
  const vsEncoded = encodeVerticalVelocity(position.verticalSpeed);
  payload[offset] = ((velEncoded & 0x0f) << 4) | ((vsEncoded >> 8) & 0x0f);
  offset++;
  payload[offset++] = vsEncoded & 0xff;

  // Track/Heading (8-bit)
  payload[offset++] = encodeTrackHeading(position.heading);

  // Emitter category (8-bit) - 1 = light aircraft
  payload[offset++] = 0x01;

  // Call sign (8 characters)
  const callSign = 'N12345  ';
  for (let i = 0; i < 8; i++) {
    payload[offset++] = callSign.charCodeAt(i);
  }

  // Emergency/priority code (4-bit)
  payload[offset++] = 0x00;

  // Calculate CRC
  const crc = calculateCRC(payload);
  const message = Buffer.alloc(30);
  payload.copy(message, 0);
  message[28] = (crc >> 8) & 0xff;
  message[29] = crc & 0xff;

  // Escape and frame
  const escaped = escapeData(message);
  const framed = Buffer.alloc(escaped.length + 2);
  framed[0] = FLAG_BYTE;
  escaped.copy(framed, 1);
  framed[framed.length - 1] = FLAG_BYTE;

  return framed;
}

/**
 * Create GDL 90 Ownship Geometric Altitude message
 */
export function createGeometricAltitude(altitudeFeet: number): Buffer {
  const payload = Buffer.alloc(5);

  // Message ID
  payload[0] = GDL90MessageId.OWNSHIP_GEOMETRIC_ALTITUDE;

  // Altitude in 5-foot increments (16-bit signed)
  const altEncoded = Math.round(altitudeFeet / 5);
  payload[1] = (altEncoded >> 8) & 0xff;
  payload[2] = altEncoded & 0xff;

  // Vertical metrics and warning (16-bit)
  payload[3] = 0x00;
  payload[4] = 0x00;

  // Calculate CRC
  const crc = calculateCRC(payload);
  const message = Buffer.alloc(7);
  payload.copy(message, 0);
  message[5] = (crc >> 8) & 0xff;
  message[6] = crc & 0xff;

  // Escape and frame
  const escaped = escapeData(message);
  const framed = Buffer.alloc(escaped.length + 2);
  framed[0] = FLAG_BYTE;
  escaped.copy(framed, 1);
  framed[framed.length - 1] = FLAG_BYTE;

  return framed;
}

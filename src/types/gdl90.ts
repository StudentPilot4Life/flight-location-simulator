/**
 * GDL 90 Protocol Types
 *
 * GDL 90 is a data link interface specification used by aviation equipment
 * to exchange GPS, traffic, weather, and other flight information.
 *
 * Reference: GDL 90 Data Interface Specification
 */

/**
 * GDL 90 Message IDs
 */
export enum GDL90MessageId {
  HEARTBEAT = 0x00,
  INITIALIZATION = 0x02,
  UPLINK_DATA = 0x07,
  HEIGHT_ABOVE_TERRAIN = 0x09,
  OWNSHIP_REPORT = 0x0A,
  OWNSHIP_GEOMETRIC_ALTITUDE = 0x0B,
  TRAFFIC_REPORT = 0x14,
  BASIC_REPORT = 0x1E,
  LONG_REPORT = 0x1F,
}

/**
 * GDL 90 Status Byte 1 flags
 */
export interface GDL90StatusByte1 {
  uatInitialized: boolean;
  ratcsInitialized: boolean;
  gpsPositionValid: boolean;
  maintenanceRequired: boolean;
  reserved: number;
}

/**
 * GDL 90 Status Byte 2 flags
 */
export interface GDL90StatusByte2 {
  timestamp: boolean;
  uatOk: boolean;
  reserved: number;
}

/**
 * GDL 90 Heartbeat message
 */
export interface GDL90Heartbeat {
  messageId: GDL90MessageId.HEARTBEAT;
  statusByte1: GDL90StatusByte1;
  statusByte2: GDL90StatusByte2;
  timestamp: number;
  messageCount: number;
}

/**
 * GDL 90 Ownship Report message
 */
export interface GDL90OwnshipReport {
  messageId: GDL90MessageId.OWNSHIP_REPORT;
  status: number;
  addressType: number;
  address: number;
  latitude: number;
  longitude: number;
  altitude: number;
  miscIndicators: number;
  navIntegrityCat: number;
  navAccuracyCat: number;
  horizontalVelocity: number;
  verticalVelocity: number;
  trackHeading: number;
  emitterCategory: number;
  callSign: string;
  emergencyCode: number;
}

/**
 * GDL 90 Ownship Geometric Altitude message
 */
export interface GDL90GeometricAltitude {
  messageId: GDL90MessageId.OWNSHIP_GEOMETRIC_ALTITUDE;
  altitude: number;
  verticalMetrics: number;
  verticalWarning: boolean;
}

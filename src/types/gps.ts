/**
 * GPS position data
 */
export interface GPSPosition {
  latitude: number;      // Degrees, -90 to 90
  longitude: number;     // Degrees, -180 to 180
  altitude: number;      // Feet MSL
  heading: number;       // Degrees, 0-359
  groundSpeed: number;   // Knots
  verticalSpeed: number; // Feet per minute
  timestamp: number;     // Unix timestamp in milliseconds
}

/**
 * GPS fix quality
 */
export enum FixQuality {
  NoFix = 0,
  GPS = 1,
  DGPS = 2,
  PPS = 3,
  RTK = 4,
  FloatRTK = 5,
  Estimated = 6,
  Manual = 7,
  Simulation = 8,
}

/**
 * Extended GPS data with quality indicators
 */
export interface GPSData extends GPSPosition {
  fixQuality: FixQuality;
  satelliteCount: number;
  hdop: number;           // Horizontal dilution of precision
}

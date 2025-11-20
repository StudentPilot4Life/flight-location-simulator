/**
 * PositionControl Component
 *
 * Manual controls for adjusting GPS position parameters
 */

import React, { useState, useRef, useEffect } from 'react';
import { GPSPosition } from '../types/gps';
import { updatePosition } from '../services/gpsApi';

interface PositionControlProps {
  position: GPSPosition;
  onPositionChange: (position: Partial<GPSPosition>) => void;
  disabled?: boolean;
}

export default function PositionControl({
  position,
  onPositionChange,
  disabled = false,
}: PositionControlProps) {
  const [isFlying, setIsFlying] = useState(false);
  const flightIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (field: keyof GPSPosition, value: number) => {
    onPositionChange({ [field]: value });
  };

  const handleFlyToggle = () => {
    setIsFlying((prev) => !prev);
  };

  useEffect(() => {
    if (isFlying) {
      flightIntervalRef.current = setInterval(() => {
        // Earth radius in meters
        const R = 6378137;
        const { latitude, longitude, altitude, heading, groundSpeed, verticalSpeed } = position;

        // Time interval in seconds
        const dt = 1;

        // --- Horizontal Movement ---
        const groundSpeedMs = groundSpeed * 0.514444; // knots to m/s
        const distance = groundSpeedMs * dt;
        const brng = (heading * Math.PI) / 180; // heading to radians
        const lat1 = (latitude * Math.PI) / 180;
        const lon1 = (longitude * Math.PI) / 180;

        const lat2 = Math.asin(
          Math.sin(lat1) * Math.cos(distance / R) +
            Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
        );
        const lon2 =
          lon1 +
          Math.atan2(
            Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
            Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
          );

        const newLatitude = (lat2 * 180) / Math.PI;
        const newLongitude = (lon2 * 180) / Math.PI;

        // --- Vertical Movement ---
        const verticalSpeedFps = verticalSpeed / 60; // fpm to fps
        const dAlt = verticalSpeedFps * dt;
        const newAltitude = altitude + dAlt;

        const newPosition: Partial<GPSPosition> = {
          latitude: newLatitude,
          longitude: newLongitude,
          altitude: newAltitude,
        };

        onPositionChange(newPosition);

        // Also send the full updated position to the server
        const fullNewPosition = {
          ...position,
          ...newPosition,
          timestamp: Date.now(),
        };
        updatePosition(fullNewPosition).catch((err) => {
          console.error('Failed to auto-update position while flying:', err);
          // Stop flying if there's a persistent error
          setIsFlying(false);
        });
      }, 250);
    } else {
      if (flightIntervalRef.current) {
        clearInterval(flightIntervalRef.current);
        flightIntervalRef.current = null;
      }
    }

    return () => {
      if (flightIntervalRef.current) {
        clearInterval(flightIntervalRef.current);
      }
    };
  }, [isFlying, position, onPositionChange]);

  return (
    <div className="position-control">
      <h3>Position Controls</h3>

      <div className="control-grid">
        <div className="control-group">
          <label htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            type="number"
            min="-90"
            max="90"
            step="0.0001"
            value={position.latitude.toFixed(4)}
            onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
            disabled={disabled || isFlying}
          />
          <span className="unit">°</span>
        </div>

        <div className="control-group">
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            type="number"
            min="-180"
            max="180"
            step="0.0001"
            value={position.longitude.toFixed(4)}
            onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
            disabled={disabled || isFlying}
          />
          <span className="unit">°</span>
        </div>

        <div className="control-group">
          <label htmlFor="altitude">Altitude</label>
          <input
            id="altitude"
            type="number"
            min="0"
            max="50000"
            step="100"
            value={position.altitude}
            onChange={(e) => handleChange('altitude', parseInt(e.target.value))}
            disabled={disabled || isFlying}
          />
          <span className="unit">ft MSL</span>
        </div>

        <div className="control-group">
          <label htmlFor="heading">Heading</label>
          <input
            id="heading"
            type="number"
            min="0"
            max="359"
            step="1"
            value={position.heading}
            onChange={(e) => handleChange('heading', parseInt(e.target.value))}
            disabled={disabled}
          />
          <span className="unit">°</span>
        </div>

        <div className="control-group">
          <label htmlFor="groundSpeed">Ground Speed</label>
          <input
            id="groundSpeed"
            type="number"
            min="0"
            max="500"
            step="1"
            value={position.groundSpeed}
            onChange={(e) => handleChange('groundSpeed', parseInt(e.target.value))}
            disabled={disabled}
          />
          <span className="unit">kts</span>
        </div>

        <div className="control-group">
          <label htmlFor="verticalSpeed">Vertical Speed</label>
          <input
            id="verticalSpeed"
            type="number"
            min="-3000"
            max="3000"
            step="100"
            value={position.verticalSpeed}
            onChange={(e) => handleChange('verticalSpeed', parseInt(e.target.value))}
            disabled={disabled}
          />
          <span className="unit">fpm</span>
        </div>
      </div>

      <div className="fly-control">
        <button onClick={handleFlyToggle} disabled={disabled} className="btn btn-fly">
          {isFlying ? 'Stop' : 'Fly'}
        </button>
        <p className="help-text-small">
          Continuously updates position based on heading and speed.
        </p>
      </div>

      <div className="help-text">
        <p>Click on the map to set position, or manually enter coordinates above.</p>
      </div>
    </div>
  );
}

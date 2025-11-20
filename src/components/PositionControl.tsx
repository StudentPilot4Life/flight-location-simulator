/**
 * PositionControl Component
 *
 * Manual controls for adjusting GPS position parameters
 */

import React from 'react';
import { GPSPosition } from '../types/gps';

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
  const handleChange = (field: keyof GPSPosition, value: number) => {
    onPositionChange({ [field]: value });
  };

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
            disabled={disabled}
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
            disabled={disabled}
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
            disabled={disabled}
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

      <div className="help-text">
        <p>Click on the map to set position, or manually enter coordinates above.</p>
      </div>
    </div>
  );
}

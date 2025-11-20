import React, { useState } from 'react';
import MapView from './components/MapView';
import PositionControl from './components/PositionControl';
import ServerControl from './components/ServerControl';
import { GPSPosition } from './types/gps';

function App() {
  // Default position (Denver, CO area - good for aviation demos)
  const [position, setPosition] = useState<GPSPosition>({
    latitude: 39.8561,
    longitude: -104.6737,
    altitude: 5000,
    heading: 0,
    groundSpeed: 120,
    verticalSpeed: 0,
    timestamp: Date.now(),
  });

  const [isServerRunning, setIsServerRunning] = useState(false);

  const handleMapPositionChange = (lat: number, lng: number) => {
    setPosition((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      timestamp: Date.now(),
    }));
  };

  const handlePositionControlChange = (changes: Partial<GPSPosition>) => {
    setPosition((prev) => ({
      ...prev,
      ...changes,
      timestamp: Date.now(),
    }));
  };

  return (
    <div className="app">
      <header>
        <h1>Flight Location Simulator</h1>
        <p className="subtitle">Simulate GPS location data for EFBs like ForeFlight</p>
      </header>

      <main className="main-content">
        <div className="map-section">
          <MapView
            position={{ lat: position.latitude, lng: position.longitude }}
            heading={position.heading}
            onPositionChange={handleMapPositionChange}
          />
        </div>

        <aside className="control-panel">
          <ServerControl
            currentPosition={position}
            onServerStatusChange={setIsServerRunning}
          />

          <PositionControl
            position={position}
            onPositionChange={handlePositionControlChange}
            disabled={!isServerRunning}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;

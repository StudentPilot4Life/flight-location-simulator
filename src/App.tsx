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
  const [isFlying, setIsFlying] = useState(false);
  const [followMode, setFollowMode] = useState(false);

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

  const handleFlyingChange = (flying: boolean) => {
    setIsFlying(flying);
    // When flight stops, disable follow mode
    if (!flying) {
      setFollowMode(false);
    }
  };

  const handleCenterRequest = () => {
    if (isFlying) {
      // If flying, toggle follow mode
      setFollowMode((prev) => !prev);
    } else {
      // If not flying, just center once (trigger by temporarily enabling follow mode)
      setFollowMode(true);
      setTimeout(() => setFollowMode(false), 100);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>
          <a href="https://www.youtube.com/@StudentPilot4Life" target="_blank" rel="noopener noreferrer" className="header-link">
            SP4L Flight Location Simulator
          </a>
        </h1>
        <p className="subtitle">Simulate GPS location data for ForeFlight</p>
      </header>

      <main className="main-content">
        <div className="map-section">
          <MapView
            position={{ lat: position.latitude, lng: position.longitude }}
            heading={position.heading}
            onPositionChange={handleMapPositionChange}
            followMode={followMode}
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
            onFlyingChange={handleFlyingChange}
            onCenterRequest={handleCenterRequest}
            followMode={followMode}
          />
        </aside>
      </main>
    </div>
  );
}

export default App;

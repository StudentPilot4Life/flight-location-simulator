/**
 * ServerControl Component
 *
 * Controls for starting/stopping the GPS data server
 */

import { useState, useEffect } from 'react';
import { getServerStatus, startServer, stopServer, updatePosition, updateConfig } from '../services/gpsApi';
import { GPSPosition } from '../types/gps';

interface ServerControlProps {
  currentPosition: GPSPosition;
  onServerStatusChange: (isRunning: boolean) => void;
}

export default function ServerControl({
  currentPosition,
  onServerStatusChange,
}: ServerControlProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [targetIP, setTargetIP] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // Poll server status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getServerStatus();
        setIsRunning(status.isRunning);
        // Only update targetIP from server if user is not currently editing
        if (!isEditing) {
          setTargetIP(status.config.targetIP || '');
        }
        onServerStatusChange(status.isRunning);
      } catch (err) {
        // Server might not be running
        console.error('Failed to get server status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [onServerStatusChange, isEditing]);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await startServer(currentPosition);
      setIsRunning(true);
      setStatusMessage('GPS server started successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await stopServer();
      setIsRunning(false);
      setStatusMessage('GPS server stopped');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePosition = async () => {
    if (!isRunning) {
      setError('Server is not running. Start the server first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updatePosition(currentPosition);
      setStatusMessage('Position updated successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTargetIP = async () => {
    // Capture the current value immediately
    const ipToSet = targetIP.trim();

    console.log('Setting IP:', ipToSet); // Debug log

    if (!ipToSet) {
      setError('Please enter a target IP address');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Calling updateConfig with:', { targetIP: ipToSet }); // Debug log
      await updateConfig({ targetIP: ipToSet });
      setIsEditing(false);
      setStatusMessage('Target IP set successfully');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Error setting IP:', err); // Debug log
      setError(err instanceof Error ? err.message : 'Failed to set target IP');
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="server-control">
      <h3>GPS Server Control</h3>

      <div className="status-indicator">
        <div className={`status-light ${isRunning ? 'active' : 'inactive'}`}></div>
        <span className="status-text">
          {isRunning ? 'Broadcasting' : 'Not broadcasting'}
        </span>
      </div>

      <div className="ip-config">
        <label htmlFor="targetIP">ForeFlight Device IP</label>
        <div className="ip-input-group">
          <input
            id="targetIP"
            type="text"
            placeholder="192.168.1.100"
            value={targetIP}
            onChange={(e) => {
              setTargetIP(e.target.value);
              setIsEditing(true);
            }}
            onFocus={() => setIsEditing(true)}
            disabled={isRunning}
          />
          <button
            onMouseDown={(e) => {
              // Prevent blur event on input when clicking button
              e.preventDefault();
            }}
            onClick={handleSetTargetIP}
            disabled={isLoading || isRunning}
            className="btn btn-set-ip"
          >
            Set IP
          </button>
        </div>
        <p className="help-text-small">
          Find your iPad&apos;s IP in Settings &gt; Wi-Fi &gt; (i) icon
        </p>
      </div>

      <div className="button-group">
        <button
          onClick={handleStart}
          disabled={isLoading || isRunning || !targetIP}
          className="btn btn-primary"
        >
          {isLoading && !isRunning ? 'Starting...' : 'Start Server'}
        </button>

        <button
          onClick={handleStop}
          disabled={isLoading || !isRunning}
          className="btn btn-secondary"
        >
          {isLoading && isRunning ? 'Stopping...' : 'Stop Server'}
        </button>
      </div>

      <button
        onClick={handleUpdatePosition}
        disabled={isLoading || !isRunning}
        className="btn btn-update"
      >
        Update Position
      </button>

      {error && <div className="error-message">{error}</div>}
      {statusMessage && <div className="success-message">{statusMessage}</div>}

      <div className="info-box">
        <h4>Connection Info</h4>
        <p>
          <strong>Protocol:</strong> XGPS (ForeFlight Network GPS)
        </p>
        <p>
          <strong>Target IP:</strong> {targetIP || 'Not set'}
        </p>
        <p>
          <strong>UDP Port:</strong> 49002
        </p>
        <p>
          <strong>Update Rate:</strong> 1 Hz
        </p>
        <p className="help-text">
          The app will send GPS data to ForeFlight using the XGPS protocol. Enable the simulator in ForeFlight → More → Devices.
        </p>
      </div>
    </div>
  );
}

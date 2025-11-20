/**
 * ServerControl Component
 *
 * Controls for starting/stopping the GPS data server
 */

import React, { useState, useEffect } from 'react';
import { getServerStatus, startServer, stopServer, updatePosition } from '../services/gpsApi';
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

  // Poll server status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getServerStatus();
        setIsRunning(status.isRunning);
        onServerStatusChange(status.isRunning);
      } catch (err) {
        // Server might not be running
        console.error('Failed to get server status:', err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [onServerStatusChange]);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await startServer();
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

  return (
    <div className="server-control">
      <h3>GPS Server Control</h3>

      <div className="status-indicator">
        <div className={`status-light ${isRunning ? 'active' : 'inactive'}`}></div>
        <span className="status-text">
          {isRunning ? 'Broadcasting' : 'Not broadcasting'}
        </span>
      </div>

      <div className="button-group">
        <button
          onClick={handleStart}
          disabled={isLoading || isRunning}
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
          <strong>Protocol:</strong> GDL 90
        </p>
        <p>
          <strong>UDP Port:</strong> 4000
        </p>
        <p>
          <strong>Update Rate:</strong> 1 Hz
        </p>
        <p className="help-text">
          Configure your EFB (e.g., ForeFlight) to receive GPS data from this device's IP
          address on UDP port 4000.
        </p>
      </div>
    </div>
  );
}

/**
 * MapView Component
 *
 * Interactive map for selecting and displaying GPS position
 */

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Create airplane icon
const airplaneIcon = L.divIcon({
  className: 'airplane-marker',
  html: `<div style="transform: rotate(0deg); font-size: 24px;">✈️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface MapViewProps {
  position: { lat: number; lng: number };
  heading?: number;
  onPositionChange: (lat: number, lng: number) => void;
}

/**
 * Component to handle map click events
 */
function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Component to update map view when position changes
 */
function MapViewController({ position }: { position: { lat: number; lng: number } }) {
  const map = useMap();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // On first render, fly to position
      map.setView([position.lat, position.lng], map.getZoom());
      isFirstRender.current = false;
    }
  }, [position, map]);

  return null;
}

/**
 * Airplane marker with rotation
 */
function AirplaneMarker({
  position,
  heading,
}: {
  position: { lat: number; lng: number };
  heading: number;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (markerRef.current) {
      const icon = L.divIcon({
        className: 'airplane-marker',
        html: `<div style="transform: rotate(${heading}deg); font-size: 24px;">✈️</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      markerRef.current.setIcon(icon);
    }
  }, [heading]);

  return <Marker ref={markerRef} position={[position.lat, position.lng]} icon={airplaneIcon} />;
}

export default function MapView({ position, heading = 0, onPositionChange }: MapViewProps) {
  return (
    <div className="map-container">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPositionChange={onPositionChange} />
        <MapViewController position={position} />
        <AirplaneMarker position={position} heading={heading} />
      </MapContainer>
    </div>
  );
}

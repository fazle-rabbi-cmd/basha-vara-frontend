'use client';

import { useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
const createIcon = () => {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const markerIcon = createIcon();

interface Property {
  id: string;
  title: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface PropertyMapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

const MapController = memo(function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [map, center, zoom]);

  return null;
});

const PropertyMarker = memo(function PropertyMarker({ property }: { property: Property }) {
  return (
    <Marker
      position={[property.lat!, property.lng!]}
      icon={markerIcon}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-semibold">{property.title}</div>
          <div className="text-muted-foreground">{property.address}</div>
        </div>
      </Popup>
    </Marker>
  );
});

export const PropertyMap = memo(function PropertyMap({
  properties,
  center,
  zoom = 13,
  height = '400px',
}: PropertyMapProps) {
  const propertiesWithLocation = properties.filter(
    (property) => Number.isFinite(property.lat) && Number.isFinite(property.lng),
  );

  const mapCenter = center || (propertiesWithLocation.length > 0
    ? [propertiesWithLocation[0].lat!, propertiesWithLocation[0].lng!]
    : [23.8103, 90.4125]);

  if (propertiesWithLocation.length === 0) {
    return (
      <div style={{ height, width: '100%' }} className="bg-muted rounded-lg flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Location not available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ height, width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={mapCenter} zoom={zoom} />

        {propertiesWithLocation.map((property) => (
          <PropertyMarker key={property.id} property={property} />
        ))}
      </MapContainer>
    </div>
  );
});

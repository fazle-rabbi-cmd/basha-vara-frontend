'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Loader2, Search, LocateFixed, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { geocodeAddress, reverseGeocodeDetails, ReverseGeocodeDetails } from '@/lib/geocoding';

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
const DEFAULT_MAP_CENTER: [number, number] = [23.8103, 90.4125];

export interface LocationDetails {
  address?: string;
  area?: string;
  city?: string;
  displayName?: string;
}

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, details?: LocationDetails) => void;
  initialLocation?: { lat: number; lng: number };
  center?: [number, number];
  height?: string;
  address?: string;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  const latitude = center?.[0];
  const longitude = center?.[1];

  // Invalidate map size on mount to prevent grey/blank tiles inside modals
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      map.setView([latitude, longitude], zoom || 15, { animate: true });
    }
  }, [map, latitude, longitude, zoom]);

  return null;
}

export function LocationPicker({
  onLocationSelect,
  initialLocation,
  center = DEFAULT_MAP_CENTER,
  height = '300px',
  address,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ?? null
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sync with incoming initialLocation updates if they change
  useEffect(() => {
    if (initialLocation && (initialLocation.lat !== selectedLocation?.lat || initialLocation.lng !== selectedLocation?.lng)) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation?.lat, initialLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationSelect = useCallback(
    (lat: number, lng: number, details?: LocationDetails) => {
      setSelectedLocation({ lat, lng });
      onLocationSelect(lat, lng, details);
    },
    [onLocationSelect]
  );

  // Auto-detect current exact GPS / browser location
  const handleAutoDetect = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatusMessage({
        type: 'error',
        text: 'Geolocation is not supported by your device or browser.',
      });
      return;
    }

    setIsDetecting(true);
    setStatusMessage({ type: 'info', text: 'Detecting your exact GPS location...' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const details: ReverseGeocodeDetails | null = await reverseGeocodeDetails(lat, lng);
          const locationDetails: LocationDetails = {
            address: details?.road,
            area: details?.area,
            city: details?.city,
            displayName: details?.displayName,
          };
          handleLocationSelect(lat, lng, locationDetails);
          setStatusMessage({
            type: 'success',
            text: details?.area
              ? `Location detected: ${details.area}${details.city ? `, ${details.city}` : ''}`
              : `Exact location detected (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          });
        } catch {
          handleLocationSelect(lat, lng);
          setStatusMessage({
            type: 'success',
            text: `Exact coordinates detected: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          });
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        let errorMsg = 'Could not detect location. Please click on the map to set your location manually.';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please allow location access or click on the map.';
        } else if (err.code === 2) {
          errorMsg = 'GPS signal unavailable. Please click on the map to select your location.';
        } else if (err.code === 3) {
          errorMsg = 'Location detection timed out. Please try again or click on the map.';
        }
        setStatusMessage({
          type: 'error',
          text: errorMsg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Geocode manually typed address
  const handleGeocode = async () => {
    if (!address || address.trim().length < 3) {
      setStatusMessage({
        type: 'error',
        text: 'Please type an address or area first to search.',
      });
      return;
    }

    setIsGeocoding(true);
    setStatusMessage({ type: 'info', text: 'Searching address on map...' });

    try {
      const result = await geocodeAddress(address);
      if (result) {
        handleLocationSelect(result.lat, result.lng, {
          area: result.address?.suburb || result.address?.city,
          displayName: result.displayName,
        });
        setStatusMessage({
          type: 'success',
          text: `Found location: ${result.displayName.slice(0, 60)}...`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Could not pinpoint address automatically. Please tap on the map to select the location.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Address search failed. Please click on the map to place the pin.',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Top action bar: Info text + Auto Detect & Search buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Click anywhere on the map or drag pin to adjust</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="h-8 text-xs font-medium border-primary/40 text-primary hover:bg-primary/10 hover:text-primary transition-colors"
            title="Auto-detect current GPS location"
          >
            {isDetecting ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5 mr-1.5" />
            )}
            Auto Detect
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGeocode}
            disabled={isGeocoding || !address || address.trim().length < 3}
            className="h-8 text-xs font-medium"
            title="Locate the typed address on the map"
          >
            {isGeocoding ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5 mr-1.5" />
            )}
            Find Address
          </Button>
        </div>
      </div>

      {/* Status banner (Feedback for Auto Detect / Geocode) */}
      {statusMessage && (
        <div
          className={`flex items-start gap-2 text-xs p-2.5 rounded-md ${
            statusMessage.type === 'error'
              ? 'text-destructive bg-destructive/10 border border-destructive/20'
              : statusMessage.type === 'success'
              ? 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800'
              : 'text-muted-foreground bg-muted border border-border'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
        </div>
      )}

      {/* Map container */}
      <div className="rounded-lg overflow-hidden border border-border shadow-sm" style={{ height, width: '100%' }}>
        <MapContainer
          center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : center}
          zoom={selectedLocation ? 16 : 13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={(lat, lng) => handleLocationSelect(lat, lng)} />
          <MapController
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : center}
            zoom={selectedLocation ? 16 : 13}
          />
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const position = event.target.getLatLng();
                  handleLocationSelect(position.lat, position.lng);
                },
              }}
            >
              <Popup>Property location (Drag to fine-tune)</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Coordinates pill */}
      {selectedLocation && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Pin coordinates: <strong className="text-foreground">{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</strong>
          </span>
          <span className="text-[11px] text-muted-foreground/80">Saved to listing</span>
        </div>
      )}
    </div>
  );
}

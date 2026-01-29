"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerProps {
  address: string;
  lat: number;
  lng: number;
  onChange: (address: string, lat: number, lng: number) => void;
}

// Component to update map center when position changes
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function LocationPicker({
  address,
  lat,
  lng,
  onChange,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    lat || 39.9526,
    lng || -75.1652,
  ]);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    lat || 39.9526,
    lng || -75.1652,
  ]);

  const provider = new OpenStreetMapProvider();

  // Search for address using Nominatim
  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const results = await provider.search({ query });
      setSearchResults(results.slice(0, 5)); // Show top 5 results
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (result: any) => {
    const newLat = result.y;
    const newLng = result.x;
    const newAddress = result.label;

    setMapCenter([newLat, newLng]);
    setMarkerPosition([newLat, newLng]);
    onChange(newAddress, newLat, newLng);
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <div>
        <label
          htmlFor="address-search"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Search for Location
        </label>
        <div className="relative">
          <input
            id="address-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Type an address or place name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {result.label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Search for an address, building, or landmark
        </p>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-gray-300">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "400px", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={markerPosition}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                setMarkerPosition([position.lat, position.lng]);
                onChange(address, position.lat, position.lng);
              },
            }}
          />
          <MapUpdater center={mapCenter} />
        </MapContainer>
      </div>

      {/* Selected Address Display */}
      <div className="space-y-2">
        <div>
          <label
            htmlFor="selected-address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Selected Address
          </label>
          <input
            id="selected-address"
            type="text"
            value={address}
            onChange={(e) => onChange(e.target.value, lat, lng)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Address will appear here"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={lat || ""}
              onChange={(e) =>
                onChange(address, parseFloat(e.target.value) || 0, lng)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={lng || ""}
              onChange={(e) =>
                onChange(address, lat, parseFloat(e.target.value) || 0)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Click on the map or drag the marker to adjust the exact location
      </p>
    </div>
  );
}

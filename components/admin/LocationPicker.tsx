"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { SavedLocation } from "@/types/location";

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

const DEFAULT_LAT = 39.9526;
const DEFAULT_LNG = -75.1652;

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
    lat || DEFAULT_LAT,
    lng || DEFAULT_LNG,
  ]);
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([
    lat || DEFAULT_LAT,
    lng || DEFAULT_LNG,
  ]);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [showSaved, setShowSaved] = useState(true);

  // Fetch saved locations on mount
  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSavedLocations(data);
      })
      .catch(() => {});
  }, []);

  // Attempt to use the user's current location when creating a new event
  // (i.e. when coordinates are still the defaults)
  useEffect(() => {
    const isDefault =
      (lat === DEFAULT_LAT && lng === DEFAULT_LNG) || (!lat && !lng);
    if (!isDefault || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMarkerPosition([latitude, longitude]);
        onChange(address, latitude, longitude);
      },
      () => {
        // Geolocation denied or unavailable — keep the defaults silently
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSelectSaved = (loc: SavedLocation) => {
    setMapCenter([loc.lat, loc.lng]);
    setMarkerPosition([loc.lat, loc.lng]);
    onChange(loc.address, loc.lat, loc.lng);
  };

  const handleToggleFavorite = (loc: SavedLocation) => {
    const newVal = !loc.is_favorite;
    setSavedLocations((prev) =>
      prev.map((l) => (l.id === loc.id ? { ...l, is_favorite: newVal } : l))
    );
    fetch(`/api/locations/${loc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: newVal }),
    }).catch(() => {
      setSavedLocations((prev) =>
        prev.map((l) =>
          l.id === loc.id ? { ...l, is_favorite: !newVal } : l
        )
      );
    });
  };

  const favorites = savedLocations.filter((l) => l.is_favorite);
  const recents = savedLocations.filter((l) => !l.is_favorite);

  return (
    <div className="space-y-4">
      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSaved(!showSaved)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
          >
            <span>{showSaved ? "\u25BE" : "\u25B8"}</span>
            Saved Locations ({savedLocations.length})
          </button>

          {showSaved && (
            <div className="space-y-3">
              {favorites.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Favorites
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectSaved(loc)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-sm text-yellow-800 hover:bg-yellow-100 transition-colors"
                      >
                        <span className="text-yellow-500">{"\u2605"}</span>
                        <span className="truncate max-w-[200px]">
                          {loc.label}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(loc);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              handleToggleFavorite(loc);
                            }
                          }}
                          className="ml-1 text-yellow-400 hover:text-yellow-600"
                          title="Remove from favorites"
                        >
                          {"\u2715"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {recents.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Recent
                  </p>
                  <div className="space-y-1">
                    {recents.slice(0, 5).map((loc) => (
                      <div
                        key={loc.id}
                        className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => handleSelectSaved(loc)}
                      >
                        <span className="text-sm text-gray-700 truncate">
                          {loc.label}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(loc);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              handleToggleFavorite(loc);
                            }
                          }}
                          className="text-gray-400 hover:text-yellow-500 ml-2"
                          title="Add to favorites"
                        >
                          {"\u2606"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map with Search Overlay */}
      <div className="relative rounded-lg overflow-hidden border border-gray-300">
        {/* Search overlay on top of map */}
        <div className="absolute top-3 left-14 right-3 z-[1000]">
          <div className="relative">
            <input
              id="address-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search for an address or place..."
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="text-sm text-gray-900">
                      {result.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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

      {/* Display Address */}
      <div className="space-y-2">
        <div>
          <label
            htmlFor="display-address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Display Address
          </label>
          <input
            id="display-address"
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

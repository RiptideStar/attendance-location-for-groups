// Geolocation verification utilities
// Uses the Haversine formula to calculate distance between two coordinates

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param coord1 First coordinate (lat, lng)
 * @param coord2 Second coordinate (lat, lng)
 * @returns Distance in meters
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180; // φ, λ in radians
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}

/**
 * Check if user coordinates are within the specified radius of event location
 * @param userCoords User's current coordinates
 * @param eventCoords Event location coordinates
 * @param radiusMeters Allowed radius in meters
 * @returns true if within radius, false otherwise
 */
export function isWithinRadius(
  userCoords: Coordinates,
  eventCoords: Coordinates,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userCoords, eventCoords);
  return distance <= radiusMeters;
}

/**
 * Validate latitude value
 * @param lat Latitude value
 * @returns true if valid, false otherwise
 */
export function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

/**
 * Validate longitude value
 * @param lng Longitude value
 * @returns true if valid, false otherwise
 */
export function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

/**
 * Validate coordinates
 * @param coords Coordinates to validate
 * @returns true if valid, false otherwise
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return isValidLatitude(coords.lat) && isValidLongitude(coords.lng);
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string (e.g., "50m" or "1.2km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

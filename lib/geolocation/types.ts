// Geolocation-related types

export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  PERMISSION_DENIED: 1;
  POSITION_UNAVAILABLE: 2;
  TIMEOUT: 3;
}

export interface LocationVerificationResult {
  success: boolean;
  distance?: number; // Distance in meters
  error?: string;
  coords?: {
    lat: number;
    lng: number;
  };
}

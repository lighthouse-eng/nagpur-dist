import { RAMTEK_COORDINATES, MAX_RADIUS_KM, UserCoordinates } from '../types';
import { getExactVillageLocation } from '../data/villageCoordinatesRegistry';

/**
 * Calculate Great-Circle distance between two points in Kilometers using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  // Keep 4 decimal places for exact sorting when two schools have similar distances
  return Math.round(d * 10000) / 10000;
}

/**
 * Calculates distance from Ramtek
 */
export function getDistanceFromRamtek(lat: number, lng: number): number {
  return calculateHaversineDistance(RAMTEK_COORDINATES.latitude, RAMTEK_COORDINATES.longitude, lat, lng);
}

/**
 * Check if a location is within 200 KM radius of Ramtek
 */
export function isWithinRamtek200Km(lat: number, lng: number): boolean {
  const dist = getDistanceFromRamtek(lat, lng);
  return dist <= MAX_RADIUS_KM;
}

/**
 * Normalize block name according to rules:
 * - Always display NAGPUR even if raw input contains NAGPUR (GRAMIN) or NAGPUR GRAMIN / RURAL
 */
export function normalizeBlockName(rawBlock: string): string {
  if (!rawBlock) return 'NAGPUR';
  const clean = rawBlock.trim().toUpperCase();
  if (
    clean.includes('NAGPUR (GRAMIN)') ||
    clean.includes('NAGPUR GRAMIN') ||
    clean.includes('NAGPUR RURAL') ||
    clean === 'NAGPUR'
  ) {
    return 'NAGPUR';
  }
  return clean;
}

export const LOCATION_REQUIRED_MESSAGE =
  'Please enable location to get directions from your current location.';

/**
 * Generate Google Maps navigation link strictly using:
 * Origin = user's current GPS location
 * Destination = selected school's exact latitude and longitude
 *
 * If user coordinates are not available, returns an empty string to prevent
 * falling back to saved/previous Google Maps locations or Ramtek.
 */
export function getGoogleMapsDirectionUrl(
  destLat: number,
  destLng: number,
  userCoords?: UserCoordinates | null
): string {
  if (userCoords?.latitude != null && userCoords?.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${destLat},${destLng}&travelmode=driving`;
  }
  return '';
}

/**
 * Opens Google Maps directions from user's current GPS location to destination coords.
 * If userCoords is not yet acquired, actively attempts to retrieve current GPS position.
 * If permission is denied or unavailable, triggers onError callback with:
 * "Please enable location to get directions from your current location."
 */
export function openSchoolDirection(
  destLat: number,
  destLng: number,
  userCoords: UserCoordinates | null | undefined,
  onCoordsAcquired?: (coords: UserCoordinates) => void,
  onError?: (msg: string) => void
): void {
  const errorMsg = LOCATION_REQUIRED_MESSAGE;

  // 1. If GPS location is already active, open directions immediately
  if (userCoords?.latitude != null && userCoords?.longitude != null) {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${destLat},${destLng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. Geolocation API check
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.(errorMsg);
    try {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(errorMsg);
      }
    } catch {
      // ignore
    }
    return;
  }

  // 3. Request current GPS coordinates
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords: UserCoordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
      onCoordsAcquired?.(coords);
      const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.latitude},${coords.longitude}&destination=${destLat},${destLng}&travelmode=driving`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    (_err) => {
      onError?.(errorMsg);
      try {
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(errorMsg);
        }
      } catch {
        // ignore
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
}

/**
 * Format distance cleanly: e.g. "0.8 km", "2.4 km", "15.0 km"
 * Supports optional meter display or standard km representation per prompt example (0.8 km -> School A).
 */
export function formatDistance(km: number | null | undefined, preferKm: boolean = true): string {
  if (km === null || km === undefined || isNaN(km)) return 'N/A';
  if (!preferKm && km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Returns the effective corrected coordinates and locationType for a school:
 * 1. If exact School Location is verified -> returns verified coordinates, locationType: 'School', isVerified: true.
 * 2. If exact School Location is unavailable -> uses the EXACT Village Location from that school's Village field.
 *    Strictly prevents using another/nearby village or random coordinates.
 *    Returns locationType: 'Village', isVerified: false.
 */
export function getSchoolCoordinates(school: {
  latitude: number;
  longitude: number;
  village?: string;
  block?: string;
  locationVerified?: boolean;
  locationType?: 'School' | 'Village';
  verifiedLatitude?: number | null;
  verifiedLongitude?: number | null;
}): { lat: number; lng: number; isVerified: boolean; locationType: 'School' | 'Village' } {
  // 1. First priority: Exact verified School Location
  if (
    school.locationVerified &&
    school.verifiedLatitude != null &&
    school.verifiedLongitude != null &&
    !isNaN(school.verifiedLatitude) &&
    !isNaN(school.verifiedLongitude) &&
    school.verifiedLatitude !== 0 &&
    school.verifiedLongitude !== 0
  ) {
    return {
      lat: school.verifiedLatitude,
      lng: school.verifiedLongitude,
      isVerified: true,
      locationType: 'School',
    };
  }

  // 2. Second priority: EXACT Village Location from that school's Village field
  const villageMatch = getExactVillageLocation(school.block, school.village);
  if (villageMatch && villageMatch.latitude && villageMatch.longitude) {
    return {
      lat: villageMatch.latitude,
      lng: villageMatch.longitude,
      isVerified: false,
      locationType: 'Village',
    };
  }

  // Fallback to school record coordinates if village directory entry not found
  const validLat = typeof school.latitude === 'number' && !isNaN(school.latitude) ? school.latitude : RAMTEK_COORDINATES.latitude;
  const validLng = typeof school.longitude === 'number' && !isNaN(school.longitude) ? school.longitude : RAMTEK_COORDINATES.longitude;

  return {
    lat: validLat,
    lng: validLng,
    isVerified: false,
    locationType: 'Village',
  };
}

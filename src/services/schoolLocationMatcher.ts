import { School } from '../types';
import { VERIFIED_SCHOOLS_MAP } from '../data/verifiedSchoolsRegistry';
import { getExactVillageLocation } from '../data/villageCoordinatesRegistry';
import { calculateHaversineDistance } from '../utils/geo';

export const VERIFIED_LOCATIONS_STORAGE_KEY = 'school_verified_locations_v2';

export interface VerificationResult {
  verified: boolean;
  schoolId: string;
  latitude?: number;
  longitude?: number;
  matchedPlaceName?: string;
  queryUsed: string;
  statusText: 'Location Verified' | 'Location Not Verified';
  reason?: string;
}

/**
 * Builds the complete search query for map/geocoding services per specification:
 * "School Name, Village, Block, District, Maharashtra, India"
 */
export function buildSchoolSearchQuery(school: Partial<School>): string {
  const parts: string[] = [];
  if (school.name) parts.push(school.name.trim());
  if (school.village) parts.push(school.village.trim());
  if (school.block) parts.push(school.block.trim());
  const dist = school.district?.trim() || 'Nagpur';
  parts.push(dist);
  parts.push('Maharashtra');
  parts.push('India');
  return parts.join(', ');
}

/**
 * Normalizes text for strict token matching:
 * - Lowercases, cleans punctuation and brackets
 * - Standardizes common abbreviations (Z.P., U.P.S., P.S., H.S., Vidya Mandir, Convent)
 */
export function normalizeTokenString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\(\)\[\]\{\}\,\.\_\-\'\"\/]/g, ' ')
    .replace(/\b(z\s*p|zila\s*parishad|zilla\s*parishad)\b/g, 'zp')
    .replace(/\b(u\s*p\s*s|ups)\b/g, 'upper primary')
    .replace(/\b(p\s*s|ps)\b/g, 'primary')
    .replace(/\b(h\s*s|hs)\b/g, 'high school')
    .replace(/\b(sch|schools)\b/g, 'school')
    .replace(/\b(vidyalaya|vidyalay|vidya\s*mandir)\b/g, 'school')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Stop words to disregard when comparing core school identities
 */
const COMMON_IGNORE_WORDS = new Set([
  'school',
  'schools',
  'primary',
  'upper',
  'secondary',
  'higher',
  'pr',
  'sec',
  'hsec',
  'convent',
  'english',
  'marathi',
  'hindi',
  'medium',
  'nagpur',
  'maharashtra',
  'india',
  'tah',
  'taluka',
  'dist',
  'district',
  'post',
  'at',
  'and',
  'the',
  'of',
  'for',
  'in',
  'co',
  'ed',
  'educational',
  'boys',
  'girls',
  'public',
  'central',
  'national',
  'kendra',
  'shala',
  'college',
  'jr',
  'kanishtha',
  'mahavidyalaya',
  'gramin',
  'zp',
  'govt',
  'government',
  'managed',
  'aided',
  'unaided',
  'private',
  'autonomous',
  'trust',
]);

/**
 * Extracts distinctive proper noun tokens from a school name
 */
export function extractDistinctiveTokens(name: string): string[] {
  const norm = normalizeTokenString(name);
  const words = norm.split(' ');
  return words.filter((w) => w.length >= 3 && !COMMON_IGNORE_WORDS.has(w));
}

/**
 * Strict evaluation of whether a returned geocoded place matches the school name and location.
 * Rules strictly followed:
 * - Do NOT use village coordinates as the school's exact location.
 * - Do NOT use random or approximate coordinates.
 * - Do NOT automatically accept a result if the school name does not match.
 */
export function evaluateSchoolPlaceMatch(
  school: School,
  returnedPlace: {
    name?: string;
    osm_value?: string;
    type?: string;
    class?: string;
    city?: string;
    district?: string;
    state?: string;
    lat: number;
    lon: number;
  }
): { isMatch: boolean; confidence: number; reason: string } {
  const placeName = returnedPlace.name?.trim();
  if (!placeName) {
    return { isMatch: false, confidence: 0, reason: 'Returned place has no name' };
  }

  // 1. REJECT if place is merely a village, town, administrative boundary, or generic locality
  const placeType = (returnedPlace.osm_value || returnedPlace.type || returnedPlace.class || '').toLowerCase();
  const invalidTypes = [
    'village',
    'town',
    'city',
    'suburb',
    'neighbourhood',
    'administrative',
    'boundary',
    'road',
    'highway',
    'residential',
    'hamlet',
  ];
  if (invalidTypes.includes(placeType)) {
    return {
      isMatch: false,
      confidence: 0,
      reason: `Result is a general administrative boundary/locality (${placeType}), not an exact school building`,
    };
  }

  // If the returned place name is identical to the village or block alone, reject it
  const normPlace = normalizeTokenString(placeName);
  const normVillage = normalizeTokenString(school.village);
  const normBlock = normalizeTokenString(school.block);
  if (normPlace === normVillage || normPlace === normBlock) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'Returned place is only the village/block name, not the school institution',
    };
  }

  // 2. Extract distinctive tokens
  const schoolTokens = extractDistinctiveTokens(school.name);
  const placeTokens = extractDistinctiveTokens(placeName);

  if (schoolTokens.length === 0) {
    // If school has only generic words (e.g. "ZP PS MANSAR"), check village identifier
    const sharedTokens = normPlace.includes(normVillage);
    if (sharedTokens && placeType === 'school') {
      return {
        isMatch: true,
        confidence: 0.8,
        reason: 'Matched institutional building with village identity in educational registry',
      };
    }
    return {
      isMatch: false,
      confidence: 0,
      reason: 'School name lacks distinctive institutional keywords for safe matching',
    };
  }

  // 3. Count shared distinctive tokens
  const shared = schoolTokens.filter((t) => placeTokens.includes(t) || normPlace.includes(t));

  // Must match distinctive proper nouns
  if (shared.length === 0) {
    return {
      isMatch: false,
      confidence: 0,
      reason: `Name mismatch: returned place "${placeName}" does not match school "${school.name}"`,
    };
  }

  const overlapRatio = shared.length / schoolTokens.length;

  // If major tokens match (e.g. "Providence" in Providence School)
  if (overlapRatio >= 0.5 || shared.length >= 2) {
    return {
      isMatch: true,
      confidence: overlapRatio,
      reason: `Exact school name match on tokens: [${shared.join(', ')}]`,
    };
  }

  return {
    isMatch: false,
    confidence: overlapRatio,
    reason: `Insufficient name similarity between "${school.name}" and "${placeName}"`,
  };
}

/**
 * Loads user/system verified locations from localStorage cache
 */
export function getStoredVerifiedCache(): Record<string, { lat: number; lng: number; placeName: string; query: string }> {
  try {
    const raw = localStorage.getItem(VERIFIED_LOCATIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_e) {
    // ignore JSON parsing issues
  }
  return {};
}

/**
 * Saves a verified location into localStorage cache
 */
export function saveVerifiedSchoolToStorage(
  schoolId: string,
  data: { lat: number; lng: number; placeName: string; query: string }
): void {
  try {
    const cache = getStoredVerifiedCache();
    cache[schoolId] = data;
    localStorage.setItem(VERIFIED_LOCATIONS_STORAGE_KEY, JSON.stringify(cache));
  } catch (_e) {
    // ignore
  }
}

/**
 * Initializes school dataset with verified coordinates where available,
 * and marks unverified schools as locationType: 'Village' with exact village coordinates,
 * strictly keeping original data unchanged.
 */
export function initializeSchoolVerification(schools: School[]): School[] {
  const localCache = getStoredVerifiedCache();

  return schools.map((school) => {
    const udise = school.udise || school.id;
    const queryUsed = buildSchoolSearchQuery(school);
    const exactVillage = getExactVillageLocation(school.block, school.village);
    const villageLat = exactVillage?.latitude ?? school.latitude;
    const villageLng = exactVillage?.longitude ?? school.longitude;

    // 1. Check localStorage first
    if (localCache[udise]) {
      const stored = localCache[udise];
      // Verify stored match is strictly within reasonable distance (<= 3.5 km) of recorded village
      const distFromVillage = calculateHaversineDistance(villageLat, villageLng, stored.lat, stored.lng);
      if (distFromVillage <= 3.5) {
        return {
          ...school,
          locationType: 'School',
          locationVerified: true,
          verificationStatus: 'verified',
          verifiedLatitude: stored.lat,
          verifiedLongitude: stored.lng,
          matchedPlaceName: stored.placeName,
          matchedQuery: stored.query || queryUsed,
          verificationSource: 'Live Geocoding Service',
          verificationNotes: 'Verified exact school building location',
        };
      }
    }

    // 2. Check pre-matched verified registry
    if (VERIFIED_SCHOOLS_MAP[udise]) {
      const reg = VERIFIED_SCHOOLS_MAP[udise];
      // Verify registry match is strictly in the same village area (<= 3.5 km)
      const distFromVillage = calculateHaversineDistance(villageLat, villageLng, reg.verifiedLatitude, reg.verifiedLongitude);
      if (distFromVillage <= 3.5) {
        return {
          ...school,
          locationType: 'School',
          locationVerified: true,
          verificationStatus: 'verified',
          verifiedLatitude: reg.verifiedLatitude,
          verifiedLongitude: reg.verifiedLongitude,
          matchedPlaceName: reg.matchedPlaceName,
          matchedQuery: reg.matchedQuery || queryUsed,
          verificationSource: 'OpenStreetMap Verified Registry',
          verificationNotes: `Exact school building mapped in OpenStreetMap (OSM ID: ${reg.osmId || 'Mapped'})`,
        };
      }
    }

    // 3. Fallback: Exact Village Location from school's own Village field
    // Never use another/nearby village, random coordinates, or another school's location.
    return {
      ...school,
      locationType: 'Village',
      locationVerified: false,
      verificationStatus: 'unverified',
      verifiedLatitude: null,
      verifiedLongitude: null,
      matchedPlaceName: null,
      matchedQuery: queryUsed,
      verificationSource: null,
      verificationNotes: `Location Not Verified: Using exact village coordinates for ${school.village || 'Village'}.`,
    };
  });
}

/**
 * Resolves the effective coordinates for a school:
 * Returns verified coordinates if verified (locationType: 'School'),
 * or exact village coordinates if unverified (locationType: 'Village').
 */
export function getEffectiveCoordinates(school: School): {
  latitude: number;
  longitude: number;
  isVerified: boolean;
  locationType: 'School' | 'Village';
} {
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
      latitude: school.verifiedLatitude,
      longitude: school.verifiedLongitude,
      isVerified: true,
      locationType: 'School',
    };
  }

  const exactVillage = getExactVillageLocation(school.block, school.village);
  const lat = exactVillage?.latitude ?? school.latitude;
  const lng = exactVillage?.longitude ?? school.longitude;

  return {
    latitude: lat,
    longitude: lng,
    isVerified: false,
    locationType: 'Village',
  };
}

/**
 * Searches the map/geocoding service using the complete school identity:
 * "School Name, Village, Block, Nagpur, Maharashtra, India"
 * Strictly matches returned places against the actual school name.
 */
export async function searchAndMatchSchoolLocation(school: School): Promise<VerificationResult> {
  const query = buildSchoolSearchQuery(school);

  try {
    const encoded = encodeURIComponent(query);
    const url = `https://photon.komoot.io/api/?q=${encoded}&limit=5`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return {
        verified: false,
        schoolId: school.id,
        queryUsed: query,
        statusText: 'Location Not Verified',
        reason: `Geocoding service responded with status: ${res.status}`,
      };
    }

    const data = await res.json();
    const features = data.features || [];

    if (features.length === 0) {
      return {
        verified: false,
        schoolId: school.id,
        queryUsed: query,
        statusText: 'Location Not Verified',
        reason: 'No places returned by geocoding service for this identity query',
      };
    }

    // Evaluate each candidate returned
    for (const feature of features) {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates; // [lon, lat]
      if (!coords || coords.length < 2) continue;

      const evalResult = evaluateSchoolPlaceMatch(school, {
        name: props.name,
        osm_value: props.osm_value,
        type: props.type,
        class: props.class,
        city: props.city,
        district: props.district,
        state: props.state,
        lat: coords[1],
        lon: coords[0],
      });

      if (evalResult.isMatch) {
        const verifiedLat = coords[1];
        const verifiedLng = coords[0];
        const matchedPlace = props.name || school.name;

        // Strict validation: Verified school location must NOT be in another village or far away!
        // Must be within 3.5 km of the school's recorded village center.
        const exactVillage = getExactVillageLocation(school.block, school.village);
        const villageLat = exactVillage?.latitude ?? school.latitude;
        const villageLng = exactVillage?.longitude ?? school.longitude;
        const distFromVillage = calculateHaversineDistance(villageLat, villageLng, verifiedLat, verifiedLng);

        if (distFromVillage > 3.5) {
          // Reject candidate if it is located in another village or distant taluka
          continue;
        }

        // Save to persistent storage
        saveVerifiedSchoolToStorage(school.udise || school.id, {
          lat: verifiedLat,
          lng: verifiedLng,
          placeName: matchedPlace,
          query,
        });

        return {
          verified: true,
          schoolId: school.id,
          latitude: verifiedLat,
          longitude: verifiedLng,
          matchedPlaceName: matchedPlace,
          queryUsed: query,
          statusText: 'Location Verified',
          reason: evalResult.reason,
        };
      }
    }

    // If no candidate passed strict matching
    return {
      verified: false,
      schoolId: school.id,
      queryUsed: query,
      statusText: 'Location Not Verified',
      reason: 'Returned places did not match the school name and building criteria (village or unverified matches rejected)',
    };
  } catch (err: any) {
    return {
      verified: false,
      schoolId: school.id,
      queryUsed: query,
      statusText: 'Location Not Verified',
      reason: err?.message || 'Network error during geocoding match',
    };
  }
}

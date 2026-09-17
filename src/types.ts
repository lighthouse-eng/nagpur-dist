export interface School {
  id: string;
  name: string;
  udise: string;
  district: string;
  block: string;
  cluster: string;
  village: string;
  pin: string;
  address: string;
  management: string;
  category: string;
  type: string; // Co-educational / Boys / Girls
  classFrom: number;
  classTo: number;
  ruralUrban: 'Rural' | 'Urban' | string;
  status: string;
  latitude: number;
  longitude: number;
  distanceUserKm?: number | null;
  distanceRamtekKm: number;
  isWithin200KmRamtek: boolean;
  email?: string;
  srNo?: string | number;
  lgdVillage?: string;
  lgdPanchayat?: string;
  lgdBlock?: string;
  // School Location Matching Engine fields
  locationType?: 'School' | 'Village';
  locationVerified?: boolean;
  verificationStatus?: 'verified' | 'unverified';
  verifiedLatitude?: number | null;
  verifiedLongitude?: number | null;
  matchedPlaceName?: string | null;
  matchedQuery?: string | null;
  verificationSource?: string | null;
  verificationNotes?: string | null;
}

export type ActiveTab = 'home' | 'search' | 'nearby' | 'map';

export interface UserCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface SearchFilters {
  query: string;
  district: string;
  block: string;
  village: string;
  classLevel: string; // 'all' | 'primary' (1-5) | 'upper_primary' (6-8) | 'secondary' (9-10) | 'higher_secondary' (11-12)
  ruralUrban: string; // 'all' | 'Rural' | 'Urban'
  category: string;
  verificationStatus?: 'all' | 'verified' | 'unverified';
  maxDistanceKm?: number | null; // for nearby radius
  within200KmOnly: boolean;
}

export const RAMTEK_COORDINATES = {
  latitude: 21.3970,
  longitude: 79.3292,
  name: 'Ramtek (Tehsil HQ)',
};

export const MAX_RADIUS_KM = 200;

export const OFFICIAL_BLOCKS = [
  'NARKHED',
  'KATOL',
  'KALMESHWAR',
  'SAONER',
  'KAMPTEE',
  'NAGPUR',
  'RAMTEK',
  'MOUDA',
  'PARSEONI',
  'HINGNA',
  'UMRED',
  'KUHI',
  'BHIWAPUR',
  'URC 1',
  'URC 2',
  'URC 3',
  'URC 4',
  'URC 5',
] as const;

export const NEARBY_RADIUS_OPTIONS = [1, 5, 10, 25, 50, 100, 200] as const;

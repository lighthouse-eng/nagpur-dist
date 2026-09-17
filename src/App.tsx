import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { NearbyView } from './components/NearbyView';
import { MapView } from './components/MapView';
import { SchoolDetailModal } from './components/SchoolDetailModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { LocationToast } from './components/LocationToast';
import { School, UserCoordinates, ActiveTab, SearchFilters, RAMTEK_COORDINATES, MAX_RADIUS_KM } from './types';
import { INITIAL_SAMPLE_SCHOOLS } from './data/sampleSchools';
import {
  calculateHaversineDistance,
  openSchoolDirection,
  LOCATION_REQUIRED_MESSAGE,
  getSchoolCoordinates,
} from './utils/geo';
import {
  initializeSchoolVerification,
  searchAndMatchSchoolLocation,
} from './services/schoolLocationMatcher';
import { Home, Search, Navigation2, Map as MapIcon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [rawSchools, setRawSchools] = useState<School[]>(() =>
    initializeSchoolVerification(INITIAL_SAMPLE_SCHOOLS)
  );
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<Partial<SearchFilters>>({});

  // Request GPS location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = LOCATION_REQUIRED_MESSAGE;
      setGeoError(msg);
      return;
    }

    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setGeoError(null);
      },
      (_err) => {
        setGeoError(LOCATION_REQUIRED_MESSAGE);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Handler for direction requests strictly requiring GPS location
  // Uses verified coordinates if location is verified, otherwise original coordinates
  const handleTriggerDirection = useCallback(
    (school: School) => {
      const coords = getSchoolCoordinates(school);
      openSchoolDirection(
        coords.lat,
        coords.lng,
        userCoords,
        (newCoords) => {
          setUserCoords(newCoords);
          setGeoError(null);
        },
        (errMsg) => {
          setGeoError(errMsg);
          setLocationToast(errMsg);
        }
      );
    },
    [userCoords]
  );

  // Request location on first mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Compute schools with updated distance from user & Ramtek using verified or record coords
  const schools = useMemo(() => {
    return rawSchools.map((school) => {
      const coords = getSchoolCoordinates(school);
      let distanceUserKm: number | null = null;
      if (userCoords) {
        distanceUserKm = calculateHaversineDistance(
          userCoords.latitude,
          userCoords.longitude,
          coords.lat,
          coords.lng
        );
      }
      const distanceRamtekKm = calculateHaversineDistance(
        RAMTEK_COORDINATES.latitude,
        RAMTEK_COORDINATES.longitude,
        coords.lat,
        coords.lng
      );
      const isWithin200KmRamtek = distanceRamtekKm <= MAX_RADIUS_KM;

      return {
        ...school,
        locationType: coords.locationType,
        distanceUserKm,
        distanceRamtekKm,
        isWithin200KmRamtek,
      };
    });
  }, [rawSchools, userCoords]);

  // Count verified schools
  const verifiedCount = useMemo(() => {
    return schools.filter((s) => s.locationVerified && s.locationType === 'School').length;
  }, [schools]);

  // Handle individual school location verification check
  const handleVerifySchool = useCallback(
    async (schoolToVerify: School) => {
      const result = await searchAndMatchSchoolLocation(schoolToVerify);
      setRawSchools((prev) =>
        prev.map((s) => {
          if (s.id !== schoolToVerify.id) return s;
          if (result.verified && result.latitude != null && result.longitude != null) {
            return {
              ...s,
              locationType: 'School',
              locationVerified: true,
              verificationStatus: 'verified',
              verifiedLatitude: result.latitude,
              verifiedLongitude: result.longitude,
              matchedPlaceName: result.matchedPlaceName || s.name,
              matchedQuery: result.queryUsed,
              verificationSource: 'Live Geocoder Search',
              verificationNotes: result.reason,
            };
          } else {
            return {
              ...s,
              locationType: 'Village',
              locationVerified: false,
              verificationStatus: 'unverified',
              matchedQuery: result.queryUsed,
              verificationNotes: result.reason,
            };
          }
        })
      );
      setSelectedSchool((prev) => {
        if (!prev || prev.id !== schoolToVerify.id) return prev;
        if (result.verified && result.latitude != null && result.longitude != null) {
          return {
            ...prev,
            locationType: 'School',
            locationVerified: true,
            verificationStatus: 'verified',
            verifiedLatitude: result.latitude,
            verifiedLongitude: result.longitude,
            matchedPlaceName: result.matchedPlaceName || prev.name,
            matchedQuery: result.queryUsed,
            verificationSource: 'Live Geocoder Search',
            verificationNotes: result.reason,
          };
        } else {
          return {
            ...prev,
            locationType: 'Village',
            locationVerified: false,
            verificationStatus: 'unverified',
            matchedQuery: result.queryUsed,
            verificationNotes: result.reason,
          };
        }
      });
    },
    []
  );

  // Handle switching to map with a specific school focused
  const handleViewOnMap = (school: School) => {
    setSelectedSchool(school);
    setActiveTab('map');
  };

  // Quick filter from home
  const handleQuickFilter = (key: string, val: string) => {
    setSearchFilters((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const navItems = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'search' as ActiveTab, label: 'Search', icon: Search },
    { id: 'nearby' as ActiveTab, label: 'Nearby', icon: Navigation2 },
    { id: 'map' as ActiveTab, label: 'Map', icon: MapIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* App Header */}
      <Header
        userCoords={userCoords}
        geoError={geoError}
        onRequestLocation={requestLocation}
        onOpenUpload={() => setIsCsvModalOpen(true)}
        totalSchools={schools.length}
        verifiedCount={verifiedCount}
      />

      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`desktop-tab-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            <span>Ramtek HQ Radius: </span>
            <strong className="text-amber-700">200 KM Fixed</strong>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <HomeView
            schools={schools}
            userCoords={userCoords}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectSchool={(school) => setSelectedSchool(school)}
            onViewOnMap={handleViewOnMap}
            onOpenUpload={() => setIsCsvModalOpen(true)}
            onQuickFilter={handleQuickFilter}
            onTriggerDirection={handleTriggerDirection}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            schools={schools}
            userCoords={userCoords}
            onSelectSchool={(school) => setSelectedSchool(school)}
            onViewOnMap={handleViewOnMap}
            initialFilters={searchFilters}
            onTriggerDirection={handleTriggerDirection}
          />
        )}

        {activeTab === 'nearby' && (
          <NearbyView
            schools={schools}
            userCoords={userCoords}
            geoError={geoError}
            onRequestLocation={requestLocation}
            onSelectSchool={(school) => setSelectedSchool(school)}
            onViewOnMap={handleViewOnMap}
            onTriggerDirection={handleTriggerDirection}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            schools={schools}
            userCoords={userCoords}
            onSelectSchool={(school) => setSelectedSchool(school)}
            onRequestLocation={requestLocation}
            selectedSchool={selectedSchool}
            onTriggerDirection={handleTriggerDirection}
            onVerifySchool={handleVerifySchool}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        nearbyCount={schools.length}
      />

      {/* School Detail Modal */}
      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          userCoords={userCoords}
          onViewOnMap={handleViewOnMap}
          onTriggerDirection={handleTriggerDirection}
          onVerifySchool={handleVerifySchool}
        />
      )}

      {/* GPS Location Warning Toast */}
      <LocationToast
        message={locationToast}
        onClose={() => setLocationToast(null)}
        onEnableLocation={requestLocation}
      />

      {/* Phase 2 CSV Upload Modal */}
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSchoolsLoaded={(newSchools) => setRawSchools(initializeSchoolVerification(newSchools))}
        currentCount={schools.length}
      />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  Navigation2,
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { School, UserCoordinates, NEARBY_RADIUS_OPTIONS, RAMTEK_COORDINATES } from '../types';
import { formatDistance, getGoogleMapsDirectionUrl, getSchoolCoordinates } from '../utils/geo';

interface NearbyViewProps {
  schools: School[];
  userCoords: UserCoordinates | null;
  geoError: string | null;
  onRequestLocation: () => void;
  onSelectSchool: (school: School) => void;
  onViewOnMap: (school: School) => void;
  onTriggerDirection?: (school: School) => void;
}

export const NearbyView: React.FC<NearbyViewProps> = ({
  schools,
  userCoords,
  geoError,
  onRequestLocation,
  onSelectSchool,
  onViewOnMap,
  onTriggerDirection,
}) => {
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter by radius and search query, then sort ascending by user GPS distance (or Ramtek distance if GPS off)
  // All schools use their corrected School or Village location
  const sortedAndFilteredSchools = useMemo(() => {
    return schools
      .filter((school) => {
        // If user GPS is active, only show schools within the selected radius from current GPS location
        if (userCoords && school.distanceUserKm != null) {
          if (school.distanceUserKm > selectedRadiusKm) return false;
        }

        // Optional search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = school.name.toLowerCase().includes(q);
          const matchUdise = school.udise.includes(q);
          const matchVillage = school.village.toLowerCase().includes(q);
          const matchBlock = school.block.toLowerCase().includes(q);
          if (!matchName && !matchUdise && !matchVillage && !matchBlock) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort strictly by distance in ASCENDING order (closest first)
        const distA = a.distanceUserKm ?? a.distanceRamtekKm ?? Number.MAX_VALUE;
        const distB = b.distanceUserKm ?? b.distanceRamtekKm ?? Number.MAX_VALUE;
        if (distA !== distB) {
          return distA - distB;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [schools, userCoords, selectedRadiusKm, searchQuery]);

  return (
    <div id="nearby-view" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* GPS Status Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                userCoords
                  ? 'bg-emerald-50 text-emerald-600'
                  : geoError
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-sky-50 text-sky-600'
              }`}
            >
              <Navigation2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {userCoords ? 'Live GPS Position Active' : 'GPS Location Required for Nearby'}
                </h2>
                {userCoords && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {userCoords
                  ? `Lat: ${userCoords.latitude.toFixed(4)}°, Lng: ${userCoords.longitude.toFixed(4)}° • Measuring proximity from your phone / device`
                  : geoError
                  ? geoError
                  : 'Enable GPS location to calculate exact distance and turn-by-turn routes to nearby schools.'}
              </p>
            </div>
          </div>

          <button
            id="nearby-detect-gps-btn"
            type="button"
            onClick={onRequestLocation}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-sm active:scale-95 flex-shrink-0"
          >
            <MapPin className="w-4 h-4" />
            <span>{userCoords ? 'Refresh GPS Location' : 'Detect My Location'}</span>
          </button>
        </div>
      </div>

      {/* Radius Filters: 1 / 5 / 10 / 25 / 50 / 100 / 200 KM */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Proximity Radius Filter
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Showing verified schools within {selectedRadiusKm} KM{' '}
              <span className="text-slate-500 font-normal">
                {userCoords ? 'from your current GPS location' : '(Enable GPS to calculate exact proximity)'}
              </span>
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Found <strong className="text-sky-700">{sortedAndFilteredSchools.length}</strong> verified schools
          </span>
        </div>

        {/* Radius Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {NEARBY_RADIUS_OPTIONS.map((km) => {
            const isSelected = selectedRadiusKm === km;
            return (
              <button
                key={km}
                id={`nearby-radius-${km}km`}
                type="button"
                onClick={() => setSelectedRadiusKm(km)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex-shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {km} KM
              </button>
            );
          })}
        </div>
      </div>

      {/* Schools List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Nearest Schools ({sortedAndFilteredSchools.length})
          </h3>
          <span className="text-xs text-slate-400">
            Sorted by shortest distance
          </span>
        </div>

        {sortedAndFilteredSchools.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Navigation2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No schools within {selectedRadiusKm} KM</h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Try expanding your radius filter to 50 KM, 100 KM, or 200 KM, or adjust your GPS location.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRadiusKm(100)}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
              >
                Expand to 100 KM
              </button>
              <button
                type="button"
                onClick={() => setSelectedRadiusKm(200)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                Expand to 200 KM
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedAndFilteredSchools.map((school, index) => {
              const coords = getSchoolCoordinates(school);
              const isVerified = coords.isVerified;
              const dirUrl = getGoogleMapsDirectionUrl(coords.lat, coords.lng, userCoords);
              const uniqueKey = `${school.block}-${school.udise}-${school.id || index}`;
              return (
                <div
                  key={uniqueKey}
                  id={`nearby-school-card-${school.id}`}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Rank, Block & Distance */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                          #{index + 1}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                          {school.block}
                        </span>
                        {isVerified && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[10px] inline-flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>School Location</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {school.distanceUserKm != null && (
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold text-xs tracking-tight shadow-sm">
                            {formatDistance(school.distanceUserKm)}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          {school.udise}
                        </span>
                      </div>
                    </div>

                    {/* School Name */}
                    <h4
                      onClick={() => onSelectSchool(school)}
                      className="text-base font-bold text-slate-900 leading-snug hover:text-sky-600 cursor-pointer transition-colors flex items-start gap-1.5"
                    >
                      <span className="text-base flex-shrink-0">🏫</span>
                      <span>{school.name}</span>
                    </h4>

                    {/* Village, Block & Distance Details */}
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-slate-500 font-medium">📍 Village:</span>
                        <strong className="text-slate-900 font-semibold">{school.village}</strong>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-slate-500 font-medium">📌 Block:</span>
                        <span className="text-slate-800 font-semibold">{school.block}</span>
                        <span className="text-slate-400">• {school.district}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-slate-500 font-medium">📏 Distance:</span>
                        <span className="font-bold text-sky-800">
                          {school.distanceUserKm != null
                            ? `${formatDistance(school.distanceUserKm)} (from My Location)`
                            : `${formatDistance(school.distanceRamtekKm)} (from Ramtek)`}
                        </span>
                      </p>
                    </div>

                    {/* Location Verification Pill */}
                    {isVerified ? (
                      <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] flex items-center gap-1.5 border border-emerald-200 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">School Location (Verified exact building)</span>
                      </div>
                    ) : (
                      <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-red-50 text-red-800 text-[11px] flex items-center justify-between border border-red-200 font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-600 inline-block flex-shrink-0 animate-pulse"></span>
                          <span>Village Location ({school.village})</span>
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Fallback</span>
                      </div>
                    )}

                    {/* Distance Metric Cards */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="bg-sky-50/80 rounded-xl p-2.5 border border-sky-100">
                        <span className="text-[10px] uppercase font-bold text-sky-800 block">
                          From My Location
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-sky-900">
                          {school.distanceUserKm != null ? formatDistance(school.distanceUserKm) : 'GPS Off'}
                        </span>
                      </div>
                      <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-100">
                        <span className="text-[10px] uppercase font-bold text-amber-800 block">
                          From Ramtek HQ
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-amber-900">
                          {formatDistance(school.distanceRamtekKm)}
                        </span>
                      </div>
                    </div>

                    {/* Key Attributes */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                        Class {school.classFrom}–{school.classTo}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                        {school.ruralUrban}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                        {school.category}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Get Direction & Details */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <a
                      id={`nearby-get-direction-${school.id}`}
                      href={dirUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!userCoords?.latitude || !userCoords?.longitude) {
                          e.preventDefault();
                          onTriggerDirection?.(school);
                        }
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Direction</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <button
                      type="button"
                      onClick={() => onSelectSchool(school)}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
                    >
                      Details
                    </button>

                    <button
                      type="button"
                      onClick={() => onViewOnMap(school)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                      title="View on Map"
                    >
                      <Compass className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

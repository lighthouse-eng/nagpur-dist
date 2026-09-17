import React, { useState } from 'react';
import {
  Search,
  Navigation2,
  Map,
  Compass,
  MapPin,
  Building2,
  Navigation,
  ExternalLink,
  ChevronRight,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  School,
  UserCoordinates,
  ActiveTab,
  OFFICIAL_BLOCKS,
  RAMTEK_COORDINATES,
} from '../types';
import { formatDistance, getGoogleMapsDirectionUrl } from '../utils/geo';

interface HomeViewProps {
  schools: School[];
  userCoords: UserCoordinates | null;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectSchool: (school: School) => void;
  onViewOnMap: (school: School) => void;
  onOpenUpload: () => void;
  onQuickFilter: (filterKey: string, val: string) => void;
  onTriggerDirection?: (school: School) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  schools,
  userCoords,
  onNavigateTab,
  onSelectSchool,
  onViewOnMap,
  onOpenUpload,
  onQuickFilter,
  onTriggerDirection,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');

  // Dynamic villages based on selected block
  const dynamicVillages = React.useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (selectedBlock === 'all' || s.block === selectedBlock) {
        if (s.village) set.add(s.village.trim());
      }
    });
    return Array.from(set).sort();
  }, [schools, selectedBlock]);

  // Count per block
  const blockCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    schools.forEach((s) => {
      counts[s.block] = (counts[s.block] || 0) + 1;
    });
    return counts;
  }, [schools]);

  // Handle instant search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onQuickFilter('query', searchQuery.trim());
      onNavigateTab('search');
    } else {
      onNavigateTab('search');
    }
  };

  const handleBlockChange = (block: string) => {
    setSelectedBlock(block);
    onQuickFilter('block', block);
  };

  // Recent/Top schools to preview on home
  const previewSchools = schools.slice(0, 6);

  return (
    <div id="home-view" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Hero Search & Action Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-3">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Field Inspection & Geographic Distance Engine</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Lighthouse School Visit
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Fast school locator with GPS proximity, Ramtek 200 KM boundary verification, and turn-by-turn navigation across all 18 Nagpur blocks.
          </p>

          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="mt-6">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                id="home-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search School Name / UDISE Code / Village..."
                className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white/20 transition-all shadow-inner"
              />
              <button
                id="home-search-submit-btn"
                type="submit"
                className="absolute right-2 px-4 py-2 sm:py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                Search
              </button>
            </div>
          </form>

          {/* Primary Action Buttons: Nearby Schools | Map | Search */}
          <div className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-4">
            {/* Nearby Schools Button */}
            <button
              id="home-btn-nearby"
              type="button"
              onClick={() => onNavigateTab('nearby')}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 sm:px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Navigation2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-center">Nearby Schools</span>
            </button>

            {/* Map Button */}
            <button
              id="home-btn-map"
              type="button"
              onClick={() => onNavigateTab('map')}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 sm:px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Map className="w-5 h-5 flex-shrink-0" />
              <span className="text-center">Map & Radius</span>
            </button>

            {/* Search Button */}
            <button
              id="home-btn-search"
              type="button"
              onClick={() => onNavigateTab('search')}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 sm:py-3.5 sm:px-4 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              <span className="text-center">All Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filters Bar: District, Block, Village, Class */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Quick Filter by Location & Class
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('search')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1"
          >
            <span>Advanced Filters</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* District */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              District
            </label>
            <select
              id="home-filter-district"
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                onQuickFilter('district', e.target.value);
                onNavigateTab('search');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Districts (Nagpur)</option>
              <option value="NAGPUR">NAGPUR</option>
            </select>
          </div>

          {/* Block (18 official blocks including normalized NAGPUR) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Block (Taluka)
            </label>
            <select
              id="home-filter-block"
              value={selectedBlock}
              onChange={(e) => {
                handleBlockChange(e.target.value);
                onNavigateTab('search');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All 18 Blocks ({schools.length} loaded)</option>
              {OFFICIAL_BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b} {blockCounts[b] ? `(${blockCounts[b]})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Village */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Village ({dynamicVillages.length})
            </label>
            <select
              id="home-filter-village"
              value={selectedVillage}
              onChange={(e) => {
                setSelectedVillage(e.target.value);
                onQuickFilter('village', e.target.value);
                onNavigateTab('search');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">
                {selectedBlock !== 'all' ? `All Villages in ${selectedBlock} (${dynamicVillages.length})` : 'All Villages'}
              </option>
              {dynamicVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Class Level
            </label>
            <select
              id="home-filter-class"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                onQuickFilter('classLevel', e.target.value);
                onNavigateTab('search');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Classes</option>
              <option value="primary">Primary (1–5)</option>
              <option value="upper_primary">Upper Primary (6–8)</option>
              <option value="secondary">Secondary (9–10)</option>
              <option value="higher_secondary">Higher Secondary (11–12)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Block Quick Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Official Blocks (18)
          </h3>
          <span className="text-[11px] text-slate-400">
            NAGPUR (GRAMIN) normalized to <strong>NAGPUR</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {OFFICIAL_BLOCKS.map((b) => {
            const count = blockCounts[b] || 0;
            const isConnected = count > 0;
            return (
              <button
                key={b}
                type="button"
                onClick={() => {
                  handleBlockChange(b);
                  onNavigateTab('search');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all shadow-2xs flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-sky-50/80 border-sky-300 text-sky-900 hover:bg-sky-100 hover:border-sky-400 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800 opacity-70'
                }`}
              >
                <span>{b}</span>
                {isConnected && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-600 text-white font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Cards & Phase 2 Architecture Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ramtek 200KM Radius Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                Official Center
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">Ramtek Tehsil HQ</h4>
              <p className="text-xs text-slate-500 mt-1">
                21.3970° N, 79.3292° E
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Radius Boundary:</span>
            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
              200 KM Fixed Radius
            </span>
          </div>
        </div>

        {/* User GPS Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
                Device GPS Locator
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                {userCoords ? 'Live Position Synced' : 'Ready to Detect'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {userCoords
                  ? `Lat: ${userCoords.latitude.toFixed(4)}, Lng: ${userCoords.longitude.toFixed(4)}`
                  : 'Calculates nearest schools in seconds'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Navigation2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Turn-by-turn routes:</span>
            <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              Google Maps
            </span>
          </div>
        </div>

        {/* Phase 2 Data Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                Phase 2 Connected
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">{schools.length} Verified Schools</h4>
              <p className="text-xs text-slate-500 mt-1">
                RAMTEK (214), SAONER (230), MOUDA (193), PARSEONI (166), KAMPTEE (238), BHIWAPUR (140), HINGNA (252), KALMESHWAR (162)
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Remaining 10 blocks:</span>
            <button
              type="button"
              onClick={onOpenUpload}
              className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
            >
              <span>Add More CSV</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured / Nearby Schools Preview */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Schools in Ramtek & Nagpur District
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any school to view complete UDISE, classification, and GPS coordinates
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('search')}
            className="text-xs font-bold text-sky-700 hover:text-sky-800"
          >
            View All ({schools.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewSchools.map((school, index) => {
            const dirUrl = getGoogleMapsDirectionUrl(school.latitude, school.longitude, userCoords);
            const uniqueKey = `${school.block}-${school.udise}-${school.id || index}`;
            return (
              <div
                key={uniqueKey}
                id={`home-school-card-${school.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-100">
                      {school.block}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {school.udise}
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectSchool(school)}
                    className="text-base font-bold text-slate-900 leading-snug hover:text-sky-600 cursor-pointer transition-colors"
                  >
                    {school.name}
                  </h4>

                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{school.village}, {school.district}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">From Ramtek</span>
                      <span className="font-bold text-amber-700">{formatDistance(school.distanceRamtekKm)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">From GPS</span>
                      <span className="font-bold text-sky-700">
                        {school.distanceUserKm != null ? formatDistance(school.distanceUserKm) : 'GPS Off'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    id={`home-dir-${school.id}`}
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
      </div>
    </div>
  );
};

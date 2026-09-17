import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Building2,
  Navigation,
  ExternalLink,
  ChevronDown,
  X,
  Compass,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  GraduationCap,
  Layers,
  ChevronUp,
} from 'lucide-react';
import {
  School,
  UserCoordinates,
  OFFICIAL_BLOCKS,
  SearchFilters,
} from '../types';
import { formatDistance, getGoogleMapsDirectionUrl, getSchoolCoordinates } from '../utils/geo';

interface SearchViewProps {
  schools: School[];
  userCoords: UserCoordinates | null;
  onSelectSchool: (school: School) => void;
  onViewOnMap: (school: School) => void;
  initialFilters?: Partial<SearchFilters>;
  onTriggerDirection?: (school: School) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  schools,
  userCoords,
  onSelectSchool,
  onViewOnMap,
  initialFilters,
  onTriggerDirection,
}) => {
  const [query, setQuery] = useState(initialFilters?.query || '');
  const [selectedDistrict, setSelectedDistrict] = useState(initialFilters?.district || 'all');
  const [selectedBlock, setSelectedBlock] = useState(initialFilters?.block || 'all');
  const [selectedVillage, setSelectedVillage] = useState(initialFilters?.village || 'all');
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [selectedClass, setSelectedClass] = useState(initialFilters?.classLevel || 'all');
  const [selectedManagement, setSelectedManagement] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRuralUrban, setSelectedRuralUrban] = useState(initialFilters?.ruralUrban || 'all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [within200KmOnly, setWithin200KmOnly] = useState<boolean>(
    initialFilters?.within200KmOnly !== undefined ? initialFilters.within200KmOnly : true
  );
  const [sortBy, setSortBy] = useState<'name' | 'distanceUser' | 'distanceRamtek'>('name');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Extract unique villages based on selected block (Block -> Village hierarchy)
  const availableVillages = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (selectedBlock === 'all' || s.block === selectedBlock) {
        if (s.village) set.add(s.village.trim());
      }
    });
    return Array.from(set).sort();
  }, [schools, selectedBlock]);

  // Extract unique clusters based on selected block
  const availableClusters = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (selectedBlock === 'all' || s.block === selectedBlock) {
        if (s.cluster) set.add(s.cluster.trim());
      }
    });
    return Array.from(set).sort();
  }, [schools, selectedBlock]);

  // Extract unique districts
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (s.district) set.add(s.district.trim());
    });
    return Array.from(set).sort();
  }, [schools]);

  // Extract unique managements
  const availableManagements = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (s.management) set.add(s.management.trim());
    });
    return Array.from(set).sort();
  }, [schools]);

  // Extract unique categories
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (s.category) set.add(s.category.trim());
    });
    return Array.from(set).sort();
  }, [schools]);

  // Extract unique types
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (s.type) set.add(s.type.trim());
    });
    return Array.from(set).sort();
  }, [schools]);

  // Extract unique statuses
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    schools.forEach((s) => {
      if (s.status) set.add(s.status.trim());
    });
    return Array.from(set).sort();
  }, [schools]);

  // Block change handler - cascades and resets village and cluster
  const handleBlockChange = (newBlock: string) => {
    setSelectedBlock(newBlock);
    setSelectedVillage('all');
    setSelectedCluster('all');
  };

  // Filtered and Sorted Schools
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      // 200 KM Ramtek boundary rule
      if (within200KmOnly && !school.isWithin200KmRamtek) {
        return false;
      }

      // Query across School name, UDISE, Village, Block
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchName = school.name.toLowerCase().includes(q);
        const matchUdise = school.udise.toLowerCase().includes(q);
        const matchVillage = school.village.toLowerCase().includes(q);
        const matchBlock = school.block.toLowerCase().includes(q);
        if (!matchName && !matchUdise && !matchVillage && !matchBlock) {
          return false;
        }
      }

      // District Filter
      if (selectedDistrict !== 'all' && school.district !== selectedDistrict) {
        return false;
      }

      // Block Filter (Block -> Village -> School)
      if (selectedBlock !== 'all' && school.block !== selectedBlock) {
        return false;
      }

      // Village Filter
      if (selectedVillage !== 'all' && school.village !== selectedVillage) {
        return false;
      }

      // Cluster Filter
      if (selectedCluster !== 'all' && school.cluster.trim() !== selectedCluster) {
        return false;
      }

      // Management Filter
      if (selectedManagement !== 'all' && school.management.trim() !== selectedManagement) {
        return false;
      }

      // Category Filter
      if (selectedCategory !== 'all' && school.category.trim() !== selectedCategory) {
        return false;
      }

      // Type Filter
      if (selectedType !== 'all' && school.type.trim() !== selectedType) {
        return false;
      }

      // Status Filter
      if (selectedStatus !== 'all' && school.status.trim() !== selectedStatus) {
        return false;
      }

      // Rural/Urban Filter
      if (selectedRuralUrban !== 'all' && school.ruralUrban !== selectedRuralUrban) {
        return false;
      }

      // Class Filter
      if (selectedClass !== 'all') {
        if (selectedClass === 'primary' && !(school.classFrom <= 5 && school.classTo >= 1)) return false;
        if (selectedClass === 'upper_primary' && !(school.classFrom <= 8 && school.classTo >= 6)) return false;
        if (selectedClass === 'secondary' && !(school.classFrom <= 10 && school.classTo >= 9)) return false;
        if (selectedClass === 'higher_secondary' && school.classTo < 11) return false;
      }

      // Location Verification Status Filter
      if (verificationFilter === 'verified' && !school.locationVerified) {
        return false;
      }
      if (verificationFilter === 'unverified' && school.locationVerified) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'distanceUser') {
        const distA = a.distanceUserKm != null ? a.distanceUserKm : 999999;
        const distB = b.distanceUserKm != null ? b.distanceUserKm : 999999;
        return distA - distB;
      }
      if (sortBy === 'distanceRamtek') {
        return a.distanceRamtekKm - b.distanceRamtekKm;
      }
      return a.name.localeCompare(b.name);
    });
  }, [
    schools,
    query,
    selectedDistrict,
    selectedBlock,
    selectedVillage,
    selectedCluster,
    selectedClass,
    selectedManagement,
    selectedCategory,
    selectedType,
    selectedStatus,
    selectedRuralUrban,
    verificationFilter,
    within200KmOnly,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedDistrict('all');
    setSelectedBlock('all');
    setSelectedVillage('all');
    setSelectedCluster('all');
    setSelectedClass('all');
    setSelectedManagement('all');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedRuralUrban('all');
    setVerificationFilter('all');
    setWithin200KmOnly(true);
    setSortBy('name');
  };

  const hasActiveFilters =
    query !== '' ||
    selectedDistrict !== 'all' ||
    selectedBlock !== 'all' ||
    selectedVillage !== 'all' ||
    selectedCluster !== 'all' ||
    selectedClass !== 'all' ||
    selectedManagement !== 'all' ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedStatus !== 'all' ||
    selectedRuralUrban !== 'all' ||
    !within200KmOnly;

  return (
    <div id="search-view" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-12">
      {/* Search Bar Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="search-input-main"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by School Name, UDISE Code, Village, or Block..."
            className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Hierarchical Filter Selectors: District -> Block -> Village -> Class */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* District Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              District
            </label>
            <select
              id="filter-district"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Block Filter (Official List) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
              <span>Block</span>
              {selectedBlock !== 'all' && (
                <span className="text-sky-600 font-normal">Active</span>
              )}
            </label>
            <select
              id="filter-block"
              value={selectedBlock}
              onChange={(e) => handleBlockChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Blocks (18)</option>
              {OFFICIAL_BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b} {b === 'RAMTEK' ? '(214)' : b === 'SAONER' ? '(230)' : b === 'MOUDA' ? '(193)' : b === 'PARSEONI' ? '(166)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter (Cascaded from selected Block) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
              <span>Village</span>
              <span className="text-[10px] text-slate-400 font-normal">({availableVillages.length})</span>
            </label>
            <select
              id="filter-village"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">
                {selectedBlock !== 'all' ? `All Villages in ${selectedBlock} (${availableVillages.length})` : 'All Villages'}
              </option>
              {availableVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Class From–To
            </label>
            <select
              id="filter-class"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Classes</option>
              <option value="primary">Primary (1–5)</option>
              <option value="upper_primary">Upper Primary (6–8)</option>
              <option value="secondary">Secondary (9–10)</option>
              <option value="higher_secondary">Higher Secondary (11–12)</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters: Cluster, Management, Category, Type, Status */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 animate-fadeIn">
            {/* Cluster */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Cluster ({availableClusters.length})
              </label>
              <select
                id="filter-cluster"
                value={selectedCluster}
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Clusters</option>
                {availableClusters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Management */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Management
              </label>
              <select
                id="filter-management"
                value={selectedManagement}
                onChange={(e) => setSelectedManagement(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Managements</option>
                {availableManagements.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Category
              </label>
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                School Type
              </label>
              <select
                id="filter-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Types</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                School Status
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Secondary Toggles & Sort */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 200KM Radius enforcement */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="filter-within-200km"
                type="checkbox"
                checked={within200KmOnly}
                onChange={(e) => setWithin200KmOnly(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
              />
              <span className="font-medium text-slate-700">
                Within 200 KM of Ramtek
              </span>
            </label>

            {/* Rural / Urban radio/pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(['all', 'Rural', 'Urban'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedRuralUrban(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedRuralUrban === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode === 'all' ? 'All Areas' : mode}
                </button>
              ))}
            </div>

            {/* Location Verification Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(['all', 'verified', 'unverified'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVerificationFilter(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    verificationFilter === mode
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {mode === 'all' ? 'All Locations' : mode === 'verified' ? '✓ Verified Only' : 'Unverified'}
                </button>
              ))}
            </div>

            {/* Toggle Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-semibold text-xs py-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvancedFilters ? 'Fewer Filters' : 'More Filters (Cluster, Management...)'}</span>
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Sort Control */}
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="text-[11px] font-medium">Sort:</span>
              <select
                id="sort-selector"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="name">School Name (A–Z)</option>
                <option value="distanceRamtek">Distance from Ramtek</option>
                <option value="distanceUser">Distance from My GPS</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-rose-600 hover:text-rose-700 font-semibold text-xs transition-colors"
              >
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Search Results ({filteredSchools.length})
          </h2>
          {selectedBlock !== 'all' && (
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered to Block: <strong className="text-slate-900">{selectedBlock}</strong>
              {selectedVillage !== 'all' && (
                <span> → Village: <strong className="text-slate-900">{selectedVillage}</strong></span>
              )}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-400">
          Showing {filteredSchools.length} of {schools.length} total
        </span>
      </div>

      {/* Results Grid */}
      {filteredSchools.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No schools match the selected criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search query, clearing the village or block filter, or switching the class range.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((school, index) => {
            const coords = getSchoolCoordinates(school);
            const isVerified = coords.isVerified;
            const dirUrl = getGoogleMapsDirectionUrl(coords.lat, coords.lng, userCoords);
            const uniqueKey = `${school.block}-${school.udise}-${school.id || index}`;

            return (
              <div
                key={uniqueKey}
                id={`school-card-${school.id}`}
                onClick={() => onSelectSchool(school)}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: UDISE & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                      {school.udise}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold uppercase">
                        {school.block}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                          school.status.toLowerCase() === 'operational' || school.status.toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {school.status}
                      </span>
                    </div>
                  </div>

                  {/* School Name */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-sky-700 transition-colors line-clamp-2 flex items-start gap-1.5">
                    <span className="text-base flex-shrink-0">🏫</span>
                    <span>{school.name}</span>
                  </h3>

                  {/* Village & Block Details */}
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-slate-500 font-medium">📍 Village:</span>
                      <strong className="text-slate-900 font-semibold">{school.village}</strong>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-slate-500 font-medium">📌 Block:</span>
                      <span className="text-slate-800 font-semibold">{school.block}</span>
                      <span className="text-slate-400">• Cluster: {school.cluster}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-slate-500 font-medium">📏 Distance:</span>
                      <span className="font-bold text-sky-800">
                        {school.distanceUserKm != null
                          ? `${formatDistance(school.distanceUserKm)} (from My GPS)`
                          : `${formatDistance(school.distanceRamtekKm)} (from Ramtek)`}
                      </span>
                    </p>
                  </div>

                  {/* School Location vs Village Location Indicator */}
                  {isVerified ? (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>School Location</span>
                      </div>
                      <p className="text-emerald-950 font-medium truncate mt-0.5">
                        Matched: {school.matchedPlaceName || school.name}
                      </p>
                      <p className="text-emerald-700 font-mono text-[10px]">
                        Exact Coords: {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2.5 p-2 rounded-xl bg-red-50/90 border border-red-200 text-[11px]">
                      <div className="flex items-center justify-between gap-1 text-red-800 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block flex-shrink-0 animate-pulse"></span>
                          <span>Village Location</span>
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">Fallback</span>
                      </div>
                      <p className="text-red-950 text-[11px] font-medium truncate mt-0.5">
                        Exact coordinates for village: <strong>{school.village}</strong>
                      </p>
                      <p className="text-red-700 font-mono text-[10px]">
                        Village Coords: {coords.lat.toFixed(5)}°N, {coords.lng.toFixed(5)}°E
                      </p>
                    </div>
                  )}

                  {/* Attributes Badge Strip */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      Class {school.classFrom}–{school.classTo}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {school.type}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {school.ruralUrban}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[140px]">
                      {school.category}
                    </span>
                  </div>
                </div>

                {/* Bottom Distance & Action Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    {/* GPS Distance */}
                    <div className="bg-sky-50/70 p-2 rounded-xl border border-sky-100">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        From My GPS
                      </span>
                      <span className="font-bold text-sky-800 text-sm">
                        {school.distanceUserKm != null
                          ? formatDistance(school.distanceUserKm)
                          : 'GPS not set'}
                      </span>
                    </div>

                    {/* Ramtek Distance */}
                    <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        From Ramtek
                      </span>
                      <span className="font-bold text-amber-800 text-sm">
                        {formatDistance(school.distanceRamtekKm)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <a
                      id={`btn-direction-${school.id}`}
                      href={dirUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!userCoords?.latitude || !userCoords?.longitude) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                        onTriggerDirection?.(school);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Get Direction</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    <button
                      id={`btn-map-${school.id}`}
                      type="button"
                      onClick={() => onViewOnMap(school)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                      title="View on Leaflet Map"
                    >
                      <Compass className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

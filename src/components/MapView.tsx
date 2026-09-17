import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Navigation,
  Crosshair,
  Layers,
  Filter,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { School, UserCoordinates, RAMTEK_COORDINATES, MAX_RADIUS_KM } from '../types';
import { formatDistance, getGoogleMapsDirectionUrl, getSchoolCoordinates } from '../utils/geo';

interface MapViewProps {
  schools: School[];
  userCoords: UserCoordinates | null;
  onSelectSchool: (school: School) => void;
  onRequestLocation: () => void;
  selectedSchool?: School | null;
  onTriggerDirection?: (school: School) => void;
  onVerifySchool?: (school: School) => Promise<void>;
}

export const MapView: React.FC<MapViewProps> = ({
  schools,
  userCoords,
  onSelectSchool,
  onRequestLocation,
  selectedSchool,
  onTriggerDirection,
  onVerifySchool,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.LayerGroup | null>(null);

  const [hideOutside200Km, setHideOutside200Km] = useState<boolean>(true);
  const [show200KmRadius, setShow200KmRadius] = useState<boolean>(true);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState<boolean>(false);
  const [activeSchoolMarker, setActiveSchoolMarker] = useState<School | null>(null);

  // Filter schools based on 200km radius and verification setting
  const visibleSchools = schools.filter((school) => {
    if (hideOutside200Km && !school.isWithin200KmRamtek) {
      return false;
    }
    if (showVerifiedOnly && !school.locationVerified) {
      return false;
    }
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered at Ramtek HQ initially
    const map = L.map(mapContainerRef.current, {
      center: [RAMTEK_COORDINATES.latitude, RAMTEK_COORDINATES.longitude],
      zoom: 10,
      zoomControl: false,
    });

    // Free OpenStreetMap tile layer (No API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Create layer groups
    const markersLayer = L.layerGroup().addTo(map);
    const userLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    userMarkerRef.current = userLayer;
    mapInstanceRef.current = map;

    // Invalidate size after initial layout render
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update 200km Radius Circle and Ramtek Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old circle if exists
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
      radiusCircleRef.current = null;
    }

    if (show200KmRadius) {
      // 200 KM = 200,000 meters
      const circle = L.circle([RAMTEK_COORDINATES.latitude, RAMTEK_COORDINATES.longitude], {
        radius: MAX_RADIUS_KM * 1000,
        color: '#d97706', // amber-600
        weight: 2,
        dashArray: '8, 8',
        fillColor: '#fbbf24',
        fillOpacity: 0.08,
      }).addTo(map);

      circle.bindTooltip('200 KM Radius Boundary from Ramtek', {
        permanent: false,
        direction: 'top',
        className: 'custom-leaflet-tooltip',
      });

      radiusCircleRef.current = circle;
    }

    // Add Ramtek Origin Marker
    const ramtekIcon = L.divIcon({
      className: 'ramtek-marker-custom',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-amber-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const ramtekMarker = L.marker([RAMTEK_COORDINATES.latitude, RAMTEK_COORDINATES.longitude], {
      icon: ramtekIcon,
      zIndexOffset: 500,
    }).addTo(map);

    ramtekMarker.bindPopup(`
      <div class="p-2 text-slate-800 font-sans">
        <span class="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-100 text-amber-800 mb-1">
          Radius Center (0.0 km)
        </span>
        <h4 class="font-bold text-sm text-slate-900 leading-tight">Ramtek Tehsil HQ</h4>
        <p class="text-xs text-slate-600 mt-1">Latitude: 21.3970° N, Longitude: 79.3292° E</p>
        <p class="text-[11px] text-amber-700 font-medium mt-1">Official origin for 200 KM boundary checks</p>
      </div>
    `);

    return () => {
      map.removeLayer(ramtekMarker);
    };
  }, [show200KmRadius]);

  // Update User GPS Marker
  useEffect(() => {
    const userLayer = userMarkerRef.current;
    if (!userLayer) return;
    userLayer.clearLayers();

    if (!userCoords) return;

    const userIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-9 h-9 rounded-full bg-sky-500/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-sky-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });

    const userMarker = L.marker([userCoords.latitude, userCoords.longitude], {
      icon: userIcon,
      zIndexOffset: 1000,
    });

    userMarker.bindPopup(`
      <div class="p-2 text-slate-800 font-sans">
        <span class="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-sky-100 text-sky-800 mb-1">
          My Live Location
        </span>
        <h4 class="font-bold text-sm text-slate-900 leading-tight">Your GPS Position</h4>
        <p class="text-xs text-slate-600 mt-1">Lat: ${userCoords.latitude.toFixed(5)}, Lng: ${userCoords.longitude.toFixed(5)}</p>
        ${userCoords.accuracy ? `<p class="text-[11px] text-slate-500 mt-0.5">Accuracy: ±${Math.round(userCoords.accuracy)}m</p>` : ''}
      </div>
    `);

    userMarker.addTo(userLayer);

    // Also draw subtle accuracy circle if available
    if (userCoords.accuracy && userCoords.accuracy > 10) {
      L.circle([userCoords.latitude, userCoords.longitude], {
        radius: userCoords.accuracy,
        color: '#0284c7',
        weight: 1,
        fillColor: '#38bdf8',
        fillOpacity: 0.1,
      }).addTo(userLayer);
    }
  }, [userCoords]);

  // Update School Markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;
    markersLayer.clearLayers();

    visibleSchools.forEach((school) => {
      const isSelected = selectedSchool?.id === school.id;
      const coords = getSchoolCoordinates(school);
      const isVerified = coords.isVerified;

      // When exact school location is verified: normal school marker (emerald/indigo) with school icon
      // When exact school location is NOT available: fallback to village location with RED marker
      const schoolIcon = L.divIcon({
        className: `school-marker-${school.id}`,
        html: `
          <div class="group relative cursor-pointer transform transition-transform hover:scale-125 ${isSelected ? 'scale-125 z-40' : ''}">
            <div class="w-8 h-8 rounded-full ${
              isSelected
                ? 'bg-indigo-700 ring-4 ring-indigo-200'
                : isVerified
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-300'
                : 'bg-red-600 hover:bg-red-700 ring-2 ring-red-300'
            } text-white shadow-md flex items-center justify-center border-2 border-white">
              ${
                isVerified
                  ? `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                    </svg>`
                  : `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>`
              }
            </div>
            ${
              isVerified
                ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-white text-[8px] font-bold shadow-xs">✓</div>`
                : `<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white shadow-xs"></div>`
            }
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900/40 rounded-full blur-[1px]"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: schoolIcon,
        zIndexOffset: isSelected ? 300 : isVerified ? 150 : 80,
      });

      const dirUrl = getGoogleMapsDirectionUrl(coords.lat, coords.lng, userCoords);

      const popupContent = `
        <div class="p-2.5 min-w-[240px] font-sans text-slate-800">
          <div class="flex items-center gap-1.5 mb-1.5 justify-between">
            <span class="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold uppercase">
              ${school.block}
            </span>
            <span class="text-[10px] text-slate-500 font-mono">
              ${school.udise}
            </span>
          </div>

          <h4 class="font-bold text-sm text-slate-900 leading-snug">
            🏫 ${school.name}
          </h4>

          <div class="mt-2 space-y-1 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div class="flex items-center justify-between">
              <span class="text-slate-500">📍 Village:</span>
              <strong class="text-slate-900 font-semibold">${school.village}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">📌 Block:</span>
              <span class="text-slate-800 font-medium">${school.block}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-500">🏷️ Location:</span>
              <span class="font-bold ${isVerified ? 'text-emerald-700' : 'text-red-700'}">
                ${isVerified ? 'School Location' : 'Village Location'}
              </span>
            </div>
          </div>

          <!-- School Location vs Village Location status banner -->
          ${
            isVerified
              ? `
            <div class="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <div class="flex items-center gap-1 text-emerald-800 font-bold text-[11px]">
                <svg class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                <span>School Location</span>
              </div>
              <p class="text-[11px] text-emerald-950 font-medium mt-0.5 leading-tight">
                Matched: <strong>${school.matchedPlaceName || school.name}</strong>
              </p>
              <p class="text-[10px] text-emerald-700 font-mono mt-0.5">
                ${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E
              </p>
            </div>
          `
              : `
            <div class="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <div class="flex items-center justify-between gap-1">
                <span class="inline-flex items-center gap-1 text-red-800 font-bold text-[11px]">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-600 inline-block flex-shrink-0"></span>
                  <span>Village Location</span>
                </span>
                <span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold">Fallback</span>
              </div>
              <p class="text-[10px] text-red-900 mt-0.5 leading-tight">
                Exact school building location is not available. Using <strong>${school.village}</strong> village location.
              </p>
              <p class="text-[10px] text-red-700 font-mono mt-0.5">
                Village Coords: ${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E
              </p>
              ${
                onVerifySchool
                  ? `
                <button 
                  id="map-popup-verify-${school.id}" 
                  type="button" 
                  class="mt-1.5 w-full py-1 px-2 bg-red-100 hover:bg-red-200 text-red-900 text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors border border-red-200"
                >
                  <span>Search for School Location</span>
                </button>
              `
                  : ''
              }
            </div>
          `
          }

          <div class="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5 text-[11px]">
            <div class="bg-slate-50 p-1.5 rounded">
              <span class="text-slate-400 block text-[9px] uppercase font-bold">From Ramtek</span>
              <span class="font-bold text-amber-700">${formatDistance(school.distanceRamtekKm)}</span>
            </div>
            <div class="bg-slate-50 p-1.5 rounded">
              <span class="text-slate-400 block text-[9px] uppercase font-bold">From GPS</span>
              <span class="font-bold text-sky-700">${school.distanceUserKm != null ? formatDistance(school.distanceUserKm) : 'N/A'}</span>
            </div>
          </div>

          <div class="mt-2.5 flex items-center gap-1.5">
            <a 
              id="map-popup-dir-${school.id}"
              href="${dirUrl || '#'}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="flex-1 inline-flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs py-1.5 px-2 rounded text-center"
            >
              <span>Direction</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
            <button 
              id="map-popup-detail-${school.id}" 
              type="button" 
              class="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded"
            >
              Details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        setActiveSchoolMarker(school);
        const detailBtn = document.getElementById(`map-popup-detail-${school.id}`);
        if (detailBtn) {
          detailBtn.onclick = () => onSelectSchool(school);
        }
        const dirBtn = document.getElementById(`map-popup-dir-${school.id}`);
        if (dirBtn) {
          dirBtn.onclick = (e) => {
            if (!userCoords?.latitude || !userCoords?.longitude) {
              e.preventDefault();
            }
            onTriggerDirection?.(school);
          };
        }
        const verifyBtn = document.getElementById(`map-popup-verify-${school.id}`);
        if (verifyBtn && onVerifySchool) {
          verifyBtn.onclick = async () => {
            verifyBtn.innerHTML = '<span>Verifying...</span>';
            await onVerifySchool(school);
          };
        }
      });

      marker.addTo(markersLayer);
    });
  }, [visibleSchools, selectedSchool, userCoords]);

  // Center on selected school when it changes - uses corrected school or village location
  useEffect(() => {
    if (!selectedSchool || !mapInstanceRef.current) return;
    const targetCoords = getSchoolCoordinates(selectedSchool);
    mapInstanceRef.current.setView([targetCoords.lat, targetCoords.lng], 14, {
      animate: true,
    });
  }, [selectedSchool]);

  // Handler functions for map controls
  const handleCenterRamtek = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([RAMTEK_COORDINATES.latitude, RAMTEK_COORDINATES.longitude], 11, {
      animate: true,
    });
  };

  const handleCenterUser = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.latitude, userCoords.longitude], 13, {
        animate: true,
      });
    } else {
      onRequestLocation();
    }
  };

  const handleFit200Km = () => {
    if (!mapInstanceRef.current || !radiusCircleRef.current) return;
    mapInstanceRef.current.fitBounds(radiusCircleRef.current.getBounds(), {
      padding: [20, 20],
      animate: true,
    });
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div id="map-view-container" className="relative w-full h-[calc(100vh-8rem)] sm:h-[calc(100vh-7rem)] flex flex-col">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Filter & Status Chips */}
        <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
          {/* 200KM Radius Filter Toggle */}
          <button
            id="map-toggle-hide-outside-btn"
            type="button"
            onClick={() => setHideOutside200Km(!hideOutside200Km)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all border ${
              hideOutside200Km
                ? 'bg-white text-slate-900 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white/90 text-slate-600 border-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Hide Outside 200 KM</span>
            <span className={`w-2 h-2 rounded-full ${hideOutside200Km ? 'bg-amber-500' : 'bg-slate-300'}`} />
          </button>

          {/* Show Radius Circle Toggle */}
          <button
            id="map-toggle-radius-circle-btn"
            type="button"
            onClick={() => setShow200KmRadius(!show200KmRadius)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all border ${
              show200KmRadius
                ? 'bg-white text-slate-900 border-sky-300'
                : 'bg-white/90 text-slate-600 border-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>200 KM Boundary</span>
          </button>

          {/* Verified Locations Only Toggle */}
          <button
            id="map-toggle-verified-only-btn"
            type="button"
            onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all border ${
              showVerifiedOnly
                ? 'bg-white text-slate-900 border-emerald-300 ring-2 ring-emerald-400/20'
                : 'bg-white/90 text-slate-600 border-slate-200'
            }`}
          >
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Verified Locations Only</span>
            <span className={`w-2 h-2 rounded-full ${showVerifiedOnly ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm border border-slate-200">
            <span className="font-bold text-sky-700">{visibleSchools.length}</span> schools shown
          </span>
        </div>

        {/* Right Map Quick Actions */}
        <div className="flex items-center gap-1.5 pointer-events-auto ml-auto">
          <button
            id="map-center-ramtek-btn"
            type="button"
            onClick={handleCenterRamtek}
            title="Center on Ramtek Origin"
            className="p-2 rounded-xl bg-white text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 shadow-md transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">Ramtek</span>
          </button>

          <button
            id="map-center-user-btn"
            type="button"
            onClick={handleCenterUser}
            title={userCoords ? 'Center on My GPS Location' : 'Detect GPS Location'}
            className="p-2 rounded-xl bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 shadow-md transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <Crosshair className={`w-4 h-4 ${userCoords ? 'text-sky-600' : 'text-slate-400'}`} />
            <span className="hidden md:inline">My GPS</span>
          </button>

          <button
            id="map-fit-bounds-btn"
            type="button"
            onClick={handleFit200Km}
            title="Fit 200 KM Radius View"
            className="p-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-md transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span className="hidden md:inline">200km Extent</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-100" />

      {/* Custom Zoom Buttons */}
      <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-1.5 shadow-lg rounded-xl overflow-hidden bg-white border border-slate-200">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 text-slate-700 hover:bg-slate-100 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200" />
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 text-slate-700 hover:bg-slate-100 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl shadow-md border border-slate-200 text-xs flex flex-wrap items-center gap-3.5">
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <span className="text-base leading-none" role="img" aria-label="School Location">🏫</span>
          <span>School Location</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          <span className="text-xs leading-none text-red-600" role="img" aria-label="Village Location">🔴</span>
          <span>Village Location</span>
        </div>
        <div className="h-3 w-px bg-slate-200 hidden sm:block"></div>
        <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-300"></span>
          <span>Your GPS</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-slate-600">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Ramtek HQ</span>
        </div>
      </div>
    </div>
  );
};

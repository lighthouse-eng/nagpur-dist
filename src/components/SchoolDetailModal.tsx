import React, { useState } from 'react';
import {
  X,
  Navigation,
  MapPin,
  Building2,
  GraduationCap,
  Layers,
  Compass,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
} from 'lucide-react';
import { School, UserCoordinates, RAMTEK_COORDINATES } from '../types';
import { formatDistance, getGoogleMapsDirectionUrl, getSchoolCoordinates } from '../utils/geo';
import { buildSchoolSearchQuery } from '../services/schoolLocationMatcher';

interface SchoolDetailModalProps {
  school: School | null;
  onClose: () => void;
  userCoords: UserCoordinates | null;
  onViewOnMap?: (school: School) => void;
  onTriggerDirection?: (school: School) => void;
  onVerifySchool?: (school: School) => Promise<void>;
}

export const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({
  school,
  onClose,
  userCoords,
  onViewOnMap,
  onTriggerDirection,
  onVerifySchool,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  if (!school) return null;

  const coords = getSchoolCoordinates(school);
  const isVerified = coords.isVerified;
  const directionUrl = getGoogleMapsDirectionUrl(coords.lat, coords.lng, userCoords);
  const searchQuery = school.matchedQuery || buildSchoolSearchQuery(school);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunVerification = async () => {
    if (!onVerifySchool || isVerifying) return;
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      await onVerifySchool(school);
      setVerifyMessage('Matching check completed.');
    } catch (err: any) {
      setVerifyMessage(err?.message || 'Verification check failed');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="school-detail-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="school-detail-modal"
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-slate-900 text-white p-5 sm:p-6 flex-shrink-0">
          <button
            id="modal-close-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
              UDISE: {school.udise}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                school.status.toLowerCase() === 'operational' || school.status.toLowerCase() === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              {school.status}
            </span>
            {isVerified ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>School Location</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-400/30 inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
                <span>Village Location</span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-white pr-8">
            {school.name}
          </h2>

          <p className="text-sm text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{school.village}</span>
            <span>•</span>
            <span className="font-semibold text-white">Block: {school.block}</span>
            <span>•</span>
            <span>{school.district}</span>
          </p>

          {/* Quick Metrics Strip */}
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">From Your GPS</span>
              <span className="font-bold text-sky-300 text-sm">
                {school.distanceUserKm != null ? formatDistance(school.distanceUserKm) : 'GPS not set'}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">From Ramtek HQ</span>
              <span className="font-bold text-amber-300 text-sm">
                {formatDistance(school.distanceRamtekKm)}
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 col-span-2 sm:col-span-1 flex items-center gap-1.5">
              {school.isWithin200KmRamtek ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-300 font-medium">Within 200 KM</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-rose-300 font-medium">&gt; 200 KM</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-700 divide-y divide-slate-100">
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-0">
            <a
              id="get-direction-btn"
              href={directionUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!userCoords?.latitude || !userCoords?.longitude) {
                  e.preventDefault();
                }
                onTriggerDirection?.(school);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-5 rounded-xl shadow-sm hover:shadow transition-all active:scale-[0.99]"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Direction (Google Maps)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-auto sm:ml-0" />
            </a>

            {onViewOnMap && (
              <button
                id="view-on-map-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onViewOnMap(school);
                }}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-all"
              >
                <Compass className="w-4 h-4 text-slate-600" />
                <span>Show on Map</span>
              </button>
            )}
          </div>

          {/* School Location Matching & Verification Status Box */}
          <div className="pt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              School Location Matching & Identity
            </h3>

            <div
              className={`p-4 rounded-xl border ${
                isVerified
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-red-50/70 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                    isVerified
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-red-100 text-red-900'
                  }`}
                >
                  {isVerified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>School Location</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                      <span>Village Location (Fallback)</span>
                    </>
                  )}
                </span>

                {onVerifySchool && (
                  <button
                    id="modal-verify-location-btn"
                    type="button"
                    onClick={handleRunVerification}
                    disabled={isVerifying}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
                    <span>{isVerifying ? 'Searching Geocoder...' : isVerified ? 'Re-verify Location' : 'Match School Location'}</span>
                  </button>
                )}
              </div>

              {verifyMessage && (
                <p className="text-xs text-slate-600 mb-2 font-medium bg-white/70 p-2 rounded border border-slate-200">
                  {verifyMessage}
                </p>
              )}

              {/* Complete Identity Query */}
              <div className="mb-3 text-xs bg-white/80 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  Complete Identity Search Query
                </span>
                <code className="text-slate-800 font-sans text-xs break-words">
                  "{searchQuery}"
                </code>
              </div>

              {isVerified ? (
                <div className="space-y-1.5 text-xs text-emerald-950">
                  <p>
                    <strong>Matched Map Place:</strong> {school.matchedPlaceName || school.name}
                  </p>
                  <p className="font-mono text-emerald-800">
                    <strong>Exact School Coordinates:</strong> {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Source: {school.verificationSource || 'Verified Educational Geocoding Registry'}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    ✓ Verified exact school building coordinates are actively used for Map, Distance, and Google Maps Navigation.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-red-950">
                  <p className="font-semibold text-red-900">
                    Exact building location not yet verified. Falling back to official village location.
                  </p>
                  <p className="font-mono text-red-800 text-[11px]">
                    <strong>Village Coordinates ({school.village}):</strong> {coords.lat.toFixed(6)}° N, {coords.lng.toFixed(6)}° E
                  </p>
                  <p className="text-[11px] text-red-800">
                    Strict location integrity enforced: Never uses another village, nearby village, or random coordinates. All map markers, directions, and distance calculations strictly route to the school's exact village ({school.village}).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Academic & Classification Details */}
          <div className="pt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              Academic & Classification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Class Levels</span>
                <span className="font-semibold text-slate-900">
                  Class {school.classFrom} to Class {school.classTo}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">School Category</span>
                <span className="font-semibold text-slate-900">{school.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Management Authority</span>
                <span className="font-semibold text-slate-900">{school.management}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">School Gender Type</span>
                <span className="font-semibold text-slate-900">{school.type}</span>
              </div>
            </div>
          </div>

          {/* Administrative & Location Hierarchy */}
          <div className="pt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-sky-600" />
              Administrative Hierarchy
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">District</span>
                <span className="font-semibold text-slate-900">{school.district}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Block (Taluka)</span>
                <span className="font-semibold text-slate-900">{school.block}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Cluster</span>
                <span className="font-semibold text-slate-900">{school.cluster}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Village / Town</span>
                <span className="font-semibold text-slate-900">{school.village}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Area Type</span>
                <span className="font-semibold text-slate-900">{school.ruralUrban}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block">Postal PIN</span>
                <span className="font-semibold text-slate-900">{school.pin}</span>
              </div>
            </div>
          </div>

          {/* Address & GPS Coordinates */}
          <div className="pt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-sky-600" />
              Address & Active Navigation Coordinates
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Physical Address</span>
                  <p className="text-sm font-medium text-slate-900">{school.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(school.address, 'addr')}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200"
                  title="Copy address"
                >
                  {copiedKey === 'addr' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block">
                      {isVerified ? 'School Latitude' : 'Village Latitude'}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 text-sm">
                      {coords.lat.toFixed(6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(coords.lat), 'lat')}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    {copiedKey === 'lat' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block">
                      {isVerified ? 'School Longitude' : 'Village Longitude'}
                    </span>
                    <span className="font-mono font-semibold text-slate-800 text-sm">
                      {coords.lng.toFixed(6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(coords.lng), 'lng')}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    {copiedKey === 'lng' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            Lighthouse School Visit Verification
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

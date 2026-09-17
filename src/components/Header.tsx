import React from 'react';
import { Compass, MapPin, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserCoordinates } from '../types';

interface HeaderProps {
  userCoords: UserCoordinates | null;
  geoError: string | null;
  onRequestLocation: () => void;
  onOpenUpload: () => void;
  totalSchools: number;
  verifiedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  userCoords,
  geoError,
  onRequestLocation,
  onOpenUpload,
  totalSchools,
  verifiedCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div className="truncate">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate leading-tight">
              Lighthouse School Visit
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1.5">
              <span>Ramtek & Nagpur District</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-sky-700 font-semibold">{totalSchools} Schools Loaded</span>
              {verifiedCount > 0 && (
                <>
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{verifiedCount} Verified</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* GPS Status / Detector */}
          <button
            id="header-gps-btn"
            onClick={onRequestLocation}
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              userCoords
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : geoError
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title={userCoords ? 'GPS Location active' : 'Click to detect your GPS location'}
          >
            <MapPin className={`w-3.5 h-3.5 ${userCoords ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">
              {userCoords ? 'GPS Active' : geoError ? 'Enable GPS' : 'Detect GPS'}
            </span>
            {userCoords ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600 hidden sm:inline" />
            ) : geoError ? (
              <AlertCircle className="w-3 h-3 text-amber-600 hidden sm:inline" />
            ) : null}
          </button>

          {/* Phase 2 CSV Upload Trigger */}
          <button
            id="header-csv-upload-btn"
            onClick={onOpenUpload}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV Portal</span>
            <span className="sm:hidden">CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};

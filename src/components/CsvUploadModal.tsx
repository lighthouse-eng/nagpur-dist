import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { School } from '../types';
import { parseSchoolCsv } from '../utils/csvParser';
import { INITIAL_SAMPLE_SCHOOLS } from '../data/sampleSchools';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolsLoaded: (newSchools: School[]) => void;
  currentCount: number;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  isOpen,
  onClose,
  onSchoolsLoaded,
  currentCount,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleProcessCsv = (csvText: string) => {
    setIsProcessing(true);
    try {
      const { schools, errors } = parseSchoolCsv(csvText);
      if (schools.length === 0) {
        setStatusMessage({
          type: 'error',
          text: errors[0] || 'No valid school rows with latitude & longitude found.',
        });
        setIsProcessing(false);
        return;
      }

      onSchoolsLoaded(schools);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${schools.length} schools! NAGPUR (GRAMIN) normalized to NAGPUR.`,
      });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 1500);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to parse CSV file.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) handleProcessCsv(text);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) handleProcessCsv(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'School Name,UDISE Code,District,Block,Cluster,Village,PIN,Address,Management,Category,Type,Class From,Class To,Rural/Urban,Status,Latitude,Longitude\n' +
      'Z.P. High School Ramtek,27091102501,NAGPUR,RAMTEK,Ramtek Central,Ramtek,441106,"Station Road, Ramtek",Zilla Parishad,Secondary with Higher Secondary,Co-educational,5,12,Rural,Operational,21.3982,79.3315\n' +
      'Nagpur Gramin Model School,27090601905,NAGPUR,NAGPUR (GRAMIN),Wadi,Wadi,440023,"Amravati Road, Wadi",Department of Education,Secondary,Co-educational,1,10,Rural,Operational,21.1492,79.0019\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lighthouse_school_visit_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleSchools = () => {
    onSchoolsLoaded(INITIAL_SAMPLE_SCHOOLS);
    setStatusMessage({
      type: 'success',
      text: `Loaded ${INITIAL_SAMPLE_SCHOOLS.length} sample schools across Ramtek & Nagpur!`,
    });
    setTimeout(() => {
      onClose();
      setStatusMessage(null);
    }, 1200);
  };

  const handleClearAllSchools = () => {
    onSchoolsLoaded([]);
    setStatusMessage({
      type: 'info',
      text: 'School data cleared. Interface is now in Phase 1 zero-data state.',
    });
  };

  return (
    <div
      id="csv-upload-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="csv-upload-modal"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-2">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Phase 2 Data Architecture</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              School CSV Upload & Dataset Management
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Currently {currentCount} schools active in memory
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-sky-50 text-sky-800 border border-sky-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Normalization & Rule Info Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Automatic Normalization Built-in:
            </h4>
            <p>
              • CSV entries containing <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">NAGPUR (GRAMIN)</code> are automatically displayed as <strong className="font-bold text-amber-950">NAGPUR</strong>.
            </p>
            <p>
              • Distances from <strong>Ramtek (21.3970, 79.3292)</strong> are computed immediately, verifying the 200 KM boundary.
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              dragActive
                ? 'border-sky-500 bg-sky-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 text-sky-600 mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold text-slate-800">
              Drag & Drop your School CSV here
            </h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Supports CSV with headers: School Name, UDISE, Block, Village, Latitude, Longitude, etc.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer shadow-sm transition-all active:scale-95">
              <UploadCloud className="w-4 h-4" />
              <span>Select CSV File</span>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Paste CSV Text Alternative */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase">
              Or Paste CSV Data Directly
            </label>
            <textarea
              id="csv-paste-textarea"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste comma-separated school rows here..."
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {pasteContent.trim() && (
              <button
                type="button"
                onClick={() => handleProcessCsv(pasteContent)}
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Import Pasted CSV Data
              </button>
            )}
          </div>

          {/* Quick Dataset Switches for Testing Phase 1 & 2 */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleLoadSampleSchools}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold border border-sky-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Active Dataset (1,595 Schools across 8 Blocks)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllSchools}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
              title="Clear all data to test pure Phase 1 empty state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear (Phase 1 Test)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>Phase 1 Interface Ready • Phase 2 Ready</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

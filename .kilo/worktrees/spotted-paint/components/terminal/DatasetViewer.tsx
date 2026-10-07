'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { BuildingChallenge } from '@/lib/types';
import { sound } from '@/components/audio/SoundEffects';
import { useGameStore } from '@/lib/store';

interface DatasetViewerProps {
  challenge: BuildingChallenge;
}

export const DatasetViewer: React.FC<DatasetViewerProps> = ({ challenge }) => {
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const soundEnabled = useGameStore((state) => state.soundEnabled);

  const fragment = challenge.datasetFragment;

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  useEffect(() => {
    async function loadCsv() {
      try {
        setLoading(true);
        const res = await fetch(fragment.downloadUrl);
        const text = await res.text();
        const lines = text.trim().split('\n').map((line) => parseCSVLine(line));
        if (lines.length > 0) {
          setHeaders(lines[0]);
          setDataRows(lines.slice(1));
        }
      } catch (err) {
        console.error('Failed to load dataset fragment:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCsv();
  }, [fragment.downloadUrl]);

  const totalPages = Math.ceil(dataRows.length / rowsPerPage);
  const currentRows = dataRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDownload = () => {
    if (soundEnabled) sound.playClick();
    const link = document.createElement('a');
    link.href = fragment.downloadUrl;
    link.download = `MANU_Historical_${fragment.filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Recovery Status Banner */}
      <div className="p-3.5 bg-cyber-green/10 border border-cyber-green/50 rounded-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-cyber-green">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-cyber-green uppercase tracking-wider flex items-center">
              <span>DECRYPTED FRAGMENT {fragment.fragmentId} OF 5</span>
              <span className="ml-2 text-[10px] px-1.5 py-0.2 bg-cyber-green/20 rounded">
                VERIFIED
              </span>
            </div>
            <div className="text-sm font-semibold text-white">
              {fragment.recordRange} ({fragment.rowCount} Records)
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="px-3 py-1.5 bg-cyber-green/20 hover:bg-cyber-green/30 border border-cyber-green text-cyber-green hover:text-white rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-green-glow"
        >
          <Download className="w-3.5 h-3.5" />
          <span>DOWNLOAD .CSV</span>
        </button>
      </div>

      <p className="text-xs text-gray-300 font-mono leading-relaxed">
        {fragment.description}
      </p>

      {/* Interactive CSV Table Preview */}
      <div className="border border-cyber-border/40 rounded-lg overflow-hidden bg-cyber-darker/90">
        <div className="px-3 py-2 bg-cyber-dark/80 border-b border-cyber-border/30 flex items-center justify-between text-xs font-mono text-gray-300">
          <div className="flex items-center space-x-1.5 text-cyber-orange">
            <Eye className="w-3.5 h-3.5" />
            <span>RAW DATA PREVIEW ({dataRows.length} ROWS)</span>
          </div>
          <div className="text-gray-400">
            Page {currentPage} of {totalPages || 1}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-cyber-orange animate-pulse">
            Decrypting memory buffer records...
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[260px]">
            <table className="w-full text-left text-[11px] font-mono whitespace-nowrap">
              <thead className="bg-cyber-darker text-cyber-orange border-b border-cyber-border/30 sticky top-0">
                <tr>
                  {headers.slice(0, 8).map((h, idx) => (
                    <th key={idx} className="px-3 py-1.5 font-bold">
                      {h}
                    </th>
                  ))}
                  {headers.length > 8 && (
                    <th className="px-3 py-1.5 text-gray-500 font-normal">
                      +{headers.length - 8} more cols
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-200">
                {currentRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-cyber-orange/10 transition-colors"
                  >
                    {row.slice(0, 8).map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-1.5">
                        {cell}
                      </td>
                    ))}
                    {row.length > 8 && (
                      <td className="px-3 py-1.5 text-gray-500">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-3 py-2 bg-cyber-dark/60 border-t border-cyber-border/20 flex items-center justify-between text-xs">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                if (soundEnabled) sound.playClick();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
              className="px-2 py-1 bg-cyber-darker border border-gray-700 disabled:opacity-40 text-gray-300 hover:text-white rounded flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>
            <span className="text-gray-400 font-mono text-[11px]">
              Showing {(currentPage - 1) * rowsPerPage + 1} -{' '}
              {Math.min(currentPage * rowsPerPage, dataRows.length)} of{' '}
              {dataRows.length}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                if (soundEnabled) sound.playClick();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
              className="px-2 py-1 bg-cyber-darker border border-gray-700 disabled:opacity-40 text-gray-300 hover:text-white rounded flex items-center space-x-1"
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

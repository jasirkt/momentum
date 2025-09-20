'use client';

import { ChangeEvent, useRef } from 'react';
import { Habit, StoredHabit } from '../types';
import { compressHabits, decompressHabits } from '../utils/storageUtils';

type DataManagementProps = {
  habits: Habit[];
  onImport: (habits: Habit[]) => void;
};

export default function DataManagement({ habits, onImport }: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (habits.length === 0) {
      alert("There are no habits to export.");
      return;
    }

    // Use the centralized compression utility
    const exportableData = compressHabits(habits);

    const dataStr = JSON.stringify(exportableData);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `momentum_habits_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File could not be read");

        const parsedData = JSON.parse(text);

        if (!Array.isArray(parsedData)) {
            throw new Error("Import data is not an array.");
        }

        let importedHabits: Habit[];
        
        const isOptimizedFormat = parsedData.length > 0 && 'yearlyData' in parsedData[0];
        const isOldFormat = parsedData.length > 0 && 'dates' in parsedData[0];

        if (isOptimizedFormat) {
          // Use the centralized decompression utility
          importedHabits = decompressHabits(parsedData as StoredHabit[]);
        } else if (isOldFormat) {
          if (!parsedData.every(h => 'id' in h && 'name' in h && 'dates' in h)) {
              throw new Error("Invalid habit object in old data format.");
          }
          importedHabits = parsedData as Habit[];
        } else if (parsedData.length === 0) {
          importedHabits = [];
        } else {
            throw new Error("Unrecognized file format.");
        }

        if (window.confirm("Are you sure you want to import this file? This will overwrite your current habits.")) {
          onImport(importedHabits);
        }
      } catch (error) {
        alert("Error reading or parsing the file. Please ensure it's a valid JSON file.");
        console.error("Import error:", error);
      } finally {
        if(event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative bg-gray-800/50 p-6 rounded-xl shadow-md my-8 border border-gray-700/50 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10"></div>
        <h2 className="text-xl font-semibold mb-4 text-white">Data Management</h2>
        <p className="text-sm text-gray-400 mb-6">
            Save your progress to a file or import it on a new device.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button
                onClick={handleExport}
                className="bg-gray-700/70 backdrop-blur-sm border border-gray-600/80 text-white font-semibold py-3 px-6 rounded-md hover:bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500 transition-all duration-200 flex-1 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Data
            </button>
            <button
                onClick={handleImportClick}
                className="bg-indigo-600/80 backdrop-blur-sm border border-indigo-500/80 text-white font-semibold py-3 px-6 rounded-md hover:bg-indigo-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200 flex-1 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                Import Data
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="application/json"
            />
        </div>
    </div>
  );
}


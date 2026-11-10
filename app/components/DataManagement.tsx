'use client';

import { ChangeEvent, useRef } from 'react';
import { Habit } from '../types';
import { compressHabits } from '../utils/storageUtils';
import { validateAndNormalizeImportedHabits, MAX_IMPORT_FILE_BYTES } from '../utils/habitValidation';

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

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      alert(
        `This file is too large to import (max ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))} MB).`,
      );
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('File could not be read');

        const parsedData: unknown = JSON.parse(text);
        const importedHabits: Habit[] = validateAndNormalizeImportedHabits(parsedData);

        if (window.confirm("Are you sure you want to import this file? This will overwrite your current habits.")) {
          onImport(importedHabits);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        alert(`Could not import this file. ${message}`);
        console.error('Import error:', error);
      } finally {
        if(event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const buttonClass =
    'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--outline)] bg-[var(--surface-container-lowest)] px-6 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--state-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]';

  return (
    <section aria-labelledby="data-heading" className="border-t border-[var(--outline-variant)] pt-8">
      <h2
        id="data-heading"
        className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]"
      >
        Back up your data
      </h2>
      <p className="mb-4 mt-2 text-sm text-[var(--on-surface-variant)]">
        Save your progress to a file or import it on a new device.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={handleExport} className={buttonClass} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Data
        </button>
        <button onClick={handleImportClick} className={buttonClass} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
    </section>
  );
}

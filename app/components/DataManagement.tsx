'use client';

import { ChangeEvent, useRef } from 'react';
import { Download, Upload } from 'lucide-react';
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
          <Upload size={20} aria-hidden="true" />
          Export Data
        </button>
        <button onClick={handleImportClick} className={buttonClass} type="button">
          <Download size={20} aria-hidden="true" />
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

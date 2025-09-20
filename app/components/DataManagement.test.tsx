import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DataManagement from './DataManagement';
import '@testing-library/jest-dom';
import { Habit } from '../types';

// Mocking the URL.createObjectURL and URL.revokeObjectURL
// These are browser-specific functions not available in Jest's JSDOM environment.
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock the window.confirm dialog to always return true for tests
global.confirm = jest.fn(() => true);

describe('DataManagement Component', () => {
  const mockOnImport = jest.fn();

  const sampleHabitsOptimized: Habit[] = [
    { id: 1, name: 'Sample Habit 1', dates: { '2025-09-20': true } },
    { id: 2, name: 'Sample Habit 2', dates: {} },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the export and import buttons', () => {
    render(<DataManagement habits={[]} onImport={mockOnImport} />);
    expect(screen.getByRole('button', { name: /Export Data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import Data/i })).toBeInTheDocument();
  });

  it('should trigger a file download when export is clicked', () => {
    render(<DataManagement habits={sampleHabitsOptimized} onImport={mockOnImport} />);
    
    const exportButton = screen.getByRole('button', { name: /Export Data/i });
    fireEvent.click(exportButton);

    // We can't test the actual download, but we can verify that createObjectURL was called,
    // which is the first step in the download process.
    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('should handle importing files in the new (optimized) format correctly', async () => {
    render(<DataManagement habits={[]} onImport={mockOnImport} />);

    // Note: The component itself handles the conversion from optimized to the app's internal format.
    // So we create a file with the optimized structure.
    const optimizedData = [{ id: 1, name: 'Optimized Habit', yearlyData: { '2025': [0,0,0,0,0,0,0,0, 262144] } }]; // Represents day 275 (Oct 2)
    const expectedHabitData = [{ id: 1, name: 'Optimized Habit', dates: { '2025-10-02': true } }];

    const file = new File([JSON.stringify(optimizedData)], 'habits_optimized.json', { type: 'application/json' });
    
    const importButton = screen.getByRole('button', { name: /Import Data/i });
    const fileInput = importButton.nextElementSibling as HTMLInputElement;

    // Fire the change event to trigger the async file read
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait until the onImport mock function has been called
    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledTimes(1);
    });

    // Now that we know it has been called, we can check what it was called with
    expect(mockOnImport).toHaveBeenCalledWith(expectedHabitData);
  });
  
  it('should handle importing files in the old (unoptimized) format for migration', async () => {
    render(<DataManagement habits={[]} onImport={mockOnImport} />);
    
    // This represents the old data structure
    const oldFormatHabits: Habit[] = [
      { id: 10, name: 'Old Format Habit', dates: { '2024-12-25': true } },
    ];
    
    const file = new File([JSON.stringify(oldFormatHabits)], 'habits_old.json', { type: 'application/json' });
    
    const importButton = screen.getByRole('button', { name: /Import Data/i });
    const fileInput = importButton.nextElementSibling as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the import to complete
    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledTimes(1);
    });
    
    // The component should recognize the old format and pass it up correctly
    expect(mockOnImport).toHaveBeenCalledWith(oldFormatHabits);
  });

  it('should not import invalid JSON file and not log an error to the console', async () => {
    // Mock window.alert so the test doesn't crash
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    // Mock console.error to prevent logging the expected error during the test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DataManagement habits={[]} onImport={mockOnImport} />);

    const invalidFile = new File(['invalid json'], 'invalid.json', { type: 'application/json' });
    const importButton = screen.getByRole('button', { name: /Import Data/i });
    const fileInput = importButton.nextElementSibling as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Wait for the alert to be called
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("Error reading or parsing the file"));
    });

    expect(mockOnImport).not.toHaveBeenCalled();

    // Clean up the spies to restore their original functionality
    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});


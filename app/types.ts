// Primary data structure used within the application's state for rendering and interaction.
export type Habit = {
  id: number;
  name: string;
  dates: Record<string, boolean>; // An object with "YYYY-MM-DD" keys for easy lookups.
};

// Optimized data structure used for saving to localStorage and for import/export.
export type StoredHabit = {
    id: number;
    name: string;
    yearlyData: Record<string, number[]>; // Bitmask format: { "2025": [123, 456, ...] }
};
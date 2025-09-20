import { render, screen, fireEvent } from '@testing-library/react';
import HabitItem from './HabitItem';
import '@testing-library/jest-dom';
import { Habit } from '../types';

// Helper to generate mock dates for testing
const getMockDates = (count: number): Date[] => {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const date = new Date('2025-09-20T00:00:00.000Z');
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates.reverse();
};

describe('HabitItem Component', () => {
  // Create mock functions that we can track
  const mockOnToggle = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnOpenStats = jest.fn();

  // Create a default habit and dates to use in the tests
  const defaultHabit: Habit = {
    id: 1,
    name: 'Test Habit',
    dates: {
      '2025-09-19': true, // This date is completed
    },
  };
  
  const sevenDays = getMockDates(7);

  // Clear mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the habit name correctly', () => {
    render(
      <HabitItem
        habit={defaultHabit}
        dates={sevenDays}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />
    );
    expect(screen.getByText('Test Habit')).toBeInTheDocument();
  });

  it('should render the correct number of date squares', () => {
    render(
      <HabitItem
        habit={defaultHabit}
        dates={sevenDays}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />
    );
    // The dates are in the format "Day, Date". We check for the weekday span.
    // There should be 7 of them.
    const weekdayElements = screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
    expect(weekdayElements).toHaveLength(7);
  });

  it('should call onToggle with the correct arguments when a date is clicked', () => {
    render(
      <HabitItem
        habit={defaultHabit}
        dates={sevenDays}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />
    );

    // Find the date square for the 20th and click it
    // The date squares that are not completed show the day of the month as text
    const dateSquare = screen.getByText('20');
    fireEvent.click(dateSquare);

    // Expect onToggle to have been called once with the habit ID and the date string
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith(1, '2025-09-20');
  });

  it('should call onDelete when the delete button is clicked', () => {
    render(
      <HabitItem
        habit={defaultHabit}
        dates={sevenDays}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />
    );

    // Find the delete button by its accessible name (aria-label) and click it
    const deleteButton = screen.getByLabelText('Delete habit');
    fireEvent.click(deleteButton);

    // Expect onDelete to have been called once with the habit's ID
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should call onOpenStats when the stats button is clicked', () => {
    render(
      <HabitItem
        habit={defaultHabit}
        dates={sevenDays}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />
    );

    const statsButton = screen.getByLabelText('View statistics');
    fireEvent.click(statsButton);

    expect(mockOnOpenStats).toHaveBeenCalledTimes(1);
    expect(mockOnOpenStats).toHaveBeenCalledWith(1);
  });
});

import { render, screen, fireEvent, within } from '@testing-library/react';
import HabitStatsModal from './HabitStatsModal';
import '@testing-library/jest-dom';
import { Habit } from '../types';

describe('HabitStatsModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const habitWithNoData: Habit = {
    id: 1,
    name: 'Empty Habit',
    dates: {},
  };

  const habitWithData: Habit = {
    id: 2,
    name: 'Active Habit',
    dates: {
      '2025-09-18': true,
      '2025-09-19': true, // 2-day streak
      '2025-09-15': true, 
      '2025-09-13': true,
      '2025-09-10': true,
    },
  };

  // Mock today's date to be Sep 20, 2025, for predictable streak calculations
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-09-20T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });


  it('should render the habit name and close button', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} />);

    expect(screen.getByText('Empty Habit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
  
  it('should call onClose when the close button is clicked', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should call onClose when the background overlay is clicked', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} />);
    
    // The background is the parent of the modal content div
    const modalContent = screen.getByRole('dialog');
    if (modalContent?.parentElement) {
        fireEvent.click(modalContent.parentElement);
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display zero for all stats when there is no data', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} />);

    const totalContainer = screen.getByText('Total Completions').parentElement!;
    expect(within(totalContainer).getByText('0')).toBeInTheDocument();

    const currentStreakContainer = screen.getByText('Current Streak').parentElement!;
    expect(within(currentStreakContainer).getByText('0')).toBeInTheDocument();

    const longestStreakContainer = screen.getByText('Longest Streak').parentElement!;
    expect(within(longestStreakContainer).getByText('0')).toBeInTheDocument();
  });

  it('should calculate and display stats correctly', () => {
    render(<HabitStatsModal habit={habitWithData} onClose={mockOnClose} onToggle={mockOnToggle} />);
    
    const totalContainer = screen.getByText('Total Completions').parentElement!;
    expect(within(totalContainer).getByText('5')).toBeInTheDocument();

    const currentStreakContainer = screen.getByText('Current Streak').parentElement!;
    expect(within(currentStreakContainer).getByText('2')).toBeInTheDocument();

    const longestStreakContainer = screen.getByText('Longest Streak').parentElement!;
    expect(within(longestStreakContainer).getByText('2')).toBeInTheDocument();
  });

  it('should render the calendar and allow toggling a date', () => {
    render(<HabitStatsModal habit={habitWithData} onClose={mockOnClose} onToggle={mockOnToggle} />);
    
    // Find a day that isn't completed, e.g., the 17th
    const dayToClick = screen.getByText('17');
    fireEvent.click(dayToClick);

    // Verify that the onToggle function was called with the correct parameters
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith(habitWithData.id, '2025-09-17');
  });

});


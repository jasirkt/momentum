import { render, screen, fireEvent, within } from '@testing-library/react';
import HabitStatsModal from './HabitStatsModal';
import '@testing-library/jest-dom';
import { Habit } from '../types';

describe('HabitStatsModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnToggle = jest.fn();
  const mockOnChangeSchedule = jest.fn();

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
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);

    expect(screen.getByText('Empty Habit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });
  
  it('should call onClose when the close button is clicked', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);
    
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('should call onClose when the background overlay is clicked', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);
    
    // The background is the parent of the modal content div
    const modalContent = screen.getByRole('dialog');
    if (modalContent?.parentElement) {
        fireEvent.click(modalContent.parentElement);
    }
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape is pressed', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display zero for all stats when there is no data', () => {
    render(<HabitStatsModal habit={habitWithNoData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);

    const totalContainer = screen.getByText('Total Completions').parentElement!;
    expect(within(totalContainer).getByText('0')).toBeInTheDocument();

    const currentStreakContainer = screen.getByText('Current Streak').parentElement!;
    expect(within(currentStreakContainer).getByText('0')).toBeInTheDocument();

    const longestStreakContainer = screen.getByText('Longest Streak').parentElement!;
    expect(within(longestStreakContainer).getByText('0')).toBeInTheDocument();
  });

  it('should calculate and display stats correctly', () => {
    render(<HabitStatsModal habit={habitWithData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);
    
    const totalContainer = screen.getByText('Total Completions').parentElement!;
    expect(within(totalContainer).getByText('5')).toBeInTheDocument();

    const currentStreakContainer = screen.getByText('Current Streak').parentElement!;
    expect(within(currentStreakContainer).getByText('2')).toBeInTheDocument();

    const longestStreakContainer = screen.getByText('Longest Streak').parentElement!;
    expect(within(longestStreakContainer).getByText('2')).toBeInTheDocument();
  });

  it('should render the calendar and allow toggling a date', () => {
    render(<HabitStatsModal habit={habitWithData} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);
    
    // Find a day that isn't completed, e.g., the 17th
    const dayToClick = screen.getByText('17');
    fireEvent.click(dayToClick);

    // Verify that the onToggle function was called with the correct parameters
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith(habitWithData.id, '2025-09-17');
  });

  describe('schedule', () => {
    const renderModal = (habit: Habit) =>
      render(<HabitStatsModal habit={habit} onClose={mockOnClose} onToggle={mockOnToggle} onChangeSchedule={mockOnChangeSchedule} />);
    const scheduleSection = () => screen.getByRole('region', { name: 'Schedule' });

    it('shows the current schedule', () => {
      renderModal(habitWithNoData);
      expect(within(scheduleSection()).getByText('Every day')).toBeInTheDocument();
    });

    it('shows the schedule in effect today, not an earlier one', () => {
      renderModal({
        ...habitWithNoData,
        schedules: [
          { from: '2025-01-01', schedule: { type: 'interval', every: 3 } },
          { from: '2025-09-01', schedule: { type: 'weekdays', days: 0b0101010 } },
        ],
      });
      expect(within(scheduleSection()).getByText('Mon, Wed, Fri')).toBeInTheDocument();
    });

    it('saves a new schedule', () => {
      renderModal(habitWithNoData);
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: 'week' } });
      fireEvent.change(screen.getByLabelText('Times a week'), { target: { value: '2' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(mockOnChangeSchedule).toHaveBeenCalledWith(1, { type: 'perPeriod', period: 'week', count: 2 });
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });

    it('explains that the change only affects today onwards', () => {
      renderModal(habitWithNoData);
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      expect(screen.getByText(/Past days keep the schedule they had/)).toBeInTheDocument();
    });

    it('discards the draft on Cancel', () => {
      renderModal(habitWithNoData);
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: 'interval' } });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnChangeSchedule).not.toHaveBeenCalled();
      expect(within(scheduleSection()).getByText('Every day')).toBeInTheDocument();
    });

    it('does not record a change when the schedule is unchanged', () => {
      renderModal(habitWithNoData);
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(mockOnChangeSchedule).not.toHaveBeenCalled();
    });
  });
});

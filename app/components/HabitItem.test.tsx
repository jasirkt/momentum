import { render, screen, fireEvent } from '@testing-library/react';
import HabitItem from './HabitItem';
import '@testing-library/jest-dom';
import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

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
  
  // Clear mock history before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the habit name correctly', () => {
    render(
      <HabitItem
        habit={defaultHabit}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />
    );
    expect(screen.getByText('Test Habit')).toBeInTheDocument();
  });

  it('shows the streak note', () => {
    render(<HabitItem habit={defaultHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} onOpenStats={mockOnOpenStats} />);
    expect(screen.getByText('Start a streak today')).toBeInTheDocument();
  });

  it('toggles today when the check button is clicked', () => {
    render(<HabitItem habit={defaultHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} onOpenStats={mockOnOpenStats} />);

    const check = screen.getByRole('button', { name: 'Mark Test Habit done today' });
    expect(check).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(check);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledWith(1, getLocalDateString(new Date()));
  });

  it('shows a completed habit as pressed and offers to undo it', () => {
    const today = getLocalDateString(new Date());
    render(
      <HabitItem
        habit={{ ...defaultHabit, dates: { [today]: true } }}
        onToggle={mockOnToggle}
        onDelete={mockOnDelete}
        onOpenStats={mockOnOpenStats}
      />,
    );

    const check = screen.getByRole('button', { name: 'Mark Test Habit not done today' });
    expect(check).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 day streak')).toBeInTheDocument();
  });

  it('opens statistics when the habit name is clicked', () => {
    render(<HabitItem habit={defaultHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} onOpenStats={mockOnOpenStats} />);

    fireEvent.click(screen.getByText('Test Habit'));

    expect(mockOnOpenStats).toHaveBeenCalledWith(1);
  });

  it('keeps delete and statistics inside the options menu', () => {
    render(<HabitItem habit={defaultHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} onOpenStats={mockOnOpenStats} />);

    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More options for Test Habit' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(1);
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'More options for Test Habit' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Statistics' }));
    expect(mockOnOpenStats).toHaveBeenCalledWith(1);
  });

  it('closes the options menu on Escape', () => {
    render(<HabitItem habit={defaultHabit} onToggle={mockOnToggle} onDelete={mockOnDelete} onOpenStats={mockOnOpenStats} />);

    fireEvent.click(screen.getByRole('button', { name: 'More options for Test Habit' }));
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

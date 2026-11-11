import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import Home from './page'; // The component we're testing
import '@testing-library/jest-dom';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock child components to isolate the Home component.
// This is a best practice to ensure we're only testing the logic within Home.
jest.mock('./components/AddHabitForm', () => {
    // The mock needs to accept the onAddHabit prop and call it when the form is "submitted"
    return jest.fn(({ onAddHabit }) => (
        <form data-testid="add-habit-form" onSubmit={(e) => { e.preventDefault(); onAddHabit('New Mock Habit'); }}>
            <input type="text" placeholder="e.g., Go for a walk" />
            <button type="submit">Add Habit</button>
            <button type="button" onClick={() => onAddHabit('Mock Weekly', { type: 'perPeriod', period: 'week', count: 2 })}>add weekly</button>
            <button type="button" onClick={() => onAddHabit('Mock Daily', { type: 'daily' })}>add daily</button>
        </form>
    ));
});

jest.mock('./components/HabitItem', () => {
    // Show the name and expose the callbacks so the page's handlers can be exercised.
    return jest.fn(({ habit, onToggle, onDelete, onOpenStats }) => (
        <div data-testid="habit-item">
            {habit.name}
            <button onClick={() => onOpenStats(habit.id)}>stats {habit.name}</button>
            <button onClick={() => onToggle(habit.id, new Date().toLocaleDateString('en-CA'))}>toggle {habit.name}</button>
            <button onClick={() => onDelete(habit.id)}>delete {habit.name}</button>
        </div>
    ));
});

// We only need to mock the components that have complex internal logic.
// DataManagement and HabitStatsModal can be ignored for this test's scope.
jest.mock('./components/DataManagement', () => jest.fn(() => <div data-testid="data-management"></div>));
jest.mock('./components/HabitStatsModal', () =>
  jest.fn(({ habit, onChangeSchedule }) => (
    <div data-testid="habit-stats-modal">
      <span data-testid="modal-schedules">{JSON.stringify(habit.schedules ?? null)}</span>
      <button onClick={() => onChangeSchedule(habit.id, { type: 'interval', every: 2 })}>set every 2 days</button>
      <button onClick={() => onChangeSchedule(habit.id, { type: 'daily' })}>set daily</button>
    </div>
  )),
);


describe('Home Component', () => {
  let dateNowSpy: jest.SpyInstance;
  let mockDateNow: number;

  // Before each test, we mock Date.now() to return a predictable, incrementing value
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    mockDateNow = 1; 
    // Replace the real Date.now() with our mock function.
    // We increment by a larger step (e.g., 10) to prevent collisions between
    // the default habit ID logic (Date.now() + index) and new habit ID logic (Date.now()).
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => {
        const now = mockDateNow;
        mockDateNow += 10;
        return now;
    });
  });

  // After each test, we restore the original Date.now() function
  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('should render the default habits when localStorage is empty', () => {
    render(<Home />);

    // Check if the default habits are displayed
    expect(screen.getByText('Drink 8 glasses of water')).toBeInTheDocument();
    expect(screen.getByText('Move your body for 20 minutes')).toBeInTheDocument();
    expect(screen.getByText('Read for 15 minutes')).toBeInTheDocument();
  });

  it('should allow a user to add a new habit', () => {
    render(<Home />);
    
    const form = screen.getByTestId('add-habit-form');

    act(() => {
        fireEvent.submit(form);
    });
    
    expect(screen.getByText('New Mock Habit')).toBeInTheDocument();
  });

  it('should load habits from localStorage if they exist', () => {
    const compressedHabits = [
        { id: 1, name: 'Habit from Storage 1', yearlyData: {} },
        { id: 2, name: 'Habit from Storage 2', yearlyData: {} },
    ];
    localStorage.setItem('habits', JSON.stringify(compressedHabits));

    render(<Home />);

    expect(screen.getByText('Habit from Storage 1')).toBeInTheDocument();
    expect(screen.getByText('Habit from Storage 2')).toBeInTheDocument();
    expect(screen.queryByText('Drink 8 glasses of water')).not.toBeInTheDocument();
  });

  it('keeps schedules through load, toggle and save', async () => {
    const schedules = [
      { from: '2025-01-01', schedule: { type: 'daily' } },
      { from: '2025-06-09', schedule: { type: 'weekdays', days: 42 } },
    ];
    localStorage.setItem('habits', JSON.stringify([{ id: 1, name: 'Gym', yearlyData: {}, schedules }]));

    render(<Home />);
    fireEvent.click(screen.getByText('toggle Gym'));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('habits')!);
      expect(Object.keys(saved[0].yearlyData)).toHaveLength(1);
      expect(saved[0].schedules).toEqual(schedules);
    });
  });

  it('saves habits loaded from the old format without adding schedules', async () => {
    localStorage.setItem('habits', JSON.stringify([{ id: 1, name: 'Walk', dates: { '2025-03-01': true } }]));

    render(<Home />);

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('habits')!);
      expect(saved).toEqual([
        { id: 1, name: 'Walk', yearlyData: { '2025': [0, 1 << 27, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } },
      ]);
    });
  });

  it('does not wipe localStorage with an empty array before loaded habits are applied', async () => {
    const compressedHabits = [
      { id: 1, name: 'Habit from Storage 1', yearlyData: {} },
      { id: 2, name: 'Habit from Storage 2', yearlyData: {} },
    ];
    const serialized = JSON.stringify(compressedHabits);
    localStorage.setItem('habits', serialized);

    render(<Home />);

    await waitFor(() => {
      const raw = localStorage.getItem('habits');
      expect(raw).not.toBe('[]');
      expect(raw).not.toBeNull();
    });
  });

  it('shows a notice and no default habits when stored habits JSON is invalid', async () => {
    localStorage.setItem('habits', '{not valid json');

    render(<Home />);

    expect(screen.getByText(/Saved data could not be read/i)).toBeInTheDocument();
    expect(screen.queryByText('Drink 8 glasses of water')).not.toBeInTheDocument();
    // Give the save effect a chance to (wrongly) run.
    await waitFor(() => expect(localStorage.getItem('habits_backup_unreadable')).toBe('{not valid json'));
    expect(localStorage.getItem('habits')).toBe('{not valid json');
  });

  it('start fresh clears unreadable data and the notice', async () => {
    localStorage.setItem('habits', '{not valid json');

    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: /start fresh/i }));

    expect(screen.queryByText(/Saved data could not be read/i)).not.toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('habits_backup_unreadable')).toBeNull());
  });

  it('loads legacy-format habits and migrates them to the bitmask format on save', async () => {
    localStorage.setItem(
      'habits',
      JSON.stringify([{ id: 1, name: 'Legacy Habit', dates: { '2025-01-01': true } }]),
    );

    render(<Home />);

    expect(screen.getByText('Legacy Habit')).toBeInTheDocument();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('habits') as string);
      expect(saved[0].yearlyData['2025'][0]).toBe(1);
      expect(saved[0].dates).toBeUndefined();
    });
  });

  it('shows a notice and keeps the data when stored habits are not an array', () => {
    localStorage.setItem('habits', JSON.stringify({ id: 1 }));

    render(<Home />);

    expect(screen.getByText(/Saved data could not be read/i)).toBeInTheDocument();
    expect(localStorage.getItem('habits')).toBe(JSON.stringify({ id: 1 }));
  });

  it('persists a newly added habit to localStorage', async () => {
    render(<Home />);

    act(() => {
      fireEvent.submit(screen.getByTestId('add-habit-form'));
    });

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('habits') as string);
      expect(saved.map((h: { name: string }) => h.name)).toContain('New Mock Habit');
    });
  });

  it('remembers that the local-storage warning was dismissed', () => {
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByText('Local storage only')).not.toBeInTheDocument();
    expect(localStorage.getItem('momentum_warning_closed')).toBe('true');
  });

  it('shows a notice and keeps the data when stored legacy habits are malformed', () => {
    const raw = JSON.stringify([{ id: 'x', name: '', dates: [] }]);
    localStorage.setItem('habits', raw);

    render(<Home />);

    expect(screen.getByText(/Saved data could not be read/i)).toBeInTheDocument();
    expect(localStorage.getItem('habits')).toBe(raw);
  });

  it('de-duplicates habit ids when loading stored data', () => {
    localStorage.setItem(
      'habits',
      JSON.stringify([
        { id: 5, name: 'Dup A', dates: {} },
        { id: 5, name: 'Dup B', dates: {} },
      ]),
    );

    render(<Home />);

    expect(screen.getByText('Dup A')).toBeInTheDocument();
    expect(screen.getByText('Dup B')).toBeInTheDocument();
  });

  it('moves a habit from To do to Done when it is completed today', () => {
    render(<Home />);

    const todoSection = () => screen.getByRole('region', { name: 'To do' });
    expect(within(todoSection()).getByText(/^Read for 15 minutes$/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Done' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('toggle Read for 15 minutes'));

    const doneSection = screen.getByRole('region', { name: 'Done' });
    expect(within(doneSection).getByText(/^Read for 15 minutes$/)).toBeInTheDocument();
    expect(within(todoSection()).queryByText(/^Read for 15 minutes$/)).not.toBeInTheDocument();
    expect(screen.getByText(/2 left today/)).toBeInTheDocument();
  });

  it('deletes without a confirm dialog and restores the habit in place on undo', () => {
    const confirmSpy = jest.spyOn(window, 'confirm');
    render(<Home />);

    fireEvent.click(screen.getByText('delete Move your body for 20 minutes'));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByText(/^Move your body for 20 minutes/)).not.toBeInTheDocument();
    expect(screen.getByText(/Deleted/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    const names = screen.getAllByTestId('habit-item').map((el) => el.textContent);
    expect(names[1]).toContain('Move your body for 20 minutes');
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('lets the undo offer expire', () => {
    jest.useFakeTimers();
    try {
      render(<Home />);
      fireEvent.click(screen.getByText('delete Read for 15 minutes'));
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(6500);
      });

      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });


  describe('schedules', () => {
    const today = () => new Date().toLocaleDateString('en-CA');
    const saved = () => JSON.parse(localStorage.getItem('habits') as string);

    it('stores the schedule of a newly added habit from today', async () => {
      render(<Home />);
      fireEvent.click(screen.getByText('add weekly'));

      await waitFor(() => {
        const habit = saved().find((h: { name: string }) => h.name === 'Mock Weekly');
        expect(habit.schedules).toEqual([{ from: today(), schedule: { type: 'perPeriod', period: 'week', count: 2 } }]);
      });
    });

    it('adds a daily habit without a schedule history', async () => {
      render(<Home />);
      fireEvent.click(screen.getByText('add daily'));

      await waitFor(() => {
        const habit = saved().find((h: { name: string }) => h.name === 'Mock Daily');
        expect(habit).toBeDefined();
        expect(habit.schedules).toBeUndefined();
      });
    });

    it('lists habits that are not due today separately', () => {
      const notToday = 0b1111111 & ~(1 << new Date().getDay());
      localStorage.setItem(
        'habits',
        JSON.stringify([
          { id: 1, name: 'Rest day habit', yearlyData: {}, schedules: [{ from: '2025-01-01', schedule: { type: 'weekdays', days: notToday } }] },
          { id: 2, name: 'Daily habit', yearlyData: {} },
        ]),
      );
      render(<Home />);

      const later = screen.getByRole('region', { name: 'Not due today' });
      expect(within(later).getByText(/^Rest day habit/)).toBeInTheDocument();
      expect(within(screen.getByRole('region', { name: 'To do' })).getByText(/^Daily habit/)).toBeInTheDocument();
      expect(screen.getByText(/1 left today/)).toBeInTheDocument();
    });

    it('says nothing is due when only habits for other days remain', () => {
      const notToday = 0b1111111 & ~(1 << new Date().getDay());
      localStorage.setItem(
        'habits',
        JSON.stringify([{ id: 1, name: 'Rest', yearlyData: {}, schedules: [{ from: '2025-01-01', schedule: { type: 'weekdays', days: notToday } }] }]),
      );
      render(<Home />);
      expect(screen.getByText(/Nothing due today/)).toBeInTheDocument();
    });

    it('moves a scheduled habit to Done when completed, even on a day it is not due', () => {
      const notToday = 0b1111111 & ~(1 << new Date().getDay());
      localStorage.setItem(
        'habits',
        JSON.stringify([{ id: 1, name: 'Rest', yearlyData: {}, schedules: [{ from: '2025-01-01', schedule: { type: 'weekdays', days: notToday } }] }]),
      );
      render(<Home />);
      fireEvent.click(screen.getByText('toggle Rest'));
      expect(within(screen.getByRole('region', { name: 'Done' })).getByText(/^Rest/)).toBeInTheDocument();
    });

    it('changes a schedule from the stats modal, keeping history and refreshing the modal', async () => {
      localStorage.setItem('habits', JSON.stringify([{ id: 1, name: 'Walk', dates: { '2025-03-01': true } }]));
      render(<Home />);

      fireEvent.click(screen.getByText('stats Walk'));
      fireEvent.click(screen.getByText('set every 2 days'));

      const expected = [
        { from: '2025-03-01', schedule: { type: 'daily' } },
        { from: today(), schedule: { type: 'interval', every: 2 } },
      ];
      expect(JSON.parse(screen.getByTestId('modal-schedules').textContent!)).toEqual(expected);
      await waitFor(() => expect(saved()[0].schedules).toEqual(expected));
    });

    it('drops the history when a same-day change is undone', async () => {
      localStorage.setItem('habits', JSON.stringify([{ id: 1, name: 'Walk', dates: { '2025-03-01': true } }]));
      render(<Home />);

      fireEvent.click(screen.getByText('stats Walk'));
      fireEvent.click(screen.getByText('set every 2 days'));
      fireEvent.click(screen.getByText('set daily'));

      expect(screen.getByTestId('modal-schedules').textContent).toBe('null');
      await waitFor(() => expect(saved()[0].schedules).toBeUndefined());
    });
  });
});

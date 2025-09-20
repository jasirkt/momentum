import { render, screen, fireEvent, act } from '@testing-library/react';
import Home from './page'; // The component we're testing
import '@testing-library/jest-dom';

// Mock child components to isolate the Home component.
// This is a best practice to ensure we're only testing the logic within Home.
jest.mock('./components/AddHabitForm', () => {
    // The mock needs to accept the onAddHabit prop and call it when the form is "submitted"
    return jest.fn(({ onAddHabit }) => (
        <form data-testid="add-habit-form" onSubmit={(e) => { e.preventDefault(); onAddHabit('New Mock Habit'); }}>
            <input type="text" placeholder="e.g., Go for a walk" />
            <button type="submit">Add Habit</button>
        </form>
    ));
});

jest.mock('./components/HabitItem', () => {
    // The mock just needs to display the habit name to be findable in the test
    return jest.fn(({ habit }) => <div data-testid="habit-item">{habit.name}</div>);
});

// We only need to mock the components that have complex internal logic.
// DataManagement and HabitStatsModal can be ignored for this test's scope.
jest.mock('./components/DataManagement', () => jest.fn(() => <div data-testid="data-management"></div>));
jest.mock('./components/HabitStatsModal', () => jest.fn(() => <div data-testid="habit-stats-modal"></div>));


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

});


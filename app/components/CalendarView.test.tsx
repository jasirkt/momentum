import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from './CalendarView';
import { Habit } from '../types';

describe('CalendarView', () => {
  const onToggle = jest.fn();
  const habit: Habit = { id: 7, name: 'Gym', dates: { '2026-11-02': true } };

  const setToday = (iso: string) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${iso}T12:00:00`));
  };

  // Day numbers per row, with '' for blank cells.
  const rows = () =>
    within(screen.getByRole('table'))
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).queryAllByRole('cell').map((cell) => cell.textContent));

  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.useRealTimers());

  it('starts the week on Monday', () => {
    setToday('2026-11-11');
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    const headers = within(screen.getByRole('table')).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('puts a month starting on Sunday in the last column', () => {
    // 1 Nov 2026 is a Sunday.
    setToday('2026-11-11');
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    expect(rows()[0]).toEqual(['', '', '', '', '', '', '1']);
    expect(rows()[1]).toEqual(['2', '3', '4', '5', '6', '7', '8']);
  });

  it('puts a month starting on Monday in the first column', () => {
    // 1 Jun 2026 is a Monday.
    setToday('2026-06-15');
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    expect(rows()[0]).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(rows()[4]).toEqual(['29', '30', '', '', '', '', '']);
  });

  it('always renders six week rows', () => {
    setToday('2026-02-10'); // Feb 2026 starts on a Sunday and spans five rows.
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(7);
  });

  it('marks completed days and toggles a day', () => {
    setToday('2026-11-11');
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    expect(screen.getByRole('button', { name: /Mon Nov 02 2026 - Completed/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tue Nov 03 2026 - Not completed/ }));
    expect(onToggle).toHaveBeenCalledWith(7, '2026-11-03');
  });

  it('keeps the Monday layout after changing month', () => {
    setToday('2026-11-11');
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    // 1 Dec 2026 is a Tuesday.
    expect(rows()[0]).toEqual(['', '1', '2', '3', '4', '5', '6']);
  });
});

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

  const heading = () => screen.getByRole('heading', { level: 3 }).textContent;

  it.each([
    ['2026-10-31', 'November 2026', 'September 2026'],
    ['2026-03-31', 'April 2026', 'February 2026'],
    ['2026-01-30', 'February 2026', 'December 2025'],
    ['2024-01-31', 'February 2024', 'December 2023'],
    ['2026-12-31', 'January 2027', 'November 2026'],
  ])('moves exactly one month from %s', (today, next, previous) => {
    setToday(today);
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(heading()).toBe(next);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(heading()).toBe(previous);
  });

  it('steps through every month of the year from the 31st', () => {
    setToday('2026-01-31');
    render(<CalendarView habit={habit} onToggle={onToggle} />);
    const seen = [heading()];
    for (let i = 0; i < 12; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
      seen.push(heading());
    }
    expect(seen).toEqual([
      'January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026',
      'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026',
      'January 2027',
    ]);
  });
});

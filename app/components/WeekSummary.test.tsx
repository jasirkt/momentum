import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeekSummary from './WeekSummary';
import { Habit } from '../types';
import { getLocalDateString, getPastDates } from '../utils/dateUtils';

describe('WeekSummary', () => {
  const dates = getPastDates(7);
  const today = getLocalDateString(dates[6]);
  const yesterday = getLocalDateString(dates[5]);

  it('renders nothing when there are no habits', () => {
    const { container } = render(<WeekSummary habits={[]} dates={dates} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('counts check-ins across the week out of all possible', () => {
    const habits: Habit[] = [
      { id: 1, name: 'A', dates: { [today]: true, [yesterday]: true } },
      { id: 2, name: 'B', dates: { [today]: true } },
    ];
    render(<WeekSummary habits={habits} dates={dates} />);
    expect(screen.getByText('3 of 14 check-ins')).toBeInTheDocument();
  });

  it('ignores completions outside the window', () => {
    const habits: Habit[] = [{ id: 1, name: 'A', dates: { '2001-01-01': true } }];
    render(<WeekSummary habits={habits} dates={dates} />);
    expect(screen.getByText('0 of 7 check-ins')).toBeInTheDocument();
  });

  it('counts only the check-ins the schedules expected', () => {
    const habits: Habit[] = [
      { id: 1, name: 'Daily', dates: { [today]: true } },
      {
        id: 2,
        name: 'Twice a week',
        dates: { [yesterday]: true },
        schedules: [{ from: '2001-01-01', schedule: { type: 'perPeriod', period: 'week', count: 2 } }],
      },
    ];
    render(<WeekSummary habits={habits} dates={dates} />);
    expect(screen.getByText('2 of 9 check-ins')).toBeInTheDocument();
  });

  it('never shows more check-ins than were possible when a habit is done on extra days', () => {
    const habits: Habit[] = [
      {
        id: 1,
        name: 'Once a week',
        dates: { [today]: true, [yesterday]: true },
        schedules: [{ from: '2001-01-01', schedule: { type: 'perPeriod', period: 'week', count: 1 } }],
      },
    ];
    render(<WeekSummary habits={habits} dates={dates} />);
    expect(screen.getByText('2 of 2 check-ins')).toBeInTheDocument();
  });
});

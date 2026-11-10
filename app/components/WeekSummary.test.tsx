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
});

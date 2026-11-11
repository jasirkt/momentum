import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';
import ScheduleEditor from './ScheduleEditor';
import { Schedule } from '../types';

// Keeps the editor controlled the way its parents use it and records every change.
function Harness({ initial, onChange }: { initial: Schedule; onChange: (s: Schedule) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <ScheduleEditor
      value={value}
      onChange={(s) => {
        setValue(s);
        onChange(s);
      }}
    />
  );
}

describe('ScheduleEditor', () => {
  const onChange = jest.fn();
  const setup = (initial: Schedule = { type: 'daily' }) => render(<Harness initial={initial} onChange={onChange} />);
  const lastValue = () => onChange.mock.calls[onChange.mock.calls.length - 1][0];

  beforeEach(() => jest.clearAllMocks());

  it('shows the current kind and no extra fields for daily', () => {
    setup();
    expect(screen.getByLabelText('Repeat')).toHaveValue('daily');
    expect(screen.queryByRole('group', { name: 'Days of the week' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('combobox')).toHaveLength(1);
  });

  it.each<[string, Schedule]>([
    ['weekdays', { type: 'weekdays', days: 0b0111110 }],
    ['week', { type: 'perPeriod', period: 'week', count: 3 }],
    ['month', { type: 'perPeriod', period: 'month', count: 4 }],
    ['interval', { type: 'interval', every: 2 }],
    ['afterLast', { type: 'afterLast', days: 3 }],
    ['monthDay', { type: 'monthDay', day: 1 }],
    ['daily', { type: 'daily' }],
  ])('switching to %s starts from a sensible default', (kind, expected) => {
    setup({ type: 'interval', every: 9 });
    fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: kind } });
    expect(lastValue()).toEqual(expected);
  });

  it('reflects an existing schedule', () => {
    setup({ type: 'perPeriod', period: 'month', count: 12 });
    expect(screen.getByLabelText('Repeat')).toHaveValue('month');
    expect(screen.getByLabelText('Times a month')).toHaveValue('12');
  });

  describe('weekdays', () => {
    it('lists days Monday first', () => {
      setup({ type: 'weekdays', days: 0b0101010 });
      const names = within(screen.getByRole('group', { name: 'Days of the week' }))
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label'));
      expect(names).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    });

    it('marks selected days and toggles them', () => {
      setup({ type: 'weekdays', days: 0b0101010 });
      expect(screen.getByRole('button', { name: 'Monday' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Sunday' })).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(screen.getByRole('button', { name: 'Sunday' }));
      expect(lastValue()).toEqual({ type: 'weekdays', days: 0b0101011 });
      fireEvent.click(screen.getByRole('button', { name: 'Monday' }));
      expect(lastValue()).toEqual({ type: 'weekdays', days: 0b0101001 });
    });

    it('keeps at least one day selected', () => {
      setup({ type: 'weekdays', days: 0b0000100 });
      const tuesday = screen.getByRole('button', { name: 'Tuesday' });
      expect(tuesday).toBeDisabled();
      fireEvent.click(tuesday);
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Monday' })).toBeEnabled();
    });
  });

  it('limits weekly counts to 1–7 and monthly counts to 1–31', () => {
    setup({ type: 'perPeriod', period: 'week', count: 3 });
    const weekly = within(screen.getByLabelText('Times a week')).getAllByRole('option');
    expect(weekly.map((o) => o.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '7']);

    fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: 'month' } });
    const monthly = within(screen.getByLabelText('Times a month')).getAllByRole('option');
    expect(monthly).toHaveLength(31);
  });

  it('keeps the period when changing the count', () => {
    setup({ type: 'perPeriod', period: 'month', count: 4 });
    fireEvent.change(screen.getByLabelText('Times a month'), { target: { value: '10' } });
    expect(lastValue()).toEqual({ type: 'perPeriod', period: 'month', count: 10 });
  });

  it('sets the interval length', () => {
    setup({ type: 'interval', every: 2 });
    const options = within(screen.getByLabelText('Days between')).getAllByRole('option');
    expect(options[0]).toHaveTextContent('2');
    expect(options[options.length - 1]).toHaveTextContent('365');
    fireEvent.change(screen.getByLabelText('Days between'), { target: { value: '14' } });
    expect(lastValue()).toEqual({ type: 'interval', every: 14 });
  });

  it('sets the days allowed since last time', () => {
    setup({ type: 'afterLast', days: 3 });
    fireEvent.change(screen.getByLabelText('Days allowed'), { target: { value: '1' } });
    expect(lastValue()).toEqual({ type: 'afterLast', days: 1 });
    expect(screen.getByText('day of the last time')).toBeInTheDocument();
  });

  it('sets the day of the month and explains short months', () => {
    setup({ type: 'monthDay', day: 1 });
    const day = screen.getByLabelText('Day of the month');
    expect(within(day).getByRole('option', { name: 'last day' })).toHaveValue('31');
    expect(screen.queryByText(/shorter months/)).not.toBeInTheDocument();

    fireEvent.change(day, { target: { value: '30' } });
    expect(lastValue()).toEqual({ type: 'monthDay', day: 30 });
    expect(screen.getByText(/or the last day in shorter months/)).toBeInTheDocument();

    fireEvent.change(day, { target: { value: '31' } });
    expect(screen.queryByText(/shorter months/)).not.toBeInTheDocument();
  });
});

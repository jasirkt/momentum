'use client';

import { useId } from 'react';
import { Schedule } from '../types';
import { ordinal, WEEKDAY_LONG, WEEKDAY_ORDER, WEEKDAY_SHORT, WEEKDAYS_MASK } from '../utils/scheduleText';

type Kind = 'daily' | 'weekdays' | 'week' | 'month' | 'interval' | 'afterLast' | 'monthDay';

const KIND_LABELS: Record<Kind, string> = {
  daily: 'Every day',
  weekdays: 'Certain days of the week',
  week: 'A number of times a week',
  month: 'A number of times a month',
  interval: 'Every N days, fixed cycle',
  afterLast: 'Within N days of last time',
  monthDay: 'A day of the month',
};

const KINDS = Object.keys(KIND_LABELS) as Kind[];

const kindOf = (s: Schedule): Kind =>
  s.type === 'perPeriod' ? s.period : s.type;

/** The schedule a kind starts with when the user switches to it. */
const defaultFor = (kind: Kind): Schedule => {
  switch (kind) {
    case 'daily':
      return { type: 'daily' };
    case 'weekdays':
      return { type: 'weekdays', days: WEEKDAYS_MASK };
    case 'week':
      return { type: 'perPeriod', period: 'week', count: 3 };
    case 'month':
      return { type: 'perPeriod', period: 'month', count: 4 };
    case 'interval':
      return { type: 'interval', every: 2 };
    case 'afterLast':
      return { type: 'afterLast', days: 3 };
    case 'monthDay':
      return { type: 'monthDay', day: 1 };
  }
};

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

const fieldClass =
  'min-h-11 rounded-xl border border-[var(--outline)] bg-[var(--surface-container-lowest)] px-3 text-[15px] font-medium text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_25%,transparent)]';

type NumberSelectProps = {
  label: string;
  value: number;
  options: number[];
  format?: (n: number) => string;
  onChange: (n: number) => void;
};

function NumberSelect({ label, value, options, format = String, onChange }: NumberSelectProps) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={fieldClass}
    >
      {options.map((n) => (
        <option key={n} value={n}>
          {format(n)}
        </option>
      ))}
    </select>
  );
}

type ScheduleEditorProps = {
  value: Schedule;
  onChange: (schedule: Schedule) => void;
};

/** Controlled picker for a habit's schedule. It can only produce valid schedules. */
export default function ScheduleEditor({ value, onChange }: ScheduleEditorProps) {
  const id = useId();
  const kind = kindOf(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-kind`} className="text-[13px] font-semibold text-[var(--on-surface-variant)]">
          Repeat
        </label>
        <select
          id={`${id}-kind`}
          value={kind}
          onChange={(e) => onChange(defaultFor(e.target.value as Kind))}
          className={fieldClass}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {value.type === 'weekdays' && (
        <div role="group" aria-label="Days of the week" className="flex gap-1.5">
          {WEEKDAY_ORDER.map((day) => {
            const on = ((value.days >> day) & 1) === 1;
            const isLastOn = on && (value.days & ~(1 << day)) === 0;
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                aria-label={WEEKDAY_LONG[day]}
                // At least one day has to stay selected.
                disabled={isLastOn}
                onClick={() => onChange({ type: 'weekdays', days: value.days ^ (1 << day) })}
                className={`flex h-11 min-w-0 flex-1 items-center justify-center rounded-full border text-[13px] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
                  on
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]'
                    : 'border-[var(--outline)] text-[var(--on-surface-variant)] hover:bg-[var(--state-hover)]'
                }`}
              >
                {WEEKDAY_SHORT[day].slice(0, 2)}
              </button>
            );
          })}
        </div>
      )}

      {value.type === 'perPeriod' && (
        <div className="flex items-center gap-2 text-[15px] text-[var(--foreground)]">
          <NumberSelect
            label={`Times a ${value.period}`}
            value={value.count}
            options={range(1, value.period === 'week' ? 7 : 31)}
            onChange={(count) => onChange({ ...value, count })}
          />
          <span>{value.count === 1 ? 'time' : 'times'} a {value.period}</span>
        </div>
      )}

      {value.type === 'interval' && (
        <div className="flex items-center gap-2 text-[15px] text-[var(--foreground)]">
          <span>Every</span>
          <NumberSelect
            label="Days between"
            value={value.every}
            options={range(2, 365)}
            onChange={(every) => onChange({ type: 'interval', every })}
          />
          <span>days, on a fixed cycle</span>
        </div>
      )}

      {value.type === 'afterLast' && (
        <div className="flex flex-wrap items-center gap-2 text-[15px] text-[var(--foreground)]">
          <span>Within</span>
          <NumberSelect
            label="Days allowed"
            value={value.days}
            options={range(1, 365)}
            onChange={(days) => onChange({ type: 'afterLast', days })}
          />
          <span>{value.days === 1 ? 'day' : 'days'} of the last time</span>
        </div>
      )}

      {value.type === 'monthDay' && (
        <div className="flex flex-wrap items-center gap-2 text-[15px] text-[var(--foreground)]">
          <span>On the</span>
          <NumberSelect
            label="Day of the month"
            value={value.day}
            options={range(1, 31)}
            format={(n) => (n === 31 ? 'last day' : ordinal(n))}
            onChange={(day) => onChange({ type: 'monthDay', day })}
          />
          {value.day >= 29 && value.day < 31 && (
            <span className="text-[13px] text-[var(--on-surface-variant)]">or the last day in shorter months</span>
          )}
        </div>
      )}
    </div>
  );
}

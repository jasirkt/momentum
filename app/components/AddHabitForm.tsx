'use client';

import { useState, FormEvent } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { MAX_HABIT_NAME_LENGTH } from '../utils/habitValidation';
import { Schedule } from '../types';
import { DAILY } from '../utils/scheduleUtils';
import { describeSchedule } from '../utils/scheduleText';
import ScheduleEditor from './ScheduleEditor';

type AddHabitFormProps = {
  onAddHabit: (name: string, schedule: Schedule) => void;
};

export default function AddHabitForm({ onAddHabit }: AddHabitFormProps) {
  const [habitName, setHabitName] = useState('');
  const [schedule, setSchedule] = useState<Schedule>(DAILY);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = habitName.trim();
    if (!trimmedName) return;

    onAddHabit(trimmedName, schedule);
    setHabitName('');
    setSchedule(DAILY);
    setScheduleOpen(false);
  };

  const isDaily = schedule.type === 'daily';
  const summary = describeSchedule(schedule);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {scheduleOpen && (
        <div
          id="new-habit-schedule"
          className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-high)] p-4"
        >
          <ScheduleEditor value={schedule} onChange={setSchedule} />
        </div>
      )}
      {!scheduleOpen && !isDaily && (
        <p className="px-1 text-[13px] font-medium text-[var(--on-surface-variant)]">Repeats: {summary}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setScheduleOpen((open) => !open)}
          aria-expanded={scheduleOpen}
          aria-controls="new-habit-schedule"
          aria-label={`Repeat: ${summary}`}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
            isDaily && !scheduleOpen
              ? 'border-[var(--outline)] text-[var(--on-surface-variant)] hover:bg-[var(--state-hover)]'
              : 'border-[var(--primary)] bg-[var(--primary-container)] text-[var(--on-primary-container)]'
          }`}
        >
          <Repeat size={20} />
        </button>
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          maxLength={MAX_HABIT_NAME_LENGTH}
          placeholder="Add a new habit..."
          className="min-h-12 min-w-0 flex-grow rounded-full border border-[var(--outline)] bg-[var(--surface-container-lowest)] px-5 text-[15px] font-medium text-[var(--foreground)] transition-[box-shadow,border-color] placeholder:text-[var(--on-surface-variant)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_25%,transparent)]"
          aria-label="New habit name"
        />
        <button
          type="submit"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] transition-[opacity,transform] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!habitName.trim()}
          aria-label="Add habit"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}

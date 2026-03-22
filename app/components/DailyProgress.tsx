'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type DailyProgressProps = {
  totalHabits: number;
  completedHabits: number;
};

export default function DailyProgress({ totalHabits, completedHabits }: DailyProgressProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    if (totalHabits === 0) {
      setPercentage(0);
    } else {
      setPercentage(Math.round((completedHabits / totalHabits) * 100));
    }
  }, [totalHabits, completedHabits]);

  const getMotivationalMessage = (pct: number) => {
    if (pct === 0) return "Let's get started!";
    if (pct < 50) return 'Good start — keep going.';
    if (pct < 100) return 'Almost there!';
    return "You're unstoppable!";
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="glass-panel relative mb-8 flex items-center justify-between overflow-hidden p-6 md:p-7">
      <div
        className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 45%, transparent), transparent 70%)',
        }}
      />

      <div className="z-10">
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-[var(--foreground)]">Today</h2>
        <p className="mb-4 text-sm font-medium text-[var(--on-surface-variant)]">
          {getMotivationalMessage(percentage)}
        </p>
        <div className="text-3xl font-bold tabular-nums text-[var(--primary)]">
          {completedHabits}
          <span className="text-xl font-medium text-[var(--on-surface-variant)]">/{totalHabits}</span>
        </div>
      </div>

      <div className="relative z-10 flex h-32 w-32 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-[var(--surface-container-highest)]"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-[var(--primary)] drop-shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_45%,transparent)]"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-[var(--foreground)]">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}

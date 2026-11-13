# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Momentum is a client-only habit tracker (Next.js 15 App Router, React 19, Tailwind v4, framer-motion) deployed at https://momentum.jasir.dev on Vercel. There is no backend: all data lives in the browser's `localStorage`. It ships as a PWA via `next-pwa`.

## Commands

```bash
npm run dev                          # dev server (Turbopack); PWA/service worker disabled in development
npm run build                        # production build (Turbopack)
npm run lint                         # ESLint (next/core-web-vitals + next/typescript)
npm test                             # Jest (jsdom, via next/jest)
npx jest app/utils/statsUtils.test.ts        # single test file
npx jest -t "calculates longest streak"      # tests matching a name
```

Tests sit next to their source as `*.test.ts(x)`.

## Architecture

- **Single page, single state owner.** `app/page.tsx` (`'use client'`) holds the `habits` array and every CRUD handler (add, delete, toggle date, import). The components in `app/components/` are presentational and receive data and callbacks through props. `HabitStatsModal` gets a snapshot of the habit it shows, so `toggleHabitDate` also refreshes `viewingHabit`.
- **Two data shapes** (`app/types.ts`):
  - `Habit` is the in-memory shape. `dates` is a `Record<"YYYY-MM-DD", true>`.
  - `StoredHabit` is the persisted and exported shape. `yearlyData` is `{ "2025": number[12] }`, a bitmask where each number holds 32 days of the year (bit index = dayOfYear − 1).
  - Both carry an optional `schedules` history (`ScheduleEntry[]`, sorted by `from`); missing or empty means daily, so data from before schedules needs no migration. `app/utils/scheduleUtils.ts` owns all schedule logic: which schedule applies on a day (`getScheduleOn`), recording changes (`setSchedule`), streaks (`calculateScheduledStreaks`, which judges each day by the schedule in effect then) and what is due today (`getDueInfo`). Weeks run Monday–Sunday.
  - Both also carry an optional `archived` flag, stored only when `true`; missing means active. Archived habits keep their history but are excluded from the daily list, due info and week summary in `page.tsx`, and are listed in `ArchivedHabits` where they can be restored.
  - `app/utils/storageUtils.ts` converts between them (`compressHabits` / `decompressHabits`). Anything that reads or writes storage or export files must go through these functions.
- **Persistence flow.** On mount, `page.tsx` reads `localStorage['habits']`. The bitmask format is decompressed. The legacy format (arrays with a `dates` key) is loaded as-is and migrates to the bitmask format on the next save. The save effect is gated on `storageHydrated` so the initial empty state never overwrites saved data. `localStorage['momentum_warning_closed']` stores whether the user dismissed the local-storage warning banner.
- **Storage can throw.** `page.tsx` reads and writes `localStorage` only through `app/utils/safeStorage.ts` (`readStorage`, `writeStorage`, `removeStorage`), which never throw when storage is blocked or full. A failed save shows a notice instead of crashing.
- **"Today" moves while the app is open.** `useNow` (`app/utils/useNow.ts`) replaces its value when the local hour changes or the page returns to the foreground, which re-renders `page.tsx` on a new day. Components read the date on each render, so anything memoized on "today" needs the date string in its deps, and click handlers should read the date at click time.
- **Import/export.** Handled in `DataManagement.tsx`. Imports are validated by `validateAndNormalizeImportedHabits` in `app/utils/habitValidation.ts`, which accepts both the bitmask format and the legacy format, enforces `MAX_HABIT_NAME_LENGTH` and `MAX_IMPORT_FILE_BYTES`, and de-duplicates ids. Habit ids are `Date.now()`-based numbers.
- **Dates are local calendar days, never UTC.** Use the helpers in `app/utils/dateUtils.ts` (`getLocalDateString`, `parseLocalDateString`, `diffCalendarDaysLocal`, `getDayOfYear`). Do not use `toISOString()` or `new Date("YYYY-MM-DD")`, which parse and format in UTC and shift days across timezones. Streak math in `statsUtils.ts` depends on this: the current streak stays alive if the last completion was today or yesterday.

## Styling

`app/globals.css` defines a light "paper journal" token set (Material 3 role names, warm paper and ink values) as CSS variables on `:root`: surfaces, `--primary` (ink), `--success` for completion, `--streak` for streaks, `--danger`, `--elevation-*`, and state layers. Headings use `font-serif` (Fraunces), body text is Inter. Components use them through Tailwind arbitrary values such as `bg-[var(--surface-container-high)]` and `text-[var(--on-surface-variant)]`. Use these tokens rather than raw colors. `.glass-panel` is the shared card style.

Dark mode redefines the same tokens under `:root[data-theme="dark"]` (a warm "lamplit journal" palette), so components need no dark variants; any new token needs a dark value too. `app/utils/theme.ts` owns theme logic: a pre-paint script in `layout.tsx` sets `data-theme` before first render, following the system until the user taps `ThemeToggle` (the sun/moon after the date), after which `localStorage['momentum_theme']` holds the choice.

## Testing conventions

Component tests use React Testing Library. They mock `framer-motion`, replacing `motion.div` and `AnimatePresence` with plain wrappers, and `page.test.tsx` also mocks the child components to isolate `Home`. Follow the same pattern when adding tests for animated components.

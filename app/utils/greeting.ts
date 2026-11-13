export const LATE_NIGHT_GREETINGS = [
  'Still up?',
  'Burning the midnight oil.',
  'Night owl mode.',
  'Hello, night owl.',
  'The quiet hours.',
  'Late night, big plans.',
  'Moonlight shift.',
  'Another day is almost here.',
  "The world is asleep. You're not.",
  'Early start, or late finish?',
  'Good night, or good morning.',
  'Stars are out, habits too.',
];

export type GreetingPeriod = 'lateNight' | 'morning' | 'afternoon' | 'evening';

/** The part of the day a local hour (0-23) falls in; the greeting changes when this does. */
export const getGreetingPeriod = (hour: number): GreetingPeriod => {
  if (hour < 5) return 'lateNight';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

/**
 * Greeting for a local hour (0-23), including its own punctuation.
 * 00:00-04:59 picks from the late-night pool; `random` is injectable for tests.
 */
export const getGreeting = (hour: number, random: () => number = Math.random): string => {
  switch (getGreetingPeriod(hour)) {
    case 'lateNight': {
      const last = LATE_NIGHT_GREETINGS.length - 1;
      return LATE_NIGHT_GREETINGS[Math.min(Math.floor(random() * LATE_NIGHT_GREETINGS.length), last)];
    }
    case 'morning':
      return 'Good morning.';
    case 'afternoon':
      return 'Good afternoon.';
    case 'evening':
      return 'Good evening.';
  }
};

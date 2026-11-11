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

/**
 * Greeting for a local hour (0-23), including its own punctuation.
 * 00:00-04:59 picks from the late-night pool; `random` is injectable for tests.
 */
export const getGreeting = (hour: number, random: () => number = Math.random): string => {
  if (hour < 5) {
    const last = LATE_NIGHT_GREETINGS.length - 1;
    return LATE_NIGHT_GREETINGS[Math.min(Math.floor(random() * LATE_NIGHT_GREETINGS.length), last)];
  }
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
};

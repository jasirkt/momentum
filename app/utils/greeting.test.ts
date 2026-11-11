import { getGreeting, LATE_NIGHT_GREETINGS } from './greeting';

describe('getGreeting', () => {
  it('uses the late-night pool from 00:00 to 04:59', () => {
    for (const hour of [0, 1, 4]) {
      expect(LATE_NIGHT_GREETINGS).toContain(getGreeting(hour));
    }
  });

  it('switches to Good morning at 05:00', () => {
    expect(getGreeting(5)).toBe('Good morning.');
    expect(getGreeting(11)).toBe('Good morning.');
  });

  it('keeps the afternoon and evening boundaries', () => {
    expect(getGreeting(12)).toBe('Good afternoon.');
    expect(getGreeting(17)).toBe('Good afternoon.');
    expect(getGreeting(18)).toBe('Good evening.');
    expect(getGreeting(23)).toBe('Good evening.');
  });

  it('picks from the pool using the injected random source', () => {
    const last = LATE_NIGHT_GREETINGS[LATE_NIGHT_GREETINGS.length - 1];
    expect(getGreeting(2, () => 0)).toBe(LATE_NIGHT_GREETINGS[0]);
    expect(getGreeting(2, () => 0.999999)).toBe(last);
    expect(getGreeting(2, () => 1)).toBe(last);
  });
});

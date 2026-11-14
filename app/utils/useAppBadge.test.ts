import { renderHook } from '@testing-library/react';
import { useAppBadge } from './useAppBadge';

describe('useAppBadge', () => {
  const nav = navigator as unknown as Record<string, unknown>;
  afterEach(() => {
    delete nav.setAppBadge;
    delete nav.clearAppBadge;
  });

  it('sets the badge to the count', () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = setAppBadge;
    nav.clearAppBadge = jest.fn().mockResolvedValue(undefined);
    renderHook(() => useAppBadge(3));
    expect(setAppBadge).toHaveBeenCalledWith(3);
  });

  it('clears the badge at 0', () => {
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.clearAppBadge = clearAppBadge;
    renderHook(() => useAppBadge(0));
    expect(clearAppBadge).toHaveBeenCalled();
  });

  it('leaves the badge alone while the count is unknown', () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = setAppBadge;
    nav.clearAppBadge = clearAppBadge;
    renderHook(() => useAppBadge(null));
    expect(setAppBadge).not.toHaveBeenCalled();
    expect(clearAppBadge).not.toHaveBeenCalled();
  });

  it('does nothing when the API is unsupported or rejects', async () => {
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
    nav.setAppBadge = jest.fn().mockRejectedValue(new Error('denied'));
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
    await Promise.resolve();
  });
});

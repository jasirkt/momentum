import { renderHook } from '@testing-library/react';
import { useAppBadge } from './useAppBadge';

describe('useAppBadge', () => {
  const nav = navigator as unknown as Record<string, unknown>;
  afterEach(() => {
    delete nav.setAppBadge;
    delete nav.clearAppBadge;
    document.title = 'Momentum';
  });

  it('sets the badge and tab title to the count', () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = setAppBadge;
    nav.clearAppBadge = jest.fn().mockResolvedValue(undefined);
    renderHook(() => useAppBadge(3));
    expect(setAppBadge).toHaveBeenCalledWith(3);
    expect(document.title).toBe('(3) Momentum');
  });

  it('clears the badge and resets tab title at 0', () => {
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.clearAppBadge = clearAppBadge;
    document.title = '(2) Momentum';
    renderHook(() => useAppBadge(0));
    expect(clearAppBadge).toHaveBeenCalled();
    expect(document.title).toBe('Momentum');
  });

  it('leaves the badge and tab title alone while the count is unknown', () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    const clearAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = setAppBadge;
    nav.clearAppBadge = clearAppBadge;
    renderHook(() => useAppBadge(null));
    expect(setAppBadge).not.toHaveBeenCalled();
    expect(clearAppBadge).not.toHaveBeenCalled();
    expect(document.title).toBe('Momentum');
  });

  it('re-applies the badge when refreshKey changes', () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = setAppBadge;
    const { rerender } = renderHook(({ key }) => useAppBadge(2, key), {
      initialProps: { key: 0 },
    });
    expect(setAppBadge).toHaveBeenCalledTimes(1);
    rerender({ key: 1 });
    expect(setAppBadge).toHaveBeenCalledTimes(2);
  });

  it('does nothing when the API is unsupported or rejects', async () => {
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
    nav.setAppBadge = jest.fn().mockRejectedValue(new Error('denied'));
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
    await Promise.resolve();
  });
});

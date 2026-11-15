import { renderHook, waitFor } from '@testing-library/react';
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

  it('re-applies the badge when the page becomes visible again', () => {
    const setAppBadge = jest.fn().mockResolvedValue(undefined);
    nav.setAppBadge = setAppBadge;
    const { unmount } = renderHook(() => useAppBadge(4));
    expect(setAppBadge).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(setAppBadge).toHaveBeenCalledTimes(2);
    expect(setAppBadge).toHaveBeenLastCalledWith(4);
    unmount();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(setAppBadge).toHaveBeenCalledTimes(2);
  });

  it('puts the title back when something else rewrites it (Next metadata after hydration)', async () => {
    renderHook(() => useAppBadge(3));
    expect(document.title).toBe('(3) Momentum');
    const titleEl = document.head.querySelector('title') ?? document.head.appendChild(document.createElement('title'));
    titleEl.textContent = 'Momentum';
    await waitFor(() => expect(document.title).toBe('(3) Momentum'));
  });

  it('does nothing when the API is unsupported or rejects', async () => {
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
    nav.setAppBadge = jest.fn().mockRejectedValue(new Error('denied'));
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
    await Promise.resolve();
  });
});

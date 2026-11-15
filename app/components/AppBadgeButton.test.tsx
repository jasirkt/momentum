import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppBadgeButton from './AppBadgeButton';

describe('AppBadgeButton', () => {
  const nav = navigator as unknown as Record<string, unknown>;
  const win = window as unknown as Record<string, unknown>;
  const originalNotification = win.Notification;
  const originalMatchMedia = window.matchMedia;

  const setStandalone = (standalone: boolean) => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: standalone && query === '(display-mode: standalone)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  };

  beforeEach(() => setStandalone(true));

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    delete nav.standalone;
    delete nav.setAppBadge;
    if (originalNotification === undefined) {
      delete win.Notification;
    } else {
      win.Notification = originalNotification;
    }
  });

  it('is hidden when Badging API or Notification API is unavailable', () => {
    render(<AppBadgeButton />);
    expect(screen.queryByRole('button', { name: /enable app icon badge/i })).not.toBeInTheDocument();
  });

  it('is hidden in a browser tab, where there is no app icon to badge', () => {
    setStandalone(false);
    nav.setAppBadge = jest.fn();
    win.Notification = { permission: 'default', requestPermission: jest.fn() };
    render(<AppBadgeButton />);
    expect(screen.queryByRole('button', { name: /enable app icon badge/i })).not.toBeInTheDocument();
  });

  it('is shown in an iOS home-screen app (navigator.standalone)', () => {
    setStandalone(false);
    nav.standalone = true;
    nav.setAppBadge = jest.fn();
    win.Notification = { permission: 'default', requestPermission: jest.fn() };
    render(<AppBadgeButton />);
    expect(screen.getByRole('button', { name: /enable app icon badge/i })).toBeInTheDocument();
  });

  it('is hidden when permission is already granted or denied', () => {
    nav.setAppBadge = jest.fn();
    win.Notification = { permission: 'granted', requestPermission: jest.fn() };
    const { rerender } = render(<AppBadgeButton />);
    expect(screen.queryByRole('button', { name: /enable app icon badge/i })).not.toBeInTheDocument();

    win.Notification = { permission: 'denied', requestPermission: jest.fn() };
    rerender(<AppBadgeButton />);
    expect(screen.queryByRole('button', { name: /enable app icon badge/i })).not.toBeInTheDocument();
  });

  it('requests permission on click, hides itself, and calls onGranted when granted', async () => {
    const requestPermission = jest.fn().mockResolvedValue('granted');
    const onGranted = jest.fn();
    nav.setAppBadge = jest.fn();
    win.Notification = { permission: 'default', requestPermission };

    render(<AppBadgeButton onGranted={onGranted} />);
    const btn = screen.getByRole('button', { name: /enable app icon badge/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalledTimes(1);
      expect(onGranted).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('button', { name: /enable app icon badge/i })).not.toBeInTheDocument();
    });
  });

  it('hides itself without calling onGranted when permission is denied', async () => {
    const requestPermission = jest.fn().mockResolvedValue('denied');
    const onGranted = jest.fn();
    nav.setAppBadge = jest.fn();
    win.Notification = { permission: 'default', requestPermission };

    render(<AppBadgeButton onGranted={onGranted} />);
    fireEvent.click(screen.getByRole('button', { name: /enable app icon badge/i }));

    await waitFor(() => {
      expect(requestPermission).toHaveBeenCalledTimes(1);
      expect(onGranted).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: /enable app icon badge/i })).not.toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppBadgeButton from './AppBadgeButton';

describe('AppBadgeButton', () => {
  const nav = navigator as unknown as Record<string, unknown>;
  const win = window as unknown as Record<string, unknown>;
  const originalNotification = win.Notification;

  afterEach(() => {
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

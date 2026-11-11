import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArchivedHabits from './ArchivedHabits';
import { Habit } from '../types';

describe('ArchivedHabits', () => {
  const habits: Habit[] = [
    { id: 1, name: 'Walk', dates: {}, archived: true },
    { id: 2, name: 'Read', dates: {}, archived: true },
  ];
  const onRestore = jest.fn();
  const onDelete = jest.fn();
  const onOpenStats = jest.fn();

  const renderList = (list: Habit[] = habits) =>
    render(<ArchivedHabits habits={list} onRestore={onRestore} onDelete={onDelete} onOpenStats={onOpenStats} />);

  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when there are no archived habits', () => {
    const { container } = renderList([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count and starts collapsed', () => {
    renderList();
    const toggle = screen.getByRole('button', { name: /Archived \(2\)/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Walk')).not.toBeInTheDocument();
  });

  it('expands and collapses the list', () => {
    renderList();
    const toggle = screen.getByRole('button', { name: /Archived \(2\)/ });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Walk')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('Walk')).not.toBeInTheDocument();
  });

  it('restores, deletes and opens stats for the chosen habit only', () => {
    renderList();
    fireEvent.click(screen.getByRole('button', { name: /Archived/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Restore Read' }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Walk' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'View statistics for Walk' }));
    expect(onOpenStats).toHaveBeenCalledWith(1);
  });
});

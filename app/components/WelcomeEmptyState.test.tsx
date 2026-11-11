import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WelcomeEmptyState from './WelcomeEmptyState';
import { HABIT_SUGGESTIONS } from '../utils/suggestions';

const setup = (addedNames: string[] = []) => {
  const onAddHabit = jest.fn();
  const onDone = jest.fn();
  render(<WelcomeEmptyState onAddHabit={onAddHabit} addedNames={addedNames} onDone={onDone} />);
  return { onAddHabit, onDone };
};

describe('WelcomeEmptyState', () => {
  it('renders a chip for every suggestion', () => {
    setup();
    for (const { name } of HABIT_SUGGESTIONS) {
      expect(screen.getByRole('button', { name: `+ ${name}` })).toBeInTheDocument();
    }
  });

  it('adds a suggestion with its schedule when tapped', () => {
    const { onAddHabit } = setup();

    fireEvent.click(screen.getByRole('button', { name: '+ Gym' }));

    expect(onAddHabit).toHaveBeenCalledWith('Gym', { type: 'weekdays', days: 0b0101010 });
  });

  it('shows the schedule on non-daily chips but not on daily ones', () => {
    setup();

    expect(screen.getByRole('button', { name: '+ Gym' })).toHaveTextContent('Mon, Wed, Fri');
    expect(screen.getByRole('button', { name: '+ Run' })).toHaveTextContent('3 times a week');
    expect(screen.getByRole('button', { name: '+ Walk' })).not.toHaveTextContent('Every day');
  });

  it('shows already-added suggestions as checked and disabled, others stay tappable', () => {
    setup(['walk']);

    expect(screen.getByRole('button', { name: '✓ Walk' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '+ Read' })).toBeEnabled();
  });

  it('offers Skip with no habits and Done once some exist', () => {
    const { onDone } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('offers Done once a habit exists', () => {
    setup(['Walk']);
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
  });
});

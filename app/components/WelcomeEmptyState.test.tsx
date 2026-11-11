import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import WelcomeEmptyState from './WelcomeEmptyState';
import { HABIT_SUGGESTIONS } from '../utils/suggestions';

describe('WelcomeEmptyState', () => {
  it('renders a chip for every suggestion', () => {
    render(<WelcomeEmptyState onAddHabit={jest.fn()} />);
    for (const { name } of HABIT_SUGGESTIONS) {
      expect(screen.getByRole('button', { name: `+ ${name}` })).toBeInTheDocument();
    }
  });

  it('adds a suggestion with its schedule when tapped', () => {
    const onAddHabit = jest.fn();
    render(<WelcomeEmptyState onAddHabit={onAddHabit} />);

    fireEvent.click(screen.getByRole('button', { name: '+ Gym' }));

    expect(onAddHabit).toHaveBeenCalledWith('Gym', { type: 'weekdays', days: 0b0101010 });
  });
});

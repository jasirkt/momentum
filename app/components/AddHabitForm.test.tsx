import { render, screen, fireEvent } from '@testing-library/react';
import AddHabitForm from './AddHabitForm';
import '@testing-library/jest-dom';

describe('AddHabitForm Component', () => {
  const mockOnAddHabit = jest.fn();

  beforeEach(() => {
    // Clear any previous mock calls before each test
    jest.clearAllMocks();
  });

  it('should render the form with an input and a button', () => {
    render(<AddHabitForm onAddHabit={mockOnAddHabit} />);

    // Check if the input field is there, identified by its placeholder text
    expect(screen.getByPlaceholderText('e.g., Go for a walk')).toBeInTheDocument();

    // Check if the submit button is there
    expect(screen.getByRole('button', { name: 'Add Habit' })).toBeInTheDocument();
  });

  it('should allow the user to type in the input field', () => {
    render(<AddHabitForm onAddHabit={mockOnAddHabit} />);
    
    const input = screen.getByPlaceholderText('e.g., Go for a walk') as HTMLInputElement;

    // Simulate typing into the input
    fireEvent.change(input, { target: { value: 'New test habit' } });

    // Assert that the input's value has changed
    expect(input.value).toBe('New test habit');
  });

  it('should call onAddHabit with the input value when the form is submitted', () => {
    render(<AddHabitForm onAddHabit={mockOnAddHabit} />);

    const input = screen.getByPlaceholderText('e.g., Go for a walk');
    const form = input.closest('form')!; // Find the parent form of the input

    // 1. Type into the input
    fireEvent.change(input, { target: { value: 'A valid habit' } });

    // 2. Submit the form
    fireEvent.submit(form);

    // 3. Check if our mock function was called with the correct value
    expect(mockOnAddHabit).toHaveBeenCalledTimes(1);
    expect(mockOnAddHabit).toHaveBeenCalledWith('A valid habit');
  });

  it('should clear the input field after submission', () => {
    render(<AddHabitForm onAddHabit={mockOnAddHabit} />);
    
    const input = screen.getByPlaceholderText('e.g., Go for a walk') as HTMLInputElement;
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Habit to be cleared' } });
    expect(input.value).toBe('Habit to be cleared'); // Ensure value is set

    fireEvent.submit(form);

    // After submission, the input should be empty
    expect(input.value).toBe('');
  });

  it('should not call onAddHabit if the input is empty or only contains whitespace', () => {
    render(<AddHabitForm onAddHabit={mockOnAddHabit} />);
    
    const input = screen.getByPlaceholderText('e.g., Go for a walk');
    const form = input.closest('form')!;

    // Test with empty string
    fireEvent.submit(form);
    
    // Test with whitespace
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form);

    // The function should never have been called
    expect(mockOnAddHabit).not.toHaveBeenCalled();
  });
});

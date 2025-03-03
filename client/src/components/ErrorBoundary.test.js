import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import userEvent from '@testing-library/user-event';
import * as errorStorage from '../utils/errorStorage';

// Mock errorStorage module
jest.mock('../utils/errorStorage', () => ({
  logError: jest.fn(() => ({ id: 'mock-error-id' })),
  ERROR_SEVERITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }
}));

// A component that throws an error when the `throwError` prop is true
const ProblemChild = ({ throwError }) => {
  if (throwError) {
    throw new Error('Test error from ProblemChild');
  }
  return <div>Everything is fine</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Clear console.error to avoid test noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders fallback UI when there is an error', () => {
    // We need to silence the React error boundary warning in the test
    const originalError = console.error;
    console.error = jest.fn();

    render(
      <ErrorBoundary>
        <ProblemChild throwError={true} />
      </ErrorBoundary>
    );

    // Verify fallback UI is shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error from ProblemChild/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    // Verify error was logged
    expect(errorStorage.logError).toHaveBeenCalled();

    console.error = originalError;
  });

  test('reset button allows retry', async () => {
    // We need to silence the React error boundary warning in the test
    const originalError = console.error;
    console.error = jest.fn();
    
    const TestCase = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <div>
          <button onClick={() => setShouldThrow(false)}>Fix Problem</button>
          <ErrorBoundary>
            {shouldThrow ? (
              <ProblemChild throwError={true} />
            ) : (
              <div>Fixed!</div>
            )}
          </ErrorBoundary>
        </div>
      );
    };

    render(<TestCase />);

    // Verify error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Fix the problem
    userEvent.click(screen.getByText('Fix Problem'));
    
    // Click try again
    userEvent.click(screen.getByText('Try Again'));
    
    // Verify we're back to normal
    expect(screen.getByText('Fixed!')).toBeInTheDocument();

    console.error = originalError;
  });

  test('accepts custom fallback component', () => {
    // We need to silence the React error boundary warning in the test
    const originalError = console.error;
    console.error = jest.fn();

    const CustomFallback = ({ error, resetErrorBoundary }) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>{error.message}</p>
        <button onClick={resetErrorBoundary}>Custom Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ProblemChild throwError={true} />
      </ErrorBoundary>
    );

    // Verify custom fallback is shown
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Test error from ProblemChild')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();

    console.error = originalError;
  });
});
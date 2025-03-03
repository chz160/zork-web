import { render, screen } from '@testing-library/react';
import App from './App';

// Mock components that use xterm.js to avoid test failures
jest.mock('./components/Terminal', () => () => <div data-testid="mock-terminal">Terminal Mock</div>);

test('renders Zork Web header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Zork Web/i);
  expect(headerElement).toBeInTheDocument();
});
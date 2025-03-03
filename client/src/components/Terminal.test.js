import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Terminal from './Terminal';

// Mock the game engine
jest.mock('../game', () => ({
  processCommand: jest.fn(() => Promise.resolve({ 
    message: 'Command processed', 
    newState: { roomId: 'start', inventory: [], score: 0, moves: 1 } 
  })),
  initGame: jest.fn(() => Promise.resolve({ 
    roomId: 'start', 
    inventory: [], 
    score: 0, 
    moves: 0 
  })),
  saveGameState: jest.fn(() => Promise.resolve(true)),
  getCurrentRoom: jest.fn(() => ({ 
    id: 'start', 
    name: 'Starting Room',
    description: 'This is the starting room.' 
  }))
}));

// Mock the error handler
jest.mock('../utils/errorHandler', () => ({
  handleError: jest.fn()
}));

describe('Terminal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the terminal container', async () => {
    await act(async () => {
      render(<Terminal />);
    });
    
    const terminalElement = screen.getByTestId('terminal-container');
    expect(terminalElement).toBeInTheDocument();
    
    const inputElement = screen.getByTestId('terminal-input');
    expect(inputElement).toBeInTheDocument();
  });
  
  test('allows entering commands', async () => {
    await act(async () => {
      render(<Terminal />);
    });
    
    const inputElement = screen.getByTestId('terminal-input');
    
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: 'look' } });
      fireEvent.keyDown(inputElement, { key: 'Enter' });
    });
    
    // Command should be displayed in history
    expect(screen.getByText('> look')).toBeInTheDocument();
    
    // Verify processCommand was called
    const { processCommand } = require('../game');
    expect(processCommand).toHaveBeenCalled();
  });
  
  test('navigates command history with arrow keys', async () => {
    await act(async () => {
      render(<Terminal />);
    });
    
    const inputElement = screen.getByTestId('terminal-input');
    
    // Enter a command
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: 'look' } });
      fireEvent.keyDown(inputElement, { key: 'Enter' });
    });
    
    // Enter another command
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: 'inventory' } });
      fireEvent.keyDown(inputElement, { key: 'Enter' });
    });
    
    // Up arrow should load previous command
    await act(async () => {
      fireEvent.keyDown(inputElement, { key: 'ArrowUp' });
    });
    
    expect(inputElement.value).toBe('inventory');
    
    // Up arrow again to get older command
    await act(async () => {
      fireEvent.keyDown(inputElement, { key: 'ArrowUp' });
    });
    
    expect(inputElement.value).toBe('look');
    
    // Down arrow to go forward in history
    await act(async () => {
      fireEvent.keyDown(inputElement, { key: 'ArrowDown' });
    });
    
    expect(inputElement.value).toBe('inventory');
  });
  
  test('processes commands correctly', async () => {
    await act(async () => {
      render(<Terminal />);
    });
    
    const inputElement = screen.getByTestId('terminal-input');
    
    // Enter a command
    await act(async () => {
      fireEvent.change(inputElement, { target: { value: 'look' } });
      fireEvent.keyDown(inputElement, { key: 'Enter' });
    });
    
    // Check if command was processed
    const { processCommand } = require('../game');
    expect(processCommand).toHaveBeenCalled();
    
    // Check if command shows in history
    expect(screen.getByText('> look')).toBeInTheDocument();
  });
});
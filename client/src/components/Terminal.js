import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  processCommand, 
  initGame, 
  saveGameState, 
  getCurrentRoom 
} from '../game';
import { handleError } from '../utils/errorHandler';
import './Terminal.css';

const Terminal = ({ useServer: initialUseServer = false }) => {
  const [history, setHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [useServer, setUseServer] = useState(initialUseServer);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize the game
  useEffect(() => {
    const loadGame = async () => {
      try {
        setIsLoading(true);
        const initialGameState = await initGame(true, useServer);
        
        // Build welcome message
        let welcomeText = '=== ZORK WEB ===\n';
        welcomeText += 'A web-based clone of the classic text adventure game\n\n';
        welcomeText += 'Copyright (c) 2025\n\n';
        welcomeText += `Mode: ${useServer ? 'Server Processing' : 'Local Processing'}\n`;
        welcomeText += 'Type "toggle-mode" to switch between local and server processing.\n\n';
        welcomeText += 'QUICK HELP:\n';
        welcomeText += '- Use compass directions to move: north, south, east, west (or n, s, e, w)\n';
        welcomeText += '- Type "look" to examine your surroundings\n';
        welcomeText += '- Type "inventory" to see what you\'re carrying\n';
        welcomeText += '- Type "help" for a complete list of commands\n\n';
        
        // Add room description if available
        if (initialGameState) {
          const room = getCurrentRoom(initialGameState);
          if (room) {
            welcomeText += room.description + '\n\n';
          }
          
          // Add score/moves if any
          const moves = initialGameState.moves > 0 ? `Moves: ${initialGameState.moves}` : '';
          const score = initialGameState.score > 0 ? `Score: ${initialGameState.score}` : '';
          
          if (moves || score) {
            welcomeText += moves;
            if (moves && score) welcomeText += ' | ';
            welcomeText += score + '\n\n';
          }
        }
        
        setHistory([{ type: 'system', content: welcomeText }]);
        setGameLoaded(true);
      } catch (error) {
        handleError(error, 'Terminal.loadGame', {
          context: 'Terminal.loadGame',
          severity: 'high',
          message: 'Failed to initialize game'
        });
        
        // Try to load a local game as fallback
        try {
          const fallbackState = await initGame(false, false);
          setGameLoaded(true);
          
          setHistory([{ 
            type: 'error', 
            content: 'Error loading game from server. Falling back to local mode.\n\nWelcome to Zork Web!' 
          }]);
          
          // Force local processing
          setUseServer(false);
        } catch (fallbackError) {
          setHistory([{ 
            type: 'error', 
            content: 'Error loading game: ' + (error.message || 'Unknown error') 
          }]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGame();
  }, [useServer]);

  // Scroll to bottom whenever history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input field when component mounts or when clicked
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (isLoading) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateHistory('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateHistory('down');
    } else if (e.key === 'Tab') {
      e.preventDefault(); // Prevent tab from moving focus
    }
  };

  const navigateHistory = (direction) => {
    if (commandHistory.length === 0) return;

    let newIndex;
    if (direction === 'up') {
      newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
    } else {
      newIndex = historyIndex > 0 ? historyIndex - 1 : -1;
    }

    setHistoryIndex(newIndex);
    setCurrentInput(newIndex >= 0 ? commandHistory[newIndex] : '');
  };

  const toggleProcessingMode = () => {
    const newMode = !useServer;
    setUseServer(newMode);
    setHistory(prev => [
      ...prev, 
      { 
        type: 'system', 
        content: `Switched to ${newMode ? 'Server' : 'Local'} Processing Mode` 
      }
    ]);
  };

  const handleCommand = async () => {
    if (!currentInput.trim() || isLoading) return;

    // Add command to history display
    const command = currentInput.trim();
    setHistory(prev => [...prev, { type: 'command', content: `> ${command}` }]);
    
    // Add to command history for up/down navigation
    setCommandHistory(prev => [command, ...prev.slice(0, 19)]);
    setHistoryIndex(-1);
    setCurrentInput('');
    
    // Handle toggle command
    if (command.toLowerCase() === 'toggle-mode') {
      const newMode = !useServer;
      setUseServer(newMode);
      setHistory(prev => [
        ...prev, 
        { 
          type: 'system', 
          content: `Switched to ${newMode ? 'Server' : 'Local'} Processing Mode` 
        }
      ]);
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await processCommand(command, gameLoaded, useServer);
      
      if (result) {
        // Handle multi-line messages
        const lines = result.message ? result.message.split('\n') : ['Command processed'];
        setHistory(prev => [...prev, { 
          type: 'response', 
          content: lines.join('\n') 
        }]);
        
        // Update game state if provided
        if (result.newState) {
          // Display current room after command
          try {
            const room = getCurrentRoom(result.newState);
            if (room && room.name) {
              setHistory(prev => [
                ...prev, 
                { 
                  type: 'location', 
                  content: `Location: ${room.name}` 
                }
              ]);
            }
          } catch (roomError) {
            console.error('Error getting current room:', roomError);
          }
          
          // Save game state after each successful command
          if (gameLoaded) {
            await saveGameState(result.newState, useServer);
          }
        }
        
        // Handle restart if needed
        if (result.restart) {
          const newState = await initGame(false, useServer);
          setGameLoaded(true);
        }
      }
    } catch (error) {
      handleError(error, 'Terminal.handleCommand', {
        context: 'Terminal.handleCommand',
        severity: 'medium',
        message: `Error processing command: ${command}`
      });
      
      // Display user-friendly error message
      let errorMessage = 'An error occurred while processing your command.';
      
      if (error.message && (error.message.includes('connection') || error.message.includes('network'))) {
        errorMessage = 'Could not connect to the server. Falling back to local processing.';
        // Try to process locally after server failure
        try {
          setUseServer(false);
          const localResult = await processCommand(command, false);
          setHistory(prev => [
            ...prev, 
            { type: 'error', content: errorMessage },
            { type: 'response', content: localResult.message || 'Command processed locally' }
          ]);
          return;
        } catch (localError) {
          errorMessage += ' Local processing also failed.';
        }
      } else if (error.message && error.message.includes('timeout')) {
        errorMessage = 'The server took too long to respond. Please try again.';
      } else if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
        errorMessage = 'The requested resource was not found on the server.';
      }
      
      setHistory(prev => [...prev, { type: 'error', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  return (
    <div 
      className="terminal" 
      onClick={handleTerminalClick}
      ref={terminalRef}
      data-testid="terminal-container"
    >
      <div className="terminal-content">
        {history.map((item, index) => (
          <div key={index} className={`terminal-line ${item.type}`}>
            {item.content}
          </div>
        ))}
        
        <div className="terminal-input-line">
          <span className="terminal-prompt">&gt; </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            disabled={isLoading}
            autoFocus
            spellCheck="false"
            autoComplete="off"
            data-testid="terminal-input"
          />
          {isLoading && <span className="terminal-loading">...</span>}
        </div>
      </div>
    </div>
  );
};

Terminal.propTypes = {
  useServer: PropTypes.bool
};

export default Terminal;
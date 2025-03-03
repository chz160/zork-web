import React, { useState, useEffect } from 'react';
import './App.css';
import Terminal from './components/Terminal';
import ErrorLog from './components/ErrorLog';
import './components/ErrorLog.css';
import { setupGlobalErrorHandlers } from './utils/errorHandler';

function App() {
  const [showErrorLog, setShowErrorLog] = useState(false);
  
  // Setup global error handlers
  useEffect(() => {
    // Set up global handlers and get cleanup function
    const cleanupHandlers = setupGlobalErrorHandlers();
    
    // Return cleanup function for when component unmounts
    return cleanupHandlers;
  }, []);

  const toggleErrorLog = () => {
    setShowErrorLog(prev => !prev);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Zork Web</h1>
      </header>
      
      <main>
        <Terminal />
      </main>
      
      {/* Error Log Components */}
      <button
        className="error-log-toggle"
        onClick={toggleErrorLog}
        title="Show Error Log"
      >
        !
      </button>
      
      <ErrorLog 
        isOpen={showErrorLog}
        onClose={() => setShowErrorLog(false)}
      />
    </div>
  );
}

export default App;
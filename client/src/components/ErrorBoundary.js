import React, { Component } from 'react';
import { addErrorLog as logError, ERROR_SEVERITY } from '../utils/errorStorage';

/**
 * ErrorBoundary component
 * 
 * A React error boundary component that catches errors in its
 * child component tree and displays a fallback UI.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  /**
   * Update state when component throws an error
   * @param {Error} error - The error that was thrown
   */
  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      error
    };
  }

  /**
   * Handle component error and log it to storage
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - React error info with component stack
   */
  componentDidCatch(error, errorInfo) {
    // Log the error to our error storage
    const errorLog = logError(
      error,
      'ErrorBoundary',
      ERROR_SEVERITY.HIGH,
      {
        componentStack: errorInfo.componentStack,
        errorInfo
      }
    );

    this.setState({
      errorInfo,
      errorId: errorLog.id
    });

    // Also log to console for development
    console.error('Component error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  /**
   * Reset the error state to try rendering again
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { fallback, children } = this.props;

    // If there's an error, show the fallback UI
    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, this.handleReset)
          : fallback;
      }

      // Default fallback UI
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>
            We're sorry, but there was an error rendering this component.
          </p>
          {error && (
            <div className="error-details">
              <p>Error: {error.toString()}</p>
              {errorId && <p>Error ID: {errorId}</p>}
            </div>
          )}
          <button 
            onClick={this.handleReset}
            className="error-reset-button"
          >
            Try Again
          </button>
        </div>
      );
    }

    // No error, render children normally
    return children;
  }
}

export default ErrorBoundary;
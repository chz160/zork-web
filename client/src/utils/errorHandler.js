/**
 * errorHandler.js - Global error handling utilities
 * 
 * This module provides global error handlers for unhandled exceptions 
 * and promise rejections, along with utility functions for consistent
 * error handling throughout the application.
 */

import { addErrorLog, ERROR_SEVERITY } from './errorStorage';

/**
 * Format error with standardized context and metadata
 * @param {Error|string} error - Error object or message
 * @param {string} context - Error context (component/function name)
 * @param {string} severity - Error severity level
 * @param {Object} metadata - Additional data about the error
 * @returns {Object} Formatted error log
 */
export const logError = (error, context = 'unknown', severity = ERROR_SEVERITY.MEDIUM, metadata = {}) => {
  return addErrorLog(error, context, severity, metadata);
};

/**
 * Handle errors with consistent formatting
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {Object} metadata - Additional error metadata
 * @returns {Object} Error info object
 */
export const handleError = (error, context, metadata = {}) => {
  let severity = ERROR_SEVERITY.MEDIUM;
  
  // Determine severity based on error type or message content
  if (error instanceof TypeError || error instanceof SyntaxError) {
    severity = ERROR_SEVERITY.HIGH;
  } else if (error.message && (
    error.message.includes('network') || 
    error.message.includes('connection') ||
    error.message.includes('server')
  )) {
    severity = ERROR_SEVERITY.MEDIUM;
  } else if (error.message && error.message.includes('critical')) {
    severity = ERROR_SEVERITY.CRITICAL;
  }
  
  // Log to storage
  const errorLog = logError(error, context, severity, metadata);
  
  // Also log to console for development
  console.error(`[${context}] ${error.message}`, error);
  
  return {
    error,
    errorLog,
    context,
    severity,
    time: new Date().toISOString()
  };
};

/**
 * Global handler for uncaught exceptions
 * @param {Event} event - Error event
 * @param {string} source - Error source
 * @param {number} lineno - Line number
 * @param {number} colno - Column number
 * @param {Error} error - Error object
 */
export const handleGlobalError = (event, source, lineno, colno, error) => {
  const metadata = { source, lineno, colno };
  
  if (error) {
    logError(error, 'global', ERROR_SEVERITY.HIGH, metadata);
  } else {
    logError(
      `Uncaught error: ${event}`, 
      'global', 
      ERROR_SEVERITY.HIGH, 
      metadata
    );
  }
  
  // Prevent default browser error handling
  event.preventDefault();
};

/**
 * Global handler for unhandled promise rejections
 * @param {PromiseRejectionEvent} event - Rejection event
 */
export const handlePromiseRejection = (event) => {
  let error = event.reason;
  
  // If reason isn't an Error object, create one
  if (!(error instanceof Error)) {
    error = new Error(
      typeof error === 'string' 
        ? error 
        : 'Unhandled Promise rejection'
    );
  }
  
  logError(
    error, 
    'promise', 
    ERROR_SEVERITY.HIGH, 
    { unhandledRejection: true }
  );
  
  // Prevent default browser error handling
  event.preventDefault();
};

/**
 * Set up global error handlers
 */
export const setupGlobalErrorHandlers = () => {
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handlePromiseRejection);
  
  console.log('Global error handlers initialized');
  
  return () => {
    // Return cleanup function
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handlePromiseRejection);
  };
};

/**
 * Create a wrapped function with error handling
 * @param {Function} fn - Function to wrap
 * @param {string} context - Error context name
 * @returns {Function} Wrapped function
 */
export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, { args });
      throw error; // Re-throw to allow caller to handle
    }
  };
};
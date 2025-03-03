/**
 * errorStorage.js - Error logging and storage module
 * 
 * This module handles saving, retrieving, and clearing error logs
 * from localStorage with unique IDs and timestamps.
 */

// Local storage key for error logs
const ERROR_LOG_KEY = 'zork_web_error_logs';

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Generate a unique error ID
 * @returns {string} Unique error ID
 */
const generateErrorId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

/**
 * Get all error logs from storage
 * @returns {Array} Array of error objects
 */
export const getErrorLogs = () => {
  try {
    const storedLogs = localStorage.getItem(ERROR_LOG_KEY);
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (error) {
    console.error('Failed to retrieve error logs:', error);
    return [];
  }
};

/**
 * Add a new error to storage
 * @param {Error|string} error - Error object or message
 * @param {string} context - Context where error occurred
 * @param {string} severity - Error severity level
 * @param {Object} metadata - Additional error metadata
 * @returns {Object} The stored error object
 */
export const addErrorLog = (error, context = 'unknown', severity = ERROR_SEVERITY.MEDIUM, metadata = {}) => {
  try {
    const logs = getErrorLogs();
    
    // Format the error object
    const errorLog = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      context,
      severity,
      metadata,
      userAgent: navigator.userAgent
    };
    
    // Add to beginning of array (most recent first)
    logs.unshift(errorLog);
    
    // Limit to 100 errors to prevent localStorage from filling up
    const trimmedLogs = logs.slice(0, 100);
    
    // Save to localStorage
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmedLogs));
    
    return errorLog;
  } catch (storageError) {
    // If we can't save to localStorage, at least log to console
    console.error('Failed to store error log:', storageError);
    console.error('Original error:', error);
    return null;
  }
};

/**
 * Filter error logs by criteria
 * @param {Object} filters - Filter criteria
 * @param {string} filters.severity - Filter by severity level
 * @param {string} filters.context - Filter by context
 * @param {string} filters.startDate - Filter by start date
 * @param {string} filters.endDate - Filter by end date
 * @param {string} filters.text - Filter by text in message
 * @returns {Array} Filtered array of error logs
 */
export const filterErrorLogs = (filters = {}) => {
  const logs = getErrorLogs();
  
  return logs.filter(log => {
    // Filter by severity
    if (filters.severity && log.severity !== filters.severity) {
      return false;
    }
    
    // Filter by context
    if (filters.context && log.context !== filters.context) {
      return false;
    }
    
    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate).getTime();
      const logDate = new Date(log.timestamp).getTime();
      if (logDate < startDate) return false;
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate).getTime();
      const logDate = new Date(log.timestamp).getTime();
      if (logDate > endDate) return false;
    }
    
    // Filter by text
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      return log.message.toLowerCase().includes(searchText);
    }
    
    return true;
  });
};

/**
 * Clear all error logs
 * @returns {boolean} Success status
 */
export const clearErrorLogs = () => {
  try {
    localStorage.removeItem(ERROR_LOG_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear error logs:', error);
    return false;
  }
};

/**
 * Get error log by ID
 * @param {string} id - Error ID
 * @returns {Object|null} Error log object or null if not found
 */
export const getErrorById = (id) => {
  const logs = getErrorLogs();
  return logs.find(log => log.id === id) || null;
};

/**
 * Delete specific error log by ID
 * @param {string} id - Error ID to delete
 * @returns {boolean} Success status
 */
export const deleteErrorLog = (id) => {
  try {
    const logs = getErrorLogs();
    const filteredLogs = logs.filter(log => log.id !== id);
    
    if (filteredLogs.length === logs.length) {
      return false; // No log was removed
    }
    
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(filteredLogs));
    return true;
  } catch (error) {
    console.error('Failed to delete error log:', error);
    return false;
  }
};

/**
 * Get the count of error logs by severity
 * @returns {Object} Counts by severity
 */
export const getErrorCountBySeverity = () => {
  const logs = getErrorLogs();
  return logs.reduce((counts, log) => {
    counts[log.severity] = (counts[log.severity] || 0) + 1;
    return counts;
  }, {});
};
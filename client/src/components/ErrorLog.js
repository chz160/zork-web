import React, { useState, useEffect } from 'react';
import { 
  getErrorLogs, 
  clearErrorLogs, 
  filterErrorLogs,
  ERROR_SEVERITY,
  deleteErrorLog,
  getErrorCountBySeverity
} from '../utils/errorStorage';

/**
 * Error Log Component
 * 
 * A toggleable UI component that displays recorded errors with
 * filtering capabilities.
 */
function ErrorLog({ isOpen, onClose }) {
  const [errors, setErrors] = useState([]);
  const [filter, setFilter] = useState({
    severity: '',
    context: '',
    text: '',
    startDate: '',
    endDate: ''
  });
  const [counts, setCounts] = useState({});

  // Load errors when component mounts or isOpen changes
  useEffect(() => {
    if (isOpen) {
      refreshErrors();
    }
  }, [isOpen]);

  // Refresh error list and counts
  const refreshErrors = () => {
    const filteredErrors = filterErrorLogs(filter);
    setErrors(filteredErrors);
    setCounts(getErrorCountBySeverity());
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply current filters
  const applyFilters = () => {
    refreshErrors();
  };

  // Reset all filters
  const resetFilters = () => {
    setFilter({
      severity: '',
      context: '',
      text: '',
      startDate: '',
      endDate: ''
    });
    setErrors(getErrorLogs());
  };

  // Clear all error logs
  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all error logs?')) {
      clearErrorLogs();
      setErrors([]);
      setCounts({});
    }
  };

  // Delete a single error log
  const handleDeleteError = (id) => {
    deleteErrorLog(id);
    refreshErrors();
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  // Get severity class for styling
  const getSeverityClass = (severity) => {
    switch(severity) {
      case ERROR_SEVERITY.LOW:
        return 'severity-low';
      case ERROR_SEVERITY.MEDIUM:
        return 'severity-medium';
      case ERROR_SEVERITY.HIGH:
        return 'severity-high';
      case ERROR_SEVERITY.CRITICAL:
        return 'severity-critical';
      default:
        return '';
    }
  };

  // If the log is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div className="error-log-container">
      <div className="error-log-header">
        <h2>Error Log</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      {/* Summary information */}
      <div className="error-summary">
        <h3>Error Summary</h3>
        <div className="error-counts">
          <div className="count">Total: {errors.length}</div>
          {Object.entries(counts).map(([severity, count]) => (
            <div 
              key={severity} 
              className={`count ${getSeverityClass(severity)}`}
            >
              {severity}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Filter controls */}
      <div className="error-filters">
        <h3>Filters</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>Severity:</label>
            <select 
              name="severity" 
              value={filter.severity}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value={ERROR_SEVERITY.LOW}>Low</option>
              <option value={ERROR_SEVERITY.MEDIUM}>Medium</option>
              <option value={ERROR_SEVERITY.HIGH}>High</option>
              <option value={ERROR_SEVERITY.CRITICAL}>Critical</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Context:</label>
            <input
              type="text"
              name="context"
              value={filter.context}
              onChange={handleFilterChange}
              placeholder="Filter by context"
            />
          </div>

          <div className="filter-group">
            <label>Text:</label>
            <input
              type="text"
              name="text"
              value={filter.text}
              onChange={handleFilterChange}
              placeholder="Search in message"
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Start Date:</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>End Date:</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-actions">
            <button onClick={applyFilters}>Apply Filters</button>
            <button onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="error-actions">
        <button onClick={refreshErrors}>Refresh</button>
        <button onClick={handleClearLogs} className="clear-button">
          Clear All Logs
        </button>
      </div>

      {/* Error list */}
      <div className="error-list">
        {errors.length === 0 ? (
          <p className="no-errors">No errors to display</p>
        ) : (
          <ul>
            {errors.map(error => (
              <li 
                key={error.id}
                className={`error-item ${getSeverityClass(error.severity)}`}
              >
                <div className="error-header">
                  <div className="error-time">{formatTime(error.timestamp)}</div>
                  <div className="error-severity">{error.severity}</div>
                  <div className="error-context">{error.context}</div>
                  <button 
                    className="delete-error" 
                    onClick={() => handleDeleteError(error.id)}
                    title="Delete this error log"
                  >
                    ×
                  </button>
                </div>
                <div className="error-message">{error.message}</div>
                {error.stack && (
                  <details>
                    <summary>Stack Trace</summary>
                    <pre className="error-stack">{error.stack}</pre>
                  </details>
                )}
                {Object.keys(error.metadata).length > 0 && (
                  <details>
                    <summary>Additional Info</summary>
                    <pre className="error-metadata">
                      {JSON.stringify(error.metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ErrorLog;
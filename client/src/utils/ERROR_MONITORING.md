# Zork Web - Error Monitoring System

This document describes the client-side error monitoring system implemented for Zork Web.

## Components

### 1. Error Storage (`errorStorage.js`)

The error storage module provides functionality to:
- Store errors in localStorage with unique IDs and timestamps
- Retrieve, filter, and clear error logs
- Track error severity and context information

Key functions:
- `addErrorLog(error, context, severity, metadata)` - Add a new error log
- `getErrorLogs()` - Get all stored errors
- `filterErrorLogs(filters)` - Filter errors by criteria
- `clearErrorLogs()` - Remove all error logs

### 2. Error Handler (`errorHandler.js`)

The global error handler provides:
- Global handlers for unhandled exceptions and promise rejections
- Utility functions for error logging and reporting
- Error categorization by severity
- Function wrappers with integrated error handling

Key functions:
- `setupGlobalErrorHandlers()` - Initialize global error handlers
- `handleError(error, context, metadata)` - Process and log errors
- `withErrorHandling(fn, context)` - Wrapper to add error handling to functions

### 3. Error Boundary (`ErrorBoundary.js`)

React error boundary component that:
- Catches errors in component rendering
- Provides fallback UI for caught errors
- Logs errors to storage with component stack traces
- Includes reset functionality to attempt recovery

### 4. Error Log UI (`ErrorLog.js`)

Visual component that:
- Displays recorded errors in a user-friendly interface
- Provides filtering by type, timestamp, and severity
- Allows clearing error logs
- Shows detailed error information with stack traces

## Installation

The error monitoring system is integrated into the main application. No additional installation steps are needed.

## Usage

### Viewing Error Logs

1. Click the error button (!) in the bottom right corner of the application to open the error log.
2. Review errors, filter by different criteria, and clear logs as needed.

### Handling Errors in Components

```jsx
import { handleError } from '../utils/errorHandler';

try {
  // Code that might throw an error
} catch (error) {
  handleError(error, 'ComponentName', { additionalData });
  // Handle error in UI as needed
}
```

### Wrapping Functions with Error Handling

```jsx
import { withErrorHandling } from '../utils/errorHandler';

// Original function
const fetchData = async (id) => {
  // Implementation
};

// Wrapped with error handling
const safeFetchData = withErrorHandling(fetchData, 'DataFetcher');
```

### Clearing Error Logs from Command Line

```bash
npm run errors:clear
```

## Error Severity Levels

- `low` - Minor issues that don't affect functionality
- `medium` - Non-critical errors (default)
- `high` - Serious errors that impact functionality
- `critical` - Critical failures affecting the application

## Integration with Existing Code

The system has been integrated with the Terminal component to record errors during command processing, API calls, and game initialization.
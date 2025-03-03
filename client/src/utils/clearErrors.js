/**
 * clearErrors.js - Script to clear error logs from localStorage
 * 
 * This script is used by the npm errors:clear command
 * to remove all error logs from localStorage.
 */

// This is meant to be run directly in a browser context
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem('zork_web_error_logs');
    console.log('Error logs cleared successfully');
  } catch (error) {
    console.error('Failed to clear error logs:', error);
    process.exit(1);
  }
} else {
  console.error('localStorage is not available in this environment');
  process.exit(1);
}
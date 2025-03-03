import { handleError, withErrorHandling } from './errorHandler';
import * as errorStorage from './errorStorage';

// Mock the errorStorage module
jest.mock('./errorStorage', () => {
  let storedErrors = [];
  
  return {
    ERROR_SEVERITY: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    },
    addErrorLog: jest.fn((error, context, severity, metadata) => {
      const errorLog = {
        id: `id-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        context,
        severity,
        metadata
      };
      storedErrors.unshift(errorLog);
      return errorLog;
    }),
    getErrorLogs: jest.fn(() => [...storedErrors]),
    clearErrorLogs: jest.fn(() => {
      storedErrors = [];
      return true;
    }),
    filterErrorLogs: jest.fn(filters => [...storedErrors])
  };
});

// Simplified test suite that focuses on error handler functionality
describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('handleError logs errors correctly', () => {
    const testError = new Error('Test error');
    const context = 'TestComponent';
    
    const result = handleError(testError, context);
    
    expect(result).toHaveProperty('error', testError);
    expect(result).toHaveProperty('context', context);
    expect(result).toHaveProperty('severity');
    expect(result).toHaveProperty('time');
    expect(errorStorage.addErrorLog).toHaveBeenCalled();
  });
  
  test('withErrorHandling wraps functions properly', async () => {
    // Success case
    const successFn = jest.fn().mockResolvedValue('success');
    const wrappedSuccess = withErrorHandling(successFn, 'SuccessContext');
    
    const result = await wrappedSuccess('test');
    expect(result).toBe('success');
    expect(successFn).toHaveBeenCalledWith('test');
    
    // Error case
    const errorFn = jest.fn().mockRejectedValue(new Error('Function error'));
    const wrappedError = withErrorHandling(errorFn, 'ErrorContext');
    
    await expect(wrappedError()).rejects.toThrow('Function error');
    expect(errorStorage.addErrorLog).toHaveBeenCalled();
  });
});
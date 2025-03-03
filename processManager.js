#!/usr/bin/env node

/**
 * Process Manager for Zork-Web
 * 
 * This script provides utilities to manage the Zork-Web processes, including:
 * - Starting client and server processes
 * - Stopping running processes
 * - Listing project-related processes
 * - Cleaning up zombie processes
 * 
 * Usage:
 *   node processManager.js [command]
 * 
 * Commands:
 *   start    - Start both client and server processes
 *   stop     - Stop all related processes
 *   list     - List all running processes for the project
 *   clean    - Kill any zombie processes on port 9876
 * 
 * Examples:
 *   node processManager.js start
 *   node processManager.js stop
 *   node processManager.js list
 *   node processManager.js clean
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');

// Configuration
const SERVER_PORT = 9876;
const isWindows = os.platform() === 'win32';
const PROCESS_NAMES = ['node', 'nodemon', 'npm'];

// Store process references for cleanup
const runningProcesses = {
  server: null,
  client: null
};

/**
 * Execute a shell command and return the result as a Promise
 * @param {string} command - Command to execute
 * @returns {Promise<string>} - Command output
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr && !stdout) {
        console.error(`Command stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Find processes using specific port
 * @param {number} port - Port number to check
 * @returns {Promise<Array>} - Array of process IDs
 */
async function findProcessesByPort(port) {
  try {
    let command;
    let processIds = [];
    
    if (isWindows) {
      // Windows command to find process on port
      command = `netstat -ano | findstr :${port}`;
      const output = await executeCommand(command);
      
      // Parse output to extract PIDs
      const lines = output.split('\n').filter(line => line.includes(`${port}`));
      
      // Extract PIDs from output
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 4) {
          const pid = parts[4];
          if (!processIds.includes(pid) && pid !== '0') {
            processIds.push(pid);
          }
        }
      });
    } else {
      // Unix/Linux/Mac command
      command = `lsof -i :${port} -t`;
      const output = await executeCommand(command);
      
      // Extract PIDs from output
      processIds = output.split('\n')
        .filter(pid => pid.trim() !== '')
        .map(pid => pid.trim());
    }
    
    return processIds;
  } catch (error) {
    // If no process is found, lsof might return an error
    if (error.code === 1) {
      return [];
    }
    console.error('Error finding processes by port:', error);
    return [];
  }
}

/**
 * Find all project-related processes
 * @returns {Promise<Array>} - Array of objects with process details
 */
async function findProjectProcesses() {
  try {
    let command;
    let processDetails = [];
    
    if (isWindows) {
      // Windows
      const processCommands = PROCESS_NAMES.map(name => 
        `wmic process where "name like '%${name}%'" get processid,commandline`
      );
      
      for (const cmd of processCommands) {
        const output = await executeCommand(cmd);
        const lines = output.split('\n').filter(line => 
          line.trim() !== '' && 
          line.toLowerCase().includes('zork') &&
          !line.toLowerCase().includes('processid')
        );
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts.pop(); // Last element should be PID
          const command = parts.join(' ');
          
          processDetails.push({
            pid,
            command,
            type: getProcessType(command)
          });
        });
      }
    } else {
      // Unix/Linux/Mac
      command = `ps aux | grep -E '${PROCESS_NAMES.join('|')}' | grep -v grep`;
      const output = await executeCommand(command);
      
      const lines = output.split('\n').filter(line => 
        line.trim() !== '' && 
        line.toLowerCase().includes('zork')
      );
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        const command = parts.slice(10).join(' ');
        
        processDetails.push({
          pid,
          command,
          type: getProcessType(command)
        });
      });
    }
    
    return processDetails;
  } catch (error) {
    console.error('Error finding project processes:', error);
    return [];
  }
}

/**
 * Determine process type based on command
 * @param {string} command - Process command line
 * @returns {string} - Process type (server, client, or unknown)
 */
function getProcessType(command) {
  if (command.includes('server') || command.includes('9876')) {
    return 'server';
  } else if (command.includes('client') || command.includes('react')) {
    return 'client';
  }
  return 'unknown';
}

/**
 * Kill processes by PID
 * @param {Array} pids - Array of process IDs to kill
 * @returns {Promise<void>}
 */
async function killProcesses(pids) {
  if (!pids || pids.length === 0) {
    console.log('No processes to kill');
    return;
  }
  
  try {
    let command;
    
    if (isWindows) {
      // Windows - kill each process individually
      for (const pid of pids) {
        await executeCommand(`taskkill /F /PID ${pid}`);
      }
    } else {
      // Unix/Linux/Mac - kill all processes at once
      command = `kill -9 ${pids.join(' ')}`;
      await executeCommand(command);
    }
    
    console.log(`Killed ${pids.length} process(es): ${pids.join(', ')}`);
  } catch (error) {
    console.error('Error killing processes:', error);
    throw error;
  }
}

/**
 * Start the server process
 * @returns {Promise<void>}
 */
async function startServer() {
  console.log('Starting server...');
  
  try {
    // Check if port is already in use
    const portProcesses = await findProcessesByPort(SERVER_PORT);
    if (portProcesses.length > 0) {
      console.log(`Port ${SERVER_PORT} is already in use by PID(s): ${portProcesses.join(', ')}`);
      console.log('Cleaning up processes before starting...');
      await killProcesses(portProcesses);
    }
    
    // Start server using npm script
    const serverProcess = spawn('npm', ['run', 'server'], {
      stdio: 'inherit',
      shell: true,
      detached: false
    });
    
    runningProcesses.server = serverProcess;
    
    console.log(`Server started with PID: ${serverProcess.pid}`);
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      console.error('Failed to start server process:', error);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      runningProcesses.server = null;
    });
    
    // Give the server some time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('Error starting server:', error);
    throw error;
  }
}

/**
 * Start the client process
 * @returns {Promise<void>}
 */
async function startClient() {
  console.log('Starting client...');
  
  try {
    // Start client using npm script
    const clientProcess = spawn('npm', ['run', 'client'], {
      stdio: 'inherit',
      shell: true,
      detached: false
    });
    
    runningProcesses.client = clientProcess;
    
    console.log(`Client started with PID: ${clientProcess.pid}`);
    
    // Handle client process events
    clientProcess.on('error', (error) => {
      console.error('Failed to start client process:', error);
    });
    
    clientProcess.on('close', (code) => {
      console.log(`Client process exited with code ${code}`);
      runningProcesses.client = null;
    });
    
  } catch (error) {
    console.error('Error starting client:', error);
    throw error;
  }
}

/**
 * Start both server and client processes
 * @returns {Promise<void>}
 */
async function startAll() {
  try {
    // Start server first
    await startServer();
    
    // Then start client
    await startClient();
    
    console.log('Both server and client are now running');
    console.log('Press Ctrl+C to stop or run: node processManager.js stop');
    
    // Keep script running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down...');
      await stopAll();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error starting processes:', error);
    // Try to clean up any processes that did start
    await stopAll();
    throw error;
  }
}

/**
 * Stop all running processes
 * @returns {Promise<void>}
 */
async function stopAll() {
  console.log('Stopping all processes...');
  
  try {
    // Find and kill all project-related processes
    const processes = await findProjectProcesses();
    
    if (processes.length === 0) {
      console.log('No running processes found');
      return;
    }
    
    const pids = processes.map(proc => proc.pid);
    await killProcesses(pids);
    
    // Also clear our internal references
    if (runningProcesses.server) {
      runningProcesses.server.kill();
      runningProcesses.server = null;
    }
    
    if (runningProcesses.client) {
      runningProcesses.client.kill();
      runningProcesses.client = null;
    }
    
    console.log('All processes stopped');
    
  } catch (error) {
    console.error('Error stopping processes:', error);
    throw error;
  }
}

/**
 * Clean up zombie processes using the specified port
 * @returns {Promise<void>}
 */
async function cleanZombieProcesses() {
  console.log(`Cleaning up zombie processes on port ${SERVER_PORT}...`);
  
  try {
    const portProcesses = await findProcessesByPort(SERVER_PORT);
    
    if (portProcesses.length === 0) {
      console.log(`No processes found using port ${SERVER_PORT}`);
      return;
    }
    
    console.log(`Found ${portProcesses.length} process(es) using port ${SERVER_PORT}`);
    await killProcesses(portProcesses);
    
  } catch (error) {
    console.error('Error cleaning zombie processes:', error);
    throw error;
  }
}

/**
 * List all running processes related to the project
 * @returns {Promise<void>}
 */
async function listProcesses() {
  console.log('Listing project processes...');
  
  try {
    const processes = await findProjectProcesses();
    
    if (processes.length === 0) {
      console.log('No running processes found');
      return;
    }
    
    console.log(`Found ${processes.length} running processes:`);
    
    // Group processes by type
    const groupedProcesses = {
      server: [],
      client: [],
      unknown: []
    };
    
    processes.forEach(proc => {
      groupedProcesses[proc.type].push(proc);
    });
    
    // Display server processes
    if (groupedProcesses.server.length > 0) {
      console.log('\nServer Processes:');
      groupedProcesses.server.forEach(proc => {
        console.log(`  PID: ${proc.pid} - ${proc.command}`);
      });
    }
    
    // Display client processes
    if (groupedProcesses.client.length > 0) {
      console.log('\nClient Processes:');
      groupedProcesses.client.forEach(proc => {
        console.log(`  PID: ${proc.pid} - ${proc.command}`);
      });
    }
    
    // Display unknown processes
    if (groupedProcesses.unknown.length > 0) {
      console.log('\nOther Project-Related Processes:');
      groupedProcesses.unknown.forEach(proc => {
        console.log(`  PID: ${proc.pid} - ${proc.command}`);
      });
    }
    
  } catch (error) {
    console.error('Error listing processes:', error);
    throw error;
  }
}

/**
 * Display usage information
 */
function showUsage() {
  console.log(`
Process Manager for Zork-Web

Usage:
  node processManager.js [command]

Commands:
  start    - Start both client and server processes
  stop     - Stop all related processes
  list     - List all running processes for the project
  clean    - Kill any zombie processes on port ${SERVER_PORT}
  help     - Display this help message

Examples:
  node processManager.js start
  node processManager.js stop
  node processManager.js list
  node processManager.js clean
  `);
}

/**
 * Main function to handle command-line arguments and execute commands
 */
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    showUsage();
    return;
  }
  
  try {
    switch (command.toLowerCase()) {
      case 'start':
        await startAll();
        break;
        
      case 'stop':
        await stopAll();
        break;
        
      case 'list':
        await listProcesses();
        break;
        
      case 'clean':
        await cleanZombieProcesses();
        break;
        
      case 'help':
        showUsage();
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        showUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error executing command:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

// Export functions for potential programmatic use
module.exports = {
  startAll,
  stopAll,
  listProcesses,
  cleanZombieProcesses
};
#!/bin/bash

# Start the server
echo "Starting the server..."
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for server to initialize
sleep 2

# Start the client
echo "Starting the client..."
cd client && npm start &
CLIENT_PID=$!

# Function to cleanup on exit
cleanup() {
  echo "Shutting down..."
  kill $SERVER_PID $CLIENT_PID 2>/dev/null
  exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Show running processes
echo "Development environment started!"
echo "Server running with PID: $SERVER_PID"
echo "Client running with PID: $CLIENT_PID"
echo "Press Ctrl+C to stop both processes"

# Keep script running
wait
#!/bin/bash

# Stop the Vite dev server using the PID from vite.pid
if [ -f vite.pid ]; then
  PID=$(cat vite.pid)
  echo "Stopping Vite dev server with PID $PID..."
  kill $PID && rm vite.pid
  echo "Vite dev server stopped."
else
  echo "vite.pid not found. Is the server running?"
fi 
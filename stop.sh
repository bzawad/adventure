#!/bin/bash

# Kill all running Vite dev server processes
pkill -f "vite"

# Optionally, remove the vite.pid file if it exists
if [ -f vite.pid ]; then
  rm vite.pid
fi

echo "All Vite dev server sessions have been killed." 
#!/bin/bash

# Start the Vite dev server in the background and save its PID
echo "Starting Vite dev server..."
npm run dev &
echo $! > vite.pid
echo "Vite dev server started with PID $(cat vite.pid)" 
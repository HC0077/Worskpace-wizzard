#!/bin/bash

# Improved cursor coordinate tracker for macOS
# This script will continuously display the cursor coordinates

echo "Starting cursor coordinate tracker..."
echo "Press Ctrl+C to exit"

while true; do
  # Get cursor position using CGEventGetLocation via osascript
  position=$(osascript -e 'tell application "System Events" to get the position of the mouse')
  
  # Extract X and Y coordinates
  x=$(echo $position | cut -d',' -f1)
  y=$(echo $position | cut -d',' -f2)
  
  # Clear line and print coordinates
  echo -ne "X: $x, Y: $y\r"
  
  # Sleep briefly to avoid high CPU usage
  sleep 0.1
done

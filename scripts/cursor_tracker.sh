#!/bin/bash

# Simple cursor coordinate tracker using AppleScript
# This script will continuously display the cursor coordinates

echo "Starting cursor coordinate tracker..."
echo "Press Ctrl+C to exit"

while true; do
  # Get cursor position using AppleScript
  position=$(osascript -e 'tell application "System Events" to get the position of the mouse')
  
  # Format the output
  position=${position//,/,Y: }
  echo -ne "X: $position\r"
  
  # Sleep briefly to avoid high CPU usage
  sleep 0.1
done

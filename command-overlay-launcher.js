// Command Overlay Launcher
// This script launches the desktop overlay command button

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to Screenpipe executable (assuming standard installation)
const screenpipePath = process.platform === 'darwin' 
  ? '/Applications/Screenpipe.app/Contents/MacOS/Screenpipe'
  : 'C:\\Program Files\\Screenpipe\\Screenpipe.exe';

// Path to our overlay script
const overlayScriptPath = path.join(__dirname, 'scripts', 'desktop-overlay.js');

// Check if files exist
if (!fs.existsSync(overlayScriptPath)) {
  console.error(`Overlay script not found at path: ${overlayScriptPath}`);
  process.exit(1);
}

// Check if Screenpipe is installed
if (!fs.existsSync(screenpipePath)) {
  console.error('Screenpipe executable not found. Please ensure Screenpipe is installed.');
  process.exit(1);
}

console.log('Launching command overlay...');

// Launch the overlay script using Screenpipe
const child = spawn(screenpipePath, ['run', overlayScriptPath], {
  stdio: 'inherit',
  detached: true
});

child.on('error', (err) => {
  console.error('Failed to launch command overlay:', err);
});

console.log('Command overlay launched! Look for the 🪄 button on your screen.');
console.log('To close the overlay, quit Screenpipe or press Ctrl+C in this terminal.');

// Keep process running
process.stdin.resume();

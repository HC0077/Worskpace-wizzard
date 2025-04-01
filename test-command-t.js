// Test script for Command+T keyboard shortcut
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Try to load the Screenpipe Operator
let pipe;
try {
  pipe = require('@screenpipe/operator');
  console.log('Successfully loaded Screenpipe Operator API');
} catch (err) {
  console.log('Could not load Screenpipe Operator API:', err.message);
  process.exit(1);
}

async function testCommandT() {
  try {
    // First activate Chrome
    console.log('Activating Chrome...');
    await execPromise(`osascript -e 'tell application "Google Chrome" to activate'`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now try Command+T using Screenpipe Operator
    console.log('Sending Command+T using Operator API...');
    await pipe.operator.pixel.press('command+t');
    console.log('Command+T sent successfully');
    
    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Test completed');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testCommandT();

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NextResponse } from 'next/server';
import { NextResponse } from 'next/server';

// The Screenpipe Operator API is injected into the runtime environment by Screenpipe
// It's available as a global 'pipe' variable in the execution context
// We don't need to require it - it's already available when running in Screenpipe

// Define a global pipe variable that will be used throughout the code
let pipe;
try {
  // Try to access the global pipe variable if it exists
  if (typeof global !== 'undefined' && global.pipe) {
    pipe = global.pipe;
    console.log('Using global pipe variable');
  } 
  // Otherwise try to require it directly
  else if (typeof require !== 'undefined') {
    pipe = require('@screenpipe/operator');
    console.log('Successfully loaded Screenpipe Operator API');
  }
} catch (err) {
  console.log('Could not load Screenpipe Operator API:', err.message);
}

// Helper function to execute keyboard shortcuts - this is crucial for keyboard shortcut functionality
async function executeKeyboardShortcut(keySequence, targetApp = null) {
  if (!Array.isArray(keySequence) || keySequence.length === 0) {
    console.error('No key sequence provided for keyboard shortcut');
    return false;
  }
  
  // Normalize the key sequence for consistent handling
  const normalizedKeySequence = keySequence.map(key => {
    // Convert common variations of modifier keys to standard form
    if (['cmd', 'command', 'meta'].includes(key.toLowerCase())) return 'command';
    if (['opt', 'option', 'alt'].includes(key.toLowerCase())) return 'option';
    if (['ctrl', 'control'].includes(key.toLowerCase())) return 'control';
    if (['shift'].includes(key.toLowerCase())) return 'shift';
    if (['space', 'spacebar'].includes(key.toLowerCase())) return 'space';
    return key.toLowerCase(); // Normalize other keys to lowercase
  });
  
  console.log(`Executing keyboard shortcut: ${normalizedKeySequence.join('+')}`);
  
  // If target app is specified, ensure it's active
  if (targetApp) {
    const correctedAppName = getCorrectAppName(targetApp);
    console.log(`Ensuring ${correctedAppName} is active before sending shortcut`);
    try {
      // Use the most direct approach to activate the app
      await execPromise(`osascript -e 'tell application "${correctedAppName}" to activate'`);
      console.log(`Successfully activated ${correctedAppName}`);
      // Wait to ensure app is fully active and ready for shortcuts
      await new Promise(resolve => setTimeout(resolve, 1000)); 
    } catch (activateErr) {
      console.error(`Failed to activate target app: ${activateErr.message}`);
      // Do NOT force create a new window, just try to activate the existing one
      try {
        await execPromise(`osascript -e 'tell application "${correctedAppName}" to activate'`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`All attempts to activate ${correctedAppName} failed`);
        return false;
      }
    }
  }
  
  // PRIORITY 1: Try using Screenpipe Operator API first (most reliable)
  if (pipe && pipe.operator && pipe.operator.pixel && pipe.operator.pixel.press) {
    try {
      console.log('Using Screenpipe Operator API for keyboard shortcut');
      
      // Special handling for Command+Space (Spotlight)
      if (normalizedKeySequence.length === 2 && 
          normalizedKeySequence.includes('command') && 
          normalizedKeySequence.includes('space')) {
        console.log('Special handling for Command+Space (Spotlight)');
        await pipe.operator.pixel.press('command+space');
        console.log('Command+Space sent using Screenpipe Operator API');
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      }
      
      // For other shortcuts, use the standard approach
      const operatorKeyCombo = normalizedKeySequence.join('+');
      await pipe.operator.pixel.press(operatorKeyCombo);
      console.log(`Pressed keys ${operatorKeyCombo} using Screenpipe Operator API`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (operatorError) {
      console.error(`Screenpipe Operator keyboard shortcut failed: ${operatorError.message}`);
      // Fall through to AppleScript method
    }
  }

  // PRIORITY 2: Try using AppleScript
  try {
    console.log('Using AppleScript for keyboard shortcut');
    
    // Build the AppleScript key command
    const modifiers = [];
    const regularKeys = [];
    
    for (const key of normalizedKeySequence) {
      // Handle modifier keys
      if (key === 'command') {
        modifiers.push('command down');
      } else if (key === 'option') {
        modifiers.push('option down');
      } else if (key === 'control') {
        modifiers.push('control down');
      } else if (key === 'shift') {
        modifiers.push('shift down');
      } else {
        // Regular keys
        regularKeys.push(key);
      }
    }
    
    // Special handling for Command+Space (Spotlight)
    if (modifiers.includes('command down') && normalizedKeySequence.includes('space')) {
      const spotlightScript = `
        tell application "System Events"
          keystroke space using {command down}
        end tell
      `;
      
      await execPromise(`osascript -e '${spotlightScript}'`);
      console.log('Command+Space (Spotlight) sent using AppleScript');
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    // Combine all regular keys
    const keysToPress = regularKeys.join('');
    
    if (keysToPress) {
      // Build and execute AppleScript for the keystroke
      let appleScript = '';
      
      if (targetApp) {
        appleScript = `
          tell application "${targetApp}"
            activate
            delay 0.5
            tell application "System Events"
              keystroke "${keysToPress}"${modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : ''}
            end tell
          end tell
        `;
      } else {
        appleScript = `
          tell application "System Events"
            keystroke "${keysToPress}"${modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : ''}
          end tell
        `;
      }
      
      await execPromise(`osascript -e '${appleScript}'`);
      console.log(`Pressed keys ${normalizedKeySequence.join('+')} using AppleScript`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } else if (modifiers.length > 0) {
      // Handle modifier-only shortcuts (like Command+Tab)
      console.log('Handling modifier-only shortcut');
      
      // For modifier-only shortcuts
      let appleScript = '';
      
      if (targetApp) {
        appleScript = `
          tell application "${targetApp}"
            activate
            delay 0.5
            tell application "System Events"
              key code 49 ${modifiers.length > 0 ? 'using {' + modifiers.join(', ') + '}' : ''}
            end tell
          end tell
        `;
      } else {
        appleScript = `
          tell application "System Events"
            key code 49 ${modifiers.length > 0 ? 'using {' + modifiers.join(', ') + '}' : ''}
          end tell
        `;
      }
      
      await execPromise(`osascript -e '${appleScript}'`);
      console.log(`Pressed modifier-only shortcut using AppleScript`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } else {
      console.error('No keys to press in the key sequence');
      return false;
    }
  } catch (error) {
    console.error(`AppleScript keyboard shortcut failed: ${error.message}`);
    return false;
  }
}

// Convert exec to promise-based
const execPromise = promisify(exec);

// Define layouts directories - support both local and user home locations
const LAYOUTS_DIR = path.join(process.cwd(), 'layouts');
const USER_LAYOUTS_DIR = path.resolve(process.env.HOME || process.env.USERPROFILE, '.screenpipe');
const USER_LAYOUTS_FILE = path.join(USER_LAYOUTS_DIR, 'workspace-layouts.json');

// Ensure directories exist
if (!fs.existsSync(LAYOUTS_DIR)) {
  fs.mkdirSync(LAYOUTS_DIR, { recursive: true });
}

if (!fs.existsSync(USER_LAYOUTS_DIR)) {
  fs.mkdirSync(USER_LAYOUTS_DIR, { recursive: true });
}

// Initialize user layouts file if it doesn't exist
if (!fs.existsSync(USER_LAYOUTS_FILE)) {
  fs.writeFileSync(USER_LAYOUTS_FILE, JSON.stringify({}, null, 2));
}

// Helper function to move mouse using AppleScript - with precise coordinates
async function moveMouseWithAppleScript(x, y) {
  try {
    console.log(`Moving mouse to x:${x}, y:${y} using AppleScript`);
    
    // Create AppleScript to move the cursor with exact coordinates
    const script = `
      tell application "System Events"
        set mousePosition to {${x}, ${y}}
        set the position of the mouse to mousePosition
      end tell
    `;
    
    // Execute the AppleScript
    await execPromise(`osascript -e '${script}'`);
    
    // Verify position with a second script to ensure accuracy
    const verifyScript = `
      tell application "System Events"
        return position of mouse
      end tell
    `;
    
    const result = await execPromise(`osascript -e '${verifyScript}'`);
    const position = result.stdout.trim();
    console.log(`Mouse position verified at: ${position}`);
    
    // Wait for mouse to settle
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  } catch (error) {
    console.error(`Error moving mouse with AppleScript: ${error.message}`);
    
    // Fallback method 1: Try Screenpipe Operator API
    if (pipe && pipe.operator && pipe.operator.pixel && pipe.operator.pixel.moveMouse) {
      try {
        console.log("Trying Screenpipe Operator API for mouse movement");
        await pipe.operator.pixel.moveMouse(x, y);
        console.log("Mouse moved using Screenpipe Operator API");
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mouse to settle
        return true;
      } catch (err) {
        console.error(`Error using Screenpipe Operator moveMouse: ${err.message}`);
      }
    }
    
    // Fallback method 2: Try direct Quartz method with Python
    try {
      console.log("Trying Python/Quartz method for mouse movement");
      const pythonScript = `
      import Quartz
      Quartz.CGWarpMouseCursorPosition((${x}, ${y}))
      `;
      
      // Write the script to a temporary file
      const tempScriptPath = path.join(process.cwd(), 'temp_mouse_move.py');
      fs.writeFileSync(tempScriptPath, pythonScript);
      
      // Execute the Python script
      await execPromise(`/usr/bin/python3 ${tempScriptPath}`);
      
      // Clean up the temporary file
      fs.unlinkSync(tempScriptPath);
      
      console.log("Mouse moved using Python/Quartz method");
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for mouse to settle
      return true;
    } catch (fallbackError) {
      console.error(`Fallback mouse movement also failed: ${fallbackError.message}`);
      
      // Last resort: Try CGDisplay method
      try {
        console.log("Trying CGDisplay method for mouse movement");
        const cgDisplayScript = `
        tell application "System Events"
          key code 123 using {control down, option down} -- Move left
          key code 124 using {control down, option down} -- Move right
          key code 125 using {control down, option down} -- Move down
          key code 126 using {control down, option down} -- Move up
          -- Now make small adjustments to get closer to target
          repeat 10 times
            key code 123 using {control down, option down, shift down} -- Move left small
            key code 124 using {control down, option down, shift down} -- Move right small
            key code 125 using {control down, option down, shift down} -- Move down small
            key code 126 using {control down, option down, shift down} -- Move up small
          end repeat
        end tell
        `;
        
        await execPromise(`osascript -e '${cgDisplayScript}'`);
        console.log("Mouse moved using CGDisplay method (approximate position)");
        return true;
      } catch (lastResortError) {
        console.error(`All mouse movement methods failed`);
        return false;
      }
    }
  }
}

// Helper function to click at current position using AppleScript
async function clickWithAppleScript(x, y) {
  try {
    // If coordinates are provided, click at those exact coordinates
    if (x !== undefined && y !== undefined) {
      console.log(`Clicking at precise coordinates (${x}, ${y}) using AppleScript`);
      
      // First move the mouse to the position
      const moveSuccess = await moveMouseWithAppleScript(x, y);
      if (!moveSuccess) {
        throw new Error('Failed to move mouse to target position before clicking');
      }
      
      // Wait a moment for the mouse to settle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create AppleScript to click at the current position
      const script = `
        tell application "System Events"
          click at the position of the mouse
        end tell
      `;
      
      // Execute the AppleScript
      await execPromise(`osascript -e '${script}'`);
      console.log(`Mouse clicked at (${x}, ${y}) successfully using AppleScript`);
    } else {
      console.log("Clicking at current position using AppleScript");
      
      // Create AppleScript to click at the current position
      const script = `
        tell application "System Events"
          click at the position of the mouse
        end tell
      `;
      
      // Execute the AppleScript
      await execPromise(`osascript -e '${script}'`);
      console.log("Mouse clicked successfully using AppleScript");
    }
    
    // Wait after click to allow UI to respond
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error(`Error clicking with AppleScript: ${error.message}`);
    
    // Fallback method 1: Try Screenpipe Operator API
    if (pipe && pipe.operator && pipe.operator.pixel) {
      try {
        console.log("Trying Screenpipe Operator API for mouse click");
        
        // First move to the exact coordinates if provided
        if (x !== undefined && y !== undefined && pipe.operator.pixel.moveMouse) {
          await pipe.operator.pixel.moveMouse(x, y);
          console.log(`Mouse moved to (${x}, ${y}) using Screenpipe Operator API`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mouse to settle
        }
        
        // Then perform the click
        if (pipe.operator.pixel.click) {
          await pipe.operator.pixel.click("left");
          console.log("Mouse clicked using Screenpipe Operator API");
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait after click
          return true;
        } else {
          throw new Error('Screenpipe Operator click method not available');
        }
      } catch (err) {
        console.error(`Error using Screenpipe Operator click: ${err.message}`);
      }
    }
    
    // Fallback method 2: Try a different AppleScript approach
    try {
      console.log("Trying alternative AppleScript method for mouse click");
      
      // If coordinates are provided, move the mouse first
      if (x !== undefined && y !== undefined) {
        // Try to move the mouse using a different AppleScript approach
        const moveScript = `
          tell application "System Events"
            set mousePosition to {${x}, ${y}}
            set the position of the mouse to mousePosition
          end tell
        `;
        
        await execPromise(`osascript -e '${moveScript}'`);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for mouse to settle
      }
      
      // Try a different click script
      const clickScript = `
        tell application "System Events"
          click
        end tell
      `;
      
      await execPromise(`osascript -e '${clickScript}'`);
      console.log("Mouse clicked using alternative AppleScript method");
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait after click
      return true;
    } catch (altScriptError) {
      console.error(`Alternative AppleScript method failed: ${altScriptError.message}`);
      
      // Fallback method 3: Try Python/AppleScript hybrid approach
      try {
        console.log("Trying Python/AppleScript hybrid method for mouse click");
        
        if (x !== undefined && y !== undefined) {
          // Create a temporary Python script for more reliable execution
          const pythonScript = `
          import Quartz
          import time
          import subprocess
          
          # Move mouse to position
          Quartz.CGWarpMouseCursorPosition((${x}, ${y}))
          time.sleep(0.3)
          
          # Execute click via AppleScript
          subprocess.run(['osascript', '-e', 'tell application "System Events" to click'])
          `;
          
          // Write the script to a temporary file
          const tempScriptPath = path.join(process.cwd(), 'temp_mouse_click.py');
          fs.writeFileSync(tempScriptPath, pythonScript);
          
          // Execute the Python script
          await execPromise(`/usr/bin/python3 ${tempScriptPath}`);
          
          // Clean up the temporary file
          fs.unlinkSync(tempScriptPath);
          
          console.log("Mouse clicked using Python/AppleScript hybrid method");
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait after click
          return true;
        } else {
          // Just click at current position
          await execPromise(`osascript -e 'tell application "System Events" to click'`);
          console.log("Mouse clicked at current position using simple AppleScript");
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait after click
          return true;
        }
      } catch (fallbackError) {
        console.error(`All mouse click methods failed: ${fallbackError.message}`);
        return false;
      }
    }
  }
}

// Helper function to ensure an application is active - ALWAYS CREATES A NEW WINDOW
async function ensureAppIsActive(appName) {
  try {
    console.log(`Opening a NEW WINDOW of ${appName}...`);
    
    // FORCE NEW WINDOW: First attempt with AppleScript
    try {
      const newWindowScript = `
        tell application "${appName}"
          activate
          try
            make new document
          on error
            try
              make new window
            on error
              -- Just activate as fallback
              activate
            end try
          end try
        end tell
      `;
      await execPromise(`osascript -e '${newWindowScript}'`);
      console.log(`Created new window for ${appName} using AppleScript`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (err) {
      console.error(`Error creating new window with AppleScript: ${err.message}`);
      
      // Fallback: force a new instance of the app with open -n
      try {
        await execPromise(`open -n -a "${appName}"`);
        console.log(`Opened new instance of ${appName} with open -n`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      } catch (err2) {
        console.error(`Error opening new instance: ${err2.message}`);
        
        // Last resort: just open the app normally
        try {
          await execPromise(`open -a "${appName}"`);
          console.log(`Opened ${appName} as last resort`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        } catch (finalErr) {
          console.error(`All methods failed to open app: ${finalErr.message}`);
          return false;
        }
      }
    }
  } catch (error) {
    console.error(`Error ensuring app is active: ${error.message}`);
    return false;
  }
}

// Helper function to get the correct app name
function getCorrectAppName(appName) {
  // Map common app names to their correct names
  const appNameMap = {
    'chrome': 'Google Chrome',
    'safari': 'Safari',
    'firefox': 'Firefox',
    'vscode': 'Visual Studio Code',
    'terminal': 'Terminal',
    'finder': 'Finder',
    'slack': 'Slack',
    'whatsapp': 'WhatsApp',
    'spotify': 'Spotify',
    'notes': 'Notes'
  };
  
  return appNameMap[appName.toLowerCase()] || appName;
}

// Helper function to open Chrome with a specific profile
async function openChromeWithProfile(url, profile) {
  try {
    console.log(`Opening Chrome with profile ${profile} and URL ${url}`);
    
    // Use AppleScript to create a completely new window without closing existing ones
    const newWindowScript = `
      tell application "Google Chrome"
        activate
        make new window
        delay 1
      end tell
    `;
    
    // First create a new Chrome window
    await execPromise(`osascript -e '${newWindowScript}'`);
    console.log('Created new Chrome window');
    
    // Then open URL in that window if provided
    if (url) {
      const openUrlScript = `
        tell application "Google Chrome"
          activate
          set theUrl to "${url}"
          set URL of active tab of front window to theUrl
        end tell
      `;
      await execPromise(`osascript -e '${openUrlScript}'`);
      console.log(`Opened URL ${url} in new Chrome window`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error with AppleScript Chrome approach: ${error.message}`);
    
    // Fallback to traditional approach of opening a new window
    try {
      console.log('Trying fallback method to open Chrome with new window...');
      
      // Use -n flag to force a new instance
      if (url) {
        await execPromise(`open -n -a "Google Chrome" --args --profile-directory="${profile}" "${url}"`);
      } else {
        await execPromise(`open -n -a "Google Chrome" --args --profile-directory="${profile}"`);
      }
      
      console.log('Chrome opened with fallback method');
      return true;
    } catch (fallbackError) {
      console.error(`Fallback method also failed: ${fallbackError.message}`);
      return false;
    }
  }
}

// Helper function to open a new tab in Chrome
async function openNewTabInChrome(url) {
  try {
    console.log(`Opening new tab in Chrome with URL: ${url}`);
    
    // Method 1: Try using AppleScript to create a new tab
    try {
      const script = `
        tell application "Google Chrome"
          activate
          delay 1
          tell application "System Events"
            keystroke "t" using {command down}
          end tell
          delay 0.5
          ${url ? `open location "${url}"` : ''}
        end tell
      `;
      
      await execPromise(`osascript -e '${script}'`);
      console.log('New tab opened successfully using AppleScript');
      return true;
    } catch (appleScriptError) {
      console.error(`AppleScript method failed: ${appleScriptError.message}`);
      
      // Method 2: Try using Screenpipe Operator API
      if (pipe && pipe.operator && pipe.operator.pixel) {
        try {
          // Ensure Chrome is active
          await execPromise(`osascript -e 'tell application "Google Chrome" to activate'`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Send Command+T
          await pipe.operator.pixel.press('command+t');
          console.log('Command+T sent using Screenpipe Operator API');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Type URL if provided
          if (url) {
            await pipe.operator.pixel.type(url);
            await new Promise(resolve => setTimeout(resolve, 500));
            await pipe.operator.pixel.press('return');
          }
          
          console.log('New tab opened successfully using Screenpipe Operator API');
          return true;
        } catch (operatorError) {
          console.error(`Screenpipe Operator method failed: ${operatorError.message}`);
          
          // Method 3: Try direct open command as last resort
          try {
            await execPromise(`open -a "Google Chrome" --new --args "${url || 'https://www.google.com'}"`);


            console.log('New tab opened using open command');
            return true;
          } catch (openError) {
            console.error(`Open command method failed: ${openError.message}`);
            return false;
          }
        }
      } else {
        // Method 3: Try direct open command as fallback
        try {
          await execPromise(`open -a "Google Chrome" --new --args "${url || 'https://www.google.com'}"`);
  
  


          console.log('New tab opened using open command');
          return true;
        } catch (openError) {
          console.error(`Open command method failed: ${openError.message}`);
          return false;
        }
      }
    }
  } catch (error) {
    console.error(`Error opening new tab: ${error.message}`);
    return false;
  }
}

// Helper function to open multiple URLs
async function openMultipleUrls(urls, app, profile) {
  try {
    if (!Array.isArray(urls) || urls.length === 0) {
      console.error('No URLs provided for openMultipleUrls');
      return false;
    }
    
    console.log(`Opening multiple URLs: ${urls.join(', ')}`);
    
    // Ensure URLs have proper http/https prefix
    const formattedUrls = urls.map(url => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
      return url;
    });
    
    // For Chrome (with or without profile)
    if (app.toLowerCase() === 'chrome' || app.toLowerCase() === 'google chrome') {
      // Handle Chrome profile if specified
      if (profile) {
        console.log(`Using Chrome profile: ${profile}`);
        // Open first URL with profile
        try {
          // Triple-escape quotes for the command line
          const escapedUrl = formattedUrls[0].replace(/"/g, '\\"');
          await execPromise(`open -a "Google Chrome" --args --profile-directory="${profile}" "${escapedUrl}"`);
          console.log(`Opened first URL: ${formattedUrls[0]} in Chrome with profile ${profile}`);
        } catch (err) {
          console.error(`Error opening Chrome with profile: ${err.message}`);
          // Fallback to standard Chrome
          await execPromise(`open -a "Google Chrome" "${formattedUrls[0]}"`);
          console.log(`Opened first URL: ${formattedUrls[0]} in Chrome (fallback method)`);
        }
      } else {
        // Open first URL directly without profile
        await execPromise(`open -a "Google Chrome" "${formattedUrls[0]}"`);
        console.log(`Opened first URL: ${formattedUrls[0]} in Chrome`);
      }
      
      // Wait longer for Chrome to fully load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // For remaining URLs, try multiple methods
      for (let i = 1; i < formattedUrls.length; i++) {
        console.log(`Opening URL ${i+1}: ${formattedUrls[i]}`);
        
        let success = false;
        
        // APPROACH 1: Try our dedicated function for opening new tabs
        try {
          success = await openNewTabInChrome(formattedUrls[i]);
          if (success) {
            console.log(`Successfully opened ${formattedUrls[i]} in new Chrome tab`);
            // Wait for page to load before opening next URL
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        } catch (err) {
          console.error(`Error with openNewTabInChrome: ${err.message}`);
        }
        
        // APPROACH 2: Use direct AppleScript if dedicated function fails
        try {
          console.log('Using AppleScript for opening URL in Chrome');
          
          // Ensure Chrome is active
          await execPromise(`osascript -e 'tell application "Google Chrome" to activate'`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Open a new tab and load URL directly
          const escapedUrl = formattedUrls[i].replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          const newTabScript = `
            tell application "Google Chrome"
              activate
              tell application "System Events"
                keystroke "t" using {command down}
              end tell
              delay 1
              open location "${escapedUrl}"
            end tell
          `;
          
          await execPromise(`osascript -e '${newTabScript}'`);
          console.log(`Opened ${formattedUrls[i]} in new Chrome tab using AppleScript`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          success = true;
        } catch (appleScriptErr) {
          console.error(`AppleScript method failed: ${appleScriptErr.message}`);
          
          // APPROACH 3: As a last resort, try direct open command
          try {
            const escapedUrl = formattedUrls[i].replace(/"/g, '\\"');
            await execPromise(`open -a "Google Chrome" "${escapedUrl}"`);
            console.log(`Opened URL using direct open command`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            success = true;
          } catch (openErr) {
            console.error(`All methods failed for URL ${formattedUrls[i]}: ${openErr.message}`);
          }
        }
        
        if (!success) {
          console.error(`Failed to open URL: ${formattedUrls[i]} after trying all methods`);
        }
      }
      
      return true;
    }
    
    // For other browsers (Safari, Firefox, etc.)
    const correctAppName = getCorrectAppName(app);
    
    // Open first URL
    await execPromise(`open -a "${correctAppName}" "${formattedUrls[0]}"`);
    console.log(`Opened first URL: ${formattedUrls[0]} in ${correctAppName}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // For remaining URLs
    for (let i = 1; i < formattedUrls.length; i++) {
      console.log(`Opening URL ${i+1} in ${correctAppName}`);
      
      // Try direct method first
      try {
        await execPromise(`open -a "${correctAppName}" "${formattedUrls[i]}"`);
        console.log(`Opened URL ${i+1} using direct open command`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        console.error(`Error opening URL directly: ${err.message}`);
        
        // Try AppleScript approach as fallback
        try {
          const newTabScript = `
            tell application "${correctAppName}"
              activate
              tell application "System Events"
                keystroke "t" using {command down}
              end tell
              delay 1
              open location "${formattedUrls[i]}"
            end tell
          `;
          
          await execPromise(`osascript -e '${newTabScript}'`);
          console.log(`Opened URL in new tab using AppleScript`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (scriptErr) {
          console.error(`Failed to open URL ${formattedUrls[i]} after trying all methods: ${scriptErr.message}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error in openMultipleUrls: ${error.message}`);
    return false;
  }
}

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(contactName, message) {
  try {
    console.log(`Sending WhatsApp message to ${contactName}`);
    
    // Open WhatsApp
    await ensureAppIsActive('WhatsApp');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Search for contact
    await execPromise(`osascript -e 'tell application "System Events" to keystroke "f" using {command down}'`);
    await new Promise(resolve => setTimeout(resolve, 500));
    await execPromise(`osascript -e 'tell application "System Events" to keystroke "${contactName}"'`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Press Enter to select first contact
    await execPromise(`osascript -e 'tell application "System Events" to keystroke return'`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Type message
    await execPromise(`osascript -e 'tell application "System Events" to keystroke "${message}"'`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send message
    await execPromise(`osascript -e 'tell application "System Events" to keystroke return'`);
    
    console.log('WhatsApp message sent successfully');
    return true;
  } catch (error) {
    console.error(`Error sending WhatsApp message: ${error.message}`);
    return false;
  }
}

// Main function to execute a workspace layout
async function executeWorkspace(layoutName) {
  try {
    console.log(`\nExecuting workspace "${layoutName}"...`);
    
    let layout = null;
    let layoutSource = '';
    
    // STEP 1: Try to load from user's home directory first (most reliable source)
    if (fs.existsSync(USER_LAYOUTS_FILE)) {
      try {
        const userLayoutsJson = fs.readFileSync(USER_LAYOUTS_FILE, 'utf8');
        const userLayouts = JSON.parse(userLayoutsJson);
        
        // Check if the layout exists by exact ID
        if (userLayouts[layoutName]) {
          layout = userLayouts[layoutName];
          layoutSource = 'user layouts file (exact match)';
        } 
        // Try case-insensitive match
        else {
          const lowerLayoutName = layoutName.toLowerCase();
          for (const [id, layoutData] of Object.entries(userLayouts)) {
            if (id.toLowerCase() === lowerLayoutName) {
              layout = layoutData;
              layoutSource = 'user layouts file (case-insensitive match)';
              break;
            }
          }
        }
      } catch (err) {
        console.error(`Error reading user layouts file: ${err.message}`);
      }
    }
    
    // STEP 2: If not found in user layouts, try local directory
    if (!layout) {
      // Try exact filename match
      const exactPath = path.join(LAYOUTS_DIR, `${layoutName}.json`);
      if (fs.existsSync(exactPath)) {
        try {
          const layoutJson = fs.readFileSync(exactPath, 'utf8');
          layout = JSON.parse(layoutJson);
          layoutSource = 'local directory (exact filename match)';
        } catch (err) {
          console.error(`Error reading layout file ${exactPath}: ${err.message}`);
        }
      }
      
      // Try lowercase filename
      if (!layout) {
        const lowercasePath = path.join(LAYOUTS_DIR, `${layoutName.toLowerCase()}.json`);
        if (fs.existsSync(lowercasePath)) {
          try {
            const layoutJson = fs.readFileSync(lowercasePath, 'utf8');
            layout = JSON.parse(layoutJson);
            layoutSource = 'local directory (lowercase filename match)';
          } catch (err) {
            console.error(`Error reading layout file ${lowercasePath}: ${err.message}`);
          }
        }
      }
      
      // Search all JSON files for matching name
      if (!layout && fs.existsSync(LAYOUTS_DIR)) {
        try {
          const files = fs.readdirSync(LAYOUTS_DIR);
          for (const file of files) {
            if (file.endsWith('.json')) {
              try {
                const filePath = path.join(LAYOUTS_DIR, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const layoutData = JSON.parse(content);
                if (layoutData.name === layoutName || 
                    layoutData.name.toLowerCase() === layoutName.toLowerCase()) {
                  layout = layoutData;
                  layoutSource = 'local directory (name match in content)';
                  break;
                }
              } catch (err) {
                // Skip invalid files
                continue;
              }
            }
          }
        } catch (err) {
          console.error(`Error searching layout files: ${err.message}`);
        }
      }
    }
    
    // STEP 3: If still not found, throw error
    if (!layout) {
      throw new Error(`Layout "${layoutName}" not found in any location`);
    }
    
    console.log(`Layout found in ${layoutSource}`);
    
    // STEP 4: Copy layout to local directory for future use
    try {
      const sanitizedName = layoutName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const backupPath = path.join(LAYOUTS_DIR, `${sanitizedName}.json`);
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, JSON.stringify(layout, null, 2));
        console.log(`Created backup of layout at ${backupPath}`);
      }
    } catch (err) {
      console.error(`Error creating backup: ${err.message}`);
      // Continue even if backup fails
    }
    
    // Validate layout
    const validation = validateLayout(layout);
    if (!validation.valid) {
      throw new Error(`Invalid layout: ${validation.message}`);
    }
    
    console.log(`Layout "${layout.name}" loaded successfully`);
    console.log(`Description: ${layout.description}`);
    console.log(`Actions: ${layout.actions.length}`);
    
    // Track the last opened app to ensure we're working in the correct context
    let lastOpenedApp = null;
    
    // Execute each action in sequence
    for (let i = 0; i < layout.actions.length; i++) {
      const action = layout.actions[i];
      console.log(`\nExecuting action ${i + 1}/${layout.actions.length}: ${action.type} - ${action.description || 'No description'}`);
      
      // Check if this is an application opening action
      const isAppOpeningAction = action.type === 'openApp' || action.app || action.openApp ||
                               action.type === 'openUrl' || action.url;
      
      try {
        // Handle different action types
        if (action.type === 'openApp' || action.openApp) {
          // Get the app name from either the new or old format
          const appName = getCorrectAppName(action.app || action.openApp);
          console.log(`Opening application: ${appName}`);
          
          // Handle Chrome with profile if specified
          if ((appName.toLowerCase() === 'chrome' || appName.toLowerCase() === 'google chrome') && 
              action.chromeProfile) {
            console.log(`Opening Chrome with profile: ${action.chromeProfile}`);
            
            try {
              // Use direct AppleScript to create a new Chrome window
              const newWindowScript = `
                tell application "Google Chrome"
                  activate
                  make new window
                  delay 1
                end tell
              `;
              
              await execPromise(`osascript -e '${newWindowScript}'`);
              console.log('Created new Chrome window');
              lastOpenedApp = 'Google Chrome';
              
              // Wait for Chrome to fully open
              await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (err) {
              console.error(`Error opening Chrome with profile: ${err.message}`);
              // Fallback to regular Chrome opening
              const success = await ensureAppIsActive(appName);
              if (success) {
                lastOpenedApp = action.app || action.openApp;
                console.log(`Application ${appName} opened successfully`);
              }
            }
          } else {
            // Force open a new window of the application
            try {
              // First try AppleScript approach to open a new window
              const newWindowScript = `
                tell application "${appName}"
                  activate
                  make new document
                end tell
              `;
              
              await execPromise(`osascript -e '${newWindowScript}'`).catch(() => {
                // If that fails, try system open which often creates a new window
                return execPromise(`open -n -a "${appName}"`);
              });
              
              console.log(`New window of application ${appName} opened successfully`);
              lastOpenedApp = action.app || action.openApp;
            } catch (err) {
              console.error(`Failed to open new window of application: ${appName}, falling back to regular open`);
              // Fallback to regular open if new window creation fails
              const success = await ensureAppIsActive(appName);
              if (success) {
                console.log(`Application ${appName} opened successfully with fallback method`);
                lastOpenedApp = action.app || action.openApp;
              } else {
                console.error(`Failed to open application: ${appName}`);
              }
            }
          }
        } else if (action.type === 'openUrl' || action.url) {
          // Get URL from either format
          const url = action.url;
          console.log(`Opening URL: ${url}`);
          
          // Determine browser
          const browser = action.browser || lastOpenedApp || 'chrome';
          const correctBrowserName = getCorrectAppName(browser);
          
          // Handle Chrome profiles
          if ((browser.toLowerCase() === 'chrome' || browser.toLowerCase() === 'google chrome')) {
            try {
              // THE MOST DIRECT AND RELIABLE METHOD - Just open the URL in Chrome
              // This will either use the existing Chrome window or open a new one
              await execPromise(`open -a "Google Chrome" "${url}"`);
              console.log(`URL opened directly in Chrome`);
              lastOpenedApp = 'Google Chrome';
              
              // Wait a moment to make sure the URL loads
              await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (err) {
              console.error(`Error with direct URL opening: ${err.message}`);
              
              // Try the profile-specific approach as a fallback
              try {
                const profile = action.chromeProfile || 'Default';
                await execPromise(`open -a "Google Chrome" --args --profile-directory="${profile}" "${url}"`);
                console.log(`URL opened in Chrome with profile ${profile}`);
                lastOpenedApp = 'Google Chrome';
              } catch (profileErr) {
                console.error(`Profile method failed: ${profileErr.message}`);
                
                // Try system default as a last resort
                try {
                  await execPromise(`open "${url}"`);
                  console.log(`URL opened with system default handler`);
                } catch (finalErr) {
                  console.error(`All URL opening methods failed: ${finalErr.message}`);
                }
              }
            }
          } else {
            // For other browsers, use the direct approach
            try {
              await execPromise(`open -a "${correctBrowserName}" "${url}"`);
              console.log(`URL opened successfully in ${correctBrowserName}`);
              lastOpenedApp = browser;
            } catch (err) {
              console.error(`Error opening URL in ${correctBrowserName}: ${err.message}`);
              
              // Fallback to system default
              try {
                await execPromise(`open "${url}"`);
                console.log(`URL opened with system default handler`);
              } catch (fallbackErr) {
                console.error(`Fallback URL opening also failed: ${fallbackErr.message}`);
              }
            }
          }
          
          // Wait for browser to load
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else if (action.type === 'openMultipleUrls') {
          // Open multiple URLs
          if (!Array.isArray(action.urls) || action.urls.length === 0) {
            console.error('No URLs provided for openMultipleUrls action');
            continue;
          }
          
          console.log(`Opening multiple URLs: ${action.urls.join(', ')}`);
          
          // Determine browser
          const browser = action.browser || 'chrome';
          
          await openMultipleUrls(action.urls, browser, action.chromeProfile);
          
          console.log('Multiple URLs opened successfully');
          lastOpenedApp = browser;
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (action.type === 'keyboardShortcut') {
          // Execute keyboard shortcut
          if (!Array.isArray(action.keySequence) || action.keySequence.length === 0) {
            console.error('No key sequence provided for keyboardShortcut action');
            continue;
          }
          
          // Normalize the key sequence for consistent handling
          const normalizedKeySequence = action.keySequence.map(key => {
            // Convert common variations of modifier keys to standard form
            if (['cmd', 'command', 'meta'].includes(key.toLowerCase())) return 'command';
            if (['opt', 'option', 'alt'].includes(key.toLowerCase())) return 'option';
            if (['ctrl', 'control'].includes(key.toLowerCase())) return 'control';
            if (['shift'].includes(key.toLowerCase())) return 'shift';
            return key.toLowerCase(); // Normalize other keys to lowercase
          });
          
          console.log(`Executing keyboard shortcut: ${normalizedKeySequence.join('+')}`);
          
          try {
            // Determine which application should receive the keyboard shortcut
            let targetApp = null;
            
            // Use the app specified in the action if available
            if (action.app) {
              targetApp = getCorrectAppName(action.app);
              console.log(`Using app specified in shortcut action: ${targetApp}`);
            } 
            // Otherwise use the last opened app if available
            else if (lastOpenedApp) {
              targetApp = getCorrectAppName(lastOpenedApp);
              console.log(`Using last opened app for shortcut: ${targetApp}`);
            } else {
              console.log('No target app specified for shortcut, will use current active app');
            }
            
            // If this is a single action, use the existing window as requested by the user
            // Don't force a new window for single keyboard shortcut actions
            if (targetApp) {
              console.log(`Using existing window of ${targetApp} for keyboard shortcut`);
            }
            
            // Always ensure target application is active regardless
            if (targetApp) {
              try {
                // Use the most direct approach to activate the app
                await execPromise(`osascript -e 'tell application "${targetApp}" to activate'`);
                console.log(`Successfully activated ${targetApp}`);
                // Wait longer to ensure app is fully active and ready for shortcuts
                await new Promise(resolve => setTimeout(resolve, 2000)); 
              } catch (activateErr) {
                console.error(`Failed to activate target app: ${activateErr.message}`);
                // Try the standard approach as fallback
                const activated = await ensureAppIsActive(targetApp);
                if (!activated) {
                  console.error(`All attempts to activate ${targetApp} failed`);
                }
              }
            }
            
            try {
              // SPECIAL HANDLING FOR COMMAND+T IN CHROME
              // This is known to be particularly problematic
              if ((normalizedKeySequence.length === 2 && 
                  normalizedKeySequence.includes('command') && 
                  normalizedKeySequence.includes('t')) &&
                  targetApp && targetApp.toLowerCase().includes('chrome')) {
                  
                console.log('Using special handling for Command+T in Chrome');
                
                // Check if we need to use a specific Chrome profile
                const chromeProfile = action.chromeProfile || null;
                if (chromeProfile) {
                  console.log(`Using Chrome profile: ${chromeProfile} for Command+T shortcut`);
                }
                
                // Use our dedicated function for opening new tabs in Chrome
                const success = await openNewTabInChrome();
                if (success) {
                  console.log('Successfully opened new tab in Chrome');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  continue;
                }
                
                // If the dedicated function fails, try the direct methods
                
                // First try using Screenpipe Operator API
                if (pipe && pipe.operator && pipe.operator.pixel && pipe.operator.pixel.press) {
                  try {
                    console.log('Using Screenpipe Operator API for Command+T in Chrome');
                    await pipe.operator.pixel.press('command+t');
                    console.log('Command+T sent to Chrome using Screenpipe Operator API');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue; // Continue to next action if successful
                  } catch (err) {
                    console.error(`Screenpipe Operator Command+T failed: ${err.message}`);
                    // Fall through to AppleScript method
                  }
                }
                
                // DIRECT APPLESCRIPT APPROACH - Fallback for Command+T
                try {
                  const cmdTScript = `
                    tell application "Google Chrome"
                      activate
                      delay 0.5
                      tell application "System Events"
                        keystroke "t" using {command down}
                      end tell
                    end tell
                  `;
                  await execPromise(`osascript -e '${cmdTScript}'`);
                  console.log('Command+T sent to Chrome using AppleScript');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  continue; // Continue to next action if successful
                } catch (err) {
                  console.error(`AppleScript Command+T failed: ${err.message}`);
                  // Fall through to the general keyboard shortcut handling
                }
              } 
              // FOR ALL OTHER KEYBOARD SHORTCUTS
              else {
                try {
                  // Try using AppleScript first - most reliable for keyboard shortcuts
                  const keyCombo = normalizedKeySequence.join('+');
                  console.log(`Sending keyboard shortcut: ${keyCombo}`);
                  
                  // Build the AppleScript key command
                  const modifiers = [];
                  const regularKeys = [];
                  
                  for (const key of normalizedKeySequence) {
                    // Handle modifier keys - already normalized, so simple check
                    if (key === 'command') {
                      modifiers.push('command down');
                    } else if (key === 'option') {
                      modifiers.push('option down');
                    } else if (key === 'control') {
                      modifiers.push('control down');
                    } else if (key === 'shift') {
                      modifiers.push('shift down');
                    } else {
                      // Regular keys
                      regularKeys.push(key);
                    }
                  }
                  
                  // Combine all regular keys
                  const keysToPress = regularKeys.join('');
                  
                  if (keysToPress) {
                    // Build and execute AppleScript for the keystroke
                    let appleScript = '';
                    
                    if (targetApp) {
                      appleScript = `
                        tell application "${targetApp}"
                          activate
                          delay 0.5
                          tell application "System Events"
                            keystroke "${keysToPress}"${modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : ''}
                          end tell
                        end tell
                      `;
                    } else {
                      appleScript = `
                        tell application "System Events"
                          keystroke "${keysToPress}"${modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : ''}
                        end tell
                      `;
                    }
                    
                    await execPromise(`osascript -e '${appleScript}'`);
                    console.log(`Pressed keys ${normalizedKeySequence.join('+')} using AppleScript`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } else if (modifiers.length > 0) {
                    // Handle modifier-only shortcuts (like Command+Tab)
                    console.log('Handling modifier-only shortcut');
                    let appleScript = '';
                    
                    if (targetApp) {
                      appleScript = `
                        tell application "${targetApp}"
                          activate
                          delay 0.5
                          tell application "System Events"
                            key code 48 ${modifiers.length > 0 ? 'using {' + modifiers.join(', ') + '}' : ''}
                          end tell
                        end tell
                      `;
                    } else {
                      appleScript = `
                        tell application "System Events"
                          key code 48 ${modifiers.length > 0 ? 'using {' + modifiers.join(', ') + '}' : ''}
                        end tell
                      `;
                    }
                    
                    await execPromise(`osascript -e '${appleScript}'`);
                    console.log(`Pressed modifier-only shortcut using AppleScript`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } else {
                    console.error('No keys to press in the key sequence');
                  }
                } catch (appleScriptError) {
                  console.error(`Error sending keyboard shortcut with AppleScript: ${appleScriptError.message}`);
                  
                  // Fall back to Screenpipe Operator API if available
                  try {
                    if (typeof pipe !== 'undefined' && pipe && pipe.operator && pipe.operator.pixel && pipe.operator.pixel.press) {
                      const keyCombo = normalizedKeySequence.join('+');
                      console.log(`Trying Screenpipe Operator API: ${keyCombo}`);
                      await pipe.operator.pixel.press(keyCombo);
                      console.log(`Successfully pressed keys using Operator API`);
                      await new Promise(resolve => setTimeout(resolve, 500));
                    } else {
                      throw new Error('Screenpipe Operator API not available');
                    }
                  } catch (pixelErr) {
                    console.error(`Screenpipe Operator keyboard shortcut failed: ${pixelErr.message}`);
                    
                    // Last resort: Try individual key presses with Screenpipe Operator API
                    try {
                      if (pipe && pipe.operator && pipe.operator.pixel) {
                        console.log('Trying individual key presses as last resort');
                        
                        // Press and hold modifiers
                        for (const mod of normalizedKeySequence.filter(k => ['command', 'option', 'control', 'shift'].includes(k))) {
                          console.log(`Pressing and holding ${mod}`);
                          await pipe.operator.pixel.press(`${mod}_down`);
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        
                        // Press regular keys
                        for (const key of normalizedKeySequence.filter(k => !['command', 'option', 'control', 'shift'].includes(k))) {
                          console.log(`Pressing ${key}`);
                          await pipe.operator.pixel.press(key);
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        
                        // Release modifiers in reverse order
                        for (const mod of [...normalizedKeySequence.filter(k => ['command', 'option', 'control', 'shift'].includes(k))].reverse()) {
                          console.log(`Releasing ${mod}`);
                          await pipe.operator.pixel.press(`${mod}_up`);
                          await new Promise(resolve => setTimeout(resolve, 100));
                        }
                        
                        console.log('Individual key presses completed');
                      } else {
                        throw new Error('Screenpipe Operator API not available for individual key presses');
                      }
                    } catch (individualError) {
                      console.error(`All keyboard shortcut methods failed: ${individualError.message}`);
                    }
                  }
                }
              }
            } catch (operatorErr) {
              console.error(`Error in keyboard shortcut handling: ${operatorErr.message}`);
              
              // Fall back to AppleScript method if all other methods fail
              console.log('Falling back to AppleScript method...');
              
              try {
                // Special handling for Command+T (new tab) in browsers
                if (normalizedKeySequence.length === 2 && 
                    normalizedKeySequence.includes('command') && 
                    normalizedKeySequence.includes('t') &&
                    targetApp && ['Google Chrome', 'Safari', 'Firefox'].includes(targetApp)) {
                  
                  await execPromise(`osascript -e 'tell application "${targetApp}" to activate' -e 'tell application "System Events" to tell process "${targetApp}" to keystroke "t" using {command down}'`);
                  console.log(`Opened new tab with Command+T in ${targetApp}`);
                } else {
                  // For other shortcuts, try AppleScript
                  // Build the key command
                  const modifiers = [];
                  const regularKeys = [];
                  
                  for (const key of normalizedKeySequence) {
                    // Handle modifier keys - already normalized, so simple check
                    if (key === 'command') {
                      modifiers.push('command down');
                    } else if (key === 'option') {
                      modifiers.push('option down');
                    } else if (key === 'control') {
                      modifiers.push('control down');
                    } else if (key === 'shift') {
                      modifiers.push('shift down');
                    } else {
                      // Regular keys
                      regularKeys.push(key);
                    }
                  }
                  
                  // Combine all regular keys
                  const keysToPress = regularKeys.join('');
                  
                  if (keysToPress) {
                    // Build and execute AppleScript for the keystroke
                    let appleScript = '';
                    
                    if (targetApp) {
                      appleScript = `tell application "${targetApp}" to activate\ntell application "System Events" to tell process "${targetApp}" to keystroke "${keysToPress}"${modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : ''}`;
                    } else {
                      appleScript = `tell application "System Events" to keystroke "${keysToPress}"${modifiers.length > 0 ? ' using {' + modifiers.join(', ') + '}' : ''}`;
                    }
                    
                    await execPromise(`osascript -e '${appleScript}'`);
                    console.log(`Pressed keys ${action.keySequence.join('+')} using AppleScript fallback`);
                  } else {
                    console.error('No regular keys to press in the key sequence');
                  }
                }
              } catch (appleScriptErr) {
                console.error(`AppleScript method also failed: ${appleScriptErr.message}`);
              }
            }
            
            console.log("Key sequence completed successfully");
          } catch (error) {
            console.error(`Error executing key sequence: ${error.message}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Handle mouse movement and click actions
        if (action.type === 'mouseMove' || action.type === 'mouseClick' || 
            (action.x !== undefined && action.y !== undefined)) {
          const x = parseInt(action.x);
          const y = parseInt(action.y);
          
          if (isNaN(x) || isNaN(y)) {
            console.error(`Invalid coordinates: x=${action.x}, y=${action.y}`);
            continue;
          }
          
          // If we need to show coordinates (for debugging)
          if (action.showCoordinates) {
            console.log(`Moving mouse to position: (${x}, ${y}) with visual feedback`);
            try {
              // Try to use cursor tracker for visual feedback
              await execPromise(`osascript ${path.join(process.cwd(), 'scripts/cursor_tracker.applescript')} ${x} ${y}`).catch(() => {});
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              // Continue even if cursor tracker fails
              console.error(`Error showing cursor tracker: ${err.message}`);
            }
          }
          
          // Ensure target application is active if specified
          if (action.app) {
            const appName = getCorrectAppName(action.app);
            await ensureAppIsActive(appName);
            lastOpenedApp = action.app;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Extra delay for app to activate
          } else if (lastOpenedApp) {
            // Otherwise, ensure the last opened app is active
            await ensureAppIsActive(getCorrectAppName(lastOpenedApp));
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Move mouse to coordinates using enhanced function
          const moved = await moveMouseWithAppleScript(x, y);
          if (!moved) {
            console.error(`Failed to move mouse to (${x}, ${y})`);
            continue;
          }
          
          // Perform click if this is a click action
          if (action.type === 'mouseClick' || action.click === true) {
            const clicked = await clickWithAppleScript(x, y);
            if (!clicked) {
              console.error(`Failed to click at (${x}, ${y})`);
            } else {
              console.log(`Successfully clicked at (${x}, ${y})`);
            }
          }
          
          // Extra delay after mouse actions
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Handle WhatsApp message action
        if (action.type === 'sendWhatsAppMessage') {
          if (!action.contactName || !action.message) {
            console.error('Missing contactName or message for sendWhatsAppMessage action');
            continue;
          }
          
          console.log(`Sending WhatsApp message to ${action.contactName}`);
          
          const success = await sendWhatsAppMessage(action.contactName, action.message);
          
          if (success) {
            console.log('WhatsApp message sent successfully');
            lastOpenedApp = 'whatsapp';
          } else {
            console.error('Failed to send WhatsApp message');
          }
        }
        
        // No additional delay for app opening actions
        
        // Wait between actions
        if (i < layout.actions.length - 1) {
          console.log('Waiting before next action...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Error executing action: ${error.message}`);
      }
    }
    
    console.log(`\nWorkspace "${layoutName}" execution completed successfully`);
    return { success: true, message: `Workspace "${layoutName}" executed successfully` };
  } catch (error) {
    console.error(`Error executing workspace: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Helper function to validate a layout and normalize it
function validateLayout(layout) {
  if (!layout) {
    return { valid: false, message: 'Layout is empty or null' };
  }
  
  if (!layout.name) {
    return { valid: false, message: 'Layout must have a name' };
  }
  
  if (!layout.description) {
    layout.description = layout.name; // Default description to name if missing
  }
  
  if (!layout.actions || !Array.isArray(layout.actions) || layout.actions.length === 0) {
    return { valid: false, message: 'Layout must have at least one action' };
  }
  
  // Normalize actions to ensure they have the correct structure
  for (let i = 0; i < layout.actions.length; i++) {
    const action = layout.actions[i];
    
    // Ensure each action has a description
    if (!action.description) {
      action.description = `Action ${i+1}`;
    }
    
    // Convert old format actions to new format
    if (!action.type) {
      // Determine action type based on properties
      if (action.openApp) {
        action.type = 'openApp';
        action.app = action.openApp;
      } else if (action.url) {
        action.type = 'openUrl';
      } else if (action.click && (action.x !== undefined && action.y !== undefined)) {
        action.type = 'mouseClick';
      } else if (action.x !== undefined && action.y !== undefined) {
        action.type = 'mouseMove';
      } else if (action.whatsapp) {
        action.type = 'whatsappMessage';
      } else if (action.keySequence || action.keys) {
        action.type = 'keyboardShortcut';
      }
    }
    
    // Ensure Chrome profile is preserved
    if (action.chromeProfile && action.type === 'openApp' && 
        (action.app?.toLowerCase() === 'chrome' || action.app?.toLowerCase() === 'google chrome')) {
      action.chromeProfile = action.chromeProfile;
    }
  }
  
  return { valid: true };
}

// Helper function to list all available layouts
function listLayouts() {
  try {
    const layouts = [];
    
    // First get layouts from user's home directory
    if (fs.existsSync(USER_LAYOUTS_FILE)) {
      try {
        const userLayoutsJson = fs.readFileSync(USER_LAYOUTS_FILE, 'utf8');
        const userLayouts = JSON.parse(userLayoutsJson);
        
        for (const [id, layout] of Object.entries(userLayouts)) {
          layouts.push({
            id: id,
            name: layout.name,
            description: layout.description,
            source: 'user',
            actions: layout.actions ? layout.actions.length : 0
          });
        }
      } catch (err) {
        console.error(`Error reading user layouts file: ${err.message}`);
      }
    }
    
    // Then get layouts from local directory
    if (fs.existsSync(LAYOUTS_DIR)) {
      try {
        const files = fs.readdirSync(LAYOUTS_DIR);
        const localLayouts = files
          .filter(file => file.endsWith('.json'))
          .map(file => {
            try {
              const layoutPath = path.join(LAYOUTS_DIR, file);
              const layoutJson = fs.readFileSync(layoutPath, 'utf8');
              const layout = JSON.parse(layoutJson);
              
              // Skip if this layout is already in the list (from user layouts)
              const filenameWithoutExt = file.replace(/\.json$/, '');
              const isDuplicate = layouts.some(l => 
                l.id === filenameWithoutExt || 
                l.name === layout.name
              );
              
              if (!isDuplicate) {
                return {
                  id: filenameWithoutExt,
                  name: layout.name,
                  description: layout.description,
                  source: 'local',
                  actions: layout.actions ? layout.actions.length : 0
                };
              }
              return null;
            } catch (err) {
              console.error(`Error reading layout file ${file}: ${err.message}`);
              return null;
            }
          })
          .filter(layout => layout !== null);
        
        layouts.push(...localLayouts);
      } catch (err) {
        console.error(`Error reading layouts directory: ${err.message}`);
      }
    }
    
    return layouts;
  } catch (error) {
    console.error(`Error listing layouts: ${error.message}`);
    return [];
  }
}

export async function GET(req) {
  console.log('GET request received');
  try {
    // Get layout name from query parameters
    const url = new URL(req.url);
    const layoutName = url.searchParams.get('layout');
    
    // If no layout name provided, return list of available layouts
    if (!layoutName) {
      const layouts = listLayouts();
      return NextResponse.json({ layouts });
    }
    
    // Execute the specified layout
    const result = await executeWorkspace(layoutName);
    
    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in GET handler: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  console.log('POST request received');
  try {
    // Parse request body
    const body = await req.json();
    
    // Save a new layout
    if (body.action === 'save') {
      if (!body.layout || !body.layout.name || !body.layout.description || !Array.isArray(body.layout.actions)) {
        return NextResponse.json({ success: false, error: 'Invalid layout format' }, { status: 400 });
      }
      
      // Sanitize layout name for filename
      const sanitizedName = body.layout.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const layoutPath = path.join(LAYOUTS_DIR, `${sanitizedName}.json`);
      
      // Save layout to file
      fs.writeFileSync(layoutPath, JSON.stringify(body.layout, null, 2));
      
      return NextResponse.json({ success: true, message: `Layout "${body.layout.name}" saved successfully` });
    }
    
    // Delete a layout
    if (body.action === 'delete') {
      if (!body.layoutName) {
        return NextResponse.json({ success: false, error: 'Layout name is required' }, { status: 400 });
      }
      
      // Find the layout file
      const files = fs.readdirSync(LAYOUTS_DIR);
      const layoutFile = files.find(file => {
        const layoutPath = path.join(LAYOUTS_DIR, file);
        const layoutJson = fs.readFileSync(layoutPath, 'utf8');
        const layout = JSON.parse(layoutJson);
        return layout.name === body.layoutName;
      });
      
      if (!layoutFile) {
        return NextResponse.json({ success: false, error: `Layout "${body.layoutName}" not found` }, { status: 404 });
      }
      
      // Delete the layout file
      fs.unlinkSync(path.join(LAYOUTS_DIR, layoutFile));
      
      return NextResponse.json({ success: true, message: `Layout "${body.layoutName}" deleted successfully` });
    }
    
    // Test a single action
    if (body.action === 'test') {
      if (!body.testAction) {
        return NextResponse.json({ success: false, error: 'Test action is required' }, { status: 400 });
      }

      const action = body.testAction;

      // Handle mouse movement and click actions
      if (action.type === 'mouseMove' || action.type === 'mouseClick' || 
          (action.x !== undefined && action.y !== undefined)) {
        const x = parseInt(action.x);
        const y = parseInt(action.y);
        
        if (isNaN(x) || isNaN(y)) {
          return NextResponse.json({ 
            success: false, 
            error: `Invalid coordinates: x=${action.x}, y=${action.y}` 
          }, { status: 400 });
        }

        try {
          // If we need to show coordinates (for debugging)
          if (action.showCoordinates) {
            console.log(`Moving mouse to position: (${x}, ${y}) with visual feedback`);
            try {
              await execPromise(`osascript ${path.join(process.cwd(), 'scripts/cursor_tracker.applescript')} ${x} ${y}`).catch(() => {});
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
              console.error(`Error showing cursor tracker: ${err.message}`);
            }
          }

          // Ensure target application is active if specified
          if (action.app) {
            const appName = getCorrectAppName(action.app);
            await ensureAppIsActive(appName);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Move mouse to coordinates using enhanced function
          const moved = await moveMouseWithAppleScript(x, y);
          if (!moved) {
            return NextResponse.json({ 
              success: false, 
              error: `Failed to move mouse to (${x}, ${y})` 
            }, { status: 500 });
          }

          // Perform click if this is a click action
          if (action.type === 'mouseClick' || action.click === true) {
            const clicked = await clickWithAppleScript(x, y);
            if (!clicked) {
              return NextResponse.json({ 
                success: false, 
                error: `Failed to click at (${x}, ${y})` 
              }, { status: 500 });
            }
          }

          return NextResponse.json({ 
            success: true, 
            message: `Successfully ${action.type === 'mouseClick' || action.click ? 'clicked' : 'moved'} at (${x}, ${y})` 
          });
        } catch (error) {
          console.error(`Error testing mouse action: ${error.message}`);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
      }

      return NextResponse.json({ success: false, error: 'Invalid test action type' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(`Error in POST handler: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

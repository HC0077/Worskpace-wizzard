const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to our file
const filePath = path.join('app', 'api', 'start-workspace', 'route.js');

// Restore from backup if it exists
try {
  if (fs.existsSync(`${filePath}.backup`)) {
    console.log('Restoring from backup file first...');
    fs.copyFileSync(`${filePath}.backup`, filePath);
  }
} catch (err) {
  console.error('Error restoring from backup:', err);
}

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Let's completely replace the keyboard shortcut handler section
// Find the keyboard shortcut handler
const keyboardShortcutStart = "        } else if (action.type === 'keyboardShortcut') {";
const keyboardShortcutStartIndex = content.indexOf(keyboardShortcutStart);

if (keyboardShortcutStartIndex !== -1) {
  // Find the next action type or end of loop
  const nextActionStartPattern = "        } else if (action.type ===";
  let nextActionStartIndex = content.indexOf(nextActionStartPattern, keyboardShortcutStartIndex + keyboardShortcutStart.length);
  
  if (nextActionStartIndex === -1) {
    // If no next action, look for the end of the loop
    nextActionStartIndex = content.indexOf("        } // End of loop", keyboardShortcutStartIndex);
  }
  
  if (nextActionStartIndex !== -1) {
    // Create a clean implementation of the keyboard shortcut handler
    const cleanKeyboardShortcutHandler = `        } else if (action.type === 'keyboardShortcut') {
          console.log('Executing keyboard shortcut action');
          
          // Ensure we have a key sequence
          if (!Array.isArray(action.keySequence) || action.keySequence.length === 0) {
            console.error('No key sequence provided for keyboardShortcut action');
            continue;
          }
          
          // Determine which application should receive the keyboard shortcut
          let targetApp = null;
          
          // Use the app specified in the action if available
          if (action.app) {
            targetApp = getCorrectAppName(action.app);
            console.log(\`Using app specified in shortcut action: \${targetApp}\`);
          } 
          // Otherwise use the last opened app if available
          else if (lastOpenedApp) {
            targetApp = getCorrectAppName(lastOpenedApp);
            console.log(\`Using last opened app for shortcut: \${targetApp}\`);
          } else {
            console.log('No target app specified for shortcut, will use current active app');
          }
          
          // IMPORTANT: For keyboard shortcuts, we MUST use the existing window
          // Do NOT create new windows for keyboard shortcut actions
          console.log(\`Using existing window of \${targetApp || 'current application'} for keyboard shortcut\`);
          
          // Special handling for Command+T in Chrome
          if (action.keySequence.length === 2 && 
              action.keySequence.map(k => k.toLowerCase()).includes('command') && 
              action.keySequence.map(k => k.toLowerCase()).includes('t') &&
              targetApp && targetApp.toLowerCase().includes('chrome')) {
            
            console.log('Special handling for Command+T in Chrome');
            try {
              const success = await openNewTabInChrome();
              if (success) {
                console.log('Successfully opened new tab in Chrome');
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            } catch (err) {
              console.error(\`Failed to open new tab in Chrome: \${err.message}\`);
              // Fall through to standard keyboard shortcut handling
            }
          }
          
          // Use our utility function to execute the keyboard shortcut in the specific window
          try {
            const success = await executeKeyboardShortcut(action.keySequence, targetApp);
            if (success) {
              console.log(\`Successfully executed keyboard shortcut: \${action.keySequence.join('+')}\`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              console.error(\`Failed to execute keyboard shortcut: \${action.keySequence.join('+')}\`);
            }
          } catch (error) {
            console.error(\`Error executing keyboard shortcut: \${error.message}\`);
          }
          continue;`;
    
    // Replace the current keyboard shortcut handler with our clean implementation
    content = content.substring(0, keyboardShortcutStartIndex) + cleanKeyboardShortcutHandler + content.substring(nextActionStartIndex);
    console.log('✅ Successfully replaced keyboard shortcut handler');
  } else {
    console.error('❌ Could not find end of keyboard shortcut handler');
  }
} else {
  console.error('❌ Could not find keyboard shortcut handler');
}

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

// Verify the syntax
try {
  const result = execSync('node -c app/api/start-workspace/route.js', { encoding: 'utf8' });
  console.log('✅ Syntax check passed:', result);
} catch (error) {
  console.error('❌ Syntax check failed:', error.message);
  
  // Try to identify the error location
  const match = error.message.match(/line (\d+)/);
  if (match) {
    const errorLine = parseInt(match[1]);
    console.log(`Error around line ${errorLine}`);
    console.log('Context around error:');
    try {
      const context = execSync(`sed -n ${Math.max(1, errorLine-5)},${errorLine+5}p app/api/start-workspace/route.js`, { encoding: 'utf8' });
      console.log(context);
    } catch (sedError) {
      console.error('Could not show context:', sedError.message);
    }
  }
}

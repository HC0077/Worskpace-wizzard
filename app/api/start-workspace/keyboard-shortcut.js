// Helper function to execute a keyboard shortcut using Screenpipe Operator API
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
  
  try {
    // PRIORITY 1: Try using Screenpipe Operator API first
    if (global.pipe && global.pipe.operator && global.pipe.operator.pixel && global.pipe.operator.pixel.press) {
      try {
        console.log('Using Screenpipe Operator API for keyboard shortcut');
        
        // Special handling for Command+Space (Spotlight)
        if (normalizedKeySequence.length === 2 && 
            normalizedKeySequence.includes('command') && 
            normalizedKeySequence.includes('space')) {
          console.log('Special handling for Command+Space (Spotlight)');
          await global.pipe.operator.pixel.press('command+space');
          console.log('Command+Space sent using Screenpipe Operator API');
          await new Promise(resolve => setTimeout(resolve, 500));
          return true;
        }
        
        // For other shortcuts, use the standard approach
        const operatorKeyCombo = normalizedKeySequence.join('+');
        await global.pipe.operator.pixel.press(operatorKeyCombo);
        console.log(`Pressed keys ${operatorKeyCombo} using Screenpipe Operator API`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      } catch (operatorError) {
        console.error(`Screenpipe Operator keyboard shortcut failed: ${operatorError.message}`);
        // Fall through to AppleScript method
      }
    }
    
    // PRIORITY 2: Try using AppleScript
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
      
      try {
        const { execPromise } = await import('../../../utils/exec.js');
        await execPromise(`osascript -e '${appleScript}'`);
        console.log(`Pressed keys ${normalizedKeySequence.join('+')} using AppleScript`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;
      } catch (execError) {
        console.error(`AppleScript execution failed: ${execError.message}`);
        return false;
      }
    } else {
      console.error('No regular keys to press in the key sequence');
      return false;
    }
  } catch (error) {
    console.error(`All keyboard shortcut methods failed: ${error.message}`);
    return false;
  }
}

module.exports = { executeKeyboardShortcut };

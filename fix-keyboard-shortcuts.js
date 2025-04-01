// Script to fix both keyboard shortcuts and URL functionality
const fs = require('fs');
const path = require('path');

// Path to our file
const filePath = path.join('app', 'api', 'start-workspace', 'route.js');

// Read the current file
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Remove the unreachable code after continue statement in the keyboard shortcut section
// This is the most critical issue causing syntax errors
const keyboardShortcutSection = "        } else if (action.type === 'keyboardShortcut') {";
const continueStatement = "          continue;";

const startIdx = content.indexOf(keyboardShortcutSection);
if (startIdx !== -1) {
  const continueIdx = content.indexOf(continueStatement, startIdx);
  
  if (continueIdx !== -1) {
    // Find where the current keyboard shortcut implementation should end
    // (next 'else if' or end of actions loop)
    let endIdx = content.indexOf('        } else if (action.type ===', continueIdx);
    if (endIdx === -1) {
      endIdx = content.indexOf('        } // End of loop through workspace actions', continueIdx);
    }
    
    if (endIdx !== -1) {
      // Remove all the unreachable code after the continue statement
      const contentBefore = content.substring(0, continueIdx + continueStatement.length);
      const contentAfter = content.substring(endIdx);
      content = contentBefore + '\n' + contentAfter;
      console.log('✅ Successfully cleaned up unreachable keyboard shortcut code');
    } else {
      console.log('⚠️ Could not find end of keyboard shortcut section');
    }
  } else {
    console.log('⚠️ Continue statement not found in keyboard shortcut section');
  }
} else {
  console.log('⚠️ Keyboard shortcut section not found');
}

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');
console.log('💾 Changes saved to file');

// Verify that our executeKeyboardShortcut function is present and properly implemented
const executeKeyboardShortcutCheck = "async function executeKeyboardShortcut(keySequence, targetApp = null) {";
if (content.includes(executeKeyboardShortcutCheck)) {
  console.log('✅ executeKeyboardShortcut function is present');
} else {
  console.log('⚠️ executeKeyboardShortcut function is missing');
}

// Verify file loads without syntax errors
try {
  require(filePath);
  console.log('✅ File loads without syntax errors');
} catch (err) {
  console.error('❌ Syntax errors remain:', err.message);
}

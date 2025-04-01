// API endpoint for executing commands
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Command mapping - map phrases to actions
// Mouse control functions
async function clickAt(x, y) {
  try {
    if (!pipe?.operator?.pixel) {
      throw new Error('Screenpipe Operator API not available');
    }

    console.log(`Moving mouse to ${x}, ${y}`);
    await pipe.operator.pixel.moveMouse(x, y);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mouse to settle

    console.log('Clicking at current position');
    await pipe.operator.pixel.click('left');
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for click to register

    return { success: true, message: 'Clicked at specified coordinates' };
  } catch (error) {
    console.error('Error clicking:', error);
    return { success: false, message: 'Failed to click: ' + error.message };
  }
}

async function doubleClickAt(x, y) {
  try {
    if (!pipe?.operator?.pixel) {
      throw new Error('Screenpipe Operator API not available');
    }

    console.log(`Moving mouse to ${x}, ${y}`);
    await pipe.operator.pixel.moveMouse(x, y);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mouse to settle

    console.log('Double clicking at current position');
    await pipe.operator.pixel.click('left');
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause between clicks
    await pipe.operator.pixel.click('left');
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for clicks to register

    return { success: true, message: 'Double clicked at specified coordinates' };
  } catch (error) {
    console.error('Error double clicking:', error);
    return { success: false, message: 'Failed to double click: ' + error.message };
  }
}

async function rightClickAt(x, y) {
  try {
    if (!pipe?.operator?.pixel) {
      throw new Error('Screenpipe Operator API not available');
    }

    console.log(`Moving mouse to ${x}, ${y}`);
    await pipe.operator.pixel.moveMouse(x, y);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for mouse to settle

    console.log('Right clicking at current position');
    await pipe.operator.pixel.click('right');
    await new Promise(resolve => setTimeout(resolve, 300)); // Wait for click to register

    return { success: true, message: 'Right clicked at specified coordinates' };
  } catch (error) {
    console.error('Error right clicking:', error);
    return { success: false, message: 'Failed to right click: ' + error.message };
  }
}

const commandMappings = [
  // Mouse controls
  {
    triggers: ['click center', 'click middle', 'click in middle'],
    action: { type: 'mouse', action: 'click', x: 960, y: 540 },
    description: 'Click in the center of the screen'
  },
  {
    triggers: ['click top left', 'click upper left'],
    action: { type: 'mouse', action: 'click', x: 100, y: 100 },
    description: 'Click in the top left corner'
  },
  {
    triggers: ['click top right', 'click upper right'],
    action: { type: 'mouse', action: 'click', x: 1820, y: 100 },
    description: 'Click in the top right corner'
  },
  {
    triggers: ['click bottom left', 'click lower left'],
    action: { type: 'mouse', action: 'click', x: 100, y: 980 },
    description: 'Click in the bottom left corner'
  },
  {
    triggers: ['click bottom right', 'click lower right'],
    action: { type: 'mouse', action: 'click', x: 1820, y: 980 },
    description: 'Click in the bottom right corner'
  },

  // System controls
  {
    triggers: ['switch to dark mode', 'dark mode', 'enable dark mode'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('System Settings');
      await pipe.operator.pixel.press('return');
      await pipe.operator.pixel.type('dark mode');
      await pipe.operator.pixel.press('return');
    },
    description: 'Switch to dark mode'
  },
  {
    triggers: ['switch to light mode', 'light mode', 'enable light mode'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('System Settings');
      await pipe.operator.pixel.press('return');
      await pipe.operator.pixel.type('light mode');
      await pipe.operator.pixel.press('return');
    },
    description: 'Switch to light mode'
  },

  // Daily productivity
  {
    triggers: ['start pomodoro', 'pomodoro timer', 'focus timer'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('Timer');
      await pipe.operator.pixel.press('return');
      await pipe.operator.pixel.type('25');
      await pipe.operator.pixel.press('return');
    },
    description: 'Start a 25-minute Pomodoro timer'
  },
  {
    triggers: ['take a break', 'start break', 'break timer'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('Timer');
      await pipe.operator.pixel.press('return');
      await pipe.operator.pixel.type('5');
      await pipe.operator.pixel.press('return');
    },
    description: 'Start a 5-minute break timer'
  },

  // Quick actions
  {
    triggers: ['screenshot', 'take screenshot', 'capture screen'],
    action: async () => {
      await pipe.operator.pixel.press('shift+cmd+4');
    },
    description: 'Take a screenshot of selected area'
  },
  {
    triggers: ['full screenshot', 'capture full screen'],
    action: async () => {
      await pipe.operator.pixel.press('shift+cmd+3');
    },
    description: 'Take a screenshot of entire screen'
  },

  // Application shortcuts
  {
    triggers: ['open notes', 'show notes', 'start notes'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('Notes');
      await pipe.operator.pixel.press('return');
    },
    description: 'Open Notes app'
  },
  {
    triggers: ['open calendar', 'show calendar', 'check calendar'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('Calendar');
      await pipe.operator.pixel.press('return');
    },
    description: 'Open Calendar app'
  },
  {
    triggers: ['open reminders', 'show reminders', 'check reminders'],
    action: async () => {
      await pipe.operator.pixel.press('cmd+space');
      await pipe.operator.pixel.type('Reminders');
      await pipe.operator.pixel.press('return');
    },
    description: 'Open Reminders app'
  },

  // System actions
  {
    triggers: ['lock screen', 'lock computer'],
    action: async () => {
      await pipe.operator.pixel.press('ctrl+cmd+q');
    },
    description: 'Lock the screen'
  },
  {
    triggers: ['show desktop', 'hide windows'],
    action: async () => {
      await pipe.operator.pixel.press('f11');
    },
    description: 'Show desktop'
  },

  // Music controls
  {
    triggers: ['play music', 'start music'],
    action: async () => {
      await pipe.operator.pixel.press('play');
    },
    description: 'Play music'
  },
  {
    triggers: ['pause music', 'stop music'],
    action: async () => {
      await pipe.operator.pixel.press('pause');
    },
    description: 'Pause music'
  },
  {
    triggers: ['next song', 'next track'],
    action: async () => {
      await pipe.operator.pixel.press('next');
    },
    description: 'Play next track'
  },
  {
    triggers: ['previous song', 'previous track'],
    action: async () => {
      await pipe.operator.pixel.press('previous');
    },
    description: 'Play previous track'
  },

  // Volume controls
  {
    triggers: ['volume up', 'increase volume', 'louder'],
    action: async () => {
      await pipe.operator.pixel.press('volume_up');
      await pipe.operator.pixel.press('volume_up');
    },
    description: 'Increase volume'
  },
  {
    triggers: ['volume down', 'decrease volume', 'quieter'],
    action: async () => {
      await pipe.operator.pixel.press('volume_down');
      await pipe.operator.pixel.press('volume_down');
    },
    description: 'Decrease volume'
  },
  {
    triggers: ['mute', 'mute audio'],
    action: async () => {
      await pipe.operator.pixel.press('mute');
    },
    description: 'Mute audio'
  },
  {
    triggers: ['switch to dark mode', 'enable dark mode', 'dark mode on'],
    action: 'switchToDarkMode',
    description: 'Switch to dark mode'
  },
  {
    triggers: ['switch to light mode', 'enable light mode', 'light mode on'],
    action: 'switchToLightMode',
    description: 'Switch to light mode'
  },
  {
    triggers: ['take a screenshot', 'capture screen', 'screenshot'],
    action: 'takeScreenshot',
    description: 'Take a screenshot'
  },
  {
    triggers: ['open chrome', 'launch chrome', 'start chrome'],
    action: 'openApp',
    params: { app: 'Google Chrome' },
    description: 'Open Google Chrome'
  },
  {
    triggers: ['open vscode', 'launch vscode', 'start vscode'],
    action: 'openApp',
    params: { app: 'Visual Studio Code' },
    description: 'Open VS Code'
  },
  {
    triggers: ['mute', 'mute audio', 'mute sound'],
    action: 'muteAudio',
    description: 'Mute audio'
  },
  {
    triggers: ['unmute', 'unmute audio', 'unmute sound'],
    action: 'unmuteAudio',
    description: 'Unmute audio'
  },
  {
    triggers: ['volume up', 'increase volume', 'louder'],
    action: 'volumeUp',
    description: 'Increase volume'
  },
  {
    triggers: ['volume down', 'decrease volume', 'quieter'],
    action: 'volumeDown',
    description: 'Decrease volume'
  }
];

// Function to find matching command
function findMatchingCommand(userInput) {
  // Ensure input is a string
  const normalizedInput = String(userInput || '').toLowerCase().trim();
  if (!normalizedInput) return null;
  
  // Try to find exact matches first
  for (const mapping of commandMappings) {
    if (mapping.triggers.includes(normalizedInput)) {
      return mapping;
    }
  }
  
  // Try to find partial matches
  for (const mapping of commandMappings) {
    for (const trigger of mapping.triggers) {
      if (normalizedInput.includes(trigger)) {
        return mapping;
      }
    }
  }
  
  // Try similarity-based fuzzy matching
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const mapping of commandMappings) {
    for (const trigger of mapping.triggers) {
      const similarity = calculateSimilarity(normalizedInput, trigger);
      
      if (similarity > 0.7 && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = mapping;
      }
    }
  }
  
  return bestMatch;
}

// Simple similarity calculation using Levenshtein distance
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) {
    d[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }
  
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return d[m][n];
}

// Command execution functions
async function executeCommand(action, params = {}) {
  // Handle mouse control commands
  if (typeof action === 'object' && action.type === 'mouse') {
    switch (action.action) {
      case 'click':
        return await clickAt(action.x, action.y);
      case 'doubleClick':
        return await doubleClickAt(action.x, action.y);
      case 'rightClick':
        return await rightClickAt(action.x, action.y);
      default:
        throw new Error('Unknown mouse action');
    }
  }
  switch (action) {
    case 'switchToDarkMode':
      return await switchToDarkMode();
    
    case 'switchToLightMode':
      return await switchToLightMode();
    
    case 'takeScreenshot':
      return await takeScreenshot();
    
    case 'openApp':
      return await openApp(params.app);
    
    case 'muteAudio':
      return await muteAudio();
    
    case 'unmuteAudio':
      return await unmuteAudio();
    
    case 'volumeUp':
      return await volumeUp();
    
    case 'volumeDown':
      return await volumeDown();
    
    default:
      throw new Error('Unknown command action');
  }
}

// Dark mode toggle function
async function switchToDarkMode() {
  try {
    // Use AppleScript to switch to dark mode
    const appleScript = `
      tell application "System Events"
        tell appearance preferences
          set dark mode to true
        end tell
      end tell
    `;
    
    await execPromise(`osascript -e '${appleScript}'`);
    return { success: true, message: 'Switched to dark mode' };
  } catch (error) {
    console.error('Error switching to dark mode:', error);
    return { success: false, message: 'Failed to switch to dark mode' };
  }
}

// Light mode toggle function
async function switchToLightMode() {
  try {
    // Use AppleScript to switch to light mode
    const appleScript = `
      tell application "System Events"
        tell appearance preferences
          set dark mode to false
        end tell
      end tell
    `;
    
    await execPromise(`osascript -e '${appleScript}'`);
    return { success: true, message: 'Switched to light mode' };
  } catch (error) {
    console.error('Error switching to light mode:', error);
    return { success: false, message: 'Failed to switch to light mode' };
  }
}

// Screenshot function
async function takeScreenshot() {
  try {
    // Generate a filename with the current date
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `screenshot_${timestamp}.png`;
    
    // Save screenshot to desktop
    await execPromise(`screencapture -x ~/Desktop/${fileName}`);
    
    return {
      success: true,
      message: `Screenshot saved to Desktop as ${fileName}`
    };
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return { success: false, message: 'Failed to take screenshot' };
  }
}

// Open app function
async function openApp(appName) {
  try {
    const formattedAppName = appName.replace(/"/g, '\\"');
    
    await execPromise(`osascript -e 'tell application "${formattedAppName}" to activate'`);
    
    return {
      success: true,
      message: `Opened ${appName}`
    };
  } catch (error) {
    console.error(`Error opening ${appName}:`, error);
    return { success: false, message: `Failed to open ${appName}` };
  }
}

// Volume control functions
async function muteAudio() {
  try {
    await execPromise('osascript -e "set volume output muted true"');
    return { success: true, message: 'Audio muted' };
  } catch (error) {
    console.error('Error muting audio:', error);
    return { success: false, message: 'Failed to mute audio' };
  }
}

async function unmuteAudio() {
  try {
    await execPromise('osascript -e "set volume output muted false"');
    return { success: true, message: 'Audio unmuted' };
  } catch (error) {
    console.error('Error unmuting audio:', error);
    return { success: false, message: 'Failed to unmute audio' };
  }
}

async function volumeUp() {
  try {
    await execPromise(`
      osascript -e "
        set currentVolume to output volume of (get volume settings)
        set newVolume to currentVolume + 10
        if newVolume > 100 then
          set newVolume to 100
        end if
        set volume output volume newVolume
      "
    `);
    
    return { success: true, message: 'Volume increased' };
  } catch (error) {
    console.error('Error increasing volume:', error);
    return { success: false, message: 'Failed to increase volume' };
  }
}

async function volumeDown() {
  try {
    await execPromise(`
      osascript -e "
        set currentVolume to output volume of (get volume settings)
        set newVolume to currentVolume - 10
        if newVolume < 0 then
          set newVolume to 0
        end if
        set volume output volume newVolume
      "
    `);
    
    return { success: true, message: 'Volume decreased' };
  } catch (error) {
    console.error('Error decreasing volume:', error);
    return { success: false, message: 'Failed to decrease volume' };
  }
}

// API Route Handler
export async function POST(request) {
  // Handle direct mouse control commands
  const mouseCommandPattern = /^(click|double[- ]?click|right[- ]?click) at \(?([0-9]+)[, ]+([0-9]+)\)?$/i;

  try {
    const data = await request.json();
    const command = String(data.command || '').trim();
    const screenContext = data.screenContext;

    // Check for mouse control commands first
    const mouseMatch = command.match(mouseCommandPattern);
    if (mouseMatch) {
      const [, action, x, y] = mouseMatch;
      const mouseAction = {
        type: 'mouse',
        action: action.toLowerCase().replace(/[- ]/g, ''),
        x: parseInt(x),
        y: parseInt(y)
      };
      const result = await executeCommand(mouseAction);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!command) {
      return new Response(
        JSON.stringify({ success: false, message: 'No command provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Find matching command
    const matchedCommand = findMatchingCommand(command);
    
    if (!matchedCommand) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Sorry, I couldn\'t understand that command' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Execute the matched command
    const result = await executeCommand(matchedCommand.action, matchedCommand.params);
    
    // Return the result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing command:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'An error occurred while processing your command'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Simple Workspace Launcher - Uses absolute coordinates for reliability
const { pipe } = require('@screenpipe/browser');
const { exec } = require('child_process');

// Helper function to open application using macOS 'open' command
function openAppWithTerminal(appName) {
  return new Promise((resolve, reject) => {
    console.log(`Opening ${appName} using 'open' command...`);
    
    // Use the 'open' command on macOS
    exec(`open -a "${appName}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error opening ${appName}: ${error.message}`);
        reject(error);
        return;
      }
      console.log(`${appName} opened successfully`);
      // Give the app time to open
      setTimeout(resolve, 3000);
    });
  });
}

// Helper function to open application using Spotlight (kept as fallback)
async function openAppWithSpotlight(appName) {
  try {
    console.log(`Opening ${appName} using Spotlight...`);
    
    // Press Command+Space to open Spotlight
    await pipe.operator.pixel.press("Meta");
    await pipe.operator.pixel.press(" ");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Type the application name
    await pipe.operator.pixel.type(appName);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Press Enter to launch
    await pipe.operator.pixel.press("Enter");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`${appName} opened successfully`);
    return true;
  } catch (error) {
    console.error(`Error opening ${appName}: ${error.message}`);
    return false;
  }
}

// Available layouts with absolute coordinates
const LAYOUTS = {
  "dev": {
    "name": "Development Mode",
    "description": "Setup for development with WhatsApp and terminal",
    "actions": [
      {
        "description": "Open WhatsApp",
        "openApp": "WhatsApp"
      },
      {
        "description": "Position mouse in WhatsApp chat area",
        "x": 400,
        "y": 300,
        "click": true
      },
      {
        "description": "Open Terminal",
        "openApp": "Terminal"
      },
      {
        "description": "Position mouse in Terminal",
        "x": 400,
        "y": 600,
        "click": true
      }
    ]
  },
  "research": {
    "name": "Research Mode",
    "description": "Browser setup for research",
    "actions": [
      {
        "description": "Open Google Chrome",
        "openApp": "Google Chrome"
      },
      {
        "description": "Position mouse at address bar",
        "x": 400,
        "y": 70,
        "click": true,
        "type": "https://github.com"
      }
    ]
  },
  "meeting": {
    "name": "Meeting Mode",
    "description": "Setup for video meetings",
    "actions": [
      {
        "description": "Open Google Chrome",
        "openApp": "Google Chrome"
      },
      {
        "description": "Position mouse at address bar",
        "x": 400,
        "y": 70,
        "click": true,
        "type": "https://meet.google.com"
      },
      {
        "description": "Open Notes app for meeting notes",
        "openApp": "Notes"
      }
    ]
  }
};

// Execute a workspace layout
async function executeWorkspace(layoutName) {
  try {
    const layout = LAYOUTS[layoutName];
    if (!layout) {
      console.log(`Layout "${layoutName}" not found. Available layouts: ${Object.keys(LAYOUTS).join(', ')}`);
      return false;
    }
    
    console.log(`Starting workspace: ${layout.name} - ${layout.description}`);
    console.log(`This layout has ${layout.actions.length} actions`);
    
    // Wait a moment before starting
    console.log("Starting in 3 seconds...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute each action in sequence
    for (const [index, action] of layout.actions.entries()) {
      console.log(`\nAction ${index + 1}/${layout.actions.length}: ${action.description}`);
      
      try {
        // Open application if specified
        if (action.openApp) {
          await openAppWithTerminal(action.openApp);
          continue;
        }
        
        // Handle key sequence if specified
        if (action.keySequence) {
          console.log(`Pressing key sequence: ${action.keySequence.join(' + ')}`);
          for (const key of action.keySequence) {
            await pipe.operator.pixel.press(key);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // Move mouse to position if coordinates are provided
        if (action.x !== undefined && action.y !== undefined) {
          console.log(`Moving mouse to x:${action.x}, y:${action.y}`);
          await pipe.operator.pixel.moveMouse(action.x, action.y);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Click if specified
          if (action.click) {
            console.log("Clicking at current position");
            await pipe.operator.pixel.click("left");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Type if specified
        if (action.type) {
          console.log(`Typing: ${action.type}`);
          await pipe.operator.pixel.type(action.type);
          await pipe.operator.pixel.press("Enter");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error executing action: ${error.message}`);
        console.log("Continuing with next action...");
      }
    }
    
    console.log("\nWorkspace setup completed successfully!");
    return true;
  } catch (error) {
    console.error("Error executing workspace:", error);
    return false;
  }
}

// List available layouts
function listLayouts() {
  console.log("\nAvailable Workspace Layouts:");
  console.log("============================");
  
  Object.entries(LAYOUTS).forEach(([id, layout]) => {
    console.log(`\n${layout.name} (${id}):`);
    console.log(`  ${layout.description}`);
    console.log(`  ${layout.actions.length} actions`);
  });
  
  console.log("\nTo start a workspace: node simple-launcher.js <layout-id>");
  console.log("Example: node simple-launcher.js dev");
}

// Main function
async function main() {
  const layoutName = process.argv[2];
  
  if (!layoutName || layoutName === "help") {
    console.log("\nSimple Workspace Launcher - Automate your workspace setup");
    console.log("\nUsage:");
    console.log("  node simple-launcher.js list     - List available layouts");
    console.log("  node simple-launcher.js <layout> - Start a workspace layout");
    console.log("  node simple-launcher.js help     - Show this help message");
    
    if (!layoutName) {
      listLayouts();
    }
    
    return;
  }
  
  if (layoutName === "list") {
    listLayouts();
    return;
  }
  
  await executeWorkspace(layoutName);
}

// Run the main function
main().catch(console.error);

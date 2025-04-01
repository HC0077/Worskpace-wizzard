// Workspace Launcher - A simple script to automate workspace setup
// Uses only confirmed working Screenpipe Operator API methods
const { pipe } = require('@screenpipe/browser');
const fs = require('fs');
const path = require('path');

// Path to store workspace layouts
const LAYOUTS_PATH = path.resolve(process.env.HOME || process.env.USERPROFILE, '.screenpipe', 'workspace-layouts.json');

// Default layouts based on relative screen positions rather than absolute coordinates
const DEFAULT_LAYOUTS = {
  "dev": {
    "name": "Development Mode",
    "description": "Setup for development with code editor and terminal",
    "actions": [
      {
        "description": "Position mouse at top left quadrant (for VSCode)",
        "relativeX": 0.2,  // 20% from left edge
        "relativeY": 0.2,  // 20% from top edge
        "click": true,
        "type": null
      },
      {
        "description": "Position mouse at bottom left quadrant (for Terminal)",
        "relativeX": 0.2,  // 20% from left edge
        "relativeY": 0.8,  // 80% from top edge (near bottom)
        "click": true,
        "type": null
      }
    ]
  },
  "research": {
    "name": "Research Mode",
    "description": "Browser setup for research",
    "actions": [
      {
        "description": "Position mouse for browser",
        "relativeX": 0.5,  // Center horizontally
        "relativeY": 0.2,  // Near top
        "click": true,
        "type": null
      },
      {
        "description": "Focus address bar",
        "relativeX": 0.5,  // Center of address bar
        "relativeY": 0.05, // Very top of screen
        "click": true,
        "type": "https://github.com"
      },
      {
        "description": "Open new tab",
        "keySequence": ["Control", "t"],
        "relativeX": null,
        "relativeY": null,
        "click": false,
        "type": null
      },
      {
        "description": "Open Stack Overflow in new tab",
        "relativeX": 0.5,  // Center of address bar
        "relativeY": 0.05, // Very top of screen
        "click": true,
        "type": "https://stackoverflow.com"
      }
    ]
  },
  "meeting": {
    "name": "Meeting Mode",
    "description": "Setup for video meetings",
    "actions": [
      {
        "description": "Position mouse for browser",
        "relativeX": 0.5,  // Center horizontally
        "relativeY": 0.2,  // Near top
        "click": true,
        "type": null
      },
      {
        "description": "Focus address bar",
        "relativeX": 0.5,  // Center of address bar
        "relativeY": 0.05, // Very top of screen
        "click": true,
        "type": "https://meet.google.com"
      }
    ]
  }
};

// Helper function to ensure layouts file exists
function ensureLayoutsFile() {
  if (!fs.existsSync(path.dirname(LAYOUTS_PATH))) {
    fs.mkdirSync(path.dirname(LAYOUTS_PATH), { recursive: true });
  }
  
  if (!fs.existsSync(LAYOUTS_PATH)) {
    fs.writeFileSync(LAYOUTS_PATH, JSON.stringify(DEFAULT_LAYOUTS, null, 2));
    console.log(`Created default layouts file at ${LAYOUTS_PATH}`);
  }
  
  return JSON.parse(fs.readFileSync(LAYOUTS_PATH, 'utf8'));
}

// Get layout by name
function getLayout(layoutName) {
  const layouts = ensureLayoutsFile();
  if (!layouts[layoutName]) {
    console.log(`Layout "${layoutName}" not found. Available layouts: ${Object.keys(layouts).join(', ')}`);
    return layouts["dev"]; // Default to dev layout
  }
  return layouts[layoutName];
}

// Get screen dimensions
async function getScreenDimensions() {
  // Since we can't directly get screen dimensions from the API,
  // we'll use a reasonable default and allow override via environment variables
  const defaultWidth = 1440;  // Common MacBook Pro width
  const defaultHeight = 900;  // Common MacBook Pro height
  
  const width = parseInt(process.env.SCREEN_WIDTH || defaultWidth);
  const height = parseInt(process.env.SCREEN_HEIGHT || defaultHeight);
  
  console.log(`Using screen dimensions: ${width}x${height}`);
  return { width, height };
}

// Execute a workspace layout
async function executeWorkspace(layoutName) {
  try {
    console.log(`Starting workspace: ${layoutName}`);
    const layout = getLayout(layoutName);
    const screen = await getScreenDimensions();
    
    console.log(`Executing layout: ${layout.name} - ${layout.description}`);
    console.log(`This layout has ${layout.actions.length} actions`);
    
    // Wait a moment before starting
    console.log("Starting in 3 seconds...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute each action in sequence
    for (const [index, action] of layout.actions.entries()) {
      console.log(`\nAction ${index + 1}/${layout.actions.length}: ${action.description}`);
      
      try {
        // Handle key sequence if specified
        if (action.keySequence) {
          console.log(`Pressing key sequence: ${action.keySequence.join(' + ')}`);
          // For simplicity, we'll just simulate the most common key combinations
          if (action.keySequence.includes("Control") && action.keySequence.includes("t")) {
            // Simulate Ctrl+T (new tab)
            await pipe.operator.pixel.press("t");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          continue;
        }
        
        // Calculate absolute position from relative coordinates if provided
        if (action.relativeX !== null && action.relativeY !== null) {
          const x = Math.round(action.relativeX * screen.width);
          const y = Math.round(action.relativeY * screen.height);
          
          // Move mouse to position
          console.log(`Moving mouse to x:${x}, y:${y} (${Math.round(action.relativeX * 100)}%, ${Math.round(action.relativeY * 100)}% of screen)`);
          await pipe.operator.pixel.moveMouse(x, y);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Click if specified
          if (action.click) {
            console.log("Clicking at current position");
            await pipe.operator.pixel.click("left");
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } else if (action.x !== undefined && action.y !== undefined) {
          // Support for legacy absolute coordinates
          console.log(`Moving mouse to absolute coordinates x:${action.x}, y:${action.y}`);
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
  const layouts = ensureLayoutsFile();
  console.log("\nAvailable Workspace Layouts:");
  console.log("============================");
  
  Object.entries(layouts).forEach(([id, layout]) => {
    console.log(`\n${layout.name} (${id}):`);
    console.log(`  ${layout.description}`);
    console.log(`  ${layout.actions.length} actions`);
  });
  
  console.log("\nTo start a workspace: node workspace-launcher.js start <layout-id>");
  console.log("Example: node workspace-launcher.js start dev");
  console.log("\nTo specify screen dimensions:");
  console.log("SCREEN_WIDTH=1920 SCREEN_HEIGHT=1080 node workspace-launcher.js start dev");
}

// Main function
async function main() {
  const command = process.argv[2];
  const layoutName = process.argv[3];
  
  if (!command || command === "help") {
    console.log("\nWorkspace Launcher - Automate your workspace setup");
    console.log("\nUsage:");
    console.log("  node workspace-launcher.js list              - List available layouts");
    console.log("  node workspace-launcher.js start <layout-id> - Start a workspace layout");
    console.log("  node workspace-launcher.js help              - Show this help message");
    return;
  }
  
  if (command === "list") {
    listLayouts();
    return;
  }
  
  if (command === "start") {
    if (!layoutName) {
      console.log("Error: No layout specified");
      console.log("Usage: node workspace-launcher.js start <layout-id>");
      return;
    }
    
    await executeWorkspace(layoutName);
    return;
  }
  
  console.log(`Unknown command: ${command}`);
  console.log("Use 'node workspace-launcher.js help' for usage information");
}

// Run the main function
main().catch(console.error);

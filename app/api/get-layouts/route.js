import fs from 'fs';
import path from 'path';

// Path to store workspace layouts
const LAYOUTS_PATH = path.resolve(process.env.HOME || process.env.USERPROFILE, '.screenpipe', 'workspace-layouts.json');

// Default layouts if none exist
const DEFAULT_LAYOUTS = {
  "dev": {
    "name": "Development Mode",
    "description": "Setup for development with code editor and terminal",
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

// Helper function to get layouts from file or use defaults
function getLayouts() {
  try {
    if (fs.existsSync(LAYOUTS_PATH)) {
      console.log(`Reading layouts from: ${LAYOUTS_PATH}`);
      const layoutsData = fs.readFileSync(LAYOUTS_PATH, 'utf8');
      const savedLayouts = JSON.parse(layoutsData);
      
      // Log the number of layouts found
      console.log(`Found ${Object.keys(savedLayouts).length} saved layouts`);
      
      return savedLayouts;
    }
  } catch (error) {
    console.error('Error reading layouts file:', error);
  }
  
  // Ensure directory exists
  const dir = path.dirname(LAYOUTS_PATH);
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Save default layouts
  console.log('Using default layouts and saving them to file');
  fs.writeFileSync(LAYOUTS_PATH, JSON.stringify(DEFAULT_LAYOUTS, null, 2));
  return DEFAULT_LAYOUTS;
}

export async function GET() {
  try {
    const layouts = getLayouts();
    
    // Format layouts for the UI but preserve ALL action details
    const formattedLayouts = Object.entries(layouts).map(([id, layout]) => ({
      id,
      name: layout.name,
      description: layout.description,
      actionCount: layout.actions.length,
      actions: layout.actions // Include the complete action objects
    }));
    
    console.log(`Returning ${formattedLayouts.length} layouts to the UI`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      layouts: formattedLayouts 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error in get-layouts API:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

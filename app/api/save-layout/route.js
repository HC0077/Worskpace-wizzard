import fs from 'fs';
import path from 'path';

// Path to store workspace layouts
const LAYOUTS_PATH = path.resolve(process.env.HOME || process.env.USERPROFILE, '.screenpipe', 'workspace-layouts.json');

// Helper function to get layouts from file or use defaults
function getLayouts() {
  try {
    if (fs.existsSync(LAYOUTS_PATH)) {
      const layoutsData = fs.readFileSync(LAYOUTS_PATH, 'utf8');
      return JSON.parse(layoutsData);
    }
  } catch (error) {
    console.error('Error reading layouts file:', error);
  }
  
  // Ensure directory exists
  const dir = path.dirname(LAYOUTS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return {};
}

// Helper function to save layouts to file
function saveLayouts(layouts) {
  try {
    console.log(`Saving layouts to ${LAYOUTS_PATH}`);
    console.log(`Number of layouts being saved: ${Object.keys(layouts).length}`);
    
    // Ensure directory exists
    const dir = path.dirname(LAYOUTS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the layouts to file with pretty formatting
    const layoutsJson = JSON.stringify(layouts, null, 2);
    fs.writeFileSync(LAYOUTS_PATH, layoutsJson);
    
    // Verify the file was written correctly
    if (fs.existsSync(LAYOUTS_PATH)) {
      const fileSize = fs.statSync(LAYOUTS_PATH).size;
      console.log(`Layouts file saved successfully. File size: ${fileSize} bytes`);
      return true;
    } else {
      console.error('File was not created after write operation');
      return false;
    }
  } catch (error) {
    console.error('Error saving layouts:', error);
    return false;
  }
}

export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    
    console.log(`Saving layout: ${body.id} - ${body.name}`);
    console.log(`Number of actions: ${body.actions ? body.actions.length : 0}`);
    
    // Validate required fields
    if (!body.id || !body.name || !body.description || !body.actions || !Array.isArray(body.actions)) {
      console.error('Missing required fields in layout');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Missing required fields: id, name, description, and actions array' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate each action
    for (const action of body.actions) {
      if (!action.description) {
        console.error('Action missing description');
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Each action must have a description' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Validate action types
      if (action.openApp) {
        // Valid application action
        console.log(`Valid app action: ${action.openApp}`);
      } else if (action.url) {
        // Valid URL action
        console.log(`Valid URL action: ${action.url}`);
      } else if (action.urls && Array.isArray(action.urls)) {
        // Valid multiple URLs action
        console.log(`Valid multi-URL action: ${action.urls.length} URLs`);
      } else if (action.whatsapp && action.contact && action.message) {
        // Valid WhatsApp action
        console.log(`Valid WhatsApp action: Message to ${action.contact}`);
      } else if (action.codeEditor && action.directory) {
        // Valid code editor action
        console.log(`Valid code editor action: ${action.codeEditor} with ${action.directory}`);
      } else if (action.keySequence && Array.isArray(action.keySequence)) {
        // Valid keyboard shortcut action
        console.log(`Valid key sequence action: ${action.keySequence.join('+')}`);
      } else if (action.scheduleTime) {
        // Valid schedule action
        console.log(`Valid schedule action: ${action.scheduleTime}`);
      } else if (action.generateRecommendedApps) {
        // Valid recommended apps action
        console.log(`Valid recommended apps action`);
      } else if (action.x !== undefined && action.y !== undefined) {
        // Valid mouse action or input action
        console.log(`Valid mouse/input action at (${action.x}, ${action.y})`);
      } else {
        console.error('Invalid action format detected');
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid action format' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Get existing layouts
    const layouts = getLayouts();
    
    // Add or update the layout
    layouts[body.id] = {
      name: body.name,
      description: body.description,
      actions: body.actions
    };
    
    console.log(`Layout object to save:`, JSON.stringify(layouts[body.id], null, 2));
    
    // Save the updated layouts
    if (saveLayouts(layouts)) {
      console.log(`Layout "${body.name}" saved successfully`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Layout "${body.name}" saved successfully` 
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    } else {
      console.error('Failed to save layout to file');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Error saving layout to file' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in save-layout API:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

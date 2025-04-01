import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based
const execPromise = promisify(exec);

// Helper function to move mouse using AppleScript
async function moveMouseWithAppleScript(x, y) {
  try {
    console.log(`Moving mouse to x:${x}, y:${y} using AppleScript`);
    
    // Create AppleScript to move the cursor
    const script = `
      tell application "System Events"
        set mousePosition to {${x}, ${y}}
        set the position of the mouse to mousePosition
      end tell
    `;
    
    // Execute the AppleScript
    await execPromise(`osascript -e '${script}'`);
    console.log("Mouse moved successfully using AppleScript");
    return true;
  } catch (error) {
    console.error(`Error moving mouse with AppleScript: ${error.message}`);
    return false;
  }
}

// Helper function to click at current position using AppleScript
async function clickWithAppleScript() {
  try {
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
    return true;
  } catch (error) {
    console.error(`Error clicking with AppleScript: ${error.message}`);
    return false;
  }
}

// Helper function to ensure an application is active
async function ensureAppIsActive(appName) {
  try {
    console.log(`Ensuring ${appName} is active...`);
    
    // First, try to activate the app using AppleScript
    try {
      await execPromise(`osascript -e 'tell application "${appName}" to activate'`);
      console.log(`Activated ${appName} using AppleScript`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for activation
      return true;
    } catch (err) {
      console.error(`Error activating app with AppleScript: ${err.message}`);
      
      // Fallback: try to open the app
      try {
        await execPromise(`open -a "${appName}"`);
        console.log(`Opened ${appName} as fallback`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait longer for opening
        return true;
      } catch (err2) {
        console.error(`Error opening app: ${err2.message}`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error ensuring app is active: ${error.message}`);
    return false;
  }
}

export async function GET(req) {
  try {
    // Get parameters from query
    const url = new URL(req.url);
    const x = parseInt(url.searchParams.get('x') || '0');
    const y = parseInt(url.searchParams.get('y') || '0');
    const click = url.searchParams.get('click') === 'true';
    const app = url.searchParams.get('app') || null;
    
    console.log(`Executing mouse action: x=${x}, y=${y}, click=${click}, app=${app}`);
    
    // Activate app if specified
    let appActivated = true;
    if (app) {
      appActivated = await ensureAppIsActive(app);
      if (!appActivated) {
        console.warn(`Could not activate app: ${app}`);
      }
    }
    
    // Move mouse to position
    const moveResult = await moveMouseWithAppleScript(x, y);
    
    // Click if requested
    let clickResult = false;
    if (click && moveResult) {
      // Wait a moment before clicking
      await new Promise(resolve => setTimeout(resolve, 500));
      clickResult = await clickWithAppleScript();
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      appActivated,
      moved: moveResult,
      clicked: clickResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error executing mouse action:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

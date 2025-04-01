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

export async function GET(req) {
  try {
    // Get coordinates from query parameters
    const url = new URL(req.url);
    const x = parseInt(url.searchParams.get('x') || '0');
    const y = parseInt(url.searchParams.get('y') || '0');
    const click = url.searchParams.get('click') === 'true';
    
    console.log(`Moving mouse to x:${x}, y:${y}, click:${click}`);
    
    // Move the mouse using AppleScript
    const moveResult = await moveMouseWithAppleScript(x, y);
    
    // Click if requested
    let clickResult = false;
    if (click && moveResult) {
      clickResult = await clickWithAppleScript();
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      moved: moveResult,
      clicked: clickResult
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error moving mouse:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

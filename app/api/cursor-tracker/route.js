import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Convert exec to promise-based
const execPromise = promisify(exec);

export async function GET(req) {
  try {
    console.log('Launching cursor tracker...');
    
    // Create scripts directory if it doesn't exist
    const scriptsDir = path.resolve(process.cwd(), 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }
    
    // Path to the cursor tracker app
    const trackerPath = path.resolve(scriptsDir, 'CursorTracker');
    
    // Check if the tracker exists
    if (!fs.existsSync(trackerPath)) {
      console.error('Cursor tracker app not found at:', trackerPath);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Cursor tracker app not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Launch the cursor tracker in the background
    console.log('Running cursor tracker app from:', trackerPath);
    await execPromise(`"${trackerPath}" &`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cursor tracker launched successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error launching cursor tracker:', error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

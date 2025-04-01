// Direct Screenpipe overlay implementation
const { pipe } = global;

async function createCommandButton() {
  // Create a floating button using Screenpipe's pixel manipulation
  const screenWidth = await pipe.operator.pixel.getScreenWidth();
  const screenHeight = await pipe.operator.pixel.getScreenHeight();
  
  // Position button in bottom right corner
  const x = screenWidth - 100;
  const y = screenHeight - 100;
  
  // Move mouse to create button
  await pipe.operator.pixel.moveMouse(x, y);
  
  // Set up click handler at these coordinates
  setInterval(async () => {
    const mouseX = await pipe.operator.pixel.getMouseX();
    const mouseY = await pipe.operator.pixel.getMouseY();
    
    // Check if mouse is in button area
    if (Math.abs(mouseX - x) < 30 && Math.abs(mouseY - y) < 30) {
      // Show command input dialog
      await pipe.operator.pixel.type("Enter command: ");
      const command = await pipe.operator.pixel.readInput();
      
      if (command) {
        // Send command to our API
        try {
          const response = await fetch('http://localhost:3006/api/execute-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
          });
          
          if (!response.ok) {
            throw new Error('Failed to execute command');
          }
        } catch (error) {
          console.error('Error executing command:', error);
        }
      }
    }
  }, 100);
}

// Start the command button
createCommandButton();

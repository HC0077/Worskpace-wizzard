// Desktop overlay script for persistent command button
// This script uses Screenpipe's overlay capabilities to show a persistent button

const { execSync } = require('child_process');
const path = require('path');

// Check if pipe is available (running in Screenpipe context)
if (typeof pipe === 'undefined' || !pipe.operator) {
  console.error('This script must be run within Screenpipe environment');
  process.exit(1);
}

// Create a persistent overlay button
async function createCommandOverlay() {
  try {
    // Check if Screenpipe has the overlay capabilities
    if (!pipe.overlay) {
      console.error('Screenpipe overlay API not available');
      return;
    }
    
    // Create a floating button overlay
    const button = await pipe.overlay.create({
      type: 'button',
      text: '🪄',
      position: { right: 20, bottom: 20 },
      style: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'linear-gradient(to right, #4a8eff, #8c46ff)',
        color: 'white',
        fontSize: '24px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
        border: 'none',
        cursor: 'pointer'
      },
      draggable: true
    });
    
    // Handle button click - open command input dialog
    button.onClick(async () => {
      // Show command input dialog
      const dialog = await pipe.overlay.create({
        type: 'dialog',
        title: 'Enter Command',
        content: {
          type: 'form',
          elements: [
            {
              type: 'text',
              id: 'command',
              label: 'Type or speak a command',
              placeholder: 'e.g., "take a screenshot" or "switch to dark mode"'
            },
            {
              type: 'button',
              id: 'voiceInput',
              text: '🎤 Voice Input',
              style: {
                backgroundColor: '#4a8eff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px'
              }
            }
          ]
        },
        actions: [
          {
            id: 'cancel',
            text: 'Cancel'
          },
          {
            id: 'execute',
            text: 'Execute',
            primary: true
          }
        ],
        style: {
          width: '400px',
          animation: 'fadeIn 0.3s ease-out'
        }
      });
      
      // Handle voice input button click
      dialog.onElementClick('voiceInput', async () => {
        try {
          if (pipe.audio && pipe.audio.transcribe) {
            dialog.updateElement('voiceInput', { text: '🎤 Listening...' });
            
            // Start voice transcription
            const transcript = await pipe.audio.transcribe();
            
            if (transcript) {
              // Set the transcribed text to the command input
              dialog.updateElement('command', { value: transcript });
            }
            
            dialog.updateElement('voiceInput', { text: '🎤 Voice Input' });
          } else {
            console.error('Audio transcription not available');
          }
        } catch (error) {
          console.error('Error using voice input:', error);
          dialog.updateElement('voiceInput', { text: '🎤 Voice Input' });
        }
      });
      
      // Handle dialog actions
      dialog.onAction('cancel', () => {
        dialog.close();
      });
      
      dialog.onAction('execute', async (data) => {
        const command = data.command;
        
        if (!command) {
          return;
        }
        
        // Show loading state
        dialog.update({
          content: {
            type: 'message',
            text: 'Executing command...',
            icon: 'loading'
          },
          actions: []
        });
        
        try {
          // Get screen context if available
          let screenContext = null;
          if (pipe.desktop && pipe.desktop.capture) {
            try {
              screenContext = await pipe.desktop.capture();
            } catch (error) {
              console.error('Failed to capture screen context:', error);
            }
          }
          
          // Send the command to our API endpoint
          const response = await fetch('http://localhost:3006/api/execute-command', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              command,
              screenContext
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to execute command');
          }
          
          const result = await response.json();
          
          // Update dialog with result
          dialog.update({
            content: {
              type: 'message',
              text: result.message,
              icon: result.success ? 'success' : 'error'
            },
            actions: [
              {
                id: 'close',
                text: 'Close',
                primary: true
              }
            ]
          });
          
          // Auto-close after a few seconds
          setTimeout(() => {
            dialog.close();
          }, 3000);
        } catch (error) {
          console.error('Error executing command:', error);
          
          dialog.update({
            content: {
              type: 'message',
              text: 'Failed to execute command. Please try again.',
              icon: 'error'
            },
            actions: [
              {
                id: 'close',
                text: 'Close',
                primary: true
              }
            ]
          });
        }
      });
      
      dialog.onAction('close', () => {
        dialog.close();
      });
    });
    
    console.log('Command overlay button created successfully');
    
    // Keep the script running
    process.stdin.resume();
  } catch (error) {
    console.error('Error creating command overlay:', error);
  }
}

// Start the overlay
createCommandOverlay();

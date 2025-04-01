// Command input popup with animations
import { useState, useEffect, useRef } from 'react';
import styles from './CommandInput.module.css';

export default function CommandInput({ onClose }) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commandResult, setCommandResult] = useState(null);
  const inputRef = useRef(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Execute command on Enter
      if (e.key === 'Enter' && inputText.trim() !== '') {
        handleExecuteCommand();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputText, onClose]);

  // Handle text input
  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  // Execute command with screen context
  const handleExecuteCommand = async (command = inputText) => {
    // Ensure command is a string and not empty
    const commandStr = String(command || '').trim();
    if (!commandStr) return;

    setIsLoading(true);
    try {
      // Get screen context if available
      let screenContext = null;
      if (typeof pipe !== 'undefined' && pipe?.desktop?.capture) {
        try {
          screenContext = await pipe.desktop.capture();
        } catch (error) {
          console.error('Failed to capture screen context:', error);
        }
      }

      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: commandStr,
          screenContext
        }),
      });

      const data = await response.json();
      setCommandResult(data);

      if (data.success) {
        // Auto-close on success after showing result
        setTimeout(() => {
          setInputText('');
          setCommandResult(null);
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error executing command:', error);
      setCommandResult({
        success: false,
        message: 'Failed to execute command. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle voice input with auto-execution
  const toggleVoiceInput = async () => {
    if (!isListening) {
      try {
        setIsListening(true);
        // Try to use Screenpipe's audio transcription
        if (typeof pipe !== 'undefined' && pipe?.audio?.transcribe) {
          console.log('Starting voice transcription...');
          const transcript = await pipe.audio.transcribe();
          if (transcript) {
            // Auto-execute voice command
            setInputText(transcript);
            handleExecuteCommand(transcript);
          }
        } else {
          // Fallback to browser's SpeechRecognition if available
          if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false;
            
            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              setInputText(transcript);
              // Auto-execute command when using browser's SpeechRecognition
              handleExecuteCommand(transcript);
            };
            
            recognition.onend = () => {
              setIsListening(false);
            };
            
            recognition.start();
          } else {
            console.error('Speech recognition not supported');
            setIsListening(false);
          }
        }
      } catch (error) {
        console.error('Error starting voice input:', error);
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  };

  // Handle command result display
  const displayCommandResult = async () => {
    const commandStr = String(inputText || '').trim();
    if (!commandStr) return;
    
    setIsLoading(true);
    
    try {
      // Get screen context if available
      let screenContext = null;
      if (typeof pipe !== 'undefined' && pipe?.desktop?.capture) {
        try {
          screenContext = await pipe.desktop.capture();
        } catch (error) {
          console.error('Failed to capture screen context:', error);
        }
      }
      
      // Send the command to our API
      const response = await fetch('/api/execute-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: inputText,
          screenContext: screenContext,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute command');
      }
      
      const result = await response.json();
      setCommandResult(result);
      
      // Auto-close after successful execution
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error executing command:', error);
      setCommandResult({
        success: false,
        message: 'Failed to execute command. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Enter Command
          </h2>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleTextChange}
              placeholder="Type or speak a command..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              disabled={isLoading}
            />
            
            <button
              onClick={toggleVoiceInput}
              className={`p-2 rounded-full ${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white transition-all`}
              disabled={isLoading}
            >
              {isListening ? '🛑' : '🎤'}
            </button>
          </div>
          
          {commandResult && (
            <div className={`p-3 rounded-md mt-2 ${commandResult.success ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'}`}>
              {commandResult.message}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button
              onClick={handleExecuteCommand}
              className="px-4 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={inputText.trim() === '' || isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : 'Execute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

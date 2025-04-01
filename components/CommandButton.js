// Floating command button component
import { useState, useEffect } from 'react';
import CommandInput from './CommandInput';

export default function CommandButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ right: 20, bottom: 20 });

  // Toggle the command input popup
  const toggleCommandInput = () => {
    setIsOpen(!isOpen);
  };

  // Handle dragging to reposition the button
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.right,
      y: e.clientY - position.bottom
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate new position (from right and bottom)
      const newRight = Math.max(20, viewportWidth - e.clientX + dragOffset.x);
      const newBottom = Math.max(20, viewportHeight - e.clientY + dragOffset.y);
      
      setPosition({
        right: newRight,
        bottom: newBottom
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      <button
        className={`fixed z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          right: `${position.right}px`, 
          bottom: `${position.bottom}px`,
          fontSize: '1.8rem' 
        }}
        onClick={toggleCommandInput}
        onMouseDown={handleMouseDown}
        aria-label="Open command input"
      >
        🪄
      </button>
      
      {isOpen && (
        <CommandInput onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

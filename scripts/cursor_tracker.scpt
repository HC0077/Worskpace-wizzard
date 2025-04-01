-- macOS Cursor Coordinates Tracker
-- This script will show the X and Y coordinates of your cursor anywhere on your screen

use framework "Foundation"
use framework "AppKit"
use scripting additions

-- Create a simple window to display coordinates
tell application "System Events"
    -- Calculate screen dimensions
    tell process "Finder"
        set screenWidth to word 3 of (get size of window of desktop)
        set screenHeight to word 4 of (get size of window of desktop)
    end tell
end tell

-- Create and configure a window to display coordinates
set coordWindow to (current application's NSWindow's alloc()'s initWithContentRect:(current application's NSMakeRect(screenWidth - 200, screenHeight - 60, 180, 50)) styleMask:(current application's NSWindowStyleMaskTitled) backing:(current application's NSBackingStoreBuffered) defer:false)
coordWindow's setTitle:"Cursor Position"
coordWindow's setLevel:(current application's NSFloatingWindowLevel)
coordWindow's setOpaque:false
coordWindow's setBackgroundColor:(current application's NSColor's colorWithCalibratedRed:0.0 green:0.0 blue:0.0 alpha:0.7)

-- Create a text field to display the coordinates
set coordText to (current application's NSTextField's alloc()'s initWithFrame:(current application's NSMakeRect(10, 10, 160, 30)))
coordText's setEditable:false
coordText's setBezeled:false
coordText's setDrawsBackground:false
coordText's setTextColor:(current application's NSColor's whiteColor())
coordText's setFont:(current application's NSFont's fontWithName:"Menlo" size:14)
coordText's setStringValue:"X: 0, Y: 0"

-- Add the text field to the window
((coordWindow's contentView()) as reference)'s addSubview:coordText

-- Show the window
coordWindow's makeKeyAndOrderFront:(missing value)

-- Update coordinates continuously
on idle
    -- Get current mouse position
    set mousePosition to (current application's NSEvent's mouseLocation())
    set xPos to item 1 of (mousePosition as list)
    set yPos to item 2 of (mousePosition as list)
    
    -- Format with two decimal places
    set xFormatted to my formatNumber(xPos)
    set yFormatted to my formatNumber(yPos)
    
    -- Update the text field
    coordText's setStringValue:("X: " & xFormatted & ", Y: " & yFormatted)
    
    return 0.05 -- Update every 0.05 seconds
end idle

-- Helper function to format numbers with two decimal places
on formatNumber(num)
    set formatter to (current application's NSNumberFormatter's alloc()'s init())
    formatter's setNumberStyle:(current application's NSNumberFormatterDecimalStyle)
    formatter's setMaximumFractionDigits:2
    set formattedNumber to (formatter's stringFromNumber:(current application's NSNumber's numberWithDouble:num))
    return formattedNumber
end formatNumber

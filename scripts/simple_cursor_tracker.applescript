-- Simple Cursor Coordinates Tracker
-- Shows the current mouse position in a floating window

tell application "System Events"
    -- Get screen dimensions
    set screenSize to get size of window of desktop
end tell

-- Create a simple AppleScript application
tell application "Script Editor"
    set newDoc to make new document
    set text of newDoc to "
    on run
        -- Create a loop to continuously update coordinates
        repeat
            -- Get cursor position
            tell application \"System Events\"
                set mousePos to current location of mouse
                set xPos to item 1 of mousePos
                set yPos to item 2 of mousePos
            end tell
            
            -- Display in a small dialog
            set dialogText to \"X: \" & xPos & \", Y: \" & yPos
            
            -- Display notification instead of dialog to be less intrusive
            display notification dialogText with title \"Cursor Position\"
            
            -- Wait a short time
            delay 0.5
        end repeat
    end run
    "
    
    -- Save and run the script
    save newDoc in (path to desktop as text) & "CursorTracker.scpt"
    run newDoc
end tell

-- Display initial message
display dialog "Cursor tracker started. Check notifications for coordinates." buttons {"OK"} default button "OK"

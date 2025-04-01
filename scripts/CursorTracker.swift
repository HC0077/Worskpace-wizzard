import Cocoa

class CursorTrackerWindow: NSWindow {
    let coordsLabel = NSTextField()
    
    init() {
        // Get screen dimensions
        let screenRect = NSScreen.main?.frame ?? NSRect(x: 0, y: 0, width: 800, height: 600)
        
        // Create window in top-right corner
        super.init(
            contentRect: NSRect(x: screenRect.width - 200, y: screenRect.height - 80, width: 180, height: 40),
            styleMask: [.titled, .closable],
            backing: .buffered,
            defer: false
        )
        
        // Configure window
        self.title = "Cursor Position"
        self.isReleasedWhenClosed = false
        self.level = .floating // Stay on top of other windows
        self.isMovable = true
        self.isMovableByWindowBackground = true
        self.backgroundColor = NSColor.black.withAlphaComponent(0.7)
        
        // Configure label
        coordsLabel.stringValue = "X: 0, Y: 0"
        coordsLabel.isEditable = false
        coordsLabel.isBezeled = false
        coordsLabel.drawsBackground = false
        coordsLabel.textColor = .white
        coordsLabel.font = NSFont(name: "Menlo", size: 14)
        coordsLabel.alignment = .center
        coordsLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Add label to window
        contentView?.addSubview(coordsLabel)
        
        // Center label in window
        if let contentView = contentView {
            NSLayoutConstraint.activate([
                coordsLabel.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
                coordsLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
                coordsLabel.widthAnchor.constraint(equalTo: contentView.widthAnchor, constant: -20),
                coordsLabel.heightAnchor.constraint(equalToConstant: 30)
            ])
        }
        
        // Start timer to update coordinates
        Timer.scheduledTimer(timeInterval: 0.05, target: self, selector: #selector(updateCoordinates), userInfo: nil, repeats: true)
    }
    
    @objc func updateCoordinates() {
        let mouseLocation = NSEvent.mouseLocation
        coordsLabel.stringValue = String(format: "X: %.0f, Y: %.0f", mouseLocation.x, mouseLocation.y)
    }
}

// Main application class
class CursorTrackerApp: NSObject, NSApplicationDelegate {
    let window = CursorTrackerWindow()
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        window.makeKeyAndOrderFront(nil)
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Create and run the application
let app = NSApplication.shared
let delegate = CursorTrackerApp()
app.delegate = delegate
app.run()

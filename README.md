# WorkFlow Wizard: Your AI-Powered Workspace Conductor

An intelligent workspace automation system that orchestrates your desktop environment through voice and text commands, turning complex workspace setups into seamless symphonies.

## Description

WorkFlow Wizard revolutionizes workspace management by seamlessly automating desktop environments through intuitive voice and text commands. It empowers users to instantly switch between customized workspace layouts, whether for development sessions, virtual meetings, or research work. The system leverages advanced mouse and keyboard automation to precisely position windows, launch applications, and execute complex command sequences. With intelligent Chrome profile handling, multi-display support, and state preservation capabilities, it ensures your workspace is always perfectly arranged. The built-in voice command system allows hands-free operation, while the visual feedback system provides real-time confirmation of actions. Users can create, save, and modify custom layouts, record action sequences, and develop personalized macros for repetitive tasks.

## Features

- **Workspace Orchestration**
  - Predefined workspace layouts (Development, Meeting, Research)
  - Custom layout creation and saving
  - Automated application launching and positioning
  - Multi-display support
  - State preservation and restoration

- **Smart Automation**
  - Precise mouse control and positioning
  - Keyboard operation automation
  - Application state management
  - Chrome profile handling
  - Voice command integration
  - Real-time action testing
  - Visual feedback system

## Technology Stack

### Core Stack
- Next.js (Backend and Frontend)
- Screenpipe Operator API (v0.1.40)
- AppleScript (System Integration)
- macOS System Events

### Frontend
- React
- TailwindCSS
- JSON for layout configurations

### System Integration
- macOS Accessibility Features
- Chrome Profile Management
- RESTful APIs

### Development
- Node.js
- JavaScript/TypeScript
- JSON Schema for configuration

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Requirements

- macOS (System Events support)
- Node.js 16+
- Chrome Browser (for profile management features)
- Screenpipe Runtime Environment

## License

MIT License - See LICENSE file for details

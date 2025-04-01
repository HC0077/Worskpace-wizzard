"use client";

import { useState, useEffect } from 'react';
import { FaDesktop, FaEdit, FaPlus, FaTrash, FaPlay, FaCog, FaWindowRestore } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// Import CommandButton with dynamic loading and no SSR
const CommandButton = dynamic(() => import('../components/CommandButton'), {
  ssr: false,
  loading: () => null
});

export default function WorkspaceOrchestrator() {
  // Add state to control command button visibility
  const [showCommandButton, setShowCommandButton] = useState(true);
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newLayout, setNewLayout] = useState({
    id: '',
    name: '',
    description: '',
    actions: []
  });
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executingLayoutId, setExecutingLayoutId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [newAction, setNewAction] = useState({
    description: '',
    type: 'application',
    openApp: '',
    method: 'terminal',
    x: 400,
    y: 300,
    click: false,
    showCoordinates: true,
    inputText: '',
    url: '',
    keySequence: [],
    chromeProfile: ''
  });
  const [editingActionIndex, setEditingActionIndex] = useState(null);

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      console.log('Fetching layouts from API...');
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/get-layouts?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Layouts loaded successfully:', data.layouts);
        setLayouts(data.layouts);
      } else {
        console.error('Failed to load layouts:', data.message);
        showNotification('Failed to load workspace layouts', 'error');
      }
    } catch (error) {
      console.error('Error fetching layouts:', error);
      showNotification('Error loading workspace layouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startWorkspace = async (layoutId) => {
    try {
      if (!layoutId) {
        showNotification('No workspace layout specified', 'error');
        return;
      }
      
      setExecuting(true);
      setExecutingLayoutId(layoutId);
      showNotification(`Starting workspace: ${layoutId}...`, 'info');
      
      console.log(`Starting workspace layout: ${layoutId}`);
      
      // Make sure we're only executing the selected layout
      // Use a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/start-workspace?layout=${encodeURIComponent(layoutId)}&_t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        showNotification('Workspace started successfully!', 'success');
      } else {
        showNotification(`Failed to start workspace: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error starting workspace:', error);
      showNotification(`Error starting workspace: ${error.message}`, 'error');
    } finally {
      setExecuting(false);
      setExecutingLayoutId(null);
    }
  };

  const saveLayout = async () => {
    try {
      if (!newLayout.id || !newLayout.name || !newLayout.description) {
        showNotification('Layout ID, name, and description are required', 'error');
        return;
      }

      if (newLayout.actions.length === 0) {
        showNotification('At least one action is required', 'error');
        return;
      }

      const response = await fetch('/api/save-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLayout),
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('Layout saved successfully!', 'success');
        setIsEditing(false);
        fetchLayouts();
      } else {
        showNotification(`Failed to save layout: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      showNotification('Error saving layout', 'error');
    }
  };

  const addAction = () => {
    if (!newAction.description) {
      showNotification('Action description is required', 'error');
      return;
    }

    let actionToAdd = {
      description: newAction.description
    };

    if (newAction.type === 'application') {
      if (!newAction.openApp) {
        showNotification('Application name is required', 'error');
        return;
      }
      actionToAdd.openApp = newAction.openApp;
      actionToAdd.method = newAction.method;
      
      // Add Chrome profile if specified and it's Chrome
      if (newAction.openApp.toLowerCase().includes('chrome') && newAction.chromeProfile) {
        actionToAdd.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'mouse') {
      actionToAdd.x = parseInt(newAction.x) || 400;
      actionToAdd.y = parseInt(newAction.y) || 300;
      actionToAdd.click = newAction.click;
      actionToAdd.showCoordinates = true;
    } else if (newAction.type === 'input') {
      actionToAdd.x = parseInt(newAction.x) || 400;
      actionToAdd.y = parseInt(newAction.y) || 300;
      actionToAdd.click = true;
      actionToAdd.type = newAction.inputText;
      actionToAdd.showCoordinates = newAction.showCoordinates;
    } else if (newAction.type === 'url') {
      if (!newAction.url) {
        showNotification('URL is required', 'error');
        return;
      }
      actionToAdd.url = newAction.url;
    } else if (newAction.type === 'multiurl') {
      if (!newAction.url) {
        showNotification('URLs are required', 'error');
        return;
      }
      actionToAdd.browser = "Google Chrome";
      actionToAdd.urls = newAction.url.split(',').map(url => url.trim());
      
      // Add Chrome profile if specified
      if (newAction.chromeProfile) {
        actionToAdd.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'whatsapp') {
      if (!newAction.url) {
        showNotification('Contact name is required', 'error');
        return;
      }
      if (!newAction.inputText) {
        showNotification('Message text is required', 'error');
        return;
      }
      actionToAdd.whatsapp = true;
      actionToAdd.contact = newAction.url;
      actionToAdd.message = newAction.inputText;
    } else if (newAction.type === 'codedir') {
      if (!newAction.url) {
        showNotification('Directory path is required', 'error');
        return;
      }
      if (!newAction.openApp) {
        showNotification('Code editor name is required', 'error');
        return;
      }
      actionToAdd.codeEditor = newAction.openApp;
      actionToAdd.directory = newAction.url;
    } else if (newAction.type === 'shortcut') {
      if (!newAction.keySequence || newAction.keySequence.length === 0) {
        showNotification('At least one key is required for a shortcut', 'error');
        return;
      }
      actionToAdd.keySequence = newAction.keySequence;
      
      // Add Chrome profile if this is a Chrome shortcut
      if (newAction.chromeProfile) {
        actionToAdd.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'schedule') {
      if (!newAction.url) {
        showNotification('Schedule time is required', 'error');
        return;
      }
      actionToAdd.scheduleTime = newAction.url;
      actionToAdd.frequency = newAction.inputText;
    }

    setNewLayout({
      ...newLayout,
      actions: [...newLayout.actions, actionToAdd]
    });

    // Reset new action form
    setNewAction({
      description: '',
      type: 'application',
      openApp: '',
      method: 'terminal',
      x: 400,
      y: 300,
      click: false,
      showCoordinates: true,
      inputText: '',
      url: '',
      keySequence: [],
      chromeProfile: ''
    });
  };

  const removeAction = (index) => {
    const updatedActions = [...newLayout.actions];
    updatedActions.splice(index, 1);
    setNewLayout({
      ...newLayout,
      actions: updatedActions
    });
  };

  const editLayout = (layout) => {
    console.log('Editing layout:', layout);
    
    // Make a deep copy of the layout to avoid reference issues
    const layoutCopy = {
      id: layout.id,
      name: layout.name,
      description: layout.description,
      actions: JSON.parse(JSON.stringify(layout.actions)) // Deep copy of actions
    };
    
    console.log('Layout copy for editing:', layoutCopy);
    
    setNewLayout(layoutCopy);
    setIsEditing(true);
  };

  const createNewLayout = () => {
    setNewLayout({
      id: '',
      name: '',
      description: '',
      actions: []
    });
    setIsEditing(true);
  };

  const editAction = (index) => {
    const actionToEdit = newLayout.actions[index];
    
    const editForm = {
      description: actionToEdit.description,
      type: 'application',
      openApp: '',
      method: 'terminal',
      x: 400,
      y: 300,
      click: false,
      showCoordinates: true,
      inputText: '',
      url: '',
      keySequence: [],
      chromeProfile: actionToEdit.chromeProfile || ''
    };
    
    // Set the appropriate type and values based on the action
    if (actionToEdit.openApp) {
      editForm.type = 'application';
      editForm.openApp = actionToEdit.openApp;
      editForm.method = actionToEdit.method || 'terminal';
      // Copy Chrome profile if it exists
      if (actionToEdit.chromeProfile) {
        editForm.chromeProfile = actionToEdit.chromeProfile;
      }
    } else if (actionToEdit.url) {
      editForm.type = 'url';
      editForm.url = actionToEdit.url;
      // Copy Chrome profile if it exists
      if (actionToEdit.chromeProfile) {
        editForm.chromeProfile = actionToEdit.chromeProfile;
      }
    } else if (actionToEdit.urls) {
      editForm.type = 'multiurl';
      editForm.url = actionToEdit.urls.join(', ');
      // Copy Chrome profile if it exists
      if (actionToEdit.chromeProfile) {
        editForm.chromeProfile = actionToEdit.chromeProfile;
      }
    } else if (actionToEdit.whatsapp) {
      editForm.type = 'whatsapp';
      editForm.url = actionToEdit.contact;
      editForm.inputText = actionToEdit.message;
    } else if (actionToEdit.codeEditor) {
      editForm.type = 'codedir';
      editForm.openApp = actionToEdit.codeEditor;
      editForm.url = actionToEdit.directory;
    } else if (actionToEdit.keySequence) {
      editForm.type = 'shortcut';
      editForm.keySequence = [...actionToEdit.keySequence];
      // Copy Chrome profile if it exists
      if (actionToEdit.chromeProfile) {
        editForm.chromeProfile = actionToEdit.chromeProfile;
      }
    } else if (actionToEdit.x !== undefined && actionToEdit.y !== undefined) {
      if (actionToEdit.type) {
        editForm.type = 'input';
        editForm.x = actionToEdit.x;
        editForm.y = actionToEdit.y;
        editForm.inputText = actionToEdit.type;
      } else {
        editForm.type = 'mouse';
        editForm.x = actionToEdit.x;
        editForm.y = actionToEdit.y;
        editForm.click = actionToEdit.click;
        editForm.showCoordinates = actionToEdit.showCoordinates !== false;
      }
    } else if (actionToEdit.scheduleTime) {
      editForm.type = 'schedule';
      editForm.url = actionToEdit.scheduleTime;
      editForm.inputText = actionToEdit.frequency;
    }
    
    setNewAction(editForm);
    setEditingActionIndex(index);
  };

  const updateAction = () => {
    if (editingActionIndex === null) {
      addAction();
      return;
    }
    
    if (!newAction.description) {
      showNotification('Action description is required', 'error');
      return;
    }

    let updatedAction = {
      description: newAction.description
    };

    if (newAction.type === 'application') {
      if (!newAction.openApp) {
        showNotification('Application name is required', 'error');
        return;
      }
      updatedAction.openApp = newAction.openApp;
      updatedAction.method = newAction.method;
      
      // Add Chrome profile if specified and it's Chrome
      if (newAction.openApp.toLowerCase().includes('chrome') && newAction.chromeProfile) {
        updatedAction.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'mouse') {
      updatedAction.x = parseInt(newAction.x) || 400;
      updatedAction.y = parseInt(newAction.y) || 300;
      updatedAction.click = newAction.click;
      updatedAction.showCoordinates = true;
    } else if (newAction.type === 'input') {
      updatedAction.x = parseInt(newAction.x) || 400;
      updatedAction.y = parseInt(newAction.y) || 300;
      updatedAction.click = true;
      updatedAction.type = newAction.inputText;
      updatedAction.showCoordinates = newAction.showCoordinates;
    } else if (newAction.type === 'url') {
      if (!newAction.url) {
        showNotification('URL is required', 'error');
        return;
      }
      updatedAction.url = newAction.url;
      
      // Add Chrome profile if specified
      if (newAction.chromeProfile) {
        updatedAction.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'multiurl') {
      if (!newAction.url) {
        showNotification('URLs are required', 'error');
        return;
      }
      updatedAction.browser = "Google Chrome";
      updatedAction.urls = newAction.url.split(',').map(url => url.trim());
      
      // Add Chrome profile if specified
      if (newAction.chromeProfile) {
        updatedAction.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'whatsapp') {
      if (!newAction.url) {
        showNotification('Contact name is required', 'error');
        return;
      }
      if (!newAction.inputText) {
        showNotification('Message text is required', 'error');
        return;
      }
      updatedAction.whatsapp = true;
      updatedAction.contact = newAction.url;
      updatedAction.message = newAction.inputText;
    } else if (newAction.type === 'codedir') {
      if (!newAction.url) {
        showNotification('Directory path is required', 'error');
        return;
      }
      if (!newAction.openApp) {
        showNotification('Code editor name is required', 'error');
        return;
      }
      updatedAction.codeEditor = newAction.openApp;
      updatedAction.directory = newAction.url;
    } else if (newAction.type === 'shortcut') {
      if (!newAction.keySequence || newAction.keySequence.length === 0) {
        showNotification('At least one key is required for a shortcut', 'error');
        return;
      }
      updatedAction.keySequence = newAction.keySequence;
      
      // Add Chrome profile if specified
      if (newAction.chromeProfile) {
        updatedAction.chromeProfile = newAction.chromeProfile;
      }
    } else if (newAction.type === 'schedule') {
      if (!newAction.url) {
        showNotification('Schedule time is required', 'error');
        return;
      }
      updatedAction.scheduleTime = newAction.url;
      updatedAction.frequency = newAction.inputText;
    }

    const updatedActions = [...newLayout.actions];
    updatedActions[editingActionIndex] = updatedAction;

    setNewLayout({
      ...newLayout,
      actions: updatedActions
    });

    // Reset form and editing state
    setNewAction({
      description: '',
      type: 'application',
      openApp: '',
      method: 'terminal',
      x: 400,
      y: 300,
      click: false,
      showCoordinates: true,
      inputText: '',
      url: '',
      keySequence: [],
      chromeProfile: ''
    });
    
    setEditingActionIndex(null);
    showNotification('Action updated successfully', 'success');
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  const renderActionDetails = (action) => {
    if (action.openApp) {
      return `Open ${action.openApp}`;
    } else if (action.url) {
      return `Open URL: ${action.url}`;
    } else if (action.urls) {
      return `Open URLs: ${action.urls.join(', ')}`;
    } else if (action.whatsapp) {
      return `WhatsApp message to ${action.contact}`;
    } else if (action.codeEditor) {
      return `Open ${action.directory} in ${action.codeEditor}`;
    } else if (action.keySequence) {
      return `Press keys: ${action.keySequence.join(' + ')}`;
    } else if (action.x !== undefined && action.y !== undefined) {
      if (action.type) {
        return `Type at (${action.x}, ${action.y}): ${action.type}`;
      } else {
        return `Mouse ${action.click ? 'click' : 'move'} at (${action.x}, ${action.y})`;
      }
    } else if (action.scheduleTime) {
      return `Schedule at ${action.scheduleTime} (${action.frequency || 'daily'})`;
    } else if (action.generateRecommendedApps) {
      return 'Add recommended applications';
    }
    return '';
  };

  return (
    <>
      {/* Floating Command Button */}
      {showCommandButton && <CommandButton />}
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FaWindowRestore className="text-2xl mr-3" />
              <h1 className="text-2xl font-bold">Workspace Orchestrator</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => startWorkspace('recommended')}
                className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center font-medium hover:bg-green-600 transition"
                disabled={executing && executingLayoutId !== 'recommended'}
              >
                {executing && executingLayoutId === 'recommended' ? (
                  <span className="animate-pulse">Running...</span>
                ) : (
                  <>
                    <FaPlay className="mr-2" /> Quick Start
                  </>
                )}
              </button>
              <button
                onClick={createNewLayout}
                className="bg-white text-blue-600 px-4 py-2 rounded-md flex items-center font-medium hover:bg-blue-50 transition"
                disabled={isEditing}
              >
                <FaPlus className="mr-2" /> New Layout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 
          'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* New Features Banner */}
      {!isEditing && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4">
          <div className="container mx-auto px-4">
            <h2 className="text-xl font-bold mb-2">New Intelligent Features Available!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <h3 className="font-semibold">Smart App Recommendations</h3>
                <p className="text-sm">Automatically opens your most used applications</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <h3 className="font-semibold">Multiple URL Support</h3>
                <p className="text-sm">Open several websites at once in Chrome</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <h3 className="font-semibold">WhatsApp Integration</h3>
                <p className="text-sm">Send messages to contacts automatically</p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <button 
                onClick={createNewLayout}
                className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition"
              >
                Try New Features Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{newLayout.id ? 'Edit Layout' : 'Create New Layout'}</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout ID</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., dev, research, meeting"
                  value={newLayout.id}
                  onChange={(e) => setNewLayout({...newLayout, id: e.target.value})}
                  disabled={!!newLayout.id} // Disable editing ID for existing layouts
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Development Mode"
                  value={newLayout.name}
                  onChange={(e) => setNewLayout({...newLayout, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Setup for development with code editor and terminal"
                  value={newLayout.description}
                  onChange={(e) => setNewLayout({...newLayout, description: e.target.value})}
                />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-3">Actions</h3>
            
            {newLayout.actions.length > 0 ? (
              <div className="mb-6 space-y-3">
                {newLayout.actions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                      <p className="font-medium">{action.description}</p>
                      <p className="text-sm text-gray-600">{renderActionDetails(action)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editAction(index)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => removeAction(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-6">No actions added yet. Add some actions below.</p>
            )}
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h4 className="font-medium mb-3">Add New Action</h4>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Open Chrome"
                    value={newAction.description}
                    onChange={(e) => setNewAction({...newAction, description: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={newAction.type}
                    onChange={(e) => setNewAction({...newAction, type: e.target.value})}
                  >
                    <option value="application">Open Application</option>
                    <option value="mouse">Mouse Action</option>
                    <option value="input">Type Text</option>
                    <option value="url">Open URL</option>
                    <option value="multiurl">Open Multiple URLs</option>
                    <option value="whatsapp">Send WhatsApp Message</option>
                    <option value="codedir">Open Directory in Code Editor</option>
                    <option value="shortcut">Keyboard Shortcut</option>
                    <option value="schedule">Schedule Action</option>
                  </select>
                </div>
                
                {newAction.type === 'application' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Google Chrome"
                        value={newAction.openApp}
                        onChange={(e) => setNewAction({...newAction, openApp: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Launch Method</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newAction.method}
                        onChange={(e) => setNewAction({...newAction, method: e.target.value})}
                      >
                        <option value="terminal">Terminal Command (Recommended)</option>
                        <option value="spotlight">Spotlight</option>
                      </select>
                    </div>
                    {(newAction.type === 'application' && newAction.openApp.toLowerCase().includes('chrome')) && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chrome Profile (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., Profile 1, Default"
                          value={newAction.chromeProfile}
                          onChange={(e) => setNewAction({...newAction, chromeProfile: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the profile name to avoid the profile selection prompt
                        </p>
                      </div>
                    )}
                  </>
                )}
                
                {(newAction.type === 'mouse' || newAction.type === 'input') && (
                  <>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">X Coordinate</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={newAction.x}
                          onChange={(e) => setNewAction({...newAction, x: e.target.value})}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Y Coordinate</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={newAction.y}
                          onChange={(e) => setNewAction({...newAction, y: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded-md mt-3 text-center">
                      <p className="text-sm font-medium">Current Position: ({newAction.x}, {newAction.y})</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates will be displayed when the mouse moves to this position
                      </p>
                      <div className="mt-2 flex justify-center space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch('/api/cursor-tracker');
                              if (!response.ok) {
                                throw new Error('Failed to launch cursor tracker');
                              }
                              showNotification('Cursor tracker launched!', 'success');
                            } catch (error) {
                              console.error('Error launching cursor tracker:', error);
                              showNotification('Failed to launch cursor tracker', 'error');
                            }
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition"
                        >
                          Launch Cursor Tracker
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              if (!newAction.x || !newAction.y) {
                                showNotification('Please enter X and Y coordinates first', 'error');
                                return;
                              }
                              
                              // Build the URL with all parameters
                              let url = `/api/execute-mouse-action?x=${newAction.x}&y=${newAction.y}`;
                              
                              // Add click parameter if this is a click action
                              if (newAction.type === 'mouseClick') {
                                url += '&click=true';
                              }
                              
                              // Add app parameter if specified
                              if (newAction.app) {
                                url += `&app=${encodeURIComponent(newAction.app)}`;
                              }
                              
                              const response = await fetch(url);
                              if (!response.ok) {
                                throw new Error('Failed to execute mouse action');
                              }
                              
                              const result = await response.json();
                              if (result.success) {
                                let message = 'Cursor moved to specified coordinates';
                                if (result.clicked) {
                                  message += ' and clicked';
                                }
                                if (newAction.app && result.appActivated) {
                                  message += ` in ${newAction.app}`;
                                }
                                showNotification(message, 'success');
                              } else {
                                showNotification(result.error || 'Failed to execute mouse action', 'error');
                              }
                            } catch (error) {
                              console.error('Error executing mouse action:', error);
                              showNotification('Failed to execute mouse action', 'error');
                            }
                          }}
                          className="bg-green-500 text-white px-3 py-1 rounded-md text-sm hover:bg-green-600 transition"
                        >
                          Test Action
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="click-checkbox"
                          className="mr-2"
                          checked={newAction.click}
                          onChange={(e) => setNewAction({...newAction, click: e.target.checked})}
                        />
                        <label htmlFor="click-checkbox" className="text-sm font-medium text-gray-700">Click at this position</label>
                      </div>
                    </div>
                  </>
                )}

                {newAction.type === 'input' && (
                  <>
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">X Coordinate</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={newAction.x}
                          onChange={(e) => setNewAction({...newAction, x: e.target.value})}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Y Coordinate</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={newAction.y}
                          onChange={(e) => setNewAction({...newAction, y: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded-md mt-3 text-center">
                      <p className="text-sm font-medium">Current Position: ({newAction.x}, {newAction.y})</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates will be displayed when the mouse moves to this position
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text to Type</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter text to be typed at the specified coordinates"
                        rows="3"
                        value={newAction.inputText}
                        onChange={(e) => setNewAction({...newAction, inputText: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The cursor will move to the specified coordinates, click, and type this text
                      </p>
                    </div>
                  </>
                )}

                {newAction.type === 'url' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., https://github.com"
                      value={newAction.url}
                      onChange={(e) => setNewAction({...newAction, url: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Will automatically navigate to this URL in the current browser window
                    </p>
                  </div>
                )}

                {newAction.type === 'multiurl' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URLs</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., https://github.com, https://google.com"
                      value={newAction.url}
                      onChange={(e) => setNewAction({...newAction, url: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Will automatically navigate to these URLs in the current browser window
                    </p>
                  </div>
                )}

                {newAction.type === 'whatsapp' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact or Group Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., John Smith or Family Group"
                      value={newAction.url}
                      onChange={(e) => setNewAction({...newAction, url: e.target.value})}
                    />
                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Message</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Type your message here..."
                      rows="3"
                      value={newAction.inputText}
                      onChange={(e) => setNewAction({...newAction, inputText: e.target.value})}
                    />
                    <div className="mt-3 bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>How it works:</strong> This action will automatically:
                      </p>
                      <ol className="text-xs text-blue-700 mt-1 list-decimal pl-4">
                        <li>Open WhatsApp</li>
                        <li>Search for the contact/group by name</li>
                        <li>Select the first matching contact</li>
                        <li>Type and send your message</li>
                      </ol>
                      <p className="text-xs text-blue-700 mt-2">
                        Make sure WhatsApp is installed and you're logged in.
                      </p>
                    </div>
                  </div>
                )}

                {newAction.type === 'codedir' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Directory Path</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., /Users/username/Documents/project"
                      value={newAction.url}
                      onChange={(e) => setNewAction({...newAction, url: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Will open this directory in the specified code editor
                    </p>
                  </div>
                )}

                {newAction.type === 'shortcut' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keyboard Shortcut</label>
                    <div className="flex space-x-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setNewAction({
                          ...newAction, 
                          keySequence: [...(newAction.keySequence || []), 'Meta']
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        ⌘ Command
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAction({
                          ...newAction, 
                          keySequence: [...(newAction.keySequence || []), 'Alt']
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        ⌥ Option
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAction({
                          ...newAction, 
                          keySequence: [...(newAction.keySequence || []), 'Control']
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        ⌃ Control
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewAction({
                          ...newAction, 
                          keySequence: [...(newAction.keySequence || []), 'Shift']
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        ⇧ Shift
                      </button>
                    </div>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Letter or number key (e.g., t, 1)"
                        maxLength={1}
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewAction({
                              ...newAction, 
                              keySequence: [...(newAction.keySequence || []), e.target.value.toLowerCase()]
                            });
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setNewAction({
                          ...newAction, 
                          keySequence: []
                        })}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-md"
                      >
                        Clear
                      </button>
                    </div>
                    {newAction.keySequence && newAction.keySequence.length > 0 && (
                      <div className="bg-gray-100 p-2 rounded-md">
                        <p className="text-sm font-medium">Current shortcut:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {newAction.keySequence.map((key, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white border border-gray-300 rounded text-sm">
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Chrome Profile field for shortcuts */}
                    {newAction.keySequence && 
                     newAction.keySequence.includes('Meta') && 
                     (newAction.keySequence.includes('t') || newAction.keySequence.includes('T')) && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chrome Profile (Optional)</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="e.g., Profile 1, Default"
                          value={newAction.chromeProfile}
                          onChange={(e) => setNewAction({...newAction, chromeProfile: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the profile name to avoid the profile selection prompt
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {newAction.type === 'schedule' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Time</label>
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        value={newAction.url}
                        onChange={(e) => setNewAction({...newAction, url: e.target.value})}
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        value={newAction.inputText || "daily"}
                        onChange={(e) => setNewAction({...newAction, inputText: e.target.value})}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekends">Weekends</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This layout will be automatically executed at the specified time
                    </p>
                    <div className="mt-3 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> For scheduling to work, the Workspace Orchestrator must be running.
                        Consider adding it to your startup applications.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={updateAction}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                {editingActionIndex !== null ? 'Update Action' : 'Add Action'}
              </button>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveLayout}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
              >
                Save Layout
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Available Workspaces</h2>
            
            {layouts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaDesktop className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No workspace layouts found</p>
                <button
                  onClick={createNewLayout}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Create Your First Layout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {layouts.map((layout) => (
                  <div key={layout.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-blue-500 text-white px-4 py-3">
                      <h3 className="font-semibold text-lg">{layout.name}</h3>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-600 mb-4">{layout.description}</p>
                      <p className="text-sm text-gray-500 mb-4">{layout.actionCount} actions</p>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={() => editLayout(layout)}
                          className="text-blue-500 hover:text-blue-700 flex items-center"
                          disabled={executing && executingLayoutId === layout.id}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => startWorkspace(layout.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded flex items-center hover:bg-green-600 transition"
                          disabled={executing && executingLayoutId !== layout.id}
                        >
                          {executing && executingLayoutId === layout.id ? (
                            <span className="animate-pulse">Running...</span>
                          ) : (
                            <>
                              <FaPlay className="mr-1" /> Start
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
    </>
  );
}

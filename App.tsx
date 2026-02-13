
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EctdTreeView from './components/EctdTreeView';
import DocumentViewer from './components/DocumentViewer';
import AiAssistant from './components/AiAssistant';
import UserManagement from './components/UserManagement';
import ApplicationList from './components/ApplicationList';
import { MOCK_APPLICATIONS, MOCK_USERS } from './constants';
import { EctdNode, AppView, User, Version, NodeType, EctdApplication } from './types';
import { Sparkles } from 'lucide-react';
import { generateComplianceCheck, generateSummary } from './services/geminiService';

// Helper to find node by ID in recursive tree
const findNodeById = (nodes: EctdNode[], id: string): EctdNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.APPLICATIONS);
  
  // State for multiple applications
  const [applications, setApplications] = useState<EctdApplication[]>(MOCK_APPLICATIONS);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // User Management State
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const currentUser = MOCK_USERS[currentUserIndex];

  // Derived state
  const currentApp = currentAppId ? applications.find(a => a.id === currentAppId) : undefined;
  // If no app selected, default to empty array to prevent crashes, though view logic handles this
  const ectdTree = currentApp ? currentApp.rootNodes : [];
  const selectedNode = (selectedNodeId && currentApp) ? findNodeById(currentApp.rootNodes, selectedNodeId) : null;

  const handleSwitchUser = () => {
    setCurrentUserIndex((prev) => (prev + 1) % MOCK_USERS.length);
  };

  const handleSelectApplication = (appId: string) => {
      setCurrentAppId(appId);
      setCurrentView(AppView.DASHBOARD);
      setSelectedNodeId(null); // Reset selection when switching apps
  };

  const handleBackToApps = () => {
      setCurrentAppId(null);
      setCurrentView(AppView.APPLICATIONS);
  };

  const handleCreateApplication = (newApp: EctdApplication) => {
      setApplications(prev => [newApp, ...prev]);
  };

  const handleNodeSelect = (node: EctdNode) => {
    setSelectedNodeId(node.id);
  };

  // Generic helper to update the tree of the CURRENT application
  const updateCurrentAppTree = (updateFn: (nodes: EctdNode[]) => EctdNode[]) => {
      if (!currentAppId) return;

      setApplications(prevApps => prevApps.map(app => {
          if (app.id === currentAppId) {
              return {
                  ...app,
                  rootNodes: updateFn(app.rootNodes),
                  lastModified: new Date().toISOString().split('T')[0]
              };
          }
          return app;
      }));
  };

  const handleRevert = (nodeId: string, version: Version) => {
    const updateNodesRecursive = (nodes: EctdNode[]): EctdNode[] => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            const newVersionNumber = (parseFloat(node.version || '0.9') + 0.1).toFixed(1);
            
            // Determine content to revert to
            const revertedContent = version.contentSnapshot 
                ? version.contentSnapshot 
                : `[Restored content from version ${version.version}]\n\n${node.content}`;
            
            const newHistoryEntry: Version = {
                version: newVersionNumber,
                timestamp: new Date().toLocaleString(),
                userId: currentUser.id,
                userName: currentUser.name,
                description: `Reverted to version ${version.version}`,
                contentSnapshot: node.content // Save the state being replaced
            };

            return {
              ...node,
              content: revertedContent,
              version: newVersionNumber,
              lastModified: new Date().toLocaleDateString(),
              status: 'draft',
              history: [newHistoryEntry, ...(node.history || [])]
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNodesRecursive(node.children)
            };
          }
          return node;
        });
      };
      
      updateCurrentAppTree(updateNodesRecursive);
  };

  const handleNodeUpdate = (updatedNode: EctdNode) => {
    const updateNodesRecursive = (nodes: EctdNode[]): EctdNode[] => {
        return nodes.map((node) => {
          if (node.id === updatedNode.id) {
            return updatedNode;
          }
          if (node.children) {
            return {
              ...node,
              children: updateNodesRecursive(node.children)
            };
          }
          return node;
        });
      };
      
      updateCurrentAppTree(updateNodesRecursive);
  };

  const handleUpload = async (file: File) => {
    if (!selectedNode || selectedNode.type !== NodeType.FOLDER) return;

    let content = "";
    try {
      content = await file.text();
    } catch (e) {
      content = "Binary file content placeholder.";
    }

    if (!content.trim()) content = "Document content not available for preview.";

    const newNode: EctdNode = {
      id: `file-${Date.now()}`,
      title: file.name,
      type: NodeType.FILE,
      status: 'draft',
      lastModified: new Date().toLocaleDateString(),
      version: '0.1',
      content: content,
      history: [
        {
          version: '0.1',
          timestamp: new Date().toLocaleString(),
          userId: currentUser.id,
          userName: currentUser.name,
          description: 'Initial document upload'
        }
      ]
    };

    // Update Tree State
    const updateNodesRecursive = (nodes: EctdNode[]): EctdNode[] => {
      return nodes.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            children: [...(node.children || []), newNode]
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateNodesRecursive(node.children)
          };
        }
        return node;
      });
    };

    updateCurrentAppTree(updateNodesRecursive);
  };

  const handleAnalyzeCompliance = async () => {
    if (!selectedNode || !selectedNode.content) return;
    
    setIsAiOpen(true);
    setIsProcessing(true);
    
    const complianceResult = await generateComplianceCheck(selectedNode.content, selectedNode.title);
    
    setAiInitialMessage(`I have analyzed "${selectedNode.title}" for ICH compliance:\n\n${complianceResult}`);
    setIsProcessing(false);
  };

  const handleSummarize = async () => {
    if (!selectedNode || !selectedNode.content) return;
    
    setIsAiOpen(true);
    setIsProcessing(true);
    
    const summary = await generateSummary(selectedNode.content);
    
    setAiInitialMessage(`Here is a summary of "${selectedNode.title}":\n\n${summary}`);
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        currentApplication={currentApp}
        onBackToApps={handleBackToApps}
      />

      <main className="flex-1 flex overflow-hidden relative">
        
        {currentView === AppView.APPLICATIONS && (
            <ApplicationList 
                applications={applications} 
                onSelectApplication={handleSelectApplication}
                onCreateApplication={handleCreateApplication}
            />
        )}

        {currentView === AppView.DASHBOARD && currentApp && (
            <Dashboard ectdTree={ectdTree} currentApp={currentApp} />
        )}

        {currentView === AppView.BROWSER && currentApp && (
          <div className="flex w-full h-full">
            <div className="w-80 shrink-0 h-full">
              <EctdTreeView 
                nodes={ectdTree} 
                onSelectNode={handleNodeSelect}
                selectedNodeId={selectedNodeId} 
                region={currentApp.region}
              />
            </div>
            <div className="flex-1 h-full overflow-hidden border-l border-slate-200">
              <DocumentViewer 
                node={selectedNode} 
                onAnalyze={handleAnalyzeCompliance}
                onSummarize={handleSummarize}
                isProcessing={isProcessing}
                currentUser={currentUser}
                onRevert={handleRevert}
                onUpload={handleUpload}
                onUpdateNode={handleNodeUpdate}
                region={currentApp.region}
              />
            </div>
          </div>
        )}

        {currentView === AppView.SETTINGS && (
             <UserManagement />
        )}

        {/* Floating AI Button (if closed) - Only show inside specific apps */}
        {!isAiOpen && currentApp && currentView !== AppView.APPLICATIONS && currentView !== AppView.SETTINGS && (
          <button
            onClick={() => setIsAiOpen(true)}
            className="absolute bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all z-40 group"
          >
            <Sparkles className="w-6 h-6" />
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
              Ask AI Assistant
            </span>
          </button>
        )}

        {/* AI Sidebar */}
        <AiAssistant 
          isOpen={isAiOpen} 
          onClose={() => {
              setIsAiOpen(false);
              setAiInitialMessage(undefined); // Reset trigger
          }} 
          initialMessage={aiInitialMessage}
        />

      </main>
    </div>
  );
};

export default App;

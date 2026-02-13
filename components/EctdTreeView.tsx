
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FolderOpen, FileCheck, FileWarning, FileText, Globe, Flag, FolderTree } from 'lucide-react';
import { EctdNode, NodeType, LifecycleOperation, ModuleId } from '../types';

interface EctdTreeViewProps {
  nodes: EctdNode[];
  onSelectNode: (node: EctdNode) => void;
  selectedNodeId: string | null;
  region?: string;
}

const StatusIcon = ({ status }: { status?: string }) => {
  switch (status) {
    case 'final': return <FileCheck className="w-3 h-3 text-emerald-500 ml-2" />;
    case 'error': return <FileWarning className="w-3 h-3 text-red-500 ml-2" />;
    case 'draft': return <span className="w-2 h-2 rounded-full bg-blue-400 ml-2"></span>;
    default: return null;
  }
};

const OperationBadge = ({ op }: { op?: LifecycleOperation }) => {
    if (!op || op === LifecycleOperation.NEW) return null;
    
    let colorClass = 'bg-blue-100 text-blue-700'; // Default Append/New
    let label = 'N';

    if (op === LifecycleOperation.REPLACE) {
        colorClass = 'bg-amber-100 text-amber-700';
        label = 'R';
    } else if (op === LifecycleOperation.DELETE) {
        colorClass = 'bg-red-100 text-red-700';
        label = 'D';
    } else if (op === LifecycleOperation.APPEND) {
        colorClass = 'bg-blue-100 text-blue-700';
        label = 'A';
    } else {
        colorClass = 'bg-green-100 text-green-700'; // New
    }

    return (
        <span className={`ml-2 px-1 rounded text-[9px] font-bold border border-current opacity-80 ${colorClass}`} title={`Operation: ${op}`}>
            {label}
        </span>
    );
};

const TreeNode: React.FC<{
  node: EctdNode;
  level: number;
  onSelectNode: (node: EctdNode) => void;
  selectedNodeId: string | null;
  region?: string;
  parentModuleId?: ModuleId;
}> = ({ node, level, onSelectNode, selectedNodeId, region, parentModuleId }) => {
  const [isOpen, setIsOpen] = useState(level < 1); // Open top levels by default
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const nodeRef = useRef<HTMLDivElement>(null);

  const currentModuleId = node.moduleId || parentModuleId;
  const isChinaM1 = region === 'CN' && currentModuleId === ModuleId.M1;

  const handleToggle = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
    onSelectNode(node); 
  };

  const handleSelect = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    onSelectNode(node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (hasChildren) handleToggle(e);
        else handleSelect(e);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const nextNode = findNextNode(nodeRef.current);
        nextNode?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevNode = findPrevNode(nodeRef.current);
        prevNode?.focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (hasChildren && !isOpen) {
          setIsOpen(true);
        } else if (hasChildren && isOpen) {
          // Move to first child
          const firstChild = nodeRef.current?.nextElementSibling?.querySelector('[data-tree-node]') as HTMLElement;
          firstChild?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (hasChildren && isOpen) {
          setIsOpen(false);
        } else {
          // Move to parent
          const parentNode = nodeRef.current?.closest('div[data-level]')?.parentElement?.previousElementSibling as HTMLElement;
          if (parentNode?.hasAttribute('data-tree-node')) {
            parentNode.focus();
          }
        }
        break;
    }
  };

  // Helper to find next visible node in DOM
  const findNextNode = (current: HTMLElement | null): HTMLElement | null => {
    if (!current) return null;
    const allNodes = Array.from(document.querySelectorAll('[data-tree-node]')) as HTMLElement[];
    const currentIndex = allNodes.indexOf(current);
    return allNodes[currentIndex + 1] || null;
  };

  // Helper to find previous visible node in DOM
  const findPrevNode = (current: HTMLElement | null): HTMLElement | null => {
    if (!current) return null;
    const allNodes = Array.from(document.querySelectorAll('[data-tree-node]')) as HTMLElement[];
    const currentIndex = allNodes.indexOf(current);
    return allNodes[currentIndex - 1] || null;
  };

  // Dynamic Styles
  let containerClasses = "flex items-center py-1.5 px-2 cursor-pointer transition-all rounded-md select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ";
  if (isSelected) {
    containerClasses += "bg-blue-100 text-blue-800 font-medium shadow-sm";
  } else if (isChinaM1) {
    containerClasses += "bg-red-50/50 hover:bg-red-100 text-slate-800";
  } else {
    containerClasses += "hover:bg-slate-100 text-slate-700";
  }

  // Icon Color
  let iconColor = isSelected ? "text-blue-500" : (isChinaM1 ? "text-red-500" : "text-amber-500");
  if (node.type === NodeType.FILE) {
    iconColor = isSelected ? "text-blue-500" : (isChinaM1 ? "text-red-400" : "text-blue-400");
  }

  return (
    <div data-level={level}>
      <div
        ref={nodeRef}
        data-tree-node
        tabIndex={0}
        onClick={hasChildren ? handleToggle : handleSelect}
        onKeyDown={handleKeyDown}
        className={containerClasses}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        aria-expanded={hasChildren ? isOpen : undefined}
        role="treeitem"
      >
        <span className="mr-1 text-slate-400 hover:text-slate-600">
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4 h-4 block" /> // Spacer
          )}
        </span>

        <span className="mr-2">
          {node.type === NodeType.FOLDER ? (
            isOpen ? <FolderOpen className={`w-4 h-4 ${iconColor}`} /> : <Folder className={`w-4 h-4 ${iconColor}`} />
          ) : (
            <FileText className={`w-4 h-4 ${iconColor}`} />
          )}
        </span>

        <span className="text-sm truncate flex-1">
          {node.title}
        </span>
        
        {/* Region Indicators */}
        {isChinaM1 && (
            <>
                {node.moduleId === ModuleId.M1 && node.type === NodeType.FOLDER ? (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 flex items-center gap-1">
                        <Flag className="w-3 h-3" /> NMPA
                    </span>
                ) : (
                   !isSelected && <span className="ml-2 text-[10px] text-red-400 opacity-60 font-medium">CN</span>
                )}
            </>
        )}
        
        {node.type === NodeType.FILE && (
            <>
                <StatusIcon status={node.status} />
                <OperationBadge op={node.operation} />
            </>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="ml-0 border-l border-slate-100/50">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelectNode={onSelectNode}
              selectedNodeId={selectedNodeId}
              region={region}
              parentModuleId={currentModuleId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EctdTreeView: React.FC<EctdTreeViewProps> = ({ nodes, onSelectNode, selectedNodeId, region }) => {
  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200" role="tree" aria-label="eCTD Submission Tree">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FolderTree className="w-3 h-3" /> Submission Structure
            </h2>
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center text-sm font-medium text-slate-800">
                    <span className={`w-2 h-2 rounded-full mr-2 ${region === 'CN' ? 'bg-red-500 shadow-red-200 shadow-lg' : 'bg-emerald-500 shadow-emerald-200 shadow-lg'}`}></span>
                    <span>{region === 'CN' ? 'NMPA (China)' : region === 'EU' ? 'EMA (Europe)' : 'FDA (USA)'}</span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    NDA
                </span>
            </div>
            {region === 'CN' && (
                <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-[10px] text-red-700 flex items-start gap-1.5">
                    <Globe className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="leading-tight">NMPA Module 1 regional requirements active. Differences highlighted.</span>
                </div>
            )}
        </div>
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            onSelectNode={onSelectNode}
            selectedNodeId={selectedNodeId}
            region={region}
          />
        ))}
      </div>
    </div>
  );
};

export default EctdTreeView;

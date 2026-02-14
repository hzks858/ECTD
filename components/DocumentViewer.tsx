
import React, { useState, useEffect, useRef } from 'react';
import { EctdNode, NodeType, UserRole, User, Version, ValidationResult, LifecycleOperation, EctdMetadata, ModuleId } from '../types';
import { validateEctdNode } from '../services/validationService';
import { FileText, Calendar, Tag, ShieldCheck, AlertTriangle, History, RotateCcw, AlertCircle, CheckCircle, Info, Upload, FileCode, FileImage, FileType, Database, GitCommit, Hash, Save, Loader2, XCircle, Check, Copy, Globe, FileStack, Plus, BookOpen, ClipboardList } from 'lucide-react';
import { calculateMockMd5 } from '../services/xmlGeneratorService';

interface DocumentViewerProps {
  node: EctdNode | null;
  onAnalyze: () => void;
  onSummarize: () => void;
  isProcessing: boolean;
  currentUser: User;
  onRevert: (nodeId: string, version: Version) => void;
  onUpload: (file: File) => void;
  onUpdateNode: (node: EctdNode) => void;
  region?: string;
}

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

type Tab = 'content' | 'history' | 'validation' | 'attributes';

const STF_FILE_TAGS = [
    { value: 'clinical-study-report', label: 'Clinical Study Report' },
    { value: 'protocol-or-amendment', label: 'Protocol or Amendment' },
    { value: 'case-report-forms', label: 'Case Report Forms' },
    { value: 'dataset', label: 'Dataset (SAS/XPT)' },
    { value: 'data-listing', label: 'Data Listing' },
    { value: 'legacy-clinical-study-report', label: 'Legacy Clinical Study Report' },
    { value: 'preclinical-study-report', label: 'Preclinical Study Report' },
    { value: 'validation-report', label: 'Validation Report' },
    { value: 'analytical-method', label: 'Analytical Method' },
    { value: 'statistical-analysis-plan', label: 'Statistical Analysis Plan' },
    { value: 'site-reference', label: 'Site Reference' },
    { value: 'individual-case-safety-report', label: 'Individual Case Safety Report' }
];

const getFileIcon = (filename: string, isStf?: boolean) => {
  if (isStf) return <FileStack className="w-8 h-8 text-indigo-500" />;
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <FileType className="w-8 h-8 text-red-500" />;
    case 'doc':
    case 'docx': return <FileText className="w-8 h-8 text-blue-500" />;
    case 'png':
    case 'jpg':
    case 'jpeg': return <FileImage className="w-8 h-8 text-purple-500" />;
    case 'xml': return <FileCode className="w-8 h-8 text-orange-500" />;
    case 'xpt': return <Database className="w-8 h-8 text-slate-500" />;
    default: return <FileText className="w-8 h-8 text-slate-500" />;
  }
};

const getFileTypeLabel = (filename: string, isStf?: boolean) => {
  if (isStf) return 'Study Tagging File (STF)';
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'PDF Document';
    case 'doc':
    case 'docx': return 'Word Document';
    case 'png':
    case 'jpg':
    case 'jpeg': return 'Image File';
    case 'xml': return 'XML Data';
    case 'xpt': return 'SAS Dataset';
    default: return 'Text Document';
  }
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({ node, onAnalyze, onSummarize, isProcessing, currentUser, onRevert, onUpload, onUpdateNode, region }) => {
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  
  // Local state for metadata editing
  const [operation, setOperation] = useState<LifecycleOperation>(LifecycleOperation.NEW);
  const [metadata, setMetadata] = useState<EctdMetadata>({});
  
  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Upload State
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  
  // STF Management State
  const [showStfModal, setShowStfModal] = useState(false);
  const [stfData, setStfData] = useState({ studyId: '', studyTitle: '' });
  
  const [showTagModal, setShowTagModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedTag, setSelectedTag] = useState(STF_FILE_TAGS[0].value);

  // Audit Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stfFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab('content');
    if (node) {
      if (node.validationResults) {
        setValidationResults(node.validationResults);
      } else {
        setValidationResults(validateEctdNode(node));
      }
      setOperation(node.operation || LifecycleOperation.NEW);
      setMetadata(node.metadata || {});
      setSaveSuccess(false);
    }
  }, [node]);
  
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // STF Logic Detection
  const isStfParent = node?.type === NodeType.FOLDER && 
        (node.moduleId === ModuleId.M4 || node.moduleId === ModuleId.M5) &&
        (node.title.includes('4.2') || node.title.includes('5.3'));

  const isStfNode = node?.metadata?.isStf === 'true';

  const handleRunValidation = () => {
    if (!node) return;
    const results = validateEctdNode(node);
    setValidationResults(results);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newUploads: UploadItem[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file: file as File,
        progress: 0,
        status: 'pending'
      }));

      setUploads(prev => [...prev, ...newUploads]);
      processUploads(newUploads);
    }
    if (event.target) event.target.value = '';
  };
  
  const handleStfFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
          setPendingFile(files[0]);
          setShowTagModal(true);
      }
      if (event.target) event.target.value = '';
  };

  const handleCreateStf = (e: React.FormEvent) => {
      e.preventDefault();
      if (!node || !stfData.studyId) return;

      const newStfNode: EctdNode = {
          id: `stf-${Date.now()}`,
          title: `[${stfData.studyId}] ${stfData.studyTitle}`,
          type: NodeType.FOLDER,
          moduleId: node.moduleId,
          status: 'draft',
          children: [],
          metadata: {
              isStf: 'true',
              studyId: stfData.studyId,
              studyTitle: stfData.studyTitle
          }
      };

      // Add to current node children
      const updatedNode = {
          ...node,
          children: [newStfNode, ...(node.children || [])]
      };
      
      onUpdateNode(updatedNode);
      setShowStfModal(false);
      setStfData({ studyId: '', studyTitle: '' });
      setToast({ message: 'Study Tagging File (STF) structure created.', type: 'success' });
  };

  const handleAddStfDocument = async () => {
      if (!node || !pendingFile) return;
      
      // Create file node with tag
      let content = "";
      try { content = await pendingFile.text(); } catch(e) { content = "Binary content"; }
      
      const newFileNode: EctdNode = {
          id: `file-${Date.now()}`,
          title: pendingFile.name,
          type: NodeType.FILE,
          moduleId: node.moduleId,
          status: 'draft',
          version: '0.1',
          content: content.substring(0, 100) + '...',
          lastModified: new Date().toLocaleDateString(),
          metadata: {
              fileTag: selectedTag
          },
          history: [{
              version: '0.1',
              timestamp: new Date().toLocaleString(),
              userId: currentUser.id,
              userName: currentUser.name,
              description: `Uploaded with tag: ${STF_FILE_TAGS.find(t => t.value === selectedTag)?.label}`
          }]
      };

      const updatedNode = {
          ...node,
          children: [...(node.children || []), newFileNode]
      };

      onUpdateNode(updatedNode);
      setShowTagModal(false);
      setPendingFile(null);
      setToast({ message: 'Document added to STF successfully.', type: 'success' });
  };

  const processUploads = async (newUploads: UploadItem[]) => {
      // Simulate concurrent uploads
      newUploads.forEach(item => {
          let progress = 0;
          const interval = setInterval(() => {
              progress += Math.floor(Math.random() * 10) + 5;
              if (progress >= 100) {
                  progress = 100;
                  clearInterval(interval);
                  
                  // Update state to completed
                  setUploads(prev => prev.map(u => 
                      u.id === item.id ? { ...u, progress: 100, status: 'completed' } : u
                  ));
                  
                  // Trigger actual app logic
                  onUpload(item.file);
                  
                  // Set toast
                  setToast({ message: `Successfully uploaded ${item.file.name}`, type: 'success' });
                  
                  // Remove from list after a delay
                  setTimeout(() => {
                      setUploads(prev => prev.filter(u => u.id !== item.id));
                  }, 3000);
              } else {
                  setUploads(prev => prev.map(u => 
                      u.id === item.id ? { ...u, progress, status: 'uploading' } : u
                  ));
              }
          }, 200);
      });
  };

  const handleSaveChanges = () => {
      if(!node) return;
      setIsSaving(true);
      
      // Simulate network persistence delay
      setTimeout(() => {
        const updatedNode = {
            ...node,
            operation: operation,
            metadata: metadata,
            checksum: calculateMockMd5(node.content || ''),
            lastModified: new Date().toISOString().split('T')[0]
        };
        onUpdateNode(updatedNode);
        setIsSaving(false);
        setSaveSuccess(true);
        
        // Reset success message
        setTimeout(() => setSaveSuccess(false), 2000);
      }, 600);
  };

  const getRegionHeader = (regionCode?: string) => {
      switch(regionCode) {
          case 'CN': return 'NMPA Submission';
          case 'EU': return 'EMA Submission';
          case 'US': return 'FDA Submission';
          case 'JP': return 'PMDA Submission';
          case 'CA': return 'Health Canada';
          default: return null;
      }
  };

  const regionHeader = getRegionHeader(region);

  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 h-full">
        <FileText className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a document to view</p>
      </div>
    );
  }

  // If Folder
  if (node.type === NodeType.FOLDER) {
    return (
      <div className="flex-1 bg-white p-8 overflow-y-auto h-full relative">
         <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${isStfNode ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                    {isStfNode ? <FileStack className="w-6 h-6 text-indigo-600" /> : <FileText className="w-6 h-6 text-amber-600" />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {node.title} 
                        {isStfNode && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 uppercase font-bold">STF</span>}
                    </h2>
                    <p className="text-slate-500">{isStfNode ? 'Study Tagging File Container' : 'Folder Overview'}</p>
                </div>
            </div>
            
            <div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    multiple
                />
                <input 
                    type="file" 
                    ref={stfFileInputRef} 
                    onChange={handleStfFileSelect} 
                    className="hidden" 
                />

                {isStfParent ? (
                    <button 
                        onClick={() => setShowStfModal(true)}
                        disabled={currentUser.role === 'REVIEWER'}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <FileStack className="w-4 h-4" /> Create Study (STF)
                    </button>
                ) : isStfNode ? (
                    <button 
                        onClick={() => stfFileInputRef.current?.click()}
                        disabled={currentUser.role === 'REVIEWER'}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Study Document
                    </button>
                ) : (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={currentUser.role === 'REVIEWER'}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Upload className="w-4 h-4" /> Upload Documents
                    </button>
                )}
            </div>
        </div>
        
        {/* Info Banner for STF Sections */}
        {isStfParent && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 text-blue-800 text-sm">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold">Study Tagging Files Required</p>
                    <p>In accordance with ICH guidelines for Module {node.moduleId === 'm4' ? '4' : '5'}, files must be organized within Study Tagging Files (STF). Please create a Study container before uploading documents.</p>
                </div>
            </div>
        )}

        {/* Upload Queue */}
        {uploads.length > 0 && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Upload Queue
                </h3>
                <div className="space-y-3">
                    {uploads.map(upload => (
                        <div key={upload.id} className="bg-white p-3 rounded border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="p-2 bg-blue-50 rounded text-blue-500">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700 truncate">{upload.file.name}</span>
                                    <span className="text-xs text-slate-500">{upload.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            upload.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                                        }`} 
                                        style={{ width: `${upload.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="w-6">
                                {upload.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                {upload.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Contents</h3>
            <ul className="space-y-2">
                {node.children?.map(child => (
                    <li key={child.id} className="flex items-center text-sm text-slate-700 bg-white p-3 rounded border border-slate-100 shadow-sm hover:border-blue-300 transition-colors">
                       {child.type === NodeType.FOLDER ? (
                           child.metadata?.isStf === 'true' ? 
                           <FileStack className="w-4 h-4 text-indigo-500 mr-3" /> :
                           <span className="w-2 h-2 rounded-full bg-amber-400 mr-3"></span>
                       ) : <span className="w-2 h-2 rounded-full bg-blue-400 mr-3"></span>}
                       
                       <div className="flex-1">
                           <span className="font-medium">{child.title}</span>
                           {child.metadata?.fileTag && (
                               <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                   {STF_FILE_TAGS.find(t => t.value === child.metadata?.fileTag)?.label || child.metadata.fileTag}
                               </span>
                           )}
                       </div>

                       <span className="ml-auto flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1 rounded">{child.id}</span>
                            <span className="text-xs text-slate-400">{child.status || 'Folder'}</span>
                       </span>
                    </li>
                ))}
                {(!node.children || node.children.length === 0) && <li className="text-slate-400 text-sm italic">Empty folder</li>}
            </ul>
        </div>

        {/* Create STF Modal */}
        {showStfModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileStack className="w-5 h-5 text-indigo-600" /> New Study Tagging File
                        </h3>
                        <button onClick={() => setShowStfModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleCreateStf} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Study ID</label>
                            <input 
                                type="text" 
                                required
                                value={stfData.studyId}
                                onChange={(e) => setStfData({...stfData, studyId: e.target.value})}
                                placeholder="e.g. 101-CL-001"
                                className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Study Title</label>
                            <textarea 
                                value={stfData.studyTitle}
                                onChange={(e) => setStfData({...stfData, studyTitle: e.target.value})}
                                placeholder="Title of the study..."
                                className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowStfModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm">Create STF</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Add File Tag Modal */}
        {showTagModal && pendingFile && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-indigo-600" /> Tag Study Document
                        </h3>
                        <button onClick={() => { setShowTagModal(false); setPendingFile(null); }} className="text-slate-400 hover:text-slate-600"><XCircle className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-500" />
                            <div className="overflow-hidden">
                                <p className="font-medium text-slate-700 truncate">{pendingFile.name}</p>
                                <p className="text-xs text-slate-500">{(pendingFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">File Tag (ICH Defined)</label>
                            <select 
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                {STF_FILE_TAGS.map(tag => (
                                    <option key={tag.value} value={tag.value}>{tag.label}</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Select the appropriate content tag for this file.</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => { setShowTagModal(false); setPendingFile(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                            <button type="button" onClick={handleAddStfDocument} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm">Add Document</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Toast Notification */}
        {toast && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${
                toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-red-600 text-white border-red-500'
              }`}>
                {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span className="font-medium text-sm">{toast.message}</span>
                <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/20 p-1 rounded-full transition-colors">
                    <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
        )}
      </div>
    );
  }

  const canEdit = currentUser.role !== 'REVIEWER';

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-blue-50 rounded text-blue-600">
            {getFileIcon(node.title, isStfNode)}
          </div>
          <div className="overflow-hidden">
             <h2 className="text-lg font-semibold text-slate-800 truncate">{node.title}</h2>
             <div className="flex items-center gap-2 mt-0.5">
                {regionHeader && (
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                        region === 'CN' ? 'bg-red-50 text-red-700 border-red-100' : 
                        region === 'EU' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                        {region === 'CN' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />}
                        {regionHeader}
                    </span>
                )}
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${
                    operation === LifecycleOperation.NEW ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    operation === LifecycleOperation.REPLACE ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    operation === LifecycleOperation.DELETE ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-green-50 text-green-700 border-green-200'
                }`}>
                    {operation}
                </span>
                {validationResults.some(r => r.severity === 'error') && (
                    <span className="flex items-center gap-1 text-[10px] text-red-600 font-medium">
                        <AlertCircle className="w-3 h-3" /> Validation Failed
                    </span>
                )}
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowAuditModal(true)}
             className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded text-sm font-medium transition-colors shadow-sm"
            >
             <ClipboardList className="w-4 h-4" />
             Review History
           </button>
           <button 
             onClick={onAnalyze}
             disabled={isProcessing}
             className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
             <ShieldCheck className="w-4 h-4" />
             AI Check
           </button>
           <button 
             onClick={onSummarize}
             disabled={isProcessing}
             className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
             <FileText className="w-4 h-4" />
             AI Summary
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-200 flex gap-6 text-sm font-medium text-slate-500">
        <button 
            onClick={() => setActiveTab('content')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'content' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-700'}`}
        >
            <FileText className="w-4 h-4" /> Document
        </button>
        <button 
            onClick={() => setActiveTab('attributes')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'attributes' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-700'}`}
        >
            <Tag className="w-4 h-4" /> Attributes & LCM
        </button>
        <button 
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-700'}`}
        >
            <History className="w-4 h-4" /> Version History
            {node.history && node.history.length > 0 && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">{node.history.length}</span>}
        </button>
        <button 
            onClick={() => setActiveTab('validation')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'validation' ? 'border-blue-500 text-blue-600' : 'border-transparent hover:text-slate-700'}`}
        >
            <ShieldCheck className="w-4 h-4" /> Validation
            {validationResults.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${validationResults.some(r => r.severity === 'error') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    {validationResults.length}
                </span>
            )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-slate-50/50 overflow-hidden relative">
        
        {/* Content Tab */}
        {activeTab === 'content' && (
             <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto bg-white shadow-sm border border-slate-200 min-h-[800px] flex flex-col">
                    <div className="bg-slate-100 border-b border-slate-200 p-3 flex justify-between items-center text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                             {getFileIcon(node.title)}
                             <span className="font-semibold">{getFileTypeLabel(node.title)}</span>
                        </div>
                        <div>Page 1 of 1</div>
                    </div>
                    <div className="p-10 flex-1 bg-white">
                        <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">PharmaCo Inc.</h1>
                                <p className="text-xs text-slate-500">Global Regulatory Affairs</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">CONFIDENTIAL</p>
                                <p className="text-xs text-slate-400">eCTD Sequence 0001</p>
                            </div>
                        </div>
                        <div className="prose prose-slate max-w-none">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">{node.title}</h3>
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-700 font-serif">
                                {node.content || "Content not available for preview."}
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* Attributes & LCM Tab */}
        {activeTab === 'attributes' && (
             <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-8">
                    
                    {/* Lifecycle Management Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-indigo-700">
                            <GitCommit className="w-5 h-5" />
                            <h3 className="text-lg font-bold">Lifecycle Management (LCM)</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Operation</label>
                                <select 
                                    value={operation} 
                                    onChange={(e) => setOperation(e.target.value as LifecycleOperation)}
                                    disabled={!canEdit}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                                >
                                    <option value={LifecycleOperation.NEW}>New</option>
                                    <option value={LifecycleOperation.REPLACE}>Replace</option>
                                    <option value={LifecycleOperation.APPEND}>Append</option>
                                    <option value={LifecycleOperation.DELETE}>Delete</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Controls how this document interacts with previous sequences.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Checksum (MD5)</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-mono overflow-hidden">
                                        <Hash className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{node.checksum || calculateMockMd5(node.content || '')}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(node.checksum || calculateMockMd5(node.content || ''))}
                                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors shrink-0"
                                        title="Copy MD5 to clipboard"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Auto-calculated upon compilation.</p>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-blue-700">
                            <Database className="w-5 h-5" />
                            <h3 className="text-lg font-bold">Document Metadata</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* STF Metadata Readonly View */}
                            {node.metadata?.isStf === 'true' && (
                                <div className="col-span-full bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-2">
                                    <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2">Study Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-indigo-500">Study ID</span>
                                            <span className="font-medium text-sm text-indigo-900">{node.metadata.studyId}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-indigo-500">Study Title</span>
                                            <span className="font-medium text-sm text-indigo-900">{node.metadata.studyTitle}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {node.metadata?.fileTag && (
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">File Tag (STF)</label>
                                    <div className="w-full p-2 rounded border border-slate-300 bg-slate-50 text-slate-600 text-sm flex items-center gap-2">
                                        <Tag className="w-4 h-4" />
                                        {STF_FILE_TAGS.find(t => t.value === node.metadata?.fileTag)?.label || node.metadata?.fileTag}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                                <input 
                                    type="text" 
                                    value={metadata.productName || ''}
                                    onChange={(e) => setMetadata({...metadata, productName: e.target.value})}
                                    disabled={!canEdit}
                                    className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. WonderDrug"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
                                <input 
                                    type="text" 
                                    value={metadata.manufacturer || ''}
                                    onChange={(e) => setMetadata({...metadata, manufacturer: e.target.value})}
                                    disabled={!canEdit}
                                    className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. Pfizer Inc."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dosage Form</label>
                                    <input 
                                        type="text" 
                                        value={metadata.dosageForm || ''}
                                        onChange={(e) => setMetadata({...metadata, dosageForm: e.target.value})}
                                        disabled={!canEdit}
                                        className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="e.g. Tablet"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Substance</label>
                                    <input 
                                        type="text" 
                                        value={metadata.substance || ''}
                                        onChange={(e) => setMetadata({...metadata, substance: e.target.value})}
                                        disabled={!canEdit}
                                        className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        placeholder="e.g. Ibuprofen"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Indication</label>
                                <input 
                                    type="text" 
                                    value={metadata.indication || ''}
                                    onChange={(e) => setMetadata({...metadata, indication: e.target.value})}
                                    disabled={!canEdit}
                                    className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="e.g. Treatment of Pain"
                                />
                            </div>
                        </div>
                    </div>

                    {canEdit && (
                        <div className="flex justify-end">
                            <button 
                                onClick={handleSaveChanges}
                                disabled={isSaving || saveSuccess}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-md transition-all duration-200 ${
                                    saveSuccess 
                                        ? 'bg-emerald-600 text-white' 
                                        : isSaving 
                                            ? 'bg-blue-400 text-white cursor-wait'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : saveSuccess ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isSaving ? 'Saving...' : saveSuccess ? 'Saved Successfully' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
             </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Version Timeline</h3>
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                        {/* Current Version */}
                        <div className="relative pl-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-800 text-lg">v{node.version || '0.1'} <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">Current</span></p>
                                        <p className="text-sm text-slate-500 mt-1">Modified {node.lastModified}</p>
                                    </div>
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 text-blue-800 text-sm rounded">
                                    Current active version visible in submission.
                                </div>
                            </div>
                        </div>

                        {/* History Items */}
                        {node.history && node.history.map((ver, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-700">v{ver.version}</p>
                                            <p className="text-xs text-slate-500 mt-1">{ver.timestamp}</p>
                                        </div>
                                        {canEdit && (
                                            <button 
                                                onClick={() => onRevert(node.id, ver)}
                                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-2 py-1 rounded transition-colors"
                                            >
                                                <RotateCcw className="w-3 h-3" /> Revert
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">
                                        {ver.description}
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                                            {ver.userName.charAt(0)}
                                        </div>
                                        {ver.userName}
                                    </div>
                                </div>
                            </div>
                        ))}

                         {(!node.history || node.history.length === 0) && (
                             <div className="pl-8 text-slate-400 italic text-sm">No previous versions found.</div>
                         )}
                    </div>
                </div>
            </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
             <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Automated Validation Report</h3>
                        <button 
                            onClick={handleRunValidation}
                            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors"
                        >
                            Re-run Checks
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {validationResults.map((result, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border flex items-start gap-3 ${
                                result.severity === 'error' ? 'bg-red-50 border-red-200' : 
                                result.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 
                                'bg-blue-50 border-blue-200'
                            }`}>
                                <div className="mt-0.5">
                                    {result.severity === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                                    {result.severity === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                                    {result.severity === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className={`font-semibold text-sm ${
                                             result.severity === 'error' ? 'text-red-800' : 
                                             result.severity === 'warning' ? 'text-amber-800' : 
                                             'text-blue-800'
                                        }`}>
                                            {result.ruleId}
                                        </p>
                                        <span className="text-xs opacity-60">{result.timestamp}</span>
                                    </div>
                                    <p className={`text-sm mt-1 ${
                                         result.severity === 'error' ? 'text-red-700' : 
                                         result.severity === 'warning' ? 'text-amber-700' : 
                                         'text-blue-700'
                                    }`}>{result.message}</p>
                                </div>
                            </div>
                        ))}
                        {validationResults.length === 0 && (
                            <div className="text-center py-10">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-slate-800 font-medium">All checks passed</p>
                                <p className="text-slate-500 text-sm">No issues detected for this document.</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* Audit Trail Modal */}
        {showAuditModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-blue-600" /> Review & Approval History
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Audit trail for {node.title}</p>
                        </div>
                        <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 whitespace-nowrap">Date & Time</th>
                                    <th className="px-6 py-3 whitespace-nowrap">User</th>
                                    <th className="px-6 py-3 w-1/2">Action / Comments</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Version</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {node.history?.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap align-top font-mono text-xs">
                                            {entry.timestamp}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-white group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                                                    {entry.userName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-700">{entry.userName}</p>
                                                    <p className="text-[10px] text-slate-400">ID: {entry.userId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 align-top leading-relaxed">
                                            {entry.description}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 group-hover:border-blue-300">
                                                v{entry.version}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!node.history || node.history.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/30">
                                            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            No history records found for this document.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
                        <button 
                            onClick={() => setShowAuditModal(false)} 
                            className="px-5 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium shadow-sm transition-all"
                        >
                            Close Log
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default DocumentViewer;


import React, { useState } from 'react';
import { EctdApplication, ModuleId, NodeType } from '../types';
import { Plus, Search, Folder, Globe, Clock, MoreVertical, FileText } from 'lucide-react';

interface ApplicationListProps {
  applications: EctdApplication[];
  onSelectApplication: (appId: string) => void;
  onCreateApplication: (app: EctdApplication) => void;
}

const ApplicationList: React.FC<ApplicationListProps> = ({ applications, onSelectApplication, onCreateApplication }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newApp, setNewApp] = useState<{name: string, region: 'US'|'EU'|'CA'|'JP'|'CN', description: string}>({
      name: '',
      region: 'US',
      description: ''
  });

  const filteredApps = applications.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            app.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = selectedRegion === 'all' || app.region === selectedRegion;
      return matchesSearch && matchesRegion;
  });

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      const timestamp = new Date().toISOString().split('T')[0];
      const newApplication: EctdApplication = {
          id: `app-${Date.now()}`,
          name: newApp.name,
          region: newApp.region,
          sequenceNumber: '0000',
          status: 'active',
          lastModified: timestamp,
          description: newApp.description,
          rootNodes: [
            { id: 'm1', title: 'Module 1: Admin', type: NodeType.FOLDER, moduleId: ModuleId.M1, children: [] },
            { id: 'm2', title: 'Module 2: Summaries', type: NodeType.FOLDER, moduleId: ModuleId.M2, children: [] },
            { id: 'm3', title: 'Module 3: Quality', type: NodeType.FOLDER, moduleId: ModuleId.M3, children: [] },
            { id: 'm4', title: 'Module 4: Nonclinical', type: NodeType.FOLDER, moduleId: ModuleId.M4, children: [] },
            { id: 'm5', title: 'Module 5: Clinical', type: NodeType.FOLDER, moduleId: ModuleId.M5, children: [] },
          ]
      };
      onCreateApplication(newApplication);
      setShowCreateModal(false);
      setNewApp({ name: '', region: 'US', description: '' });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar relative h-full">
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">eCTD Applications</h1>
                    <p className="text-slate-500 mt-1">Manage and track your regulatory submissions across all regions.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Plus className="w-5 h-5" /> New Application
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full relative">
                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search applications by name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="flex w-full md:w-auto gap-2">
                    <select 
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full md:w-auto p-2 border border-slate-200 rounded-lg text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Regions</option>
                        <option value="US">US (FDA)</option>
                        <option value="EU">EU (EMA)</option>
                        <option value="CA">CA (Health Canada)</option>
                        <option value="JP">Japan (PMDA)</option>
                        <option value="CN">China (NMPA)</option>
                    </select>
                </div>
            </div>

            {/* Application Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApps.map(app => (
                    <div 
                        key={app.id} 
                        onClick={() => onSelectApplication(app.id)}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Folder className="w-6 h-6" />
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                    app.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                                    app.status === 'submission_ready' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-slate-50 text-slate-500 border border-slate-100'
                                }`}>
                                    {app.status.replace('_', ' ')}
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{app.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{app.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    <span>{app.region}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span>Seq: {app.sequenceNumber}</span>
                                </div>
                                <div className="flex items-center gap-1 ml-auto">
                                    <Clock className="w-3 h-3" />
                                    <span>{app.lastModified}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State */}
                {filteredApps.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
                        <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No applications found matching your criteria.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedRegion('all'); }} className="text-sm text-blue-600 hover:underline mt-2">Clear filters</button>
                    </div>
                )}
            </div>
        </div>

        {/* Create Application Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Create New Application</h3>
                        <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5 rotate-90" /></button>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Application Name</label>
                            <input 
                                type="text" 
                                required
                                value={newApp.name}
                                onChange={(e) => setNewApp({...newApp, name: e.target.value})}
                                placeholder="e.g. IND 123456 (Neurology)"
                                className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                            <select 
                                value={newApp.region}
                                onChange={(e) => setNewApp({...newApp, region: e.target.value as any})}
                                className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="US">United States (FDA)</option>
                                <option value="EU">Europe (EMA)</option>
                                <option value="CA">Canada (Health Canada)</option>
                                <option value="JP">Japan (PMDA)</option>
                                <option value="CN">China (NMPA)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea 
                                value={newApp.description}
                                onChange={(e) => setNewApp({...newApp, description: e.target.value})}
                                placeholder="Brief description of the product and indication..."
                                className="w-full p-2 rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
                            >
                                Create Application
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default ApplicationList;

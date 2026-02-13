
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MOCK_RECENT_ACTIVITIES } from '../constants';
import { FileCheck, AlertCircle, Clock, FileText, Database, Code, X, Plus, Calendar, RotateCcw, GitMerge, FileArchive, CheckCircle2 } from 'lucide-react';
import { EctdNode, EctdApplication, LifecycleOperation, SubmissionType, NodeType } from '../types';
import { generateIndexXml, generateMd5ChecksumFile } from '../services/xmlGeneratorService';

interface DashboardProps {
  ectdTree?: EctdNode[];
  currentApp: EctdApplication;
}

const STATUS_DATA = [
  { name: 'Final', value: 45, color: '#10b981' }, // emerald-500
  { name: 'Draft', value: 30, color: '#3b82f6' }, // blue-500
  { name: 'Reviewed', value: 20, color: '#f59e0b' }, // amber-500
  { name: 'Error', value: 5, color: '#ef4444' }, // red-500
];

const MODULE_PROGRESS = [
  { name: 'M1', completed: 80, total: 100 },
  { name: 'M2', completed: 45, total: 100 },
  { name: 'M3', completed: 60, total: 100 },
  { name: 'M4', completed: 90, total: 100 },
  { name: 'M5', completed: 30, total: 100 },
];

const MOCK_SEQUENCE_HISTORY = [
    { seq: '0000', type: 'original', date: '2023-01-15', status: 'published', description: 'Initial NDA Submission' },
    { seq: '0001', type: 'amendment', date: '2023-03-20', status: 'published', description: 'Response to CDE deficiencies' },
    { seq: '0002', type: 'supplement', date: '2023-06-10', status: 'published', description: 'CMC Update' },
];

const Dashboard: React.FC<DashboardProps> = ({ ectdTree, currentApp }) => {
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [showNewSeqModal, setShowNewSeqModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  const [generatedXml, setGeneratedXml] = useState('');
  const [generatedMd5, setGeneratedMd5] = useState('');
  const [activeTab, setActiveTab] = useState<'index' | 'md5'>('index');
  
  const [newSeqData, setNewSeqData] = useState({
    sequenceNumber: (parseInt(currentApp.sequenceNumber) + 1).toString().padStart(4, '0'),
    submissionType: 'amendment' as SubmissionType,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [withdrawSeq, setWithdrawSeq] = useState({
      targetSeq: '0001',
      reason: 'Administrative withdrawal per agency request'
  });

  const handleCompile = () => {
    if (currentApp) {
        const xml = generateIndexXml(currentApp);
        const md5 = generateMd5ChecksumFile(currentApp);
        setGeneratedXml(xml);
        setGeneratedMd5(md5);
        setShowXmlModal(true);
    }
  };

  const handleCreateSequence = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Successfully initialized Sequence ${newSeqData.sequenceNumber} (${newSeqData.submissionType}).\n\n- util/dtd synced\n- m1/cn initialized`);
    setShowNewSeqModal(false);
  };

  const handleWithdrawal = () => {
      // Automate NMPA Withdrawal Logic
      // 1. Create new Sequence
      // 2. Scan target sequence
      // 3. Generate Delete/Replace-Revert operations
      const nextSeq = (parseInt(currentApp.sequenceNumber) + 1).toString().padStart(4, '0');
      
      alert(`AUTOMATED WITHDRAWAL PROCESS (NMPA V1.1 Guide Sec 6.3):
      
1. Creating Sequence ${nextSeq} (Type: Withdrawal)
2. Analyzing Sequence ${withdrawSeq.targetSeq}...
3. Auto-generating 'Delete' operations for NEW files in ${withdrawSeq.targetSeq}.
4. Auto-generating 'Replace' operations to REVERT files modified in ${withdrawSeq.targetSeq} to previous version.
5. Updating index.xml lifecycle.

Sequence ${nextSeq} is ready for review.`);
      setShowWithdrawModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar relative">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Submission Dashboard</h1>
            <p className="text-slate-500 mt-1">
                Overview of {currentApp.name} 
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
                    Seq {currentApp.sequenceNumber}
                </span>
            </p>
        </div>
        <div className="flex gap-3">
             {currentApp.region === 'CN' && (
                <button 
                    onClick={() => setShowWithdrawModal(true)}
                    className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" /> Withdraw Seq
                </button>
             )}
            <button 
                onClick={() => setShowNewSeqModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
                <Plus className="w-4 h-4" /> New Sequence
            </button>
            <button 
                onClick={handleCompile}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
            >
                <Database className="w-4 h-4" /> Compile
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Documents Total', value: '142', icon: FileText, color: 'bg-blue-100 text-blue-600' },
          { label: 'Pending Review', value: '18', icon: Clock, color: 'bg-amber-100 text-amber-600' },
          { label: 'Validation Errors', value: '3', icon: AlertCircle, color: 'bg-red-100 text-red-600' },
          { label: 'Ready to Archive', value: '64', icon: FileCheck, color: 'bg-emerald-100 text-emerald-600' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center">
            <div className={`p-4 rounded-full ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Charts Section */}
          <div className="xl:col-span-2 space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Document Status Distribution</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={STATUS_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {STATUS_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                    {STATUS_DATA.map((item) => (
                    <div key={item.name} className="flex items-center text-sm text-slate-600">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                        {item.name}
                    </div>
                    ))}
                </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Completion by Module</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MODULE_PROGRESS} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tick={{fontSize: 12}} width={30} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="completed" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f1f5f9' }} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
             </div>
             
             {/* Sequence History */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <GitMerge className="w-5 h-5 text-indigo-600" /> Sequence Lifecycle History
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Seq No.</th>
                                <th className="px-6 py-4">Submission Type</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {MOCK_SEQUENCE_HISTORY.map((seq) => (
                                <tr key={seq.seq} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{seq.seq}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border capitalize ${
                                            seq.type === 'original' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            seq.type === 'amendment' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>{seq.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{seq.date}</td>
                                    <td className="px-6 py-4 text-slate-600">{seq.description}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                            <CheckCircle2 className="w-4 h-4" /> {seq.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {/* Current Working Sequence */}
                            <tr className="bg-blue-50/30">
                                <td className="px-6 py-4 font-mono font-bold text-blue-700">{currentApp.sequenceNumber}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                                        {currentApp.submissionType || 'amendment'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 italic">In Progress</td>
                                <td className="px-6 py-4 text-slate-500 italic">Current Working Sequence</td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-blue-600 text-xs font-bold">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div> Editing
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
             </div>
          </div>

          {/* Right Column: Recent Activity */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                <button className="text-blue-600 text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                {MOCK_RECENT_ACTIVITIES.map((activity) => (
                    <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <FileText className="w-5 h-5" />
                        </div>
                        <div>
                        <p className="text-sm font-medium text-slate-800">
                            <span className="font-bold">{activity.user}</span> {activity.action} <span className="text-blue-600">{activity.file}</span>
                        </p>
                        <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        v0.{activity.id}
                    </span>
                    </div>
                ))}
                </div>
            </div>
          </div>
      </div>

      {/* New Sequence Modal */}
      {showNewSeqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" /> Initialize New Sequence
                </h3>
                <button onClick={() => setShowNewSeqModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleCreateSequence} className="p-6 space-y-5">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Sequence Number</label>
                         <input 
                            type="text" 
                            value={newSeqData.sequenceNumber}
                            onChange={(e) => setNewSeqData({...newSeqData, sequenceNumber: e.target.value})}
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="0002"
                            required
                            pattern="\d{4}"
                            title="4 digit sequence number"
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Submission Date</label>
                         <input 
                            type="date" 
                            value={newSeqData.date}
                            onChange={(e) => setNewSeqData({...newSeqData, date: e.target.value})}
                            className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                         />
                     </div>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Submission Type</label>
                     <select 
                        value={newSeqData.submissionType}
                        onChange={(e) => setNewSeqData({...newSeqData, submissionType: e.target.value as SubmissionType})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                     >
                         <option value="original">Original Application</option>
                         <option value="amendment">Amendment</option>
                         <option value="supplement">Supplement</option>
                         <option value="variation">Variation</option>
                         <option value="annual-report">Annual Report</option>
                         <option value="withdrawal">Withdrawal</option>
                     </select>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Description / Related Activity</label>
                     <textarea 
                        value={newSeqData.description}
                        onChange={(e) => setNewSeqData({...newSeqData, description: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none"
                        placeholder="e.g. Response to Agency Questions dated..."
                        required
                     />
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                     <button 
                        type="button"
                        onClick={() => setShowNewSeqModal(false)} 
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                     >
                         Cancel
                     </button>
                     <button 
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                     >
                         Create Sequence
                     </button>
                 </div>
             </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border-t-4 border-red-500">
             <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-red-600" /> Automated Withdrawal
                </h3>
                <button onClick={() => setShowWithdrawModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                </button>
             </div>
             <div className="p-6 space-y-5">
                 <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-sm text-amber-800">
                     <p className="font-bold mb-1">Warning: Irreversible Action</p>
                     This will create a new sequence that logically reverses all operations in the target sequence. 
                     Files added will be 'Deleted'. Files replaced will be 'Reverted'.
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Target Sequence to Withdraw</label>
                     <select 
                        value={withdrawSeq.targetSeq}
                        onChange={(e) => setWithdrawSeq({...withdrawSeq, targetSeq: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                     >
                         {MOCK_SEQUENCE_HISTORY.map(s => (
                             <option key={s.seq} value={s.seq}>Sequence {s.seq} - {s.description}</option>
                         ))}
                     </select>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Withdrawal</label>
                     <textarea 
                        value={withdrawSeq.reason}
                        onChange={(e) => setWithdrawSeq({...withdrawSeq, reason: e.target.value})}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm h-24 resize-none"
                     />
                 </div>

                 <div className="pt-4 flex justify-end gap-3">
                     <button 
                        type="button"
                        onClick={() => setShowWithdrawModal(false)} 
                        className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                     >
                         Cancel
                     </button>
                     <button 
                        onClick={handleWithdrawal}
                        className="px-6 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                     >
                         Process Withdrawal
                     </button>
                 </div>
             </div>
          </div>
        </div>
      )}

      {/* XML Preview Modal */}
      {showXmlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-slate-800 font-bold">
                              <Code className="w-5 h-5 text-blue-600" />
                              <h3>Compilation Preview</h3>
                          </div>
                          <div className="flex bg-slate-200 rounded-lg p-1 text-xs font-medium">
                              <button 
                                onClick={() => setActiveTab('index')}
                                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'index' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  index.xml
                              </button>
                              <button 
                                onClick={() => setActiveTab('md5')}
                                className={`px-3 py-1 rounded-md transition-all ${activeTab === 'md5' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                  index-md5.txt
                              </button>
                          </div>
                      </div>
                      <button onClick={() => setShowXmlModal(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-auto p-0 bg-slate-900 custom-scrollbar">
                      <pre className="text-blue-100 font-mono text-xs p-6 leading-relaxed">
                          {activeTab === 'index' ? generatedXml : generatedMd5}
                      </pre>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                          <FileArchive className="w-4 h-4" />
                          <span>util/dtd and util/style will be auto-included in export.</span>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowXmlModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                            Close
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                            Download Submission Package
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;

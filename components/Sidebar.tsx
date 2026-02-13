
import React from 'react';
import { LayoutDashboard, FolderTree, Settings, Activity, User, RefreshCw, Layers, ArrowLeft } from 'lucide-react';
import { AppView, User as UserType, EctdApplication } from '../types';

interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currentUser: UserType;
  onSwitchUser: () => void;
  currentApplication?: EctdApplication;
  onBackToApps: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, onSwitchUser, currentApplication, onBackToApps }) => {
  const navItems = currentApplication ? [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.BROWSER, label: 'eCTD Browser', icon: FolderTree },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ] : [
    { id: AppView.APPLICATIONS, label: 'All Applications', icon: Layers },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col justify-between h-full shadow-xl transition-all duration-300">
      <div>
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-700 bg-slate-950">
          <Activity className="text-blue-400 w-8 h-8 shrink-0" />
          <span className="ml-3 font-bold text-xl hidden lg:block text-blue-100 truncate">PharmaSync</span>
        </div>

        {currentApplication && (
           <div className="p-4 border-b border-slate-800 bg-slate-800/50">
               <button 
                onClick={onBackToApps}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-3 transition-colors"
               >
                   <ArrowLeft className="w-3 h-3" /> Back to Apps
               </button>
               <div className="hidden lg:block">
                   <h3 className="font-semibold text-sm text-white truncate" title={currentApplication.name}>
                       {currentApplication.name}
                   </h3>
                   <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-blue-900 text-blue-200 px-1.5 py-0.5 rounded border border-blue-800">
                            {currentApplication.region}
                        </span>
                        <span className="text-[10px] text-slate-400">
                            Seq: {currentApplication.sequenceNumber}
                        </span>
                   </div>
               </div>
           </div>
        )}
        
        <nav className="mt-6 flex flex-col gap-2 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-blue-200'
                }`}
              >
                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-200'}`} />
                <span className="ml-3 font-medium hidden lg:block truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-full ${currentUser.color} flex items-center justify-center font-bold text-xs shadow-lg shrink-0`}>
              {currentUser.avatarInitials}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold truncate">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={onSwitchUser}
            className="hidden lg:block p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Switch User (Demo)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

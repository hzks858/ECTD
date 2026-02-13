
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, User as UserIcon, Check, X, Lock, Plus, Trash2, Power, Ban, AlertTriangle } from 'lucide-react';
import { MOCK_USERS } from '../constants';

// Extended interface for local state management to include status
interface ManagedUser extends User {
  status: 'active' | 'inactive';
}

const ROLE_PERMISSIONS = {
    'ADMIN': ['System Configuration', 'User Management', 'Create/Edit/Delete', 'Approve/Review', 'Submit Sequence'],
    'RA_SPECIALIST': ['Create/Edit', 'Version Control', 'Run Validation', 'Generate Summaries'],
    'REVIEWER': ['View Documents', 'Add Comments', 'View Reports']
};

const UserManagement: React.FC = () => {
  // Initialize state with MOCK_USERS and default status 'active'
  const [users, setUsers] = useState<ManagedUser[]>(
    MOCK_USERS.map(user => ({ ...user, status: 'active' }))
  );
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState<{name: string, role: UserRole}>({
    name: '',
    role: 'RA_SPECIALIST'
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim()) return;

    const initials = newUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-indigo-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const userToAdd: ManagedUser = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      role: newUser.role,
      avatarInitials: initials,
      color: randomColor,
      status: 'active'
    };

    setUsers([...users, userToAdd]);
    setShowAddModal(false);
    setNewUser({ name: '', role: 'RA_SPECIALIST' });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
      }
      return u;
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Settings & Configuration</h1>
        <p className="text-slate-500 mt-1">Manage user roles, permissions, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* User List */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-600" /> Authorized Users
                  </h3>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                      <Plus className="w-4 h-4" /> Add User
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                          <tr>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {users.map((user) => (
                              <tr key={user.id} className={`transition-colors ${user.status === 'inactive' ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                  <td className="px-6 py-4 flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full ${user.status === 'inactive' ? 'bg-slate-300' : user.color} flex items-center justify-center text-white text-xs font-bold shadow-sm transition-colors`}>
                                          {user.avatarInitials}
                                      </div>
                                      <div>
                                        <span className={`font-medium block ${user.status === 'inactive' ? 'text-slate-400' : 'text-slate-700'}`}>
                                            {user.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{user.id}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                          user.status === 'inactive' ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                          user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                          user.role === 'RA_SPECIALIST' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                          'bg-green-50 text-green-700 border-green-100'
                                      }`}>
                                          {user.role.replace('_', ' ')}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      {user.status === 'active' ? (
                                        <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1 rounded-full w-fit">
                                            <Ban className="w-3 h-3" /> Inactive
                                        </span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleToggleStatus(user.id)}
                                            className={`p-1.5 rounded-md transition-colors ${
                                                user.status === 'active' 
                                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                                            }`}
                                            title={user.status === 'active' ? "Deactivate User" : "Activate User"}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {users.length === 0 && (
                      <div className="p-8 text-center text-slate-400">
                          <p>No users found.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Roles Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
              <div className="p-6 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" /> Role Matrix
                  </h3>
              </div>
              <div className="p-6 space-y-6">
                  {(Object.entries(ROLE_PERMISSIONS) as [UserRole, string[]][]).map(([role, permissions]) => (
                      <div key={role}>
                          <h4 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                              {role.replace('_', ' ')}
                          </h4>
                          <ul className="space-y-2">
                              {permissions.map((perm, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                      {perm}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ))}
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs leading-relaxed">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <p>Deactivating a user immediately revokes their access to the system. Deleting a user is permanent and cannot be undone.</p>
                      </div>
                  </div>
              </div>
          </div>

      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="RA_SPECIALIST">RA Specialist</option>
                  <option value="REVIEWER">Reviewer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

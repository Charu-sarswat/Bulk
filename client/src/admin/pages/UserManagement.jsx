import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Users, UserPlus, Trash2, Key, ShieldCheck, Mail, Search, RefreshCw, X, Check, Shield, UserCheck } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';

export default function UserManagement() {
  const { token, user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [submitting, setSubmitting] = useState(false);

  // Password change states
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load user accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, role })
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`User ${username} created successfully!`, 'success');
        setUsername('');
        setPassword('');
        setRole('staff');
        setShowAddForm(false);
        fetchUsers();
      } else {
        addToast(data.message || 'Failed to create user', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error creating user account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 6) {
      addToast('Password must be at least 6 characters long', 'warning');
      return;
    }
    setPasswordChanging(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/users/${selectedUserForPassword.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`Password for ${selectedUserForPassword.username} updated!`, 'success');
        setNewPassword('');
        setSelectedUserForPassword(null);
      } else {
        addToast(data.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while updating password', 'error');
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleDeleteUser = async (id, uname) => {
    if (!window.confirm(`Are you sure you want to remove user "${uname}"?`)) return;

    try {
      const response = await fetch(`${apiUrl}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        addToast(`User ${uname} deleted`, 'info');
        fetchUsers();
      } else {
        addToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error while deleting user', 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = u.username.toLowerCase().includes(query) || u.role.toLowerCase().includes(query);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const getRoleBadgeColor = (r) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'kitchen':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  if (loading) {
    return <SkeletonLoader type="list" />;
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header Controls */}
      <PageHeader
        title="System Users Management"
        description="Provision and audit credentials for cashier staff, kitchen helpers, and admins."
        icon={Users}
      >
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-bold text-xs rounded-xl px-4 py-2.5 shadow-sm transition-all flex items-center gap-2 cursor-pointer border border-[#F8A324]/30 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </PageHeader>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Total Credentials</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">{users.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">System Admins</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {users.filter(u => u.role === 'admin').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center gap-3 sm:gap-4 hover:shadow-sm transition-all">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider block leading-tight">Staff & Kitchen</span>
            <div className="text-lg sm:text-2xl font-black text-gray-900 font-serif mt-0.5">
              {users.filter(u => u.role !== 'admin').length}
            </div>
          </div>
        </div>
      </div>

      {/* Single Unified Edge-to-Edge Table Panel Card Container */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-xs overflow-hidden">
        {/* Control Bar Header with Padding */}
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by username or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324] focus:ring-1 focus:ring-[#F8A324]/30"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F8A324] cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="staff">Counter Staff</option>
              <option value="kitchen">Kitchen Operator</option>
            </select>
          </div>
        </div>

        {/* Users List edge-to-edge Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">System User</th>
                <th className="py-3.5 px-4 sm:px-6">Role</th>
                <th className="py-3.5 px-4 sm:px-6 hidden sm:table-cell">Created On</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-semibold">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-400 font-bold">
                    No system users matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((u) => (
                  <tr key={u.id} className="hover:bg-[#FFF9EE]/20 transition-colors">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#691F1A]/10 border border-[#691F1A]/20 flex items-center justify-center text-[#691F1A] font-black uppercase text-xs">
                          {u.username[0]}
                        </div>
                        <div>
                          <span className="font-serif font-black text-sm text-gray-900 block">{u.username}</span>
                          {u.id === currentUser.id && (
                            <span className="text-[9px] text-emerald-600 font-extrabold uppercase bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              Active Session
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-gray-400 font-light">
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right space-x-1">
                      <button
                        onClick={() => setSelectedUserForPassword(u)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer inline-block"
                        title="Change user password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        disabled={u.id === currentUser.id}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent inline-block"
                        title={u.id === currentUser.id ? "Cannot delete active session" : "Delete system user"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer with Padding */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-gray-100 bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredUsers.length / pageSize)}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            pageSizeOptions={[5, 10, 20, 50]}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF9EE] text-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#F8A324]/20 flex flex-col">
            <div className="p-5 border-b border-[#F8A324]/20 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF9EE] border border-[#F8A324]/30 flex items-center justify-center text-[#691F1A]">
                  <UserPlus className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-gray-900">Add System User</h3>
                  <span className="text-[10px] text-[#691F1A] uppercase tracking-wider font-extrabold block">Provision new login</span>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="w-8 h-8 rounded-full bg-gray-150 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. cashier_chowpati"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  Access Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#F8A324]"
                >
                  <option value="staff">Staff (Cashier / Counter)</option>
                  <option value="kitchen">Kitchen Screen Operator</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-black text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FFF9EE] text-gray-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#F8A324]/20 flex flex-col">
            <div className="p-5 border-b border-[#F8A324]/20 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF9EE] border border-[#F8A324]/30 flex items-center justify-center text-[#691F1A]">
                  <Key className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-gray-900">Change Password</h3>
                  <span className="text-[10px] text-[#691F1A] uppercase tracking-wider font-extrabold block">User: {selectedUserForPassword.username}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedUserForPassword(null);
                  setNewPassword('');
                }} 
                className="w-8 h-8 rounded-full bg-gray-150 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter at least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F8A324]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPassword(null);
                    setNewPassword('');
                  }}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordChanging}
                  className="flex-1 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-black text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {passwordChanging ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

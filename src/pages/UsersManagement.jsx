import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  UserCheck, 
  UserX, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/users?page=${page}&limit=${limit}&search=${search}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showNotification('error', 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4000);
  };

  // Send Credentials Handler
  const handleSendEmail = async (user) => {
    try {
      setActionLoading(`email-${user.id}`);
      const password = prompt(`Enter temporary password for ${user.email}:`);
      if (!password) {
        setActionLoading(null);
        return;
      }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/send-credentials`, {
        email: user.email,
        name: user.name,
        password: password
      });

      if (res.data.success) {
        showNotification('success', `Credentials successfully sent to ${user.email}`);
      }
    } catch (err) {
      console.error('Error sending email:', err);
      showNotification('error', 'Failed to send email.');
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Active / Deactive Handler
  const handleToggleStatus = async (user) => {
    try {
      setActionLoading(`status-${user.id}`);
      const newStatus = !user.is_active;

      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/api/users/users/${user.id}/status`, {
        is_active: newStatus
      });

      if (res.data.success) {
        showNotification('success', res.data.message);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('error', 'Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setActionLoading(`delete-${id}`);
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/users/${id}`);

      if (res.data.success) {
        showNotification('success', 'User deleted successfully!');
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      showNotification('error', 'Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Users Management</h1>
          <p className="text-sm text-slate-500">Manage user accounts, statuses, credentials, and access control.</p>
        </div>
      </div>

      {notification.message && (
        <div className={`mb-4 p-4 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
          {notification.message}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
        <Search className="text-slate-400 ml-2" size={20} />
        <input 
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full outline-none text-sm text-slate-700 font-medium bg-transparent"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6">Name</th>
              <th className="py-4 px-6">Email Address</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400 font-medium">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin text-blue-600" size={20}/>
                    Loading users...
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400">
                  No users found matching your search.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shadow-inner">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-medium">{user.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.is_active !== false 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {user.is_active !== false ? 'Active' : 'Deactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                    {/* Send Credentials */}
                    <button
                      onClick={() => handleSendEmail(user)}
                      disabled={actionLoading === `email-${user.id}`}
                      title="Send Credentials"
                      className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      {actionLoading === `email-${user.id}` ? <Loader2 className="animate-spin" size={16}/> : <Mail size={16}/>}
                    </button>

                    {/* Activate / Deactivate */}
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={actionLoading === `status-${user.id}`}
                      title={user.is_active !== false ? "Deactivate User" : "Activate User"}
                      className={`p-2 rounded-xl transition-all shadow-sm disabled:opacity-50 ${
                        user.is_active !== false 
                          ? 'bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white' 
                          : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white'
                      }`}
                    >
                      {actionLoading === `status-${user.id}` ? (
                        <Loader2 className="animate-spin" size={16}/>
                      ) : user.is_active !== false ? (
                        <UserX size={16}/>
                      ) : (
                        <UserCheck size={16}/>
                      )}
                    </button>

                    {/* Delete User */}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={actionLoading === `delete-${user.id}`}
                      title="Delete User"
                      className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                      {actionLoading === `delete-${user.id}` ? <Loader2 className="animate-spin" size={16}/> : <Trash2 size={16}/>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-500">
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
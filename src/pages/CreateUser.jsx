import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Mail, Shield, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user'
  });
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Agar pehle se request chal rahi hai toh dubara mat bhejo

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/create-user`, formData);
      if (res.data.success) {
        setSuccessMessage(`User created successfully! Credentials sent to ${formData.email}`);
        setFormData({ name: '', email: '', role: 'user' });
      }
    } catch (err) {
      console.error("User creation error:", err);
      setErrorMessage(err.response?.data?.error || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen font-sans text-slate-900 flex justify-center items-center">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 w-full max-w-lg p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-200">
            <UserPlus className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Create New User</h1>
            <p className="text-xs text-slate-500 font-medium">Auto-generate and email login credentials</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
            <CheckCircle size={18} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </span>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter user full name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="user@example.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Role</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Shield size={16} />
              </span>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="user">User / Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating & Sending Email...
              </>
            ) : (
              "Create User & Send Credentials"
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreateUser;
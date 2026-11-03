import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Mail, Shield, User, CheckCircle, AlertCircle, Loader2, Key, Eye, EyeOff, Wand2Icon, ArrowLeft } from 'lucide-react';

const CreateUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 🔐 Auto Generate Strong Password Function
  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!_";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({
      ...formData,
      password: password
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/create-user`, formData);
      if (res.data.success) {
        setSuccessMessage(`User created successfully! Credentials sent to ${formData.email}`);
        setFormData({ name: '', email: '', role: 'user', password: '' });
      }
    } catch (err) {
      console.error("User creation error:", err);
      setErrorMessage(err.response?.data?.error || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen font-sans text-slate-900 flex justify-center items-center relative">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/users')}
        className="absolute top-6 left-6 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Users
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 w-full max-w-lg p-8 mt-12">
        
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
          
          {/* Full Name */}
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

          {/* Email Address */}
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

          {/* Password with Generate & Hide/Show Toggle */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600">Password</label>
              <button 
                type="button" 
                onClick={generateStrongPassword}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100"
              >
                <Wand2Icon size={12} /> Auto-Generate
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key size={16} />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter or generate password"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
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

          {/* Submit Button */}
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
import React, { useState } from 'react';
import axios from 'axios';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

const ChangePassword = () => {
  // LocalStorage se logged-in admin ka email fetch karein
  const adminUser = JSON.parse(localStorage.getItem('adminUser')) || {};
  
  const [formData, setFormData] = useState({
    email: adminUser.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/change-password`, {
        email: formData.email,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setMessage('Password updated successfully!');
        // Form fields clear kar dein
        setFormData({
          ...formData,
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto font-sans">
      <div className="bg-[#0A1931] border border-[#152B4D] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00A8E8]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[#152B4D]">
          <div className="bg-[#003566] p-3.5 rounded-2xl border border-[#00509D] shadow-[0_0_15px_rgba(0,168,232,0.3)]">
            <KeyRound className="text-[#00A8E8]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Security Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">Change your admin account password securely</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3.5 rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {message && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3.5 rounded-2xl text-xs flex items-center gap-3">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Admin Email</label>
            <input 
              type="email" 
              disabled
              value={formData.email}
              className="w-full bg-[#050A19]/50 border border-[#152B4D] rounded-xl px-4 py-3 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Current Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                required
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#003566] hover:bg-[#00509D] text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_10px_20px_rgba(0,53,102,0.4)] border border-[#00509D] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
          </button>
        </form>

        {/* Security Footer Badge */}
        <div className="mt-8 pt-6 border-t border-[#152B4D] flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Encrypted Admin Security Vault</span>
        </div>

      </div>
    </div>
  );
};

export default ChangePassword;
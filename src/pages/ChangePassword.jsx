import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ShieldCheck, Mail, Eye, EyeOff } from 'lucide-react';

const getStoredAdminEmail = () => {
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const directEmail = localStorage.getItem('adminEmail') || localStorage.getItem('email') || '';

    let email = adminUser?.email || user?.email || directEmail || '';

    if (!email) {
      const rawToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
      if (rawToken && rawToken.split('.').length === 3) {
        const payload = JSON.parse(atob(rawToken.split('.')[1]));
        email = payload?.email || '';
      }
    }

    return String(email || '').trim();
  } catch (e) {
    return '';
  }
};

const ChangePassword = () => {
  const initialEmail = getStoredAdminEmail();

  const [formData, setFormData] = useState({
    email: initialEmail,
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const foundEmail = getStoredAdminEmail();
    if (foundEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: foundEmail }));
    }
  }, [formData.email]);

  const toggleVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = String(formData.email || '').trim();

    if (!cleanEmail) {
      setError('Please enter admin email.');
      return;
    }

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
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        {
          email: cleanEmail,
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        localStorage.setItem('adminEmail', cleanEmail);
        setMessage('Password updated successfully!');
        setFormData({
          ...formData,
          email: cleanEmail,
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
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                disabled={Boolean(initialEmail)}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@trucktrak.com"
                className={`w-full border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-[#00A8E8] transition-colors ${
                  initialEmail
                    ? 'bg-[#050A19]/50 text-slate-400 cursor-not-allowed'
                    : 'bg-[#050A19] text-white'
                }`}
              />
            </div>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Current Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type={showPasswords.old ? 'text' : 'password'}
                required
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 pr-11 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('old')}
                aria-label={showPasswords.old ? 'Hide current password' : 'Show current password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00A8E8] transition-colors cursor-pointer"
              >
                {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 pr-11 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('new')}
                aria-label={showPasswords.new ? 'Hide new password' : 'Show new password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00A8E8] transition-colors cursor-pointer"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 pr-11 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors"
              />
              <button
                type="button"
                onClick={() => toggleVisibility('confirm')}
                aria-label={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#00A8E8] transition-colors cursor-pointer"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
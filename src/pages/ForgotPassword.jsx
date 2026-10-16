import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Truck, Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // Step 1: Email input, Step 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Step 1: Send OTP to Email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/admin/forgot-password', { email });
      if (res.data.success) {
        setMessage('OTP sent to your email successfully!');
        setStep(2); // Next step par move ho jao
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Update Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('http://localhost:5000/api/admin/reset-password-otp', {
        email,
        otp,
        newPassword
      });
      if (res.data.success) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A19] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#0A1931] border border-[#152B4D] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00A8E8]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex bg-[#003566] p-3 rounded-2xl shadow-[0_0_20px_rgba(0,168,232,0.3)] mb-4 border border-[#00509D]">
            <Truck className="text-[#00A8E8]" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Password Recovery</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            {step === 1 ? 'Enter email to receive OTP' : 'Verify OTP & Set New Password'}
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 relative z-10">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 relative z-10">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1 FORM */}
        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@trucktrak.com"
                  className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8]"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#003566] hover:bg-[#00509D] text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 border border-[#00509D] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Sending OTP...' : 'Send OTP to Email'}</span>
              {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        ) : (
          /* STEP 2 FORM */
          <form onSubmit={handleResetPassword} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Enter 6-Digit OTP</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound size={18} />
                </span>
                <input 
                  type="text" 
                  required
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm tracking-widest focus:outline-none focus:border-[#00A8E8]"
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8]"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#003566] hover:bg-[#00509D] text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 border border-[#00509D] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Verifying...' : 'Reset Password'}</span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#152B4D] text-center relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs text-[#00A8E8] font-bold hover:underline">
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
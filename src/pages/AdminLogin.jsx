import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Truck, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data && response.data.token) {
        // Sahi keys save karein jo baki components me use ho rahi hain
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Full page reload ke sath dashboard par redirect karein
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A19] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#0A1931] border border-[#152B4D] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00A8E8]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex bg-[#003566] p-3 rounded-2xl shadow-[0_0_20px_rgba(0,168,232,0.3)] mb-4 border border-[#00509D]">
            <Truck className="text-[#00A8E8]" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Truck-Trak Fleet Management</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 relative z-10">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Admin Email</label>
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
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#050A19] border border-[#152B4D] rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-[#00A8E8] transition-colors placeholder:text-slate-600"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#003566] hover:bg-[#00509D] text-white py-3.5 px-4 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_10px_20px_rgba(0,53,102,0.4)] border border-[#00509D] flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In as Admin'}</span>
            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#152B4D] flex items-center justify-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold relative z-10">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Secured Backend API Authentication</span>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Truck, Mail, Lock, Eye, EyeOff, ArrowRight, 
  ShieldCheck, AlertCircle, Navigation, ExternalLink, 
  Activity, MapPin, Radio 
} from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const TRACCAR_URL = 'https://traccar-uksd.srv1882256.hstgr.cloud';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#00A8E8] selection:text-white">
      
      {/* Background Ambient Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl bg-[#0B132B]/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT COLUMN: Traccar & Fleet Info */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B132B] via-[#0F1C3F] to-[#0B132B] p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative overflow-hidden">
          
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-[#00A8E8]/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Logo Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-tr from-[#003566] to-[#00A8E8] rounded-2xl shadow-lg shadow-cyan-500/20 text-white border border-cyan-400/30">
                <Truck size={26} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Truck-Trak</h2>
                <p className="text-[11px] text-cyan-400 font-semibold tracking-wider uppercase">Fleet Intelligence</p>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
              Fleet Management & Telematics
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed mb-8">
              Access real-time vehicle analytics, driver performance logs, and enterprise GPS tracking from one central control hub.
            </p>
          </div>

          {/* TRACCAR QUICK ACCESS CARD */}
          <div className="bg-gradient-to-br from-[#122348] to-[#0A1633] border border-cyan-500/30 rounded-2xl p-5 shadow-xl shadow-black/40 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <Navigation size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Traccar GPS Engine</h3>
                  <p className="text-[10px] text-slate-400">Standalone Live Map</p>
                </div>
              </div>

              {/* Live Status Indicator */}
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-semibold text-emerald-400">
                <Radio size={12} className="animate-pulse" />
                Live
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">
              Direct access to live vehicle positions, active route trajectories, and OBD sensor telemetry without admin sign-in.
            </p>

            <a
              href={TRACCAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0077B6] hover:from-[#0096D1] hover:to-[#005F92] text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all duration-300 group-hover:shadow-cyan-500/30"
            >
              <span>Open Traccar Tracking Portal</span>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

        </div>

        {/* RIGHT COLUMN: Admin Login Form */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center bg-[#070D1E]/60">
          
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-medium text-cyan-400 mb-3">
                <ShieldCheck size={14} />
                Secure Portal
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">Admin Authentication</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your credentials to manage fleet assets</p>
            </div>

            {error && (
              <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@trucktrak.com"
                    className="w-full bg-[#0B132B] border border-slate-800 rounded-xl px-4 py-3 pl-10 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0B132B] border border-slate-800 rounded-xl px-4 py-3 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In To Dashboard'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[11px] text-slate-500">
                Protected by Truck-Trak Enterprise Encryption & Auth Shield
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
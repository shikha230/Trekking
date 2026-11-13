import React from 'react';

export const ProgressNode = ({ title, sub, icon, isCompleted, isActive }) => (
  <div className="flex flex-col items-center">
    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${
      isActive 
        ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-110 font-bold' 
        : isCompleted 
        ? 'bg-blue-50 text-blue-600 border-blue-200' 
        : 'bg-slate-50 text-slate-400 border-slate-200'
    }`}>
      {icon}
    </div>
    <div className="text-center mt-2.5">
      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>{title}</p>
      <p className="text-[9px] sm:text-[10px] text-slate-400">{sub}</p>
    </div>
  </div>
);

export const TelemetryWidget = ({ label, value, icon }) => (
  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">{icon} {label}</p>
    <p className="text-base sm:text-lg font-black text-slate-900 font-mono">{value}</p>
  </div>
);

export const LogItem = ({ time, text, status }) => (
  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 shadow-inner">
    <div className={`w-2 h-2 rounded-full mt-1.5 ${status === 'success' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
    <div>
      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{time}</p>
      <p className="text-xs text-slate-700 font-medium">{text}</p>
    </div>
  </div>
);
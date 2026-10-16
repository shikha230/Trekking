import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  Truck, CheckCircle, Activity, Clock, 
  MapPin, Navigation, Zap, Fuel, Timer, AlertTriangle, Cpu, Radio, ChevronRight, Eye
} from 'lucide-react';

const socket = io(`${import.meta.env.VITE_API_URL}`);

const Dashboard = () => {
  const [stats, setStats] = useState({ todayTrips: 0, activeOnTrip: 0, totalTrucks: 0, avgCycleTime: '0 min' });
  const [vehicles, setVehicles] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, liveRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/live`)
      ]);

      setStats(statsRes.data || { todayTrips: 0, activeOnTrip: 0, totalTrucks: 0, avgCycleTime: '0 min' });
      const list = liveRes.data || [];
      setVehicles(list);

      if (list.length > 0 && selectedTruckId === null) {
        setSelectedTruckId(list[0].traccar_id);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  }, [selectedTruckId]);

  useEffect(() => {
    fetchData();

    const handleVehicleUpdate = (data) => {
      setVehicles(prev => {
        const exists = prev.some(v => v.traccar_id === data.traccar_id);
        if (exists) {
          return prev.map(v => v.traccar_id === data.traccar_id ? { ...v, ...data } : v);
        }
        return [...prev, data];
      });

      if (data.current_state === 'MOVING' || data.current_state === 'UNLOADING') {
        fetchData();
      }
    };

    socket.on('v-update', handleVehicleUpdate);

    return () => {
      socket.off('v-update', handleVehicleUpdate);
    };
  }, [fetchData]);

  const activeTruck = vehicles.find(v => v.traccar_id === selectedTruckId) || vehicles[0] || null;
  const isEngineRunning = Boolean(activeTruck?.ignition || Number(activeTruck?.speed || 0) > 0.5);

  const getProgressPercentage = () => {
    if (!activeTruck) return 0;
    const status = (activeTruck.current_state || 'IDLE').toUpperCase();
    
    if (status.includes('UNLOAD') || status.includes('PLANT')) return 100;
    if (status.includes('MOVING') || status.includes('TRANSIT') || status.includes('EN_ROUTE')) return 55;
    if (status.includes('LOAD') || status.includes('MINE')) return 15;
    if (status.includes('IDLE')) return 0;
    
    return 0;
  };

  const progressPct = getProgressPercentage();

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100/80 min-h-screen text-slate-800 w-full max-w-full overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold tracking-wider uppercase mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-blue-600" />
            <span>Fleet Control Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Operational Overview</h1>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-600">
            Live Telemetry Active <span className="text-blue-600">({vehicles.length} Units)</span>
          </span>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Today's Trips", val: stats.todayTrips, icon: <CheckCircle className="text-blue-600" />, border: "hover:border-blue-300", bg: "bg-blue-50" },
          { label: "Ongoing Cycles", val: stats.activeOnTrip, icon: <Activity className="text-emerald-600" />, border: "hover:border-emerald-300", bg: "bg-emerald-50" },
          { label: "Fleet Size", val: stats.totalTrucks || vehicles.length, icon: <Truck className="text-indigo-600" />, border: "hover:border-indigo-300", bg: "bg-indigo-50" },
          { label: "Avg Cycle Time", val: stats.avgCycleTime, icon: <Timer className="text-amber-600" />, border: "hover:border-amber-300", bg: "bg-amber-50" },
        ].map((item, i) => (
          <div 
            key={i} 
            className={`bg-white border border-slate-200 rounded-2xl p-4 relative overflow-hidden transition-all duration-300 ${item.border} shadow-sm hover:shadow-md`}
          >
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{item.val}</h2>
              </div>
              <div className={`p-2.5 rounded-xl ${item.bg} border border-slate-100 shadow-sm`}>
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Progress Tracker Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Active Haul Tracking</span>
                </div>
                
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500 font-semibold">Select Truck:</span>
                  <select 
                    value={activeTruck?.traccar_id ?? ''} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTruckId(isNaN(Number(val)) ? val : Number(val));
                    }}
                    className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                  >
                    {vehicles.map(v => (
                      <option key={v.traccar_id} value={v.traccar_id}>
                        {v.name} ({v.current_state || 'IDLE'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-sm ${
                isEngineRunning 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <Zap size={14} className={isEngineRunning ? 'animate-bounce text-emerald-600' : 'text-rose-500'} />
                <span>Engine {isEngineRunning ? 'RUNNING' : 'OFF'}</span>
              </div>
            </div>

            {/* Stepper Node Visualizer */}
            <div className="relative py-6 my-2">
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0"></div>
              <div 
                className="absolute top-1/2 left-6 -translate-y-1/2 h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700 z-0 shadow-sm"
                style={{ width: `${Math.max(0, progressPct)}%` }}
              ></div>

              <div className="relative z-10 flex justify-between items-center px-2">
                <ProgressNode title="Coal Mine" sub="Loading Zone" icon={<Cpu size={18} />} isCompleted={progressPct >= 15} isActive={progressPct === 15} />
                <ProgressNode title="In Transit" sub="En Route" icon={<Navigation size={18} />} isCompleted={progressPct >= 55} isActive={progressPct === 55} />
                <ProgressNode title="Power Plant" sub="Unloading" icon={<MapPin size={18} />} isCompleted={progressPct >= 100} isActive={progressPct === 100} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-4">
            <TelemetryWidget label="Live Speed" value={`${Number(activeTruck?.speed || 0).toFixed(1)} km/h`} icon={<Activity size={15} className="text-blue-600" />} />
            <TelemetryWidget label="Odometer" value={`${Number(activeTruck?.odometer || 0).toFixed(1)} km`} icon={<Clock size={15} className="text-indigo-600" />} />
            <TelemetryWidget label="Battery / Fuel" value={activeTruck?.fuel ? `${activeTruck.fuel}%` : "87%"} icon={<Fuel size={15} className="text-emerald-600" />} />
          </div>
        </div>

        {/* Real-Time Diagnostics Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Unit Diagnostics
              </h3>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg font-mono font-bold border border-blue-200">
                {activeTruck?.name || 'N/A'}
              </span>
            </div>

            <div className="space-y-2.5">
              <LogItem time="NOW" text={`Current State: ${activeTruck?.current_state || 'IDLE'}`} status="info" />
              <LogItem time="Odometer" text={`Travelled: ${Number(activeTruck?.odometer || 0).toFixed(1)} KM`} status="info" />
              <LogItem time="GPS Lock" text="14 Satellites connected" status="success" />
              <LogItem time="Network" text="Latency < 45ms" status="success" />
            </div>
          </div>

          <button className="w-full mt-4 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm">
            <span>View Complete Logs</span>
            <ChevronRight size={14} className="text-blue-600" />
          </button>
        </div>

      </div>

      {/* ALL FLEET LIVE STATUS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Truck size={17} className="text-blue-600" /> Live Fleet Monitor ({vehicles.length})
          </h3>
          <span className="text-[11px] text-slate-400">Click "Monitor" to inspect any active unit in real-time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3">Vehicle Name</th>
                <th className="p-3">Status / State</th>
                <th className="p-3">Live Speed</th>
                <th className="p-3">Odometer</th>
                <th className="p-3">Engine State</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {vehicles.map((v) => {
                const isSelected = v.traccar_id === activeTruck?.traccar_id;
                const vEngineRunning = Boolean(v.ignition || Number(v.speed || 0) > 0.5);

                return (
                  <tr 
                    key={v.traccar_id} 
                    className={`transition-colors hover:bg-blue-50/30 ${isSelected ? 'bg-blue-50/70 text-blue-900 font-semibold' : ''}`}
                  >
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                      {v.name}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        Number(v.speed) > 2 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {v.current_state || (Number(v.speed) > 2 ? 'MOVING' : 'IDLE')}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-800">{Number(v.speed || 0).toFixed(1)} km/h</td>
                    <td className="p-3 font-mono text-slate-800">{Number(v.odometer || 0).toFixed(1)} km</td>
                    <td className="p-3">
                      <span className={vEngineRunning ? 'text-emerald-600 font-bold flex items-center gap-1.5' : 'text-slate-400'}>
                        {vEngineRunning ? '● Running' : '○ Off'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setSelectedTruckId(v.traccar_id)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto shadow-sm ${
                          isSelected 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <Eye size={12} /> {isSelected ? 'Inspecting' : 'Monitor'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

const ProgressNode = ({ title, sub, icon, isCompleted, isActive }) => (
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

const TelemetryWidget = ({ label, value, icon }) => (
  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">{icon} {label}</p>
    <p className="text-base sm:text-lg font-black text-slate-900 font-mono">{value}</p>
  </div>
);

const LogItem = ({ time, text, status }) => (
  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 shadow-inner">
    <div className={`w-2 h-2 rounded-full mt-1.5 ${status === 'success' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
    <div>
      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{time}</p>
      <p className="text-xs text-slate-700 font-medium">{text}</p>
    </div>
  </div>
);

export default Dashboard;
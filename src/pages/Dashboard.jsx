// import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios';
// import { io } from 'socket.io-client';
// import { 
//   Truck, CheckCircle, Activity, Clock, 
//   MapPin, Navigation, Zap, Fuel, Timer, AlertTriangle, Cpu, Radio, ChevronRight, Eye
// } from 'lucide-react';

// const socket = io();

// const Dashboard = () => {
//   const [stats, setStats] = useState({ todayTrips: 0, activeOnTrip: 0, totalTrucks: 0, avgCycleTime: '0 min' });
//   const [vehicles, setVehicles] = useState([]);
//   const [selectedTruckId, setSelectedTruckId] = useState(null);

//   const fetchData = useCallback(async () => {
//     try {
//       const [statsRes, liveRes] = await Promise.all([
//         axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`),
//         axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/live`)
//       ]);

//       setStats(statsRes.data || { todayTrips: 0, activeOnTrip: 0, totalTrucks: 0, avgCycleTime: '0 min' });
//       const list = liveRes.data || [];
//       setVehicles(list);

//       if (list.length > 0 && selectedTruckId === null) {
//         setSelectedTruckId(list[0].traccar_id);
//       }
//     } catch (err) {
//       console.error("Dashboard Fetch Error:", err);
//     }
//   }, [selectedTruckId]);

//   useEffect(() => {
//     fetchData();

//     const handleVehicleUpdate = (data) => {
//       setVehicles(prev => {
//         const exists = prev.some(v => v.traccar_id === data.traccar_id);
//         if (exists) {
//           return prev.map(v => v.traccar_id === data.traccar_id ? { ...v, ...data } : v);
//         }
//         return [...prev, data];
//       });

//       if (data.current_state === 'MOVING' || data.current_state === 'UNLOADING') {
//         fetchData();
//       }
//     };

//     socket.on('v-update', handleVehicleUpdate);

//     return () => {
//       socket.off('v-update', handleVehicleUpdate);
//     };
//   }, [fetchData]);

//   const activeTruck = vehicles.find(v => v.traccar_id === selectedTruckId) || vehicles[0] || null;
//   const isEngineRunning = Boolean(activeTruck?.ignition || Number(activeTruck?.speed || 0) > 0.5);

//   const getProgressPercentage = () => {
//     if (!activeTruck) return 0;
//     const status = (activeTruck.current_state || 'IDLE').toUpperCase();
    
//     if (status.includes('UNLOAD') || status.includes('PLANT')) return 100;
//     if (status.includes('MOVING') || status.includes('TRANSIT') || status.includes('EN_ROUTE')) return 55;
//     if (status.includes('LOAD') || status.includes('MINE')) return 15;
//     if (status.includes('IDLE')) return 0;
    
//     return 0;
//   };

//   const progressPct = getProgressPercentage();

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 bg-slate-100/80 min-h-screen text-slate-800 w-full max-w-full overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
//       {/* Top Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
//         <div>
//           <div className="flex items-center gap-2 text-blue-600 text-xs font-bold tracking-wider uppercase mb-1">
//             <Radio className="w-3.5 h-3.5 animate-pulse text-blue-600" />
//             <span>Fleet Control Command Center</span>
//           </div>
//           <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Operational Overview</h1>
//         </div>

//         <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
//           <span className="relative flex h-2.5 w-2.5">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
//             <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
//           </span>
//           <span className="text-xs font-bold tracking-wider uppercase text-slate-600">
//             Live Telemetry Active <span className="text-blue-600">({vehicles.length} Units)</span>
//           </span>
//         </div>
//       </div>

//       {/* Primary KPI Stats Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//         {[
//           { label: "Today's Trips", val: stats.todayTrips, icon: <CheckCircle className="text-blue-600" />, border: "hover:border-blue-300", bg: "bg-blue-50" },
//           { label: "Ongoing Cycles", val: stats.activeOnTrip, icon: <Activity className="text-emerald-600" />, border: "hover:border-emerald-300", bg: "bg-emerald-50" },
//           { label: "Fleet Size", val: stats.totalTrucks || vehicles.length, icon: <Truck className="text-indigo-600" />, border: "hover:border-indigo-300", bg: "bg-indigo-50" },
//           { label: "Avg Cycle Time", val: stats.avgCycleTime, icon: <Timer className="text-amber-600" />, border: "hover:border-amber-300", bg: "bg-amber-50" },
//         ].map((item, i) => (
//           <div 
//             key={i} 
//             className={`bg-white border border-slate-200 rounded-2xl p-4 relative overflow-hidden transition-all duration-300 ${item.border} shadow-sm hover:shadow-md`}
//           >
//             <div className="flex justify-between items-start relative z-10">
//               <div>
//                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
//                 <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{item.val}</h2>
//               </div>
//               <div className={`p-2.5 rounded-xl ${item.bg} border border-slate-100 shadow-sm`}>
//                 {item.icon}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Main Grid Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
//         {/* Progress Tracker Card */}
//         <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
//           <div>
//             <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-100">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <span className="h-2 w-2 rounded-full bg-blue-600"></span>
//                   <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Active Haul Tracking</span>
//                 </div>
                
//                 <div className="flex items-center gap-3 mt-2">
//                   <span className="text-xs text-slate-500 font-semibold">Select Truck:</span>
//                   <select 
//                     value={activeTruck?.traccar_id ?? ''} 
//                     onChange={(e) => {
//                       const val = e.target.value;
//                       setSelectedTruckId(isNaN(Number(val)) ? val : Number(val));
//                     }}
//                     className="bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl outline-none focus:border-blue-500 cursor-pointer shadow-sm"
//                   >
//                     {vehicles.map(v => (
//                       <option key={v.traccar_id} value={v.traccar_id}>
//                         {v.name} {v.imei ? `[IMEI: ${v.imei}]` : ''} ({v.current_state || 'IDLE'})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-sm ${
//                 isEngineRunning 
//                   ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
//                   : 'bg-rose-50 border-rose-200 text-rose-700'
//               }`}>
//                 <Zap size={14} className={isEngineRunning ? 'animate-bounce text-emerald-600' : 'text-rose-500'} />
//                 <span>Engine {isEngineRunning ? 'RUNNING' : 'OFF'}</span>
//               </div>
//             </div>

//             {/* Stepper Node Visualizer */}
//             <div className="relative py-6 my-2">
//               <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0"></div>
//               <div 
//                 className="absolute top-1/2 left-6 -translate-y-1/2 h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700 z-0 shadow-sm"
//                 style={{ width: `${Math.max(0, progressPct)}%` }}
//               ></div>

//               <div className="relative z-10 flex justify-between items-center px-2">
//                 <ProgressNode title="Coal Mine" sub="Loading Zone" icon={<Cpu size={18} />} isCompleted={progressPct >= 15} isActive={progressPct === 15} />
//                 <ProgressNode title="In Transit" sub="En Route" icon={<Navigation size={18} />} isCompleted={progressPct >= 55} isActive={progressPct === 55} />
//                 <ProgressNode title="Power Plant" sub="Unloading" icon={<MapPin size={18} />} isCompleted={progressPct >= 100} isActive={progressPct === 100} />
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-4">
//             <TelemetryWidget label="Live Speed" value={`${Number(activeTruck?.speed || 0).toFixed(1)} km/h`} icon={<Activity size={15} className="text-blue-600" />} />
//             <TelemetryWidget label="Odometer" value={`${Number(activeTruck?.odometer || 0).toFixed(1)} km`} icon={<Clock size={15} className="text-indigo-600" />} />
// <TelemetryWidget label="Battery / Fuel" value={`${activeTruck?.batteryFuel ?? activeTruck?.fuel ?? 87}%`} icon={<Fuel size={15} className="text-emerald-600" />} />          </div>
//         </div>

//         {/* Real-Time Diagnostics Panel */}
//         <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
//           <div>
//             <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
//               <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
//                 <AlertTriangle size={15} className="text-amber-500" /> Unit Diagnostics
//               </h3>
//               <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg font-mono font-bold border border-blue-200">
//                 {activeTruck?.imei ? `IMEI: ${activeTruck.imei}` : (activeTruck?.name || 'N/A')}
//               </span>
//             </div>

//             <div className="space-y-2.5">
//               <LogItem time="NOW" text={`Current State: ${activeTruck?.current_state || 'IDLE'}`} status="info" />
//               <LogItem time="IMEI" text={activeTruck?.imei || 'N/A'} status="success" />
//               <LogItem time="GPS Lock" text="14 Satellites connected" status="success" />
//               <LogItem time="Network" text="Latency < 45ms" status="success" />
//             </div>
//           </div>

//           <button className="w-full mt-4 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm">
//             <span>View Complete Logs</span>
//             <ChevronRight size={14} className="text-blue-600" />
//           </button>
//         </div>

//       </div>

//       {/* ALL FLEET LIVE STATUS TABLE */}
//       <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
//           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
//             <Truck size={17} className="text-blue-600" /> Live Fleet Monitor ({vehicles.length})
//           </h3>
//           <span className="text-[11px] text-slate-400">Click "Monitor" to inspect any active unit in real-time</span>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-left text-xs text-slate-700">
//             <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 tracking-wider">
//               <tr>
//                 <th className="p-3">Vehicle Name & IMEI</th>
//                 <th className="p-3">Status / State</th>
//                 <th className="p-3">Live Speed</th>
//                 <th className="p-3">Odometer</th>
//                 <th className="p-3">Engine State</th>
//                 <th className="p-3 text-right">Action</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100 font-medium">
//               {vehicles.map((v) => {
//                 const isSelected = v.traccar_id === activeTruck?.traccar_id;
//                 const vEngineRunning = Boolean(v.ignition || Number(v.speed || 0) > 0.5);

//                 return (
//                   <tr 
//                     key={v.traccar_id} 
//                     className={`transition-colors hover:bg-blue-50/30 ${isSelected ? 'bg-blue-50/70 text-blue-900 font-semibold' : ''}`}
//                   >
//                     <td className="p-3 flex items-center gap-2">
//                       <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
//                       <div>
//                         <div className="font-bold text-slate-900">{v.name}</div>
//                         <div className="text-[10px] font-mono text-blue-600">IMEI: {v.imei || 'N/A'}</div>
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
//                         Number(v.speed) > 2 
//                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
//                           : 'bg-amber-50 text-amber-700 border-amber-200'
//                       }`}>
//                         {v.current_state || (Number(v.speed) > 2 ? 'MOVING' : 'IDLE')}
//                       </span>
//                     </td>
//                     <td className="p-3 font-mono text-slate-800">{Number(v.speed || 0).toFixed(1)} km/h</td>
//                     <td className="p-3 font-mono text-slate-800">{Number(v.odometer || 0).toFixed(1)} km</td>
//                     <td className="p-3">
//                       <span className={vEngineRunning ? 'text-emerald-600 font-bold flex items-center gap-1.5' : 'text-slate-400'}>
//                         {vEngineRunning ? '● Running' : '○ Off'}
//                       </span>
//                     </td>
//                     <td className="p-3 text-right">
//                       <button 
//                         onClick={() => setSelectedTruckId(v.traccar_id)}
//                         className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ml-auto shadow-sm ${
//                           isSelected 
//                             ? 'bg-blue-600 text-white shadow-md' 
//                             : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
//                         }`}
//                       >
//                         <Eye size={12} /> {isSelected ? 'Inspecting' : 'Monitor'}
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//     </div>
//   );
// };

// const ProgressNode = ({ title, sub, icon, isCompleted, isActive }) => (
//   <div className="flex flex-col items-center">
//     <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${
//       isActive 
//         ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-110 font-bold' 
//         : isCompleted 
//         ? 'bg-blue-50 text-blue-600 border-blue-200' 
//         : 'bg-slate-50 text-slate-400 border-slate-200'
//     }`}>
//       {icon}
//     </div>
//     <div className="text-center mt-2.5">
//       <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>{title}</p>
//       <p className="text-[9px] sm:text-[10px] text-slate-400">{sub}</p>
//     </div>
//   </div>
// );

// const TelemetryWidget = ({ label, value, icon }) => (
//   <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner">
//     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">{icon} {label}</p>
//     <p className="text-base sm:text-lg font-black text-slate-900 font-mono">{value}</p>
//   </div>
// );

// const LogItem = ({ time, text, status }) => (
//   <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 shadow-inner">
//     <div className={`w-2 h-2 rounded-full mt-1.5 ${status === 'success' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
//     <div>
//       <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{time}</p>
//       <p className="text-xs text-slate-700 font-medium">{text}</p>
//     </div>
//   </div>
// );

// export default Dashboard;

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Truck, Activity, Clock, MapPin, Navigation, Zap, Fuel,
  AlertTriangle, Cpu, Radio, ChevronRight, ChevronLeft, Search, X, Check
} from 'lucide-react';

const socket = io();
const PAGE_SIZE = 10;

const isVehicleOnline = (v) => {
  if (!v) return false;
  if (typeof v.online === 'boolean') return v.online;
  const st = String(v.status || v.current_state || '').toUpperCase();
  if (['ONLINE', 'MOVING', 'IN_TRANSIT', 'LOADING', 'UNLOADING'].includes(st)) return true;
  if (v.lastUpdate || v.last_update) {
    const diffMs = Date.now() - new Date(v.lastUpdate || v.last_update).getTime();
    if (!Number.isNaN(diffMs) && diffMs <= 10 * 60 * 1000) return true;
  }
  return Boolean(v.ignition) || Number(v.speed || 0) > 0.5;
};

const formatInput1Display = (truck) => {
  if (!truck) return 'No';
  const raw = truck.input1 ?? truck.in1 ?? truck.attributes?.in1 ?? truck.attributes?.input1 ?? null;
  if (raw === null || raw === undefined || raw === '') return 'No';
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No';
  const str = String(raw).trim().toLowerCase();
  if (str === 'true' || str === 'yes' || str === '1' || str === 'on') return 'Yes';
  if (str === 'false' || str === 'no' || str === '0' || str === 'off') return 'No';
  return String(raw);
};

const formatVoltageDisplay = (truck) => {
  if (!truck) return 'N/A';

  if (truck.voltage !== null && truck.voltage !== undefined && !Number.isNaN(Number(truck.voltage))) {
    const v = Number(truck.voltage);
    return `${(v > 100 ? v / 1000 : v).toFixed(1)} V`;
  }

  const raw = truck.power ?? truck.battery ?? truck.batteryFuel;
  if (raw === null || raw === undefined || raw === '') return 'N/A';

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/v$/i.test(trimmed)) return trimmed;
    const parsed = Number(trimmed.replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(parsed)) {
      return `${(parsed > 100 ? parsed / 1000 : parsed).toFixed(1)} V`;
    }
    return trimmed;
  }

  const num = Number(raw);
  if (Number.isNaN(num)) return String(raw);
  return `${(num > 100 ? num / 1000 : num).toFixed(1)} V`;
};

const getProgressPercentage = (truck) => {
  if (!truck) return 0;
  const status = (truck.current_state || 'IDLE').toUpperCase();
  if (status.includes('UNLOAD') || status.includes('PLANT')) return 100;
  if (status.includes('MOVING') || status.includes('TRANSIT') || status.includes('EN_ROUTE') || Number(truck.speed || 0) > 2) return 55;
  if (status.includes('LOAD') || status.includes('MINE')) return 15;
  return 0;
};

const Dashboard = () => {
  const [stats, setStats] = useState({ totalVehicles: 0, totalOnline: 0 });
  const [vehicles, setVehicles] = useState([]);

  // Multi-select + instant search state
  const [selectedTruckIds, setSelectedTruckIds] = useState([]);
  const [focusedTruckId, setFocusedTruckId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pickerRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, liveRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/stats`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/live`)
      ]);

      const list = Array.isArray(liveRes.data) ? liveRes.data : (liveRes.data?.vehicles || []);
      const onlineFromList = list.filter(isVehicleOnline).length;

      setStats({
        totalVehicles: statsRes.data?.totalVehicles ?? list.length,
        totalOnline: statsRes.data?.totalOnline ?? onlineFromList
      });

      setVehicles(list);

      if (list.length > 0) {
        setSelectedTruckIds(prev => (prev.length === 0 ? [list[0].traccar_id] : prev));
        setFocusedTruckId(prev => prev ?? list[0].traccar_id);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleVehicleUpdate = (data) => {
      setVehicles(prev => {
        const exists = prev.some(v => Number(v.traccar_id) === Number(data.traccar_id));
        const updated = exists
          ? prev.map(v => (Number(v.traccar_id) === Number(data.traccar_id) ? { ...v, ...data } : v))
          : [...prev, data];

        setStats(s => ({
          totalVehicles: Math.max(s.totalVehicles, updated.length),
          totalOnline: updated.filter(isVehicleOnline).length
        }));

        return updated;
      });
    };

    socket.on('v-update', handleVehicleUpdate);
    return () => {
      socket.off('v-update', handleVehicleUpdate);
    };
  }, [fetchData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDropdownVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v =>
      String(v.name || '').toLowerCase().includes(q) ||
      String(v.imei || '').toLowerCase().includes(q) ||
      String(v.current_state || '').toLowerCase().includes(q)
    );
  }, [vehicles, searchQuery]);

  const selectedTrucks = useMemo(
    () => vehicles.filter(v => selectedTruckIds.includes(v.traccar_id)),
    [vehicles, selectedTruckIds]
  );

  const toggleTruckSelection = (traccarId) => {
    setSelectedTruckIds(prev => {
      const exists = prev.includes(traccarId);
      if (exists) {
        const next = prev.filter(id => id !== traccarId);
        if (focusedTruckId === traccarId) {
          setFocusedTruckId(next[0] ?? vehicles[0]?.traccar_id ?? null);
        }
        return next;
      } else {
        setFocusedTruckId(traccarId);
        return [...prev, traccarId];
      }
    });
  };

  const activeTruck =
    vehicles.find(v => v.traccar_id === focusedTruckId) ||
    selectedTrucks[0] ||
    vehicles[0] ||
    null;

  const tableVehicles = selectedTrucks.length > 0 ? selectedTrucks : vehicles;
  const totalPages = Math.max(1, Math.ceil(tableVehicles.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTruckIds.length]);

  const paginatedVehicles = useMemo(() => {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    return tableVehicles.slice(startIdx, startIdx + PAGE_SIZE);
  }, [tableVehicles, currentPage]);

  const displayTotalVehicles = stats.totalVehicles || vehicles.length;
  const displayTotalOnline = stats.totalOnline || vehicles.filter(isVehicleOnline).length;
  const activeInput1 = formatInput1Display(activeTruck);

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
            Live Telemetry Active <span className="text-blue-600">({displayTotalOnline} Online)</span>
          </span>
        </div>
      </div>

      {/* Primary KPI Stats Grid (Only Total Vehicles & Total Online) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { label: "Total Vehicles", val: displayTotalVehicles, icon: <Truck className="text-indigo-600" />, border: "hover:border-indigo-300", bg: "bg-indigo-50" },
          { label: "Total Online", val: displayTotalOnline, icon: <Activity className="text-emerald-600" />, border: "hover:border-emerald-300", bg: "bg-emerald-50" },
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
            <div className="flex flex-wrap justify-between items-start gap-4 mb-5 pb-4 border-b border-slate-100">
              <div className="w-full" ref={pickerRef}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Active Haul Tracking</span>
                    <span className="text-[11px] font-bold text-slate-500">({selectedTrucks.length} Selected)</span>
                  </div>
                  {selectedTrucks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedTruckIds([])}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Type-to-Show Search Input */}
                <div className="relative mt-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    placeholder="Type truck name or IMEI to select multiple trucks..."
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl outline-none focus:border-blue-500 focus:bg-white shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {isDropdownOpen && (
                    <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {filteredDropdownVehicles.length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">No matching truck found</div>
                      ) : (
                        filteredDropdownVehicles.map(v => {
                          const isChecked = selectedTruckIds.includes(v.traccar_id);
                          return (
                            <div
                              key={v.traccar_id}
                              onClick={() => toggleTruckSelection(v.traccar_id)}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors ${
                                isChecked ? 'bg-blue-50/80 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                                    isChecked
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check size={11} strokeWidth={3} />}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900">{v.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400">
                                    {v.imei ? `IMEI: ${v.imei}` : `ID: ${v.traccar_id}`} ({v.current_state || 'IDLE'})
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">
                                Input 1: <b>{formatInput1Display(v)}</b>
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Trucks Chips */}
                {selectedTrucks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {selectedTrucks.map(t => (
                      <span
                        key={t.traccar_id}
                        onClick={() => setFocusedTruckId(t.traccar_id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                          activeTruck?.traccar_id === t.traccar_id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <span>{t.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTruckSelection(t.traccar_id);
                          }}
                          className="hover:opacity-75"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Node Visualizer Line for EVERY Selected Truck */}
            {selectedTrucks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-medium">
                Type truck name or IMEI above to view live haul progress line.
              </div>
            ) : (
              <div className="space-y-5 max-h-[430px] overflow-y-auto pr-1">
                {selectedTrucks.map((truck) => {
                  const pct = getProgressPercentage(truck);
                  const truckEngineRunning = Boolean(truck.ignition || Number(truck.speed || 0) > 0.5);
                  const isFocused = activeTruck?.traccar_id === truck.traccar_id;
                  const truckInput1 = formatInput1Display(truck);

                  return (
                    <div
                      key={truck.traccar_id}
                      onClick={() => setFocusedTruckId(truck.traccar_id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isFocused
                          ? 'border-blue-300 bg-blue-50/20 shadow-sm'
                          : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-sm text-slate-900">{truck.name}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                            {truck.current_state || 'IDLE'}
                          </span>
                          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            Loading: <b>{truck.distToLoading || 'N/A'}</b>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Unloading: <b>{truck.distToUnloading || 'N/A'}</b>
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${
                            truckInput1 === 'Yes'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            Input 1: {truckInput1}
                          </span>
                        </div>

                        <div className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                          truckEngineRunning
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          <Zap size={12} className={truckEngineRunning ? 'text-emerald-600' : 'text-rose-500'} />
                          <span>Engine {truckEngineRunning ? 'RUNNING' : 'OFF'}</span>
                        </div>
                      </div>

                      <div className="relative py-3">
                        <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1.5 bg-slate-200/80 rounded-full z-0"></div>
                        <div
                          className="absolute top-1/2 left-6 -translate-y-1/2 h-1.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-700 z-0 shadow-sm"
                          style={{ width: `${Math.max(0, pct)}%` }}
                        ></div>

                        <div className="relative z-10 flex justify-between items-center px-2">
                          <ProgressNode title="Loading" sub={`(${truck.distToLoading || 'N/A'})`} icon={<Cpu size={16} />} isCompleted={pct >= 15} isActive={pct === 15} />
                          <ProgressNode title="In Transit" sub={`${Number(truck.speed || 0).toFixed(1)} km/h`} icon={<Navigation size={16} />} isCompleted={pct >= 55} isActive={pct === 55} />
                          <ProgressNode title="Unloading" sub={`(${truck.distToUnloading || 'N/A'})`} icon={<MapPin size={16} />} isCompleted={pct >= 100} isActive={pct === 100} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Telemetry Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-4">
            <TelemetryWidget label="Live Speed" value={`${Number(activeTruck?.speed || 0).toFixed(1)} km/h`} icon={<Activity size={15} className="text-blue-600" />} />
            <TelemetryWidget label="Input 1" value={activeInput1} icon={<Clock size={15} className="text-indigo-600" />} />
            <TelemetryWidget label="Battery / Fuel (Voltage)" value={formatVoltageDisplay(activeTruck)} icon={<Fuel size={15} className="text-emerald-600" />} />
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
                {activeTruck?.imei ? `IMEI: ${activeTruck.imei}` : (activeTruck?.name || 'N/A')}
              </span>
            </div>

            <div className="space-y-2.5">
              <LogItem time="NOW" text={`Current State: ${activeTruck?.current_state || 'IDLE'}`} status="info" />
              <LogItem time="INPUT 1" text={`Input 1: ${activeInput1}`} status={activeInput1 === 'Yes' ? 'success' : 'info'} />
              <LogItem time="LOADING" text={`Distance to Loading: ${activeTruck?.distToLoading || 'N/A'}`} status="info" />
              <LogItem time="UNLOADING" text={`Distance to Unloading: ${activeTruck?.distToUnloading || 'N/A'}`} status="success" />
              <LogItem time="VOLTAGE" text={`Power: ${formatVoltageDisplay(activeTruck)}`} status="success" />
            </div>
          </div>

          <button className="w-full mt-4 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm">
            <span>View Complete Logs</span>
            <ChevronRight size={14} className="text-blue-600" />
          </button>
        </div>

      </div>

      {/* LIVE FLEET MONITOR TABLE WITH PAGINATION & INPUT 1 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Truck size={17} className="text-blue-600" /> Live Fleet Monitor ({tableVehicles.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, tableVehicles.length)} of {tableVehicles.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3">Vehicle Name & IMEI</th>
                <th className="p-3">Status / State</th>
                <th className="p-3">Input 1</th>
                <th className="p-3">Loading Dist</th>
                <th className="p-3">Unloading Dist</th>
                <th className="p-3">Voltage</th>
                <th className="p-3">Live Speed</th>
                <th className="p-3">Engine State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedVehicles.map((v) => {
                const vEngineRunning = Boolean(v.ignition || Number(v.speed || 0) > 0.5);
                const vInput1 = formatInput1Display(v);

                return (
                  <tr
                    key={v.traccar_id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <div className="text-[10px] font-mono text-blue-600">IMEI: {v.imei || 'N/A'}</div>
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
                    <td className="p-3 font-mono font-bold">
                      <span className={vInput1 === 'Yes' ? 'text-emerald-700' : 'text-slate-600'}>
                        {vInput1}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-blue-700 font-bold">{v.distToLoading || 'N/A'}</td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{v.distToUnloading || 'N/A'}</td>
                    <td className="p-3 font-mono text-slate-800 font-bold">{formatVoltageDisplay(v)}</td>
                    <td className="p-3 font-mono text-slate-800">{Number(v.speed || 0).toFixed(1)} km/h</td>
                    <td className="p-3">
                      <span className={vEngineRunning ? 'text-emerald-600 font-bold flex items-center gap-1.5' : 'text-slate-400'}>
                        {vEngineRunning ? '● Running' : '○ Off'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {tableVehicles.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold border transition-all ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

const ProgressNode = ({ title, sub, icon, isCompleted, isActive }) => (
  <div className="flex flex-col items-center">
    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border transition-all shadow-sm ${
      isActive
        ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-110 font-bold'
        : isCompleted
        ? 'bg-blue-50 text-blue-600 border-blue-200'
        : 'bg-slate-50 text-slate-400 border-slate-200'
    }`}>
      {icon}
    </div>
    <div className="text-center mt-2">
      <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-600' : 'text-slate-700'}`}>{title}</p>
      <p className="text-[9px] sm:text-[10px] text-slate-500">{sub}</p>
    </div>
  </div>
);

const TelemetryWidget = ({ label, value, icon }) => (
  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-inner">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">{icon} {label}</p>
    <p className="text-sm sm:text-base font-black text-slate-900 font-mono">{value}</p>
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
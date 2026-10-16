import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Navigation, Truck, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';

const HistoryPage = () => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // --- STATES ---
  const [vehicles, setVehicles] = useState([]); 
  const [selectedTruck, setSelectedTruck] = useState(null); 
  const [history, setHistory] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 🗓️ Date Filter States
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  // 1. Fetch all vehicles on load
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/all`);
        const data = Array.isArray(res.data) ? res.data : (res.data.vehicles || []);
        setVehicles(data);
        if (data.length > 0) setSelectedTruck(data[0]);
      } catch (err) {
        console.error("Error fetching vehicles", err);
      }
    };
    fetchVehicles();
  }, []);

  // 2. Fetch History when Truck, Start Date or End Date changes
  useEffect(() => {
    if (!selectedTruck?.traccar_id) return;

    const fetchHistoryData = async () => {
      try {
        setLoading(true);
        setCurrentPage(1); 
        
        const [geoRes, histRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/geofences`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/trips/history/${selectedTruck.traccar_id}`, {
            params: {
              from: startDate,
              to: endDate
            }
          })
        ]);

        const historyData = histRes.data.history || (Array.isArray(histRes.data) ? histRes.data : []);
        const zonesData = geoRes.data.zones || (Array.isArray(geoRes.data) ? geoRes.data : histRes.data.zones || []);

        setHistory(historyData);
        setZones(zonesData);

      } catch (err) {
        console.error("Error fetching history", err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoryData();
  }, [selectedTruck, startDate, endDate]);

  // Distance Calculation
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getZoneName = useCallback((lat, lng) => {
    if (!zones || zones.length === 0) return "On Road / In Transit";
    const foundZone = zones.find(z => {
      const dist = calculateDistance(lat, lng, parseFloat(z.latitude), parseFloat(z.longitude));
      return dist <= z.radius;
    });
    return foundZone ? foundZone.name : "On Road / In Transit";
  }, [zones]);

  // Pagination Logic
  const safeHistory = Array.isArray(history) ? history : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistory = safeHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(safeHistory.length / itemsPerPage);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
            <Navigation size={14} /> Historical Analytics
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Truck Movement</h1>
        </div>

        {/* SELECTOR & DATE FILTERS */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-3.5 rounded-[24px] shadow-sm border border-gray-100">
          
          {/* Asset Select */}
          <div className="flex items-center gap-2 px-2 border-r border-gray-100 pr-4">
            <Truck size={18} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Asset:</span>
            <select 
              className="bg-gray-50 border-none rounded-xl px-3 py-1.5 font-bold text-xs text-gray-700 outline-none min-w-[150px]"
              onChange={(e) => {
                const truck = vehicles.find(v => v.traccar_id?.toString() === e.target.value);
                if (truck) setSelectedTruck(truck);
              }}
              value={selectedTruck?.traccar_id || ''}
            >
              {vehicles.map(v => (
                <option key={v.id || v.traccar_id} value={v.traccar_id}>
                  {v.name} (ID: {v.traccar_id})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">From:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-3 py-1.5 font-bold text-xs text-gray-700 outline-none cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">To:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-3 py-1.5 font-bold text-xs text-gray-700 outline-none cursor-pointer"
            />
          </div>

        </div>
      </div>

      {/* STATS */}
      {selectedTruck && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Asset</p>
            <p className="text-2xl font-black text-blue-600">{selectedTruck.name}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Logs Found</p>
            <p className="text-2xl font-black text-gray-900">{safeHistory.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date Range</p>
            <p className="text-sm font-bold text-gray-700 mt-1">{startDate} to {endDate}</p>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-black text-gray-400 uppercase tracking-[2px] border-b border-gray-50 bg-gray-50/30">
                <th className="p-6">Timestamp</th>
                <th className="p-6">Zone / Location</th>
                <th className="p-6">Speed & Engine</th>
                <th className="p-6">Odometer</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-bold animate-pulse">Loading data...</td></tr>
              ) : currentHistory.length > 0 ? currentHistory.map((log, index) => {
                const attrs = typeof log.attributes === 'string' ? JSON.parse(log.attributes) : (log.attributes || {});
                const speedKMH = log.speed_kmh !== undefined ? log.speed_kmh : Math.round((log.speed || 0) * 1.852);
                const zoneName = log.location || getZoneName(log.latitude, log.longitude);

                // FIXED STATUS LOGIC
                let displayStatus = log.status;
                if (!displayStatus) {
                  if (speedKMH > 2) {
                    displayStatus = 'IN_TRANSIT';
                  } else if (attrs.in1 === true || attrs.in1 === 1) {
                    displayStatus = 'UNLOADING';
                  } else {
                    displayStatus = 'STOPPED';
                  }
                }

                return (
                  <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-gray-900 text-sm">{new Date(log.devicetime).toLocaleTimeString()}</p>
                      <p className="text-[10px] font-bold text-gray-400">{new Date(log.devicetime).toLocaleDateString()}</p>
                    </td>
                    <td className="p-6">
                      <p className="font-black text-gray-800 text-sm">{zoneName}</p>
                      <p className="text-[10px] font-mono text-gray-400">{Number(log.latitude).toFixed(4)}, {Number(log.longitude).toFixed(4)}</p>
                    </td>
                    <td className="p-6">
                       <div className="text-sm font-black text-gray-700">{speedKMH} KM/H</div>
                       <div className={`text-[9px] font-black uppercase ${attrs.ignition ? 'text-green-500' : 'text-gray-300'}`}>
                         {attrs.ignition ? 'Engine ON' : 'Engine OFF'}
                       </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-bold text-gray-600">{((attrs.totalDistance || 0) / 1000).toFixed(1)} KM</div>
                    </td>
                    <td className="p-6">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        displayStatus === 'IN_TRANSIT' ? 'bg-emerald-100 text-emerald-600' :
                        displayStatus === 'UNLOADING' ? 'bg-amber-100 text-amber-600' :
                        displayStatus === 'LOADING' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {displayStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="p-20 text-center text-gray-400 font-bold">No history records found for the selected dates.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-6 bg-gray-50/50 border-t flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="p-2 bg-white border rounded-xl disabled:opacity-30"
                >
                  <ChevronLeft size={18}/>
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage >= totalPages}
                  className="p-2 bg-white border rounded-xl disabled:opacity-30"
                >
                  <ChevronRight size={18}/>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
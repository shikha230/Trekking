import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Truck, RefreshCw, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const TripLogs = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');
  
  const [page, setPage] = useState(1);
  const limit = 8;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 12-Hour AM/PM Format Helper
  const formatDateTime = (dateString) => {
    if (!dateString) return '---';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (totalMinutes) => {
      if (!totalMinutes || totalMinutes === 0) return '0 mins';
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours === 0) return `${minutes} mins`;
      return `${hours} hrs ${minutes} mins`;
  };

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/trips/vehicles-list');
      setVehicles(res.data);
    } catch (err) {
      console.error("Vehicles fetch error", err);
    }
  };

  const fetchTrips = async (pageNum = 1) => {
    try {
      setLoading(true);
      let url = `http://localhost:5000/api/trips/trip?page=${pageNum}&limit=${limit}&`;
      if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
      
      if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
      if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

      const res = await axios.get(url);
      const data = res.data;
      
      setTrips(data);
      setHasMore(data.length >= limit);
    } catch (err) {
      console.error("Trip fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchTrips(page);
  }, [page, selectedVehicle, fromDateTime, toDateTime]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleGenerateTrips = async () => {
    if (!selectedVehicle || selectedVehicle === 'all') {
      alert("Please select a specific truck from the dropdown to scan history!");
      return;
    }
    try {
      setGenerating(true);
      await axios.get(`http://localhost:5000/api/trips/generate/${selectedVehicle}`);
      setPage(1);
      await fetchTrips(1);
    } catch (err) {
      console.error("Generation error", err);
    } finally {
      setGenerating(false);
    }
  };

  // CSV Download Function
  const handleDownloadCSV = async () => {
    try {
      let url = `http://localhost:5000/api/trips/trip?page=1&limit=1000&`; // Zyada data export ke liye limit badha di gayi hai
      if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
      if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
      if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

      const res = await axios.get(url);
      const allTrips = res.data;

      if (!allTrips || allTrips.length === 0) {
        alert("No data available to download!");
        return;
      }

      // CSV Headers
      let csvContent = "data:text/csv;charset=utf-8,Truck Name,Start Time,End Time,Duration,Status\n";

      // Rows mapping
      allTrips.forEach(t => {
        const truckName = `"${t.vehicle_name || 'N/A'}"`;
        const startTime = `"${formatDateTime(t.start_time)}"`;
        const endTime = `"${formatDateTime(t.end_time)}"`;
        const duration = `"${t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}"`;
        const status = `"${t.status || 'N/A'}"`;

        csvContent += [truckName, startTime, endTime, duration, status].join(",") + "\n";
      });

      // Download trigger
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Trip_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Download error", err);
      alert("Failed to download trip logs.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-200">
              <ClipboardList className="text-blue-600" size={22} />
            </div> 
            Trip & Cycle Logs
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Automatically detected truck cycles from geofences</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Download Button */}
          <button 
            onClick={handleDownloadCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-none"
          >
            <Download size={14} />
            Download CSV
          </button>

          <button 
            onClick={handleGenerateTrips}
            disabled={generating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-none"
          >
            <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
            {generating ? "Scanning History..." : "Scan & Generate Trips"}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
          <Filter size={16} className="text-blue-600"/> Filters:
        </div>
        
        <select 
          value={selectedVehicle} 
          onChange={handleFilterChange(setSelectedVehicle)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Trucks</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.traccar_id || v.id}>{v.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          From: 
          <input 
            type="datetime-local" 
            value={fromDateTime} 
            onChange={handleFilterChange(setFromDateTime)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          To: 
          <input 
            type="datetime-local" 
            value={toDateTime} 
            onChange={handleFilterChange(setToDateTime)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600"
          />
        </div>

        {(fromDateTime || toDateTime || selectedVehicle !== 'all') && (
          <button 
            onClick={() => { setSelectedVehicle('all'); setFromDateTime(''); setToDateTime(''); setPage(1); }}
            className="text-xs text-rose-600 font-bold hover:underline ml-auto cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Trips Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
              <tr>
                <th className="px-6 py-4">Truck Name</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-slate-400 font-bold">
                    Loading trips...
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-slate-400 font-bold">
                    No trips found for the selected time range.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900 flex items-center gap-2.5">
                      <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                        <Truck size={14} className="text-slate-600"/>
                      </div> 
                      {t.vehicle_name}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">
                      {formatDateTime(t.start_time)}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">
                      {formatDateTime(t.end_time)}
                    </td>
                    <td className="px-6 py-4 font-black text-blue-600">
                      {t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        t.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1 || loading}
          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition-all border border-slate-200 cursor-pointer"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="text-xs font-black text-slate-700">
          Page <span className="text-blue-600">{page}</span>
        </div>

        <button
          onClick={() => setPage(prev => prev + 1)}
          disabled={!hasMore || loading}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
};

export default TripLogs;
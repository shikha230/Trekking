// // import React, { useState, useEffect } from 'react';
// // import axios from 'axios';
// // import { ClipboardList, Truck, RefreshCw, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// // const TripLogs = () => {
// //   const [trips, setTrips] = useState([]);
// //   const [vehicles, setVehicles] = useState([]);
// //   const [selectedVehicle, setSelectedVehicle] = useState('all');
  
// //   // Traccar jaisa Period filter state ('today', 'week', 'month', 'custom')
// //   const [period, setPeriod] = useState('today');
// //   const [fromDateTime, setFromDateTime] = useState('');
// //   const [toDateTime, setToDateTime] = useState('');
  
// //   const [page, setPage] = useState(1);
// //   const limit = 8;
// //   const [loading, setLoading] = useState(true);
// //   const [generating, setGenerating] = useState(false);
// //   const [hasMore, setHasMore] = useState(true);

// //   // Helper to format dates for API in Indian Standard Time (IST) or ISO local format
// //   const getISTISOString = (date) => {
// //     const offsetMinutes = 330; // IST is UTC+5:30
// //     const istDate = new Date(date.getTime() + (offsetMinutes * 60 * 1000));
// //     return istDate.toISOString().slice(0, 16);
// //   };

// //   // Handle Period Presets (Traccar Style)
// //   useEffect(() => {
// //     const now = new Date();
// //     let start = new Date();
// //     let end = new Date(now);

// //     if (period === 'today') {
// //       start.setHours(0, 0, 0, 0);
// //       setFromDateTime(getISTISOString(start));
// //       setToDateTime(getISTISOString(end));
// //     } else if (period === 'week') {
// //       const day = now.getDay() || 7;
// //       start.setHours(0, 0, 0, 0);
// //       start.setDate(now.getDate() - day + 1);
// //       setFromDateTime(getISTISOString(start));
// //       setToDateTime(getISTISOString(end));
// //     } else if (period === 'month') {
// //       start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
// //       setFromDateTime(getISTISOString(start));
// //       setToDateTime(getISTISOString(end));
// //     }
// //     // Agar 'custom' hai toh user khud select karega, values overwrite nahi hongi
// //   }, [period]);

// //   // 12-Hour AM/PM Format Helper
// //   const formatDateTime = (dateString) => {
// //     if (!dateString) return '---';
// //     const date = new Date(dateString);
// //     return date.toLocaleString('en-IN', {
// //       timeZone: 'Asia/Kolkata',
// //       year: 'numeric',
// //       month: 'short',
// //       day: 'numeric',
// //       hour: 'numeric',
// //       minute: '2-digit',
// //       hour12: true
// //     });
// //   };

// //   const formatDuration = (totalMinutes) => {
// //       if (!totalMinutes || totalMinutes === 0) return '0 mins';
// //       const hours = Math.floor(totalMinutes / 60);
// //       const minutes = totalMinutes % 60;
// //       if (hours === 0) return `${minutes} mins`;
// //       return `${hours} hrs ${minutes} mins`;
// //   };

// //   const fetchVehicles = async () => {
// //     try {
// //       const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/vehicles-list`);
// //       setVehicles(res.data);
// //     } catch (err) {
// //       console.error("Vehicles fetch error", err);
// //     }
// //   };

// //   const fetchTrips = async (pageNum = 1) => {
// //     try {
// //       setLoading(true);
// //       let url = `${import.meta.env.VITE_API_URL}/api/trips/trip?page=${pageNum}&limit=${limit}&`;
// //       if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
      
// //       if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
// //       if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

// //       const res = await axios.get(url);
// //       const data = res.data;
      
// //       setTrips(data);
// //       setHasMore(data.length >= limit);
// //     } catch (err) {
// //       console.error("Trip fetch error", err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchVehicles();
// //   }, []);

// //   useEffect(() => {
// //     fetchTrips(page);
// //   }, [page, selectedVehicle, fromDateTime, toDateTime]);

// //   const handleFilterChange = (setter) => (e) => {
// //     setter(e.target.value);
// //     setPage(1);
// //   };

// //   const handleGenerateTrips = async () => {
// //     if (!selectedVehicle || selectedVehicle === 'all') {
// //       alert("Please select a specific truck from the dropdown to scan history!");
// //       return;
// //     }
// //     try {
// //       setGenerating(true);
// //       await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/generate/${selectedVehicle}`);
// //       setPage(1);
// //       await fetchTrips(1);
// //     } catch (err) {
// //       console.error("Generation error", err);
// //     } finally {
// //       setGenerating(false);
// //     }
// //   };

// //   // CSV Download Function
// //   const handleDownloadCSV = async () => {
// //     try {
// //       let url = `${import.meta.env.VITE_API_URL}/api/trips/trip?page=1&limit=1000&`;
// //       if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
// //       if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
// //       if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

// //       const res = await axios.get(url);
// //       const allTrips = res.data;

// //       if (!allTrips || allTrips.length === 0) {
// //         alert("No data available to download!");
// //         return;
// //       }

// //       let csvContent = "data:text/csv;charset=utf-8,Truck Name,Start Time,Unloading Time,End Time,Duration,IO9,Status\n";

// //       allTrips.forEach(t => {
// //         const truckName = `"${t.vehicle_name || 'N/A'}"`;
// //         const startTime = `"${formatDateTime(t.start_time)}"`;
// //         const unloadingTime = `"${formatDateTime(t.unloading_start_time)}"`;
// //         const endTime = `"${formatDateTime(t.end_time)}"`;
// //         const duration = `"${t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}"`;
// //         const endIo9 = `"${t.end_io9 ?? 'N/A'}"`;
// //         const status = `"${t.status || 'N/A'}"`;

// //         csvContent += [truckName, startTime, unloadingTime, endTime, duration, endIo9, status].join(",") + "\n";
// //       });

// //       const encodedUri = encodeURI(csvContent);
// //       const link = document.createElement("a");
// //       link.setAttribute("href", encodedUri);
// //       link.setAttribute("download", `Trip_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
// //       document.body.appendChild(link);
// //       link.click();
// //       document.body.removeChild(link);
// //     } catch (err) {
// //       console.error("CSV Download error", err);
// //       alert("Failed to download trip logs.");
// //     }
// //   };

// //   return (
// //     <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      
// //       {/* Header Section */}
// //       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
// //         <div>
// //           <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
// //             <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-200">
// //               <ClipboardList className="text-blue-600" size={22} />
// //             </div> 
// //             Trip & Cycle Logs
// //           </h1>
// //           <p className="text-xs text-slate-500 font-medium mt-1">Automatically detected truck cycles from geofences & sensor states</p>
// //         </div>

// //         <div className="flex items-center gap-3 w-full sm:w-auto">
// //           <button 
// //             onClick={handleDownloadCSV}
// //             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-none"
// //           >
// //             <Download size={14} />
// //             Download CSV
// //           </button>

// //           <button 
// //             onClick={handleGenerateTrips}
// //             disabled={generating}
// //             className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-none"
// //           >
// //             <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
// //             {generating ? "Scanning History..." : "Scan & Generate Trips"}
// //           </button>
// //         </div>
// //       </div>

// //       {/* Filters Section (Traccar Style Period + Vehicle + Custom Date) */}
// //       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
// //         <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
// //           <Filter size={16} className="text-blue-600"/> Filters:
// //         </div>
        
// //         {/* Vehicle Selector */}
// //         <select 
// //           value={selectedVehicle} 
// //           onChange={handleFilterChange(setSelectedVehicle)}
// //           className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
// //         >
// //           <option value="all">All Trucks</option>
// //           {vehicles.map(v => (
// //             <option key={v.id} value={v.traccar_id || v.id}>{v.name}</option>
// //           ))}
// //         </select>

// //         {/* Traccar Style Period Selector */}
// //         <select
// //           value={period}
// //           onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
// //           className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
// //         >
// //           <option value="today">Today</option>
// //           <option value="week">This Week</option>
// //           <option value="month">This Month</option>
// //           <option value="custom">Custom Period</option>
// //         </select>

// //         {/* Custom From & To Inputs (Active only if period is 'custom') */}
// //         <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
// //           From: 
// //           <input 
// //             type="datetime-local" 
// //             value={fromDateTime} 
// //             disabled={period !== 'custom'}
// //             onChange={handleFilterChange(setFromDateTime)}
// //             className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
// //           />
// //         </div>

// //         <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
// //           To: 
// //           <input 
// //             type="datetime-local" 
// //             value={toDateTime} 
// //             disabled={period !== 'custom'}
// //             onChange={handleFilterChange(setToDateTime)}
// //             className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
// //           />
// //         </div>
// //       </div>

// //       {/* Trips Table Container */}
// //       <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
// //         <div className="overflow-x-auto">
// //           <table className="w-full text-left border-collapse min-w-[700px]">
// //             <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
// //               <tr>
// //                 <th className="px-6 py-4">Truck Name</th>
// //                 <th className="px-6 py-4">Start Time</th>
// //                 <th className="px-6 py-4">End Time</th>
// //                 <th className="px-6 py-4">Duration</th>
// //                 <th className="px-6 py-4">End IO9</th>
// //                 <th className="px-6 py-4">Status</th>
// //               </tr>
// //             </thead>
// //             <tbody className="divide-y divide-slate-100 text-xs">
// //               {loading ? (
// //                 <tr>
// //                   <td colSpan="6" className="text-center py-20 text-slate-400 font-bold">
// //                     Loading trips...
// //                   </td>
// //                 </tr>
// //               ) : trips.length === 0 ? (
// //                 <tr>
// //                   <td colSpan="6" className="text-center py-20 text-slate-400 font-bold">
// //                     No trips found for the selected time range.
// //                   </td>
// //                 </tr>
// //               ) : (
// //                 trips.map((t) => (
// //                   <tr key={t.id} className="hover:bg-slate-50 transition-colors">
// //                     <td className="px-6 py-4 font-black text-slate-900 flex items-center gap-2.5">
// //                       <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
// //                         <Truck size={14} className="text-slate-600"/>
// //                       </div> 
// //                       {t.vehicle_name}
// //                     </td>
// //                     <td className="px-6 py-4 font-bold text-slate-600">
// //                       {formatDateTime(t.start_time)}
// //                     </td>
// //                     <td className="px-6 py-4 font-bold text-slate-600">
// //                       {formatDateTime(t.end_time)}
// //                     </td>
// //                     <td className="px-6 py-4 font-black text-blue-600">
// //                       {t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}
// //                     </td>
// //                     <td className="px-6 py-4 font-black text-emerald-600">
// //                       {t.end_io9 !== null && t.end_io9 !== undefined ? t.end_io9 : '---'}
// //                     </td>
// //                     <td className="px-6 py-4">
// //                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
// //                         t.status === 'COMPLETED' 
// //                           ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
// //                           : 'bg-blue-100 text-blue-700 border border-blue-200'
// //                       }`}>
// //                         {t.status}
// //                       </span>
// //                     </td>
// //                   </tr>
// //                 ))
// //               )}
// //             </tbody>
// //           </table>
// //         </div>
// //       </div>

// //       {/* Pagination Controls */}
// //       <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
// //         <button
// //           onClick={() => setPage(prev => Math.max(prev - 1, 1))}
// //           disabled={page === 1 || loading}
// //           className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition-all border border-slate-200 cursor-pointer"
// //         >
// //           <ChevronLeft size={16} /> Previous
// //         </button>

// //         <div className="text-xs font-black text-slate-700">
// //           Page <span className="text-blue-600">{page}</span>
// //         </div>

// //         <button
// //           onClick={() => setPage(prev => prev + 1)}
// //           disabled={!hasMore || loading}
// //           className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
// //         >
// //           Next <ChevronRight size={16} />
// //         </button>
// //       </div>

// //     </div>
// //   );
// // };

// // export default TripLogs;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { ClipboardList, Truck, RefreshCw, Filter, ChevronLeft, ChevronRight, Download, AlertTriangle } from 'lucide-react';

// const TripLogs = () => {
//   const [trips, setTrips] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [selectedVehicle, setSelectedVehicle] = useState('all');
  
//   // Period filter state ('today', 'week', 'month', 'custom')
//   const [period, setPeriod] = useState('today');
//   const [fromDateTime, setFromDateTime] = useState('');
//   const [toDateTime, setToDateTime] = useState('');
  
//   const [page, setPage] = useState(1);
//   const limit = 5;
//   const [loading, setLoading] = useState(true);
//   const [generating, setGenerating] = useState(false);
//   const [hasMore, setHasMore] = useState(true);

//   // Helper to format dates for API in Indian Standard Time (IST) or ISO local format
//   const getISTISOString = (date) => {
//     const offsetMinutes = 330; // IST is UTC+5:30
//     const istDate = new Date(date.getTime() + (offsetMinutes * 60 * 1000));
//     return istDate.toISOString().slice(0, 16);
//   };

//   // Handle Period Presets (Traccar Style)
//   useEffect(() => {
//     const now = new Date();
//     let start = new Date();
//     let end = new Date(now);

//     if (period === 'today') {
//       start.setHours(0, 0, 0, 0);
//       setFromDateTime(getISTISOString(start));
//       setToDateTime(getISTISOString(end));
//     } else if (period === 'week') {
//       const day = now.getDay() || 7;
//       start.setHours(0, 0, 0, 0);
//       start.setDate(now.getDate() - day + 1);
//       setFromDateTime(getISTISOString(start));
//       setToDateTime(getISTISOString(end));
//     } else if (period === 'month') {
//       start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
//       setFromDateTime(getISTISOString(start));
//       setToDateTime(getISTISOString(end));
//     }
//   }, [period]);

//   // 12-Hour AM/PM Format Helper
//   const formatDateTime = (dateString) => {
//     if (!dateString) return '---';
//     const date = new Date(dateString);
//     return date.toLocaleString('en-IN', {
//       timeZone: 'Asia/Kolkata',
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: 'numeric',
//       minute: '2-digit',
//       hour12: true
//     });
//   };

//   const formatDuration = (totalMinutes) => {
//       if (!totalMinutes || totalMinutes === 0) return '0 mins';
//       const hours = Math.floor(totalMinutes / 60);
//       const minutes = totalMinutes % 60;
//       if (hours === 0) return `${minutes} mins`;
//       return `${hours} hrs ${minutes} mins`;
//   };

//   const fetchVehicles = async () => {
//     try {
//       const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/vehicles-list`);
//       setVehicles(res.data);
//     } catch (err) {
//       console.error("Vehicles fetch error", err);
//     }
//   };

//   const fetchTrips = async (pageNum = 1) => {
//     try {
//       setLoading(true);
//       let url = `${import.meta.env.VITE_API_URL}/api/trips/trip?page=${pageNum}&limit=${limit}&`;
//       if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
//       if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
//       if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

//       const res = await axios.get(url);

//       if (res.data && Array.isArray(res.data.trips)) {
//         setTrips(res.data.trips);
//         setTotalPages(res.data.pagination?.totalPages || 1);
//         setHasMore(res.data.pagination?.hasMore || false);
//       } else if (Array.isArray(res.data)) {
//         setTrips(res.data);
//         setHasMore(res.data.length >= limit);
//       } else {
//         setTrips([]);
//       }
//     } catch (err) {
//       console.error("Trip fetch error", err);
//       setTrips([]); // Error aane par bhi empty array rakhein taaki crash na ho
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVehicles();
//   }, []);

//   useEffect(() => {
//     fetchTrips(page);
//   }, [page, selectedVehicle, fromDateTime, toDateTime]);

//   const handleFilterChange = (setter) => (e) => {
//     setter(e.target.value);
//     setPage(1);
//   };

//   const handleGenerateTrips = async () => {
//     if (!selectedVehicle || selectedVehicle === 'all') {
//       alert("Please select a specific truck from the dropdown to scan history!");
//       return;
//     }
//     try {
//       setGenerating(true);
//       await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/generate/${selectedVehicle}`);
//       setPage(1);
//       await fetchTrips(1);
//     } catch (err) {
//       console.error("Generation error", err);
//     } finally {
//       setGenerating(false);
//     }
//   };

//   // CSV Download Function
//   const handleDownloadCSV = async () => {
//     try {
//       let url = `${import.meta.env.VITE_API_URL}/api/trips/trip?page=1&limit=1000&`;
//       if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
//       if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
//       if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

//       const res = await axios.get(url);
//       const allTrips = res.data.trips || res.data;
//       if (!allTrips || allTrips.length === 0) {
//         alert("No data available to download!");
//         return;
//       }

//       let csvContent = "data:text/csv;charset=utf-8,Truck Name,Start Time (Loading),Unloading Start Time,End Time,Cycle Duration,End IO9,Status,Remarks\n";

//       allTrips.forEach(t => {
//         const truckName = `"${t.vehicle_name || 'N/A'}"`;
//         const startTime = `"${formatDateTime(t.start_time)}"`;
//         const unloadingTime = `"${formatDateTime(t.unloading_start_time)}"`;
//         const endTime = `"${formatDateTime(t.end_time)}"`;
//         const duration = `"${t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}"`;
//         const endIo9 = `"${t.end_io9 ?? 'N/A'}"`;
//         const status = `"${t.status || 'N/A'}"`;
//         const remarks = `"${t.remarks || 'Normal Completion'}"`;

//         csvContent += [truckName, startTime, unloadingTime, endTime, duration, endIo9, status, remarks].join(",") + "\n";
//       });

//       const encodedUri = encodeURI(csvContent);
//       const link = document.createElement("a");
//       link.setAttribute("href", encodedUri);
//       link.setAttribute("download", `Trip_Logs_Sheet_Rules_${new Date().toISOString().slice(0, 10)}.csv`);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (err) {
//       console.error("CSV Download error", err);
//       alert("Failed to download trip logs.");
//     }
//   };

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      
//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
//             <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-200">
//               <ClipboardList className="text-blue-600" size={22} />
//             </div> 
//             Fleet Trip & Cycle Logs (Client Sheet Rules)
//           </h1>
//           <p className="text-xs text-slate-500 font-medium mt-1">CAT Dumpers & Volvo Trucks rule-based cycle tracking (IO6, IO9, in1=true, speed=0)</p>
//         </div>

//         <div className="flex items-center gap-3 w-full sm:w-auto">
//           <button 
//             onClick={handleDownloadCSV}
//             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-none"
//           >
//             <Download size={14} />
//             Download CSV
//           </button>

//           <button 
//             onClick={handleGenerateTrips}
//             disabled={generating}
//             className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer justify-center flex-1 sm:flex-none"
//           >
//             <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
//             {generating ? "Scanning Sheet Rules..." : "Scan & Generate Trips"}
//           </button>
//         </div>
//       </div>

//       {/* Filters Section */}
//       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
//         <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
//           <Filter size={16} className="text-blue-600"/> Filters:
//         </div>
        
//         {/* Vehicle Selector */}
//         <select 
//           value={selectedVehicle} 
//           onChange={handleFilterChange(setSelectedVehicle)}
//           className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
//         >
//           <option value="all">All Trucks (CAT & Volvo)</option>
//           {vehicles.map(v => (
//             <option key={v.id} value={v.traccar_id || v.id}>{v.name}</option>
//           ))}
//         </select>

//         {/* Period Selector */}
//         <select
//           value={period}
//           onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
//           className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
//         >
//           <option value="today">Today</option>
//           <option value="week">This Week</option>
//           <option value="month">This Month</option>
//           <option value="custom">Custom Period</option>
//         </select>

//         {/* Custom From & To Inputs */}
//         <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
//           From: 
//           <input 
//             type="datetime-local" 
//             value={fromDateTime} 
//             disabled={period !== 'custom'}
//             onChange={handleFilterChange(setFromDateTime)}
//             className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
//           />
//         </div>

//         <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
//           To: 
//           <input 
//             type="datetime-local" 
//             value={toDateTime} 
//             disabled={period !== 'custom'}
//             onChange={handleFilterChange(setToDateTime)}
//             className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
//           />
//         </div>
//       </div>

//       {/* Trips Table Container */}
//       <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse min-w-[900px]">
//             <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
//               <tr>
//                 <th className="px-5 py-4">Truck Name</th>
//                 <th className="px-5 py-4">Trip Start (Loading)</th>
//                 <th className="px-5 py-4">Unloading Start</th>
//                 <th className="px-5 py-4">Trip End</th>
//                 <th className="px-5 py-4">Duration</th>
//                 <th className="px-5 py-4">End IO9</th>
//                 <th className="px-5 py-4">Status</th>
//                 <th className="px-5 py-4">Remarks / Flag</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-slate-100 text-xs">
//               {loading ? (
//                 <tr>
//                   <td colSpan="8" className="text-center py-20 text-slate-400 font-bold">
//                     Loading rule-based trip logs...
//                   </td>
//                 </tr>
//               ) : trips.length === 0 ? (
//                 <tr>
//                   <td colSpan="8" className="text-center py-20 text-slate-400 font-bold">
//                     No trips found matching the client sheet criteria for this time range.
//                   </td>
//                 </tr>
//               ) : (
//                 trips.map((t) => (
//                   <tr key={t.id} className="hover:bg-slate-50 transition-colors">
//                     <td className="px-5 py-4 font-black text-slate-900 flex items-center gap-2.5">
//                       <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
//                         <Truck size={14} className="text-slate-600"/>
//                       </div> 
//                       {t.vehicle_name}
//                     </td>
//                     <td className="px-5 py-4 font-bold text-slate-600">
//                       {formatDateTime(t.start_time)}
//                     </td>
//                     <td className="px-5 py-4 font-bold text-purple-600">
//                       {formatDateTime(t.unloading_start_time)}
//                     </td>
//                     <td className="px-5 py-4 font-bold text-slate-600">
//                       {formatDateTime(t.end_time)}
//                     </td>
//                     <td className="px-5 py-4 font-black text-blue-600">
//                       {t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}
//                     </td>
//                     <td className="px-5 py-4 font-black text-emerald-600">
//                       {t.end_io9 !== null && t.end_io9 !== undefined ? t.end_io9 : '---'}
//                     </td>
//                     <td className="px-5 py-4">
//                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
//                         t.status === 'COMPLETED' 
//                           ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
//                           : t.status === 'FLAGGED'
//                           ? 'bg-amber-100 text-amber-700 border border-amber-200'
//                           : 'bg-blue-100 text-blue-700 border border-blue-200'
//                       }`}>
//                         {t.status}
//                       </span>
//                     </td>
//                     <td className="px-5 py-4 font-medium text-slate-500">
//                       {t.status === 'FLAGGED' ? (
//                         <span className="flex items-center gap-1 text-amber-600 font-bold">
//                           <AlertTriangle size={14} /> {t.remarks || 'Completed outside un-loading area'}
//                         </span>
//                       ) : (
//                         t.remarks || 'Normal Completion'
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Pagination Controls */}
//       <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
//         <button
//           onClick={() => setPage(prev => Math.max(prev - 1, 1))}
//           disabled={page === 1 || loading}
//           className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 px-4 py-2 rounded-xl text-xs font-black text-slate-700 transition-all border border-slate-200 cursor-pointer"
//         >
//           <ChevronLeft size={16} /> Previous
//         </button>

//         <div className="text-xs font-black text-slate-700">
//           Page <span className="text-blue-600">{page}</span>
//         </div>

//         <button
//           onClick={() => setPage(prev => prev + 1)}
//           disabled={!hasMore || loading}
//           className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
//         >
//           Next <ChevronRight size={16} />
//         </button>
//       </div>

//     </div>
//   );
// };

// export default TripLogs;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardList, Truck, RefreshCw, Filter, ChevronLeft, ChevronRight, Download, AlertTriangle } from 'lucide-react';

const TripLogs = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');

  // Period filter state ('today', 'week', 'month', 'custom')
  const [period, setPeriod] = useState('today');
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Helper: Safely parse backend timestamp (handles both ISO 'Z' and raw UTC DB strings)
  const parseAsUTCDate = (dateString) => {
    if (!dateString) return null;
    const str = String(dateString).trim();
    const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(str);
    const normalized = hasTimezone ? str : str.replace(' ', 'T') + 'Z';
    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? new Date(str) : parsed;
  };

  // Helper to format dates for datetime-local input strictly in IST (YYYY-MM-DDTHH:mm)
  const getISTISOString = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(date);

    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const hour = map.hour === '24' ? '00' : map.hour;
    return `${map.year}-${map.month}-${map.day}T${hour}:${map.minute}`;
  };

  // Handle Period Presets
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now);

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
      setFromDateTime(getISTISOString(start));
      setToDateTime(getISTISOString(end));
    } else if (period === 'week') {
      const day = now.getDay() || 7;
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - day + 1);
      setFromDateTime(getISTISOString(start));
      setToDateTime(getISTISOString(end));
    } else if (period === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      setFromDateTime(getISTISOString(start));
      setToDateTime(getISTISOString(end));
    }
  }, [period]);

  // 12-Hour AM/PM Format Helper strictly in IST
  const formatDateTime = (dateString) => {
    const date = parseAsUTCDate(dateString);
    if (!date || isNaN(date.getTime())) return '---';
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/vehicles-list`);
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Vehicles fetch error", err);
      setVehicles([]);
    }
  };

  const fetchTrips = async (pageNum = 1) => {
    try {
      setLoading(true);
      let url = `${import.meta.env.VITE_API_URL}/api/trips/trip?page=${pageNum}&limit=${limit}&`;
      if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
      if (selectedShift && selectedShift !== 'all') url += `shift=${selectedShift}&`;
      if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
      if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

      const res = await axios.get(url);

      if (res.data && Array.isArray(res.data.trips)) {
        setTrips(res.data.trips);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setHasMore(res.data.pagination?.hasMore || false);
      } else if (Array.isArray(res.data)) {
        setTrips(res.data);
        setTotalPages(1);
        setHasMore(res.data.length >= limit);
      } else {
        setTrips([]);
        setTotalPages(1);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Trip fetch error", err);
      setTrips([]);
      setTotalPages(1);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchTrips(page);
  }, [page, selectedVehicle, selectedShift, fromDateTime, toDateTime]);

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
      await axios.get(`${import.meta.env.VITE_API_URL}/api/trips/generate/${selectedVehicle}`);
      setPage(1);
      await fetchTrips(1);
    } catch (err) {
      console.error("Generation error", err);
      alert("Failed to scan and generate trips. Please ensure the backend server is running.");
    } finally {
      setGenerating(false);
    }
  };

  // Helper: Calculate Shift Name & Accounting Date strictly in IST
  const getShiftInfoForCSV = (dateString) => {
    const date = parseAsUTCDate(dateString);
    if (!date || isNaN(date.getTime())) return { shiftName: 'N/A', shiftDate: 'N/A' };

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      hour12: false
    }).formatToParts(date);

    const map = Object.fromEntries(parts.map(p => [p.type, Number(p.value)]));
    const hour = map.hour === 24 ? 0 : map.hour;

    let shiftName = '';
    const accountingDate = new Date(Date.UTC(map.year, map.month - 1, map.day));

    if (hour >= 6 && hour < 14) {
      shiftName = 'Shift 1 (06:00 AM - 01:59 PM)';
    } else if (hour >= 14 && hour < 22) {
      shiftName = 'Shift 2 (02:00 PM - 09:59 PM)';
    } else {
      shiftName = 'Shift 3 (10:00 PM - 05:59 AM)';
      if (hour < 6) {
        accountingDate.setUTCDate(accountingDate.getUTCDate() - 1);
      }
    }

    const shiftDate = accountingDate.toLocaleDateString('en-IN', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });

    return { shiftName, shiftDate };
  };

  // Fixed & Reliable CSV Download Function using Blob
  const handleDownloadCSV = async () => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/trips/trip?page=1&limit=5000&`;
      if (selectedVehicle && selectedVehicle !== 'all') url += `vehicleId=${selectedVehicle}&`;
      if (selectedShift && selectedShift !== 'all') url += `shift=${selectedShift}&`;
      if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
      if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

      const res = await axios.get(url);
      const allTrips = Array.isArray(res.data?.trips)
        ? res.data.trips
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (!allTrips || allTrips.length === 0) {
        alert("No trip data available to download for the selected filters!");
        return;
      }

      const headers = [
        "Sr. No.",
        "Truck Name",
        "Shift Date",
        "Shift",
        "Trip Start (Loading)",
        "Unloading Start",
        "Trip End",
        "Cycle Duration",
        "End IO9",
        "Status",
        "Remarks / Flag"
      ];

      const escapeCSV = (val) => {
        const str = String(val ?? '---').replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = allTrips.map((t, index) => {
        const { shiftName, shiftDate } = getShiftInfoForCSV(t.start_time);
        const duration = t.total_cycle_minutes
          ? formatDuration(t.total_cycle_minutes)
          : 'In Transit';
        const remarks =
          t.remarks ||
          (t.status === 'FLAGGED'
            ? 'Flagged: Outside Un-Loading Area'
            : 'Normal Completion');

        return [
          escapeCSV(index + 1),
          escapeCSV(t.vehicle_name || 'N/A'),
          escapeCSV(t.shift_date || shiftDate),
          escapeCSV(t.shift_name || shiftName),
          escapeCSV(formatDateTime(t.start_time)),
          escapeCSV(formatDateTime(t.unloading_start_time)),
          escapeCSV(formatDateTime(t.end_time)),
          escapeCSV(duration),
          escapeCSV(t.end_io9 !== null && t.end_io9 !== undefined ? t.end_io9 : '---'),
          escapeCSV(t.status || 'N/A'),
          escapeCSV(remarks)
        ].join(",");
      });

      const csvString = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const blobUrl = URL.createObjectURL(blob);

      const istTodayStr = getISTISOString(new Date()).slice(0, 10);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute(
        "download",
        `Shift_Trip_Report_${istTodayStr}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("CSV Download error:", err);
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
            Fleet Trip & Cycle Logs
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            CAT Dumpers & Volvo Trucks rule-based cycle tracking (IO6, IO9, IO1, speed=0)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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
            {generating ? "Scanning Rules..." : "Scan & Generate Trips"}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
          <Filter size={16} className="text-blue-600"/> Filters:
        </div>
        
        {/* Vehicle Selector */}
        <select 
          value={selectedVehicle} 
          onChange={handleFilterChange(setSelectedVehicle)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Trucks (CAT & Volvo)</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.traccar_id || v.id}>{v.name}</option>
          ))}
        </select>

        {/* Shift Selector */}
        <select
          value={selectedShift}
          onChange={handleFilterChange(setSelectedShift)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          <option value="all">All Shifts</option>
          <option value="shift1">Shift 1 (6:00 AM - 1:59 PM)</option>
          <option value="shift2">Shift 2 (2:00 PM - 9:59 PM)</option>
          <option value="shift3">Shift 3 (10:00 PM - 5:59 AM)</option>
        </select>

        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-600"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Period</option>
        </select>

        {/* Custom From & To Inputs */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          From: 
          <input 
            type="datetime-local" 
            value={fromDateTime} 
            disabled={period !== 'custom'}
            onChange={handleFilterChange(setFromDateTime)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          To: 
          <input 
            type="datetime-local" 
            value={toDateTime} 
            disabled={period !== 'custom'}
            onChange={handleFilterChange(setToDateTime)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Trips Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
              <tr>
                <th className="px-5 py-4">Truck Name</th>
                <th className="px-5 py-4">Trip Start (Loading)</th>
                <th className="px-5 py-4">Unloading Start</th>
                <th className="px-5 py-4">Trip End</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">End IO9</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Remarks / Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-20 text-slate-400 font-bold">
                    Loading rule-based trip logs...
                  </td>
                </tr>
              ) : !Array.isArray(trips) || trips.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-20 text-slate-400 font-bold">
                    No trips found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-black text-slate-900 flex items-center gap-2.5">
                      <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                        <Truck size={14} className="text-slate-600"/>
                      </div> 
                      {t.vehicle_name}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600">
                      {formatDateTime(t.start_time)}
                    </td>
                    <td className="px-5 py-4 font-bold text-purple-600">
                      {formatDateTime(t.unloading_start_time)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600">
                      {formatDateTime(t.end_time)}
                    </td>
                    <td className="px-5 py-4 font-black text-blue-600">
                      {t.total_cycle_minutes ? formatDuration(t.total_cycle_minutes) : 'In Transit'}
                    </td>
                    <td className="px-5 py-4 font-black text-emerald-600">
                      {t.end_io9 !== null && t.end_io9 !== undefined ? t.end_io9 : '---'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        t.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : t.status === 'FLAGGED'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-500">
                      {t.status === 'FLAGGED' ? (
                        <span className="flex items-center gap-1 text-amber-600 font-bold">
                          <AlertTriangle size={14} /> {t.remarks || 'Completed outside un-loading area'}
                        </span>
                      ) : (
                        t.remarks || 'Normal Completion'
                      )}
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
          Page <span className="text-blue-600">{page}</span> of <span className="text-slate-900">{totalPages}</span>
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
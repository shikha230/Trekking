// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import {
//   FileDown, Calendar, Cpu, CheckCircle, AlertCircle,
//   Loader2, Search, X, CheckSquare, Square, FileSpreadsheet, Layers
// } from 'lucide-react';

// const CONCURRENCY_LIMIT = 4; // 4 parallel requests at a time (fast without overloading 2-vCPU DB)

// const ReportExport = () => {
//   const [devices, setDevices] = useState([]);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [dropdownOpen, setDropdownOpen] = useState(false);

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [progressText, setProgressText] = useState('');
//   const [notification, setNotification] = useState({ type: '', message: '' });

//   const dropdownRef = useRef(null);

//   // 1. Fetch available trucks/devices
//   useEffect(() => {
//     const fetchDevices = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/live`);
//         setDevices(res.data || []);
//       } catch (err) {
//         console.error('Error fetching devices:', err);
//       }
//     };
//     fetchDevices();
//   }, []);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const showNotification = (type, message) => {
//     setNotification({ type, message });
//     setTimeout(() => {
//       setNotification({ type: '', message: '' });
//     }, 5000);
//   };

//   const isAllSelected = devices.length > 0 && selectedIds.length === devices.length;

//   // Toggle single device
//   const toggleDevice = (id) => {
//     const strId = String(id);
//     setSelectedIds((prev) =>
//       prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId]
//     );
//   };

//   // Select All / Deselect All ("All" option)
//   const handleToggleAll = () => {
//     if (isAllSelected) {
//       setSelectedIds([]);
//     } else {
//       setSelectedIds(devices.map((d) => String(d.traccar_id)));
//     }
//   };

//   const filteredDevices = devices.filter((d) => {
//     const q = searchTerm.toLowerCase();
//     return (
//       String(d.name || '').toLowerCase().includes(q) ||
//       String(d.imei || '').toLowerCase().includes(q)
//     );
//   });

//   const selectedDevicesList = devices.filter((d) =>
//     selectedIds.includes(String(d.traccar_id))
//   );

//   // 2. Download Single Consolidated Excel (.xlsx) File using Concurrent Worker Pool
//   const handleDownloadConsolidatedExcel = async (e) => {
//     e.preventDefault();

//     if (selectedIds.length === 0) {
//       showNotification('error', 'Please select "All Trucks" or at least one truck/device.');
//       return;
//     }

//     setLoading(true);
//     setNotification({ type: '', message: '' });

//     const resultsByIndex = new Array(selectedDevicesList.length).fill(null);
//     const emptyDevices = [];
//     const failedDevices = [];

//     try {
//       const formattedStart = startDate && startDate.length === 16 ? `${startDate}:00` : startDate;
//       const formattedEnd = endDate && endDate.length === 16 ? `${endDate}:00` : endDate;
//       const dateTag = startDate ? startDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

//       let nextIndex = 0;
//       let completedCount = 0;

//       const worker = async () => {
//         while (nextIndex < selectedDevicesList.length) {
//           const currentIdx = nextIndex++;
//           const dev = selectedDevicesList[currentIdx];

//           setProgressText(
//             `Fetching (${completedCount + 1}/${selectedDevicesList.length}): ${dev.name}...`
//           );

//           try {
//             const params = new URLSearchParams();
//             params.append('deviceId', dev.traccar_id);
//             if (formattedStart) params.append('startDate', formattedStart);
//             if (formattedEnd) params.append('endDate', formattedEnd);

//             const response = await axios.get(
//               `${import.meta.env.VITE_API_URL}/api/download_custom_csv?${params.toString()}`,
//               { responseType: 'text', timeout: 60000 }
//             );

//             const csvText = typeof response.data === 'string' ? response.data : '';
//             if (!csvText.trim()) {
//               emptyDevices.push(dev.name);
//               continue;
//             }

//             const parsedWb = XLSX.read(csvText, { type: 'string' });
//             const firstSheetName = parsedWb.SheetNames[0];
//             if (!firstSheetName) {
//               emptyDevices.push(dev.name);
//               continue;
//             }

//             const firstSheet = parsedWb.Sheets[firstSheetName];
//             const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

//             if (!Array.isArray(rows) || rows.length === 0) {
//               emptyDevices.push(dev.name);
//               continue;
//             }

//             resultsByIndex[currentIdx] = {
//               dev,
//               rows,
//             };
//           } catch (devErr) {
//             console.error(`Failed for ${dev.name}:`, devErr);
//             failedDevices.push(dev.name);
//           } finally {
//             completedCount += 1;
//             setProgressText(`Processed ${completedCount} of ${selectedDevicesList.length} trucks...`);
//           }
//         }
//       };

//       const poolSize = Math.min(CONCURRENCY_LIMIT, selectedDevicesList.length);
//       await Promise.all(Array.from({ length: poolSize }, () => worker()));

//       // Preserve exact truck order & assign sequential Sr. No.
//       const allConsolidatedRows = [];
//       let trucksWithDataCount = 0;

//       for (const item of resultsByIndex) {
//         if (!item) continue;
//         trucksWithDataCount += 1;

//         for (const row of item.rows) {
//           const { ['Truck Name']: _oldName, IMEI: _oldImei, ['Sr. No.']: _oldSr, ...restFields } = row;
//           allConsolidatedRows.push({
//             'Sr. No.': allConsolidatedRows.length + 1,
//             'Truck Name': item.dev.name || 'N/A',
//             'IMEI': item.dev.imei || 'N/A',
//             ...restFields
//           });
//         }
//       }

//       if (allConsolidatedRows.length > 0) {
//         setProgressText('Building systematic Excel sheet...');

//         const newWb = XLSX.utils.book_new();
//         const newWs = XLSX.utils.json_to_sheet(allConsolidatedRows);

//         const headers = Object.keys(allConsolidatedRows[0]);
//         newWs['!cols'] = headers.map((header) => {
//           const maxLen = Math.max(
//             header.length,
//             ...allConsolidatedRows.slice(0, 200).map((r) => String(r[header] ?? '').length)
//           );
//           return { wch: Math.min(Math.max(maxLen + 3, 12), 35) };
//         });

//         XLSX.utils.book_append_sheet(newWb, newWs, 'Consolidated_Report');

//         // Reliable Blob download
//         const wbArray = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
//         const blob = new Blob([wbArray], {
//           type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//         });
//         const blobUrl = URL.createObjectURL(blob);

//         const fileLabel = isAllSelected
//           ? `All_Fleet_Consolidated_${dateTag}.xlsx`
//           : `Fleet_Report_${trucksWithDataCount}_Trucks_${dateTag}.xlsx`;

//         const link = document.createElement('a');
//         link.href = blobUrl;
//         link.setAttribute('download', fileLabel);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

//         const skippedMsg = emptyDevices.length
//           ? ` | Empty: ${emptyDevices.join(', ')}`
//           : '';
//         const errMsg = failedDevices.length
//           ? ` | API Error: ${failedDevices.join(', ')}`
//           : '';

//         showNotification(
//           'success',
//           `Downloaded ${fileLabel} (${allConsolidatedRows.length} rows across ${trucksWithDataCount} truck(s))${skippedMsg}${errMsg}`
//         );
//       } else {
//         const detail =
//           failedDevices.length > 0
//             ? `API error on ${failedDevices.join(', ')}. Check backend console/Network tab.`
//             : 'No rows returned for selected date/time range. Try widening Start/End Date & Time.';
//         showNotification('error', detail);
//       }
//     } catch (err) {
//       console.error('Export error:', err);
//       showNotification('error', 'Export failed. Please try again.');
//     } finally {
//       setLoading(false);
//       setProgressText('');
//     }
//   };

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto font-sans text-slate-900">
//       <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">

//         {/* Header */}
//         <div className="flex items-center gap-3 mb-6">
//           <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-200">
//             <FileSpreadsheet className="text-blue-600" size={24} />
//           </div>
//           <div>
//             <h1 className="text-xl font-black text-slate-900">Custom Fleet Report Export</h1>
//             <p className="text-xs text-slate-500 font-medium">
//               Select "All" or multiple trucks to download all data systematically in a single Excel sheet
//             </p>
//           </div>
//         </div>

//         {/* Notification Alert */}
//         {notification.message && (
//           <div
//             className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm ${
//               notification.type === 'success'
//                 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
//                 : 'bg-rose-50 text-rose-700 border border-rose-200'
//             }`}
//           >
//             {notification.type === 'success' ? (
//               <CheckCircle size={18} className="shrink-0" />
//             ) : (
//               <AlertCircle size={18} className="shrink-0" />
//             )}
//             <span>{notification.message}</span>
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={handleDownloadConsolidatedExcel} className="space-y-4">

//           {/* Multi-Select Device Dropdown with "All" Option */}
//           <div ref={dropdownRef} className="relative">
//             <div className="flex items-center justify-between mb-2">
//               <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
//                 Select Trucks / Devices ({isAllSelected ? `All (${devices.length})` : `${selectedIds.length} Selected`})
//               </label>
//               <button
//                 type="button"
//                 onClick={handleToggleAll}
//                 className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
//               >
//                 {isAllSelected ? 'Clear All' : 'Select All'}
//               </button>
//             </div>

//             {/* Trigger Box */}
//             <div
//               onClick={() => setDropdownOpen((o) => !o)}
//               className="w-full min-h-[46px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus-within:border-blue-600 transition-all cursor-pointer flex flex-wrap items-center gap-1.5"
//             >
//               <Cpu size={16} className="text-slate-400 mr-1 shrink-0" />
//               {selectedDevicesList.length === 0 ? (
//                 <span className="text-slate-400 font-semibold">Click to select "All" or specific trucks...</span>
//               ) : isAllSelected ? (
//                 <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5">
//                   <Layers size={13} />
//                   All Trucks ({devices.length})
//                   <X
//                     size={12}
//                     className="hover:text-rose-200"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setSelectedIds([]);
//                     }}
//                   />
//                 </span>
//               ) : (
//                 selectedDevicesList.map((dev) => (
//                   <span
//                     key={dev.traccar_id}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       toggleDevice(dev.traccar_id);
//                     }}
//                     className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-blue-700"
//                   >
//                     {dev.name}
//                     <X size={12} />
//                   </span>
//                 ))
//               )}
//             </div>

//             {/* Dropdown List */}
//             {dropdownOpen && (
//               <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
//                 {/* Search Input */}
//                 <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
//                   <Search size={14} className="text-slate-400" />
//                   <input
//                     type="text"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     placeholder="Type truck name or IMEI..."
//                     className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
//                     autoFocus
//                   />
//                   {searchTerm && (
//                     <button
//                       type="button"
//                       onClick={() => setSearchTerm('')}
//                       className="text-slate-400 hover:text-slate-600 cursor-pointer"
//                     >
//                       <X size={14} />
//                     </button>
//                   )}
//                 </div>

//                 {/* "All Trucks / Fleet" Option Row */}
//                 {devices.length > 0 && (
//                   <div
//                     onClick={handleToggleAll}
//                     className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 transition-colors ${
//                       isAllSelected
//                         ? 'bg-indigo-50 text-indigo-900 font-black'
//                         : 'bg-slate-50/70 hover:bg-indigo-50/50 text-slate-800 font-bold'
//                     }`}
//                   >
//                     <div className="flex items-center gap-2.5">
//                       {isAllSelected ? (
//                         <CheckSquare size={16} className="text-indigo-600 shrink-0" />
//                       ) : (
//                         <Square size={16} className="text-slate-400 shrink-0" />
//                       )}
//                       <div>
//                         <p className="font-bold">All Trucks / Fleet</p>
//                         <p className="text-[10px] text-slate-500">
//                           Combine all {devices.length} devices into one systematic Excel sheet
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Device Options */}
//                 <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
//                   {filteredDevices.length === 0 ? (
//                     <div className="p-4 text-center text-xs text-slate-400">No matching trucks found</div>
//                   ) : (
//                     filteredDevices.map((d) => {
//                       const isChecked = selectedIds.includes(String(d.traccar_id));
//                       return (
//                         <div
//                           key={d.traccar_id}
//                           onClick={() => toggleDevice(d.traccar_id)}
//                           className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
//                             isChecked ? 'bg-blue-50/70 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
//                           }`}
//                         >
//                           <div className="flex items-center gap-2.5">
//                             {isChecked ? (
//                               <CheckSquare size={16} className="text-blue-600 shrink-0" />
//                             ) : (
//                               <Square size={16} className="text-slate-400 shrink-0" />
//                             )}
//                             <div>
//                               <p className="font-bold">{d.name}</p>
//                               <p className="text-[10px] text-slate-400 font-mono">IMEI: {d.imei}</p>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Start Date & Time */}
//           <div>
//             <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
//               Start Date & Time
//             </label>
//             <div className="relative">
//               <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
//                 <Calendar size={16} />
//               </span>
//               <input
//                 type="datetime-local"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//                 required
//                 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
//               />
//             </div>
//           </div>

//           {/* End Date & Time */}
//           <div>
//             <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
//               End Date & Time
//             </label>
//             <div className="relative">
//               <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
//                 <Calendar size={16} />
//               </span>
//               <input
//                 type="datetime-local"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//                 required
//                 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
//               />
//             </div>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
//           >
//             {loading ? (
//               <>
//                 <Loader2 size={16} className="animate-spin" /> {progressText || 'Generating Consolidated Excel...'}
//               </>
//             ) : (
//               <>
//                 <FileDown size={16} /> Download Consolidated Excel ({selectedIds.length} Trucks)
//               </>
//             )}
//           </button>
//         </form>

//       </div>
//     </div>
//   );
// };

// export default ReportExport;





// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import * as XLSX from 'xlsx';
// import {
//   FileDown, Calendar, Cpu, CheckCircle, AlertCircle,
//   Loader2, Search, X, CheckSquare, Square, FileSpreadsheet, Layers, Clock
// } from 'lucide-react';

// const formatIstClock = (dateObj = new Date()) => {
//   return `${dateObj.toLocaleTimeString('en-IN', {
//     timeZone: 'Asia/Kolkata',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: true,
//   }).toUpperCase()} IST`;
// };

// const getCountdownStartSeconds = (truckCount, startVal, endVal) => {
//   let hoursSpan = 8;
//   if (startVal && endVal) {
//     const diffMs = new Date(endVal).getTime() - new Date(startVal).getTime();
//     if (!Number.isNaN(diffMs) && diffMs > 0) {
//       hoursSpan = Math.max(1, diffMs / (1000 * 60 * 60));
//     }
//   }
//   const complexityFactor = Math.min(hoursSpan / 8, 4);
//   const rawSec = 4 + truckCount * 0.08 * complexityFactor;
//   return Math.min(Math.max(Math.round(rawSec), 5), 60);
// };

// const ReportExport = () => {
//   const [devices, setDevices] = useState([]);
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [dropdownOpen, setDropdownOpen] = useState(false);

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [progressText, setProgressText] = useState('');
//   const [countdownSec, setCountdownSec] = useState(0);
//   const [initialCountdownSec, setInitialCountdownSec] = useState(0);
//   const [istClock, setIstClock] = useState(() => formatIstClock());
//   const [notification, setNotification] = useState({ type: '', message: '' });

//   const dropdownRef = useRef(null);
//   const timerIntervalRef = useRef(null);

//   useEffect(() => {
//     const fetchDevices = async () => {
//       try {
//         const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/live`);
//         setDevices(res.data || []);
//       } catch (err) {
//         console.error('Error fetching devices:', err);
//       }
//     };
//     fetchDevices();
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   useEffect(() => {
//     return () => {
//       if (timerIntervalRef.current) {
//         clearInterval(timerIntervalRef.current);
//       }
//     };
//   }, []);

//   const startCountdown = (truckCount, startVal, endVal) => {
//     if (timerIntervalRef.current) {
//       clearInterval(timerIntervalRef.current);
//     }
//     const startFrom = getCountdownStartSeconds(truckCount, startVal, endVal);
//     setInitialCountdownSec(startFrom);
//     setCountdownSec(startFrom);
//     setIstClock(formatIstClock(new Date()));

//     timerIntervalRef.current = setInterval(() => {
//       setIstClock(formatIstClock(new Date()));
//       setCountdownSec((prev) => (prev > 0 ? prev - 1 : 0));
//     }, 1000);
//   };

//   const stopCountdown = () => {
//     if (timerIntervalRef.current) {
//       clearInterval(timerIntervalRef.current);
//       timerIntervalRef.current = null;
//     }
//   };

//   const showNotification = (type, message) => {
//     setNotification({ type, message });
//     setTimeout(() => {
//       setNotification({ type: '', message: '' });
//     }, 6000);
//   };

//   const isAllSelected = devices.length > 0 && selectedIds.length === devices.length;

//   const toggleDevice = (id) => {
//     const strId = String(id);
//     setSelectedIds((prev) =>
//       prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId]
//     );
//   };

//   const handleToggleAll = () => {
//     if (isAllSelected) {
//       setSelectedIds([]);
//     } else {
//       setSelectedIds(devices.map((d) => String(d.traccar_id)));
//     }
//   };

//   const filteredDevices = devices.filter((d) => {
//     const q = searchTerm.toLowerCase();
//     return (
//       String(d.name || '').toLowerCase().includes(q) ||
//       String(d.imei || '').toLowerCase().includes(q)
//     );
//   });

//   const selectedDevicesList = devices.filter((d) =>
//     selectedIds.includes(String(d.traccar_id))
//   );

//   const handleDownloadConsolidatedExcel = async (e) => {
//     e.preventDefault();

//     if (selectedIds.length === 0) {
//       showNotification('error', 'Please select "All Trucks" or at least one truck/device.');
//       return;
//     }

//     setLoading(true);
//     setNotification({ type: '', message: '' });
//     startCountdown(selectedIds.length, startDate, endDate);

//     try {
//       const formattedStart = startDate && startDate.length === 16 ? `${startDate}:00` : startDate;
//       const formattedEnd = endDate && endDate.length === 16 ? `${endDate}:00` : endDate;
//       const dateTag = startDate ? startDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

//       const deviceParam = isAllSelected ? 'all' : selectedIds.join(',');

//       setProgressText(
//         isAllSelected
//           ? `Fetching data for all ${devices.length} trucks...`
//           : `Fetching data for ${selectedIds.length} selected truck(s)...`
//       );

//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/download_custom_csv`,
//         {
//           params: {
//             deviceId: deviceParam,
//             ...(formattedStart ? { startDate: formattedStart } : {}),
//             ...(formattedEnd ? { endDate: formattedEnd } : {}),
//           },
//           timeout: 120000,
//         }
//       );

//       const rawRows = Array.isArray(response.data) ? response.data : [];

//       if (rawRows.length === 0) {
//         showNotification(
//           'error',
//           'No rows returned for selected trucks & date/time range. Try widening Start/End Date & Time.'
//         );
//         return;
//       }

//       setProgressText('Building systematic Excel sheet...');

//       const trucksWithDataSet = new Set();
//       const allConsolidatedRows = rawRows.map((row, idx) => {
//         const truckName = row.device_name || 'N/A';
//         if (row.device_name) {
//           trucksWithDataSet.add(String(row.device_name));
//         }

//         return {
//           'Sr. No.': idx + 1,
//           'Truck Name': truckName,
//           'IMEI': row.device_imei || 'N/A',
//           ...row,
//         };
//       });

//       const emptyTrucks = selectedDevicesList
//         .map((d) => d.name)
//         .filter((name) => name && !trucksWithDataSet.has(String(name)));

//       const newWb = XLSX.utils.book_new();
//       const newWs = XLSX.utils.json_to_sheet(allConsolidatedRows);

//       const headers = Object.keys(allConsolidatedRows[0]);
//       newWs['!cols'] = headers.map((header) => {
//         const maxLen = Math.max(
//           header.length,
//           ...allConsolidatedRows.slice(0, 100).map((r) => String(r[header] ?? '').length)
//         );
//         return { wch: Math.min(Math.max(maxLen + 3, 12), 35) };
//       });

//       XLSX.utils.book_append_sheet(newWb, newWs, 'Consolidated_Report');

//       const wbArray = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
//       const blob = new Blob([wbArray], {
//         type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       });
//       const blobUrl = URL.createObjectURL(blob);

//       const fileLabel = isAllSelected
//         ? `All_Fleet_Consolidated_${dateTag}.xlsx`
//         : `Fleet_Report_${trucksWithDataSet.size}_Trucks_${dateTag}.xlsx`;

//       const link = document.createElement('a');
//       link.href = blobUrl;
//       link.setAttribute('download', fileLabel);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

//       const skippedMsg =
//         emptyTrucks.length > 0
//           ? ` | No Data (${emptyTrucks.length}): ${emptyTrucks.slice(0, 8).join(', ')}${
//               emptyTrucks.length > 8 ? '...' : ''
//             }`
//           : '';

//       const allTrucksSuccessMsg =
//         emptyTrucks.length === 0
//           ? `All ${trucksWithDataSet.size} selected truck(s) data downloaded successfully! `
//           : '';

//       showNotification(
//         'success',
//         `${allTrucksSuccessMsg}Saved ${fileLabel} (${allConsolidatedRows.length} rows)${skippedMsg}`
//       );
//     } catch (err) {
//       console.error('Export error:', err);
//       showNotification('error', 'Export failed. Please try again.');
//     } finally {
//       stopCountdown();
//       setLoading(false);
//       setProgressText('');
//       setCountdownSec(0);
//       setInitialCountdownSec(0);
//     }
//   };

//   const progressPercent =
//     initialCountdownSec > 0
//       ? Math.max(
//           8,
//           Math.min(100, Math.round(((initialCountdownSec - countdownSec) / initialCountdownSec) * 100))
//         )
//       : 10;

//   const timerDisplay = countdownSec > 0 ? `${countdownSec}s` : 'Finishing...';

//   return (
//     <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto font-sans text-slate-900">
//       <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">

//         {/* Header */}
//         <div className="flex items-center gap-3 mb-6">
//           <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-200">
//             <FileSpreadsheet className="text-blue-600" size={24} />
//           </div>
//           <div>
//             <h1 className="text-xl font-black text-slate-900">Custom Fleet Report Export</h1>
//             <p className="text-xs text-slate-500 font-medium">
//               Select "All" or multiple trucks to download all data systematically in a single Excel sheet
//             </p>
//           </div>
//         </div>

//         {/* Notification Alert */}
//         {notification.message && (
//           <div
//             className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm ${
//               notification.type === 'success'
//                 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
//                 : 'bg-rose-50 text-rose-700 border border-rose-200'
//             }`}
//           >
//             {notification.type === 'success' ? (
//               <CheckCircle size={18} className="shrink-0" />
//             ) : (
//               <AlertCircle size={18} className="shrink-0" />
//             )}
//             <span>{notification.message}</span>
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={handleDownloadConsolidatedExcel} className="space-y-4">

//           {/* Multi-Select Device Dropdown with "All" Option */}
//           <div ref={dropdownRef} className="relative">
//             <div className="flex items-center justify-between mb-2">
//               <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
//                 Select Trucks / Devices ({isAllSelected ? `All (${devices.length})` : `${selectedIds.length} Selected`})
//               </label>
//               <button
//                 type="button"
//                 onClick={handleToggleAll}
//                 className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
//               >
//                 {isAllSelected ? 'Clear All' : 'Select All'}
//               </button>
//             </div>

//             <div
//               onClick={() => setDropdownOpen((o) => !o)}
//               className="w-full min-h-[46px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus-within:border-blue-600 transition-all cursor-pointer flex flex-wrap items-center gap-1.5"
//             >
//               <Cpu size={16} className="text-slate-400 mr-1 shrink-0" />
//               {selectedDevicesList.length === 0 ? (
//                 <span className="text-slate-400 font-semibold">Click to select "All" or specific trucks...</span>
//               ) : isAllSelected ? (
//                 <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5">
//                   <Layers size={13} />
//                   All Trucks ({devices.length})
//                   <X
//                     size={12}
//                     className="hover:text-rose-200"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setSelectedIds([]);
//                     }}
//                   />
//                 </span>
//               ) : (
//                 selectedDevicesList.map((dev) => (
//                   <span
//                     key={dev.traccar_id}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       toggleDevice(dev.traccar_id);
//                     }}
//                     className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-blue-700"
//                   >
//                     {dev.name}
//                     <X size={12} />
//                   </span>
//                 ))
//               )}
//             </div>

//             {dropdownOpen && (
//               <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
//                 <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
//                   <Search size={14} className="text-slate-400" />
//                   <input
//                     type="text"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     placeholder="Type truck name or IMEI..."
//                     className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
//                     autoFocus
//                   />
//                   {searchTerm && (
//                     <button
//                       type="button"
//                       onClick={() => setSearchTerm('')}
//                       className="text-slate-400 hover:text-slate-600 cursor-pointer"
//                     >
//                       <X size={14} />
//                     </button>
//                   )}
//                 </div>

//                 {devices.length > 0 && (
//                   <div
//                     onClick={handleToggleAll}
//                     className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 transition-colors ${
//                       isAllSelected
//                         ? 'bg-indigo-50 text-indigo-900 font-black'
//                         : 'bg-slate-50/70 hover:bg-indigo-50/50 text-slate-800 font-bold'
//                     }`}
//                   >
//                     <div className="flex items-center gap-2.5">
//                       {isAllSelected ? (
//                         <CheckSquare size={16} className="text-indigo-600 shrink-0" />
//                       ) : (
//                         <Square size={16} className="text-slate-400 shrink-0" />
//                       )}
//                       <div>
//                         <p className="font-bold">All Trucks / Fleet</p>
//                         <p className="text-[10px] text-slate-500">
//                           Combine all {devices.length} devices into one systematic Excel sheet
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
//                   {filteredDevices.length === 0 ? (
//                     <div className="p-4 text-center text-xs text-slate-400">No matching trucks found</div>
//                   ) : (
//                     filteredDevices.map((d) => {
//                       const isChecked = selectedIds.includes(String(d.traccar_id));
//                       return (
//                         <div
//                           key={d.traccar_id}
//                           onClick={() => toggleDevice(d.traccar_id)}
//                           className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
//                             isChecked ? 'bg-blue-50/70 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
//                           }`}
//                         >
//                           <div className="flex items-center gap-2.5">
//                             {isChecked ? (
//                               <CheckSquare size={16} className="text-blue-600 shrink-0" />
//                             ) : (
//                               <Square size={16} className="text-slate-400 shrink-0" />
//                             )}
//                             <div>
//                               <p className="font-bold">{d.name}</p>
//                               <p className="text-[10px] text-slate-400 font-mono">IMEI: {d.imei}</p>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Start Date & Time */}
//           <div>
//             <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
//               Start Date & Time (IST)
//             </label>
//             <div className="relative">
//               <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
//                 <Calendar size={16} />
//               </span>
//               <input
//                 type="datetime-local"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//                 required
//                 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
//               />
//             </div>
//           </div>

//           {/* End Date & Time */}
//           <div>
//             <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
//               End Date & Time (IST)
//             </label>
//             <div className="relative">
//               <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
//                 <Calendar size={16} />
//               </span>
//               <input
//                 type="datetime-local"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//                 required
//                 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
//               />
//             </div>
//           </div>

//           {/* 3-2-1 Countdown + IST Clock Box */}
//           {loading && (
//             <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
//               <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
//                 <span className="flex items-center gap-1.5 text-blue-700 font-mono">
//                   <Clock size={14} />
//                   Timer: {timerDisplay}
//                 </span>
//                 <span className="text-slate-800 font-mono bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
//                   {istClock}
//                 </span>
//               </div>
//               <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-blue-600 transition-all duration-700 rounded-full"
//                   style={{ width: `${progressPercent}%` }}
//                 />
//               </div>
//               <p className="text-[11px] text-slate-500 font-medium">
//                 {progressText || 'Preparing report...'}
//               </p>
//             </div>
//           )}

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
//           >
//             {loading ? (
//               <>
//                 <Loader2 size={16} className="animate-spin" />
//                 {`Downloading (${timerDisplay} • ${istClock})`}
//               </>
//             ) : (
//               <>
//                 <FileDown size={16} /> Download Consolidated Excel ({selectedIds.length} Trucks)
//               </>
//             )}
//           </button>
//         </form>

//       </div>
//     </div>
//   );
// };

// export default ReportExport;
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  FileDown, Calendar, Cpu, CheckCircle, AlertCircle,
  Loader2, Search, X, CheckSquare, Square, FileSpreadsheet, Layers, Clock
} from 'lucide-react';

const MAX_NON_ADMIN_VEHICLES = 3;
const MAX_NON_ADMIN_HOURS = 8;
const MAX_NON_ADMIN_MS = MAX_NON_ADMIN_HOURS * 60 * 60 * 1000;

const getIsAdminUser = () => {
  try {
    const storedUser = JSON.parse(
      localStorage.getItem('user') || localStorage.getItem('adminUser') || '{}'
    );
    const userRole = (storedUser.role || '').toLowerCase();
    return (
      userRole === 'admin' ||
      storedUser.email === 'admin@trucktrak.com' ||
      (storedUser.email || '').includes('admin') ||
      Boolean(localStorage.getItem('adminToken'))
    );
  } catch {
    return false;
  }
};

const formatIstClock = (dateObj = new Date()) => {
  return `${dateObj.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toUpperCase()} IST`;
};

const getCountdownStartSeconds = (truckCount, startVal, endVal) => {
  let hoursSpan = 8;
  if (startVal && endVal) {
    const diffMs = new Date(endVal).getTime() - new Date(startVal).getTime();
    if (!Number.isNaN(diffMs) && diffMs > 0) {
      hoursSpan = Math.max(1, diffMs / (1000 * 60 * 60));
    }
  }
  const complexityFactor = Math.min(hoursSpan / 8, 4);
  const rawSec = 4 + truckCount * 0.08 * complexityFactor;
  return Math.min(Math.max(Math.round(rawSec), 5), 60);
};

const xmlEscape = (val) => {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const colIndexToLetter = (idx) => {
  let num = idx + 1;
  let letters = '';
  while (num > 0) {
    const rem = (num - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    num = Math.floor((num - 1) / 26);
  }
  return letters;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const computeCrc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const buildStoredZipBlob = (entries) => {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes =
      entry.data instanceof Uint8Array ? entry.data : encoder.encode(entry.data);
    const crc = computeCrc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x0021, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);

    localParts.push(localHeader, nameBytes, dataBytes);

    const centralHeader = new Uint8Array(46);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x0021, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);

    centralParts.push(centralHeader, nameBytes);
    offset += localHeader.length + nameBytes.length + size;
  }

  let centralSize = 0;
  for (const part of centralParts) {
    centralSize += part.length;
  }

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

const buildSheetXmlParts = (rows, headers) => {
  const parts = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>',
  ];

  let headerRowXml = '<row r="1">';
  for (let c = 0; c < headers.length; c++) {
    const ref = `${colIndexToLetter(c)}1`;
    headerRowXml += `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(headers[c])}</t></is></c>`;
  }
  headerRowXml += '</row>';
  parts.push(headerRowXml);

  const ROW_BATCH = 1000;
  for (let start = 0; start < rows.length; start += ROW_BATCH) {
    const end = Math.min(start + ROW_BATCH, rows.length);
    let batchXml = '';

    for (let rIdx = start; rIdx < end; rIdx++) {
      const excelRowNum = rIdx + 2;
      const rowObj = rows[rIdx];
      batchXml += `<row r="${excelRowNum}">`;

      for (let c = 0; c < headers.length; c++) {
        const val = rowObj[headers[c]];
        if (val === null || val === undefined || val === '') continue;

        const ref = `${colIndexToLetter(c)}${excelRowNum}`;
        if (typeof val === 'number' && Number.isFinite(val)) {
          batchXml += `<c r="${ref}"><v>${val}</v></c>`;
        } else {
          batchXml += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(val)}</t></is></c>`;
        }
      }

      batchXml += '</row>';
    }

    parts.push(batchXml);
  }

  parts.push('</sheetData></worksheet>');
  return parts;
};

const buildMultiSheetXlsxBlob = (sheets) => {
  const safeSheetNames = sheets.map((s) =>
    String(s.name || 'Sheet').replace(/[\\/?*[\]:]/g, '_').slice(0, 31)
  );

  const zipEntries = [
    {
      name: '[Content_Types].xml',
      data: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        ...safeSheetNames.map(
          (_, idx) =>
            `<Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
        ),
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
        '</Types>',
      ].join(''),
    },
    {
      name: '_rels/.rels',
      data: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
        '</Relationships>',
      ].join(''),
    },
    {
      name: 'xl/workbook.xml',
      data: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
        '<sheets>',
        ...safeSheetNames.map(
          (sheetTitle, idx) =>
            `<sheet name="${xmlEscape(sheetTitle)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>`
        ),
        '</sheets>',
        '</workbook>',
      ].join(''),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        ...safeSheetNames.map(
          (_, idx) =>
            `<Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>`
        ),
        `<Relationship Id="rId${safeSheetNames.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
        '</Relationships>',
      ].join(''),
    },
    {
      name: 'xl/styles.xml',
      data: [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
        '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
        '</styleSheet>',
      ].join(''),
    },
  ];

  sheets.forEach((sheet, idx) => {
    const headers =
      sheet.headers && sheet.headers.length > 0
        ? sheet.headers
        : sheet.rows.length > 0
        ? Object.keys(sheet.rows[0])
        : ['Data'];

    zipEntries.push({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      data: buildSheetXmlParts(sheet.rows, headers),
    });
  });

  return buildStoredZipBlob(zipEntries);
};

const triggerBlobDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
};

const ReportExport = () => {
  const isAdmin = getIsAdminUser();

  const [devices, setDevices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [countdownSec, setCountdownSec] = useState(0);
  const [initialCountdownSec, setInitialCountdownSec] = useState(0);
  const [istClock, setIstClock] = useState(() => formatIstClock());
  const [notification, setNotification] = useState({ type: '', message: '', missingTrucks: [] });

  const dropdownRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/live`);
        setDevices(res.data || []);
      } catch (err) {
        console.error('Error fetching devices:', err);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const startCountdown = (truckCount, startVal, endVal) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    const startFrom = getCountdownStartSeconds(truckCount, startVal, endVal);
    setInitialCountdownSec(startFrom);
    setCountdownSec(startFrom);
    setIstClock(formatIstClock(new Date()));

    timerIntervalRef.current = setInterval(() => {
      setIstClock(formatIstClock(new Date()));
      setCountdownSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const stopCountdown = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const showNotification = (type, message, missingTrucks = []) => {
    setNotification({ type, message, missingTrucks });
  };

  const isAllSelected = isAdmin && devices.length > 0 && selectedIds.length === devices.length;

  const toggleDevice = (id) => {
    const strId = String(id);
    setSelectedIds((prev) => {
      if (prev.includes(strId)) {
        return prev.filter((item) => item !== strId);
      }
      if (!isAdmin && prev.length >= MAX_NON_ADMIN_VEHICLES) {
        showNotification(
          'error',
          `Non-admin users can select a maximum of ${MAX_NON_ADMIN_VEHICLES} vehicles at a time.`
        );
        return prev;
      }
      return [...prev, strId];
    });
  };

  const handleToggleAll = () => {
    if (!isAdmin) {
      showNotification(
        'error',
        `Select All is available for Admin only. Non-admin users can select up to ${MAX_NON_ADMIN_VEHICLES} vehicles.`
      );
      return;
    }
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(devices.map((d) => String(d.traccar_id)));
    }
  };

  const validateDateWindow = () => {
    if (!startDate || !endDate) {
      return 'Please select both Start Date & Time and End Date & Time.';
    }
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return 'Please enter valid Start and End Date & Time values.';
    }
    if (endMs <= startMs) {
      return 'End Date & Time must be after Start Date & Time.';
    }
    if (!isAdmin && endMs - startMs > MAX_NON_ADMIN_MS) {
      return `Non-admin users can export a maximum window of ${MAX_NON_ADMIN_HOURS} hours at a time.`;
    }
    return '';
  };

  const filteredDevices = devices.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      String(d.name || '').toLowerCase().includes(q) ||
      String(d.imei || '').toLowerCase().includes(q)
    );
  });

  const selectedDevicesList = devices.filter((d) =>
    selectedIds.includes(String(d.traccar_id))
  );

  const handleDownloadConsolidatedExcel = async (e) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      showNotification(
        'error',
        isAdmin
          ? 'Please select "All Trucks" or at least one truck/device.'
          : `Please select at least 1 truck (maximum ${MAX_NON_ADMIN_VEHICLES} vehicles).`
      );
      return;
    }

    if (!isAdmin && selectedIds.length > MAX_NON_ADMIN_VEHICLES) {
      showNotification(
        'error',
        `Non-admin users can export a maximum of ${MAX_NON_ADMIN_VEHICLES} vehicles at a time.`
      );
      return;
    }

    const windowError = validateDateWindow();
    if (windowError) {
      showNotification('error', windowError);
      return;
    }

    setLoading(true);
    setNotification({ type: '', message: '', missingTrucks: [] });
    startCountdown(selectedIds.length, startDate, endDate);

    try {
      const formattedStart = startDate && startDate.length === 16 ? `${startDate}:00` : startDate;
      const formattedEnd = endDate && endDate.length === 16 ? `${endDate}:00` : endDate;
      const dateTag = startDate ? startDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

      const deviceParam = isAllSelected ? 'all' : selectedIds.join(',');

      setProgressText(
        isAllSelected
          ? `Fetching data for all ${devices.length} trucks...`
          : `Fetching data for ${selectedIds.length} selected truck(s)...`
      );

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/download_custom_csv`,
        {
          params: {
            deviceId: deviceParam,
            ...(formattedStart ? { startDate: formattedStart } : {}),
            ...(formattedEnd ? { endDate: formattedEnd } : {}),
          },
          timeout: 300000,
        }
      );

      const rawRows = Array.isArray(response.data) ? response.data : [];

      if (rawRows.length === 0) {
        showNotification(
          'error',
          'No rows returned for selected trucks & date/time range. Try widening Start/End Date & Time.'
        );
        return;
      }

      setProgressText('Building systematic Excel workbook...');

      const trucksWithDataSet = new Set();
      const imeisWithDataSet = new Set();
      const extraKeysSet = new Set();

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (row.device_name) {
          trucksWithDataSet.add(String(row.device_name).trim().toLowerCase());
        }
        if (row.device_imei) {
          imeisWithDataSet.add(String(row.device_imei).trim());
        }
        for (const k of Object.keys(row)) {
          if (k !== 'device_name' && k !== 'device_imei') {
            extraKeysSet.add(k);
          }
        }
      }

      const headers = ['Sr. No.', 'Truck Name', 'IMEI', ...Array.from(extraKeysSet)];

      const allConsolidatedRows = new Array(rawRows.length);
      for (let idx = 0; idx < rawRows.length; idx++) {
        const row = rawRows[idx];
        allConsolidatedRows[idx] = {
          'Sr. No.': idx + 1,
          'Truck Name': row.device_name || 'N/A',
          'IMEI': row.device_imei || 'N/A',
          ...row,
        };
      }

      const emptyTruckDevices = selectedDevicesList.filter((d) => {
        const normName = String(d.name || '').trim().toLowerCase();
        const normImei = String(d.imei || '').trim();
        const hasByName = normName && trucksWithDataSet.has(normName);
        const hasByImei = normImei && imeisWithDataSet.has(normImei);
        return !hasByName && !hasByImei;
      });

      const emptyTruckNames = emptyTruckDevices.map((d) => d.name || d.imei);

      const sheetsToExport = [
        {
          name: 'Consolidated_Report',
          headers,
          rows: allConsolidatedRows,
        },
      ];

      if (emptyTruckDevices.length > 0) {
        sheetsToExport.push({
          name: 'No_Data_Vehicles',
          headers: [
            'Sr. No.',
            'Truck Name',
            'IMEI',
            'Start Date & Time (IST)',
            'End Date & Time (IST)',
            'Status',
          ],
          rows: emptyTruckDevices.map((d, idx) => ({
            'Sr. No.': idx + 1,
            'Truck Name': d.name || 'N/A',
            'IMEI': d.imei || 'N/A',
            'Start Date & Time (IST)': formattedStart || 'Not Specified',
            'End Date & Time (IST)': formattedEnd || 'Not Specified',
            'Status': 'No GPS Data Found in Selected Period',
          })),
        });
      }

      const fileLabel = isAllSelected
        ? `All_Fleet_Consolidated_${dateTag}.xlsx`
        : `Fleet_Report_${trucksWithDataSet.size}_Trucks_${dateTag}.xlsx`;

      let excelBlob;
      if (allConsolidatedRows.length <= 20000) {
        const wb = XLSX.utils.book_new();
        for (const s of sheetsToExport) {
          const ws = XLSX.utils.json_to_sheet(s.rows, { header: s.headers });
          ws['!cols'] = s.headers.map((header) => {
            const maxLen = Math.max(
              header.length,
              ...s.rows.slice(0, 100).map((r) => String(r[header] ?? '').length)
            );
            return { wch: Math.min(Math.max(maxLen + 3, 12), 35) };
          });
          XLSX.utils.book_append_sheet(wb, ws, s.name);
        }
        const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        excelBlob = new Blob([wbArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        excelBlob = buildMultiSheetXlsxBlob(sheetsToExport);
      }

      triggerBlobDownload(excelBlob, fileLabel);

      const skippedSummary =
        emptyTruckNames.length > 0
          ? ` | No Data (${emptyTruckNames.length} vehicles — also saved in "No_Data_Vehicles" sheet): ${emptyTruckNames.join(', ')}`
          : '';

      const allTrucksSuccessMsg =
        emptyTruckNames.length === 0
          ? `All ${trucksWithDataSet.size} selected truck(s) data downloaded successfully! `
          : '';

      showNotification(
        'success',
        `${allTrucksSuccessMsg}Saved ${fileLabel} (${allConsolidatedRows.length.toLocaleString()} rows)${skippedSummary}`,
        emptyTruckNames
      );
    } catch (err) {
      console.error('Export error:', err);
      const serverMsg = err?.response?.data?.error;
      const reason = serverMsg || err?.message || 'Unknown error';
      showNotification('error', `Export failed: ${reason}`);
    } finally {
      stopCountdown();
      setLoading(false);
      setProgressText('');
      setCountdownSec(0);
      setInitialCountdownSec(0);
    }
  };

  const progressPercent =
    initialCountdownSec > 0
      ? Math.max(
          8,
          Math.min(100, Math.round(((initialCountdownSec - countdownSec) / initialCountdownSec) * 100))
        )
      : 10;

  const timerDisplay = countdownSec > 0 ? `${countdownSec}s` : 'Finishing...';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-200">
            <FileSpreadsheet className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Custom Fleet Report Export</h1>
            <p className="text-xs text-slate-500 font-medium">
              {isAdmin
                ? 'Select "All" or multiple trucks to download all data systematically in a single Excel sheet'
                : `Select up to ${MAX_NON_ADMIN_VEHICLES} trucks and a maximum ${MAX_NON_ADMIN_HOURS}-hour window to export Excel`}
            </p>
          </div>
        </div>

        {/* Persistent Dismissible Notification Alert */}
        {notification.message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-bold shadow-sm border ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {notification.type === 'success' ? (
                  <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
                )}
                <span className="leading-relaxed">{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification({ type: '', message: '', missingTrucks: [] })}
                className="text-slate-500 hover:text-slate-800 p-1 rounded-lg cursor-pointer shrink-0"
                title="Close message"
              >
                <X size={16} />
              </button>
            </div>

            {notification.missingTrucks && notification.missingTrucks.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-emerald-200/80">
                <p className="text-[11px] uppercase tracking-wider text-amber-800 mb-1.5">
                  Vehicles Without Data ({notification.missingTrucks.length}) — Saved in "No_Data_Vehicles" Excel Sheet:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {notification.missingTrucks.map((name, i) => (
                    <span
                      key={`${name}-${i}`}
                      className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[11px]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDownloadConsolidatedExcel} className="space-y-4">

          {/* Multi-Select Device Dropdown */}
          <div ref={dropdownRef} className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                {isAdmin
                  ? `Select Trucks / Devices (${isAllSelected ? `All (${devices.length})` : `${selectedIds.length} Selected`})`
                  : `Select Trucks / Devices (${selectedIds.length}/${MAX_NON_ADMIN_VEHICLES} Max)`}
              </label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {isAllSelected ? 'Clear All' : 'Select All'}
                </button>
              )}
            </div>

            <div
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full min-h-[46px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus-within:border-blue-600 transition-all cursor-pointer flex flex-wrap items-center gap-1.5"
            >
              <Cpu size={16} className="text-slate-400 mr-1 shrink-0" />
              {selectedDevicesList.length === 0 ? (
                <span className="text-slate-400 font-semibold">
                  {isAdmin
                    ? 'Click to select "All" or specific trucks...'
                    : `Click to select up to ${MAX_NON_ADMIN_VEHICLES} trucks...`}
                </span>
              ) : isAllSelected ? (
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5">
                  <Layers size={13} />
                  All Trucks ({devices.length})
                  <X
                    size={12}
                    className="hover:text-rose-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds([]);
                    }}
                  />
                </span>
              ) : (
                selectedDevicesList.map((dev) => (
                  <span
                    key={dev.traccar_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDevice(dev.traccar_id);
                    }}
                    className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-blue-700"
                  >
                    {dev.name}
                    <X size={12} />
                  </span>
                ))
              )}
            </div>

            {dropdownOpen && (
              <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type truck name or IMEI..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isAdmin && devices.length > 0 && (
                  <div
                    onClick={handleToggleAll}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 transition-colors ${
                      isAllSelected
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'bg-slate-50/70 hover:bg-indigo-50/50 text-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isAllSelected ? (
                        <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">All Trucks / Fleet</p>
                        <p className="text-[10px] text-slate-500">
                          Combine all {devices.length} devices into one systematic Excel sheet
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {filteredDevices.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No matching trucks found</div>
                  ) : (
                    filteredDevices.map((d) => {
                      const isChecked = selectedIds.includes(String(d.traccar_id));
                      const isMaxReached = !isAdmin && !isChecked && selectedIds.length >= MAX_NON_ADMIN_VEHICLES;
                      return (
                        <div
                          key={d.traccar_id}
                          onClick={() => toggleDevice(d.traccar_id)}
                          className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-blue-50/70 text-blue-900 font-bold'
                              : isMaxReached
                              ? 'opacity-50 hover:bg-slate-50 text-slate-500'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isChecked ? (
                              <CheckSquare size={16} className="text-blue-600 shrink-0" />
                            ) : (
                              <Square size={16} className="text-slate-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold">{d.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">IMEI: {d.imei}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start Date & Time */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              Start Date & Time (IST){!isAdmin ? ` — Max ${MAX_NON_ADMIN_HOURS}h Window` : ''}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar size={16} />
              </span>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              End Date & Time (IST){!isAdmin ? ` — Max ${MAX_NON_ADMIN_HOURS}h Window` : ''}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar size={16} />
              </span>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Countdown + IST Clock Box */}
          {loading && (
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-blue-700 font-mono">
                  <Clock size={14} />
                  Timer: {timerDisplay}
                </span>
                <span className="text-slate-800 font-mono bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  {istClock}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-700 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {progressText || 'Preparing report...'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {`Downloading (${timerDisplay} • ${istClock})`}
              </>
            ) : (
              <>
                <FileDown size={16} /> Download Consolidated Excel ({selectedIds.length} Trucks)
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ReportExport;
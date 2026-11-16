// import React, { useState, useEffect, useRef } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import axios from 'axios';
// import { Play, Pause, FastForward, Rewind, ArrowLeft, Download, SlidersHorizontal, Layers } from 'lucide-react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import 'leaflet/dist/leaflet.css';

// const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

// // 🎨 Traccar Speed Color Helper (Yellow -> Orange -> Red -> Dark)
// const getSpeedColor = (speedKnots = 0) => {
//   if (speedKnots <= 2) return '#EAB308'; // Yellow (Slow)
//   if (speedKnots <= 5) return '#F97316'; // Orange (Medium)
//   if (speedKnots <= 10) return '#B91C1C'; // Dark Red (Fast)
//   return '#1E293B'; // Near Black (Very Fast / Max)
// };

// // 🚛 Traccar Replay Vehicle Pin / Arrow Marker
// const createTraccarReplayIcon = (heading = 0) => {
//   return L.divIcon({
//     className: 'traccar-replay-marker',
//     html: `
//       <div style="transform: rotate(${heading}deg); transition: transform 0.2s linear; display: flex; align-items: center; justify-content: center;">
//         <svg width="30" height="30" viewBox="0 0 24 24" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.5));">
//           <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
//         </svg>
//       </div>
//     `,
//     iconSize: [30, 30],
//     iconAnchor: [15, 15],
//   });
// };

// const MapController = ({ routeCoordinates, currentPos, isPlaying }) => {
//   const map = useMap();

//   useEffect(() => {
//     if (routeCoordinates && routeCoordinates.length > 0) {
//       const bounds = L.latLngBounds(routeCoordinates);
//       map.fitBounds(bounds, {
//         padding: [80, 80],
//         maxZoom: 20,
//         animate: true,
//       });
//     }
//   }, [routeCoordinates, map]);

//   useEffect(() => {
//     if (isPlaying && currentPos && currentPos[0] && currentPos[1]) {
//       map.panTo(currentPos, { animate: true, duration: 0.4 });
//     }
//   }, [currentPos, isPlaying, map]);

//   return null;
// };

// // 🕒 Accurate IST Timezone Formatter
// const formatISTDateTime = (isoString) => {
//   if (!isoString) return 'N/A';
//   try {
//     const date = new Date(isoString);
//     if (isNaN(date.getTime())) return isoString;

//     return new Intl.DateTimeFormat('en-GB', {
//       timeZone: 'Asia/Kolkata',
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//       hour12: false,
//     }).format(date).replace(',', '');
//   } catch (e) {
//     return isoString;
//   }
// };

// const calculateBearing = (lat1, lon1, lat2, lon2) => {
//   if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
//   const dLon = (lon2 - lon1) * (Math.PI / 180);
//   const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
//   const x =
//     Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
//     Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
//   let brng = Math.atan2(y, x) * (180 / Math.PI);
//   return (brng + 360) % 360;
// };

// const HistoricalPlayback = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const preselectedDeviceId = queryParams.get('deviceId');

//   const [devices, setDevices] = useState([]);
//   const [selectedDevice, setSelectedDevice] = useState(preselectedDeviceId || '');
//   const [period, setPeriod] = useState('custom');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [geofences, setGeofences] = useState([]);
//   const [mapType, setMapType] = useState('google');

//   const [playbackData, setPlaybackData] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [speedMultiplier, setSpeedMultiplier] = useState(1);

//   const timerRef = useRef(null);

//   useEffect(() => {
//     const now = new Date();
//     const start = new Date(now);
//     start.setHours(0, 0, 0, 0);

//     const formatForInput = (d) => {
//       const year = d.getFullYear();
//       const month = String(d.getMonth() + 1).padStart(2, '0');
//       const day = String(d.getDate()).padStart(2, '0');
//       const hours = String(d.getHours()).padStart(2, '0');
//       const minutes = String(d.getMinutes()).padStart(2, '0');
//       return `${year}-${month}-${day}T${hours}:${minutes}`;
//     };

//     setStartDate(formatForInput(start));
//     setEndDate(formatForInput(now));
//   }, []);

//   useEffect(() => {
//     axios
//       .get(`${API_BASE_URL}/api/trips/vehicles-list`)
//       .then((res) => {
//         const list = Array.isArray(res.data) ? res.data : [];
//         setDevices(list);
//         if (preselectedDeviceId) setSelectedDevice(preselectedDeviceId);
//       })
//       .catch((err) => console.error(err));

//     axios
//       .get(`${API_BASE_URL}/api/geofences`)
//       .then((res) => setGeofences(res.data || []))
//       .catch((err) => console.error(err));
//   }, [preselectedDeviceId]);

//   useEffect(() => {
//     if (preselectedDeviceId && startDate && endDate) {
//       fetchPlaybackData(preselectedDeviceId, startDate, endDate);
//     }
//   }, [preselectedDeviceId, startDate, endDate]);

//   const fetchPlaybackData = async (devId, start, end) => {
//     try {
//       // Local datetime ko backend ke liye properly format karein
//       const queryUrl = `${API_BASE_URL}/api/trips/history/${devId}?startDate=${start}:00&endDate=${end}:59`;
//       const res = await axios.get(queryUrl);
//       const historyArray = res.data.history || res.data;
//       if (Array.isArray(historyArray) && historyArray.length > 0) {
//         setPlaybackData(historyArray);
//         setCurrentIndex(0);
//         setIsPlaying(false);
//       } else {
//         setPlaybackData([]);
//         alert('No history points found for this time range.');
//       }
//     } catch (err) {
//       console.error('Failed to load history:', err);
//     }
//   };

//   const handleShowClick = (e) => {
//     e.preventDefault();
//     if (!selectedDevice) {
//       alert('Please select a device.');
//       return;
//     }
//     fetchPlaybackData(selectedDevice, startDate, endDate);
//   };

//   const currentPoint = playbackData[currentIndex] || playbackData[0] || {};
//   const nextPoint = playbackData[currentIndex + 1] || currentPoint;

//   const routeCoordinates = Array.isArray(playbackData)
//     ? playbackData.map((p) => [Number(p.latitude), Number(p.longitude)])
//     : [];

//   const currentPos =
//     currentPoint.latitude && currentPoint.longitude
//       ? [Number(currentPoint.latitude), Number(currentPoint.longitude)]
//       : [22.348, 82.656];

//   let heading = Number(currentPoint.course || currentPoint.heading || 0);
//   if (!heading && playbackData.length > 1 && currentIndex < playbackData.length - 1) {
//     heading = calculateBearing(
//       Number(currentPoint.latitude),
//       Number(currentPoint.longitude),
//       Number(nextPoint.latitude),
//       Number(nextPoint.longitude)
//     );
//   }

//   const selectedDeviceObj = devices.find((d) => (d.traccar_id || d.id) == selectedDevice);
//   const deviceName = selectedDeviceObj?.name || currentPoint.vehicle_name || 'CAT D81';

//   const serverTimeIST = formatISTDateTime(currentPoint.devicetime || currentPoint.servertime);
//   const ignitionVal =
//     currentPoint.ignition !== undefined
//       ? currentPoint.ignition
//         ? 'ON'
//         : 'OFF'
//       : currentPoint.attributes?.ignition
//       ? 'ON'
//       : 'OFF';
//   const io6Val = currentPoint.io6 || currentPoint.attributes?.io6 || 'N/A';
//   const io9Val = currentPoint.io9 || currentPoint.attributes?.io9 || 'N/A';
//   const speedVal = `${Number(currentPoint.speed_kmh || 0).toFixed(1)} km/h`;
//   const satellitesVal = currentPoint.satellites || currentPoint.attributes?.satellites || '12';

//   useEffect(() => {
//     if (isPlaying && playbackData.length > 0) {
//       const activeInterval = 1000 / speedMultiplier;
//       timerRef.current = setTimeout(() => {
//         if (currentIndex < playbackData.length - 1) {
//           setCurrentIndex((prev) => prev + 1);
//         } else {
//           setIsPlaying(false);
//           setCurrentIndex(0);
//         }
//       }, activeInterval);
//     }
//     return () => clearTimeout(timerRef.current);
//   }, [isPlaying, currentIndex, playbackData, speedMultiplier]);

//   return (
//     <div className="relative w-full h-screen bg-[#f8f7f3] overflow-hidden font-sans flex">
      
//       {/* Sidebar Panel */}
//       <div className="w-[320px] bg-white border-r border-slate-300 flex flex-col z-[2000] shadow-sm">
//         <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
//           <button onClick={() => navigate(-1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer">
//             <ArrowLeft size={18} />
//           </button>
//           <span className="text-[15px] font-medium text-slate-800">Replay</span>
//         </div>

//         <form onSubmit={handleShowClick} className="p-4 space-y-4 text-xs">
//           <div className="border border-slate-300 rounded px-3 py-2 relative">
//             <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">Device</label>
//             <select
//               value={selectedDevice}
//               onChange={(e) => setSelectedDevice(e.target.value)}
//               className="w-full bg-transparent text-slate-800 focus:outline-none pt-1"
//               required
//             >
//               <option value="">-- Select Device --</option>
//               {devices.map((d) => (
//                 <option key={d.id || d.traccar_id} value={d.traccar_id || d.id}>{d.name}</option>
//               ))}
//             </select>
//           </div>

//           <div className="border border-slate-300 rounded px-3 py-2 relative">
//             <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">Period</label>
//             <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-transparent text-slate-800 focus:outline-none pt-1">
//               <option value="custom">Custom</option>
//               <option value="today">Today</option>
//             </select>
//           </div>

//           <div className="border border-slate-300 rounded px-3 py-2 relative">
//             <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">From</label>
//             <input
//               type="datetime-local"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="w-full bg-transparent text-slate-800 focus:outline-none pt-1 text-xs"
//               required
//             />
//           </div>

//           <div className="border border-slate-300 rounded px-3 py-2 relative">
//             <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">To</label>
//             <input
//               type="datetime-local"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="w-full bg-transparent text-slate-800 focus:outline-none pt-1 text-xs"
//               required
//             />
//           </div>

//           <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-medium py-2.5 rounded shadow-sm transition cursor-pointer text-xs tracking-wider">
//             SHOW
//           </button>
//         </form>

//         {playbackData.length > 0 && (
//           <div className="mx-4 mt-2 p-3 bg-slate-50 rounded border border-slate-200 space-y-2.5">
//             <div className="text-center text-xs font-bold text-slate-700">{deviceName}</div>

//             <div className="relative flex items-center">
//               <input
//                 type="range"
//                 min={0}
//                 max={playbackData.length - 1}
//                 value={currentIndex}
//                 onChange={(e) => {
//                   setIsPlaying(false);
//                   setCurrentIndex(Number(e.target.value));
//                 }}
//                 className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-300 rounded-lg"
//               />
//             </div>

//             <div className="flex items-center justify-between text-[11px] text-slate-600">
//               <span className="font-medium">{currentIndex + 1}/{playbackData.length}</span>

//               <div className="flex items-center gap-2.5 text-slate-700">
//                 <button onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} className="cursor-pointer"><Rewind size={13} fill="currentColor" /></button>
//                 <button onClick={() => setIsPlaying(!isPlaying)} className="cursor-pointer text-blue-600">
//                   {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
//                 </button>
//                 <button onClick={() => setCurrentIndex((prev) => Math.min(playbackData.length - 1, prev + 1))} className="cursor-pointer"><FastForward size={13} fill="currentColor" /></button>
//               </div>

//               <span className="text-[10px] text-slate-500 font-mono">{serverTimeIST}</span>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Map Area */}
//       <div className="flex-1 h-full relative">
//         <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
//           <button onClick={() => setMapType(mapType === 'google' ? 'satellite' : 'google')} className="bg-white p-2 rounded shadow border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
//             <Layers size={16} />
//           </button>
//         </div>

//         <div className="absolute bottom-6 left-3 z-[1000] bg-white px-2 py-1.5 rounded border border-slate-300 shadow-sm text-[10px]">
//           <div className="w-16 h-2 bg-gradient-to-r from-blue-400 via-yellow-400 to-red-600 rounded-xs mb-0.5"></div>
//           <div className="text-center font-medium text-slate-600">0 - 10 kn</div>
//         </div>

//         <MapContainer center={currentPos} zoom={18} maxZoom={22} zoomControl={false} className="w-full h-full z-0">
//           {mapType === 'satellite' ? (
//             <TileLayer maxNativeZoom={19} maxZoom={22} url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
//           ) : (
//             <TileLayer maxNativeZoom={20} maxZoom={22} url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
//           )}

//           <MapController routeCoordinates={routeCoordinates} currentPos={currentPos} isPlaying={isPlaying} />

//           {geofences.map((gf) => {
//             const isUnloading = (gf.type || gf.category || '').toLowerCase() === 'unloading';
//             const color = isUnloading ? '#A855F7' : '#3B82F6';
//             if (gf.coordinates && Array.isArray(gf.coordinates)) {
//               return <Polygon key={gf.id || gf.name} positions={gf.coordinates} pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 2, dashArray: '4, 4' }} />;
//             }
//             if (gf.latitude && gf.longitude && gf.radius) {
//               return <Circle key={gf.id || gf.name} center={[Number(gf.latitude), Number(gf.longitude)]} radius={Number(gf.radius)} pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 2, dashArray: '4, 4' }} />;
//             }
//             return null;
//           })}

//           {playbackData.length > 1 && playbackData.map((pt, idx) => {
//             if (idx === playbackData.length - 1) return null;
//             const nextPt = playbackData[idx + 1];
//             const p1 = [Number(pt.latitude), Number(pt.longitude)];
//             const p2 = [Number(nextPt.latitude), Number(nextPt.longitude)];
//             const segmentColor = getSpeedColor(Number(pt.speed || 0));
//             const angle = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

//             const arrowIcon = L.divIcon({
//               className: 'route-arrow-icon',
//               html: `<div style="transform: rotate(${angle - 90}deg); color: ${segmentColor}; font-size: 11px; line-height: 1; font-weight: bold;">▶</div>`,
//               iconSize: [12, 12],
//               iconAnchor: [6, 6],
//             });

//             return (
//               <React.Fragment key={`seg-${idx}`}>
//                 <Polyline positions={[p1, p2]} pathOptions={{ color: segmentColor, weight: 3, opacity: 0.95 }} />
//                 <Marker position={p2} icon={arrowIcon} interactive={false} />
//               </React.Fragment>
//             );
//           })}

//           {currentPoint.latitude && (
//             <Marker position={currentPos} icon={createTraccarReplayIcon(heading)}>
//               <Popup className="custom-popup" autoPan={false}>
//                 <div className="p-3 bg-slate-950 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[210px]">
//                   <div className="text-center font-bold pb-1.5 border-b border-slate-800 text-amber-400">{deviceName}</div>
//                   <div className="space-y-1 text-[11px]">
//                     <div className="flex justify-between"><span className="text-slate-400">Server Time:</span> <span className="font-mono text-slate-200">{serverTimeIST}</span></div>
//                     <div className="flex justify-between"><span className="text-slate-400">Ignition:</span> <span className="font-bold text-emerald-400">{ignitionVal}</span></div>
//                     <div className="flex justify-between"><span className="text-slate-400">Load Status:</span> <span className="font-mono text-cyan-400 font-bold">{io6Val}</span></div>
//                     <div className="flex justify-between"><span className="text-slate-400">Dala Position:</span> <span className="font-mono text-blue-400 font-bold">{io9Val}</span></div>
//                     <div className="flex justify-between"><span className="text-slate-400">Speed:</span> <span className="font-mono text-amber-400 font-bold">{speedVal}</span></div>
//                     <div className="flex justify-between"><span className="text-slate-400">Satellites:</span> <span className="font-mono text-purple-400 font-bold">{satellitesVal}</span></div>
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           )}
//         </MapContainer>
//       </div>
//     </div>
//   );
// };

// export default HistoricalPlayback;


import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Play, Pause, FastForward, Rewind, ArrowLeft, Download, SlidersHorizontal, Layers } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

// 🎨 Traccar Speed Color Helper (Yellow -> Orange -> Red -> Dark)
const getSpeedColor = (speedKnots = 0) => {
  if (speedKnots <= 2) return '#EAB308'; // Yellow (Slow)
  if (speedKnots <= 5) return '#F97316'; // Orange (Medium)
  if (speedKnots <= 10) return '#B91C1C'; // Dark Red (Fast)
  return '#1E293B'; // Near Black (Very Fast / Max)
};

// 🚛 Traccar Replay Vehicle Pin / Arrow Marker
const createTraccarReplayIcon = (heading = 0) => {
  return L.divIcon({
    className: 'traccar-replay-marker',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.2s linear; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#2563EB" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.5));">
          <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// 🔍 Smooth Pan During Play (Manual Zoom Enabled without restriction)
const MapController = ({ currentPos, isPlaying }) => {
  const map = useMap();

  useEffect(() => {
    if (isPlaying && currentPos && currentPos[0] && currentPos[1]) {
      map.panTo(currentPos, { animate: true, duration: 0.4 });
    }
  }, [currentPos, isPlaying, map]);

  return null;
};

// 🕒 Accurate IST Timezone Formatter
const formatISTDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date).replace(',', '');
  } catch (e) {
    return isoString;
  }
};

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos(dLon);
  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
};

const HistoricalPlayback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preselectedDeviceId = queryParams.get('deviceId');

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(preselectedDeviceId || '');
  const [period, setPeriod] = useState('custom');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [geofences, setGeofences] = useState([]);
  const [mapType, setMapType] = useState('google');

  const [playbackData, setPlaybackData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const timerRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const formatForInput = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartDate(formatForInput(start));
    setEndDate(formatForInput(now));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/trips/vehicles-list`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setDevices(list);
        if (preselectedDeviceId) setSelectedDevice(preselectedDeviceId);
      })
      .catch((err) => console.error(err));

    axios
      .get(`${API_BASE_URL}/api/geofences`)
      .then((res) => setGeofences(res.data || []))
      .catch((err) => console.error(err));
  }, [preselectedDeviceId]);

  useEffect(() => {
    if (preselectedDeviceId && startDate && endDate) {
      fetchPlaybackData(preselectedDeviceId, startDate, endDate);
    }
  }, [preselectedDeviceId, startDate, endDate]);

  const fetchPlaybackData = async (devId, start, end) => {
    try {
      const queryUrl = `${API_BASE_URL}/api/trips/history/${devId}?startDate=${start}:00&endDate=${end}:59`;
      const res = await axios.get(queryUrl);
      const historyArray = res.data.history || res.data;
      if (Array.isArray(historyArray) && historyArray.length > 0) {
        setPlaybackData(historyArray);
        setCurrentIndex(0);
        setIsPlaying(false);
      } else {
        setPlaybackData([]);
        alert('No history points found for this time range.');
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleShowClick = (e) => {
    e.preventDefault();
    if (!selectedDevice) {
      alert('Please select a device.');
      return;
    }
    fetchPlaybackData(selectedDevice, startDate, endDate);
  };

  const currentPoint = playbackData[currentIndex] || playbackData[0] || {};
  const nextPoint = playbackData[currentIndex + 1] || currentPoint;

  const routeCoordinates = Array.isArray(playbackData)
    ? playbackData.map((p) => [Number(p.latitude), Number(p.longitude)])
    : [];

  const currentPos =
    currentPoint.latitude && currentPoint.longitude
      ? [Number(currentPoint.latitude), Number(currentPoint.longitude)]
      : [22.348, 82.656];

  let heading = Number(currentPoint.course || currentPoint.heading || 0);
  if (!heading && playbackData.length > 1 && currentIndex < playbackData.length - 1) {
    heading = calculateBearing(
      Number(currentPoint.latitude),
      Number(currentPoint.longitude),
      Number(nextPoint.latitude),
      Number(nextPoint.longitude)
    );
  }

  const selectedDeviceObj = devices.find((d) => (d.traccar_id || d.id) == selectedDevice);
  const deviceName = selectedDeviceObj?.name || currentPoint.vehicle_name || 'CAT D81';

  const serverTimeIST = formatISTDateTime(currentPoint.devicetime || currentPoint.servertime);
  const ignitionVal =
    currentPoint.ignition !== undefined
      ? currentPoint.ignition
        ? 'ON'
        : 'OFF'
      : currentPoint.attributes?.ignition
      ? 'ON'
      : 'OFF';
  const io6Val = currentPoint.io6 || currentPoint.attributes?.io6 || 'N/A';
  const io9Val = currentPoint.io9 || currentPoint.attributes?.io9 || 'N/A';
  const speedVal = `${Number(currentPoint.speed_kmh || 0).toFixed(1)} km/h`;
  const satellitesVal = currentPoint.satellites || currentPoint.attributes?.satellites || '12';

  useEffect(() => {
    if (isPlaying && playbackData.length > 0) {
      const activeInterval = 1000 / speedMultiplier;
      timerRef.current = setTimeout(() => {
        if (currentIndex < playbackData.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentIndex(0);
        }
      }, activeInterval);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, playbackData, speedMultiplier]);

  return (
    <div className="relative w-full h-screen bg-[#f8f7f3] overflow-hidden font-sans flex">
      
      {/* Sidebar Panel */}
      <div className="w-[320px] bg-white border-r border-slate-300 flex flex-col z-[2000] shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <button onClick={() => navigate(-1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <span className="text-[15px] font-medium text-slate-800">Replay</span>
        </div>

        <form onSubmit={handleShowClick} className="p-4 space-y-4 text-xs">
          <div className="border border-slate-300 rounded px-3 py-2 relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">Device</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full bg-transparent text-slate-800 focus:outline-none pt-1"
              required
            >
              <option value="">-- Select Device --</option>
              {devices.map((d) => (
                <option key={d.id || d.traccar_id} value={d.traccar_id || d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="border border-slate-300 rounded px-3 py-2 relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-transparent text-slate-800 focus:outline-none pt-1">
              <option value="custom">Custom</option>
              <option value="today">Today</option>
            </select>
          </div>

          <div className="border border-slate-300 rounded px-3 py-2 relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">From</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent text-slate-800 focus:outline-none pt-1 text-xs"
              required
            />
          </div>

          <div className="border border-slate-300 rounded px-3 py-2 relative">
            <label className="absolute -top-2 left-2 bg-white px-1 text-[11px] text-slate-500 font-medium">To</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent text-slate-800 focus:outline-none pt-1 text-xs"
              required
            />
          </div>

          <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-medium py-2.5 rounded shadow-sm transition cursor-pointer text-xs tracking-wider">
            SHOW
          </button>
        </form>

        {playbackData.length > 0 && (
          <div className="mx-4 mt-2 p-3 bg-slate-50 rounded border border-slate-200 space-y-2.5">
            <div className="text-center text-xs font-bold text-slate-700">{deviceName}</div>

            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={playbackData.length - 1}
                value={currentIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentIndex(Number(e.target.value));
                }}
                className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium">{currentIndex + 1}/{playbackData.length}</span>

              <div className="flex items-center gap-2.5 text-slate-700">
                <button onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} className="cursor-pointer"><Rewind size={13} fill="currentColor" /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="cursor-pointer text-blue-600">
                  {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
                <button onClick={() => setCurrentIndex((prev) => Math.min(playbackData.length - 1, prev + 1))} className="cursor-pointer"><FastForward size={13} fill="currentColor" /></button>
              </div>

              <span className="text-[10px] text-slate-500 font-mono">{serverTimeIST}</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 h-full relative">
        <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
          <button onClick={() => setMapType(mapType === 'google' ? 'satellite' : 'google')} className="bg-white p-2 rounded shadow border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Layers size={16} />
          </button>
        </div>

        <div className="absolute bottom-6 left-3 z-[1000] bg-white px-2 py-1.5 rounded border border-slate-300 shadow-sm text-[10px]">
          <div className="w-16 h-2 bg-gradient-to-r from-blue-400 via-yellow-400 to-red-600 rounded-xs mb-0.5"></div>
          <div className="text-center font-medium text-slate-600">0 - 10 kn</div>
        </div>

        <MapContainer center={currentPos} zoom={19} maxZoom={22} zoomControl={true} className="w-full h-full z-0">
          {mapType === 'satellite' ? (
            <TileLayer maxNativeZoom={19} maxZoom={22} url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          ) : (
            <TileLayer maxNativeZoom={20} maxZoom={22} url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
          )}

          <MapController currentPos={currentPos} isPlaying={isPlaying} />

          {geofences.map((gf) => {
            const isUnloading = (gf.type || gf.category || '').toLowerCase() === 'unloading';
            const color = isUnloading ? '#A855F7' : '#3B82F6';
            if (gf.coordinates && Array.isArray(gf.coordinates)) {
              return <Polygon key={gf.id || gf.name} positions={gf.coordinates} pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 2, dashArray: '4, 4' }} />;
            }
            if (gf.latitude && gf.longitude && gf.radius) {
              return <Circle key={gf.id || gf.name} center={[Number(gf.latitude), Number(gf.longitude)]} radius={Number(gf.radius)} pathOptions={{ color, fillColor: color, fillOpacity: 0.1, weight: 2, dashArray: '4, 4' }} />;
            }
            return null;
          })}

          {playbackData.length > 1 && playbackData.map((pt, idx) => {
            if (idx === playbackData.length - 1) return null;
            const nextPt = playbackData[idx + 1];
            const p1 = [Number(pt.latitude), Number(pt.longitude)];
            const p2 = [Number(nextPt.latitude), Number(nextPt.longitude)];
            const segmentColor = getSpeedColor(Number(pt.speed || 0));
            const angle = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

            const arrowIcon = L.divIcon({
              className: 'route-arrow-icon',
              html: `<div style="transform: rotate(${angle - 90}deg); color: ${segmentColor}; font-size: 11px; line-height: 1; font-weight: bold;">▶</div>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            });

            return (
              <React.Fragment key={`seg-${idx}`}>
                <Polyline positions={[p1, p2]} pathOptions={{ color: segmentColor, weight: 3, opacity: 0.95 }} />
                <Marker position={p2} icon={arrowIcon} interactive={false} />
              </React.Fragment>
            );
          })}

          {currentPoint.latitude && (
            <Marker position={currentPos} icon={createTraccarReplayIcon(heading)}>
              <Popup className="custom-popup" autoPan={false}>
                <div className="p-3 bg-slate-950 text-white rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[210px]">
                  <div className="text-center font-bold pb-1.5 border-b border-slate-800 text-amber-400">{deviceName}</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-400">Server Time:</span> <span className="font-mono text-slate-200">{serverTimeIST}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Ignition:</span> <span className="font-bold text-emerald-400">{ignitionVal}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Load Status:</span> <span className="font-mono text-cyan-400 font-bold">{io6Val}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Dala Position:</span> <span className="font-mono text-blue-400 font-bold">{io9Val}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Speed:</span> <span className="font-mono text-amber-400 font-bold">{speedVal}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Satellites:</span> <span className="font-mono text-purple-400 font-bold">{satellitesVal}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default HistoricalPlayback;
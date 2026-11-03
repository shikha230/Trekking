// // import React, { useState, useEffect } from 'react';
// // import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Tooltip, useMap } from 'react-leaflet';
// // import L from 'leaflet';
// // import { io } from 'socket.io-client';
// // import axios from 'axios';
// // import { Radio, Activity, Layers } from 'lucide-react';
// // import 'leaflet/dist/leaflet.css';

// // const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
// // const socket = io(API_BASE_URL);

// // const getTruckStatus = (truck) => {
// //   const speed = Number(truck.speed || 0);
// //   const isEngineOn = truck.ignition || speed > 0.5;
// //   const state = (truck.current_state || '').toUpperCase();

// //   if (state.includes('UNLOAD') || state.includes('PLANT')) {
// //     return { label: 'UNLOADING', color: '#8B5CF6', bg: 'bg-purple-600' };
// //   }
// //   if (state.includes('LOAD') || state.includes('MINE')) {
// //     return { label: 'LOADING', color: '#2563EB', bg: 'bg-blue-600' };
// //   }
// //   if (speed > 2) {
// //     return { label: 'MOVING', color: '#10B981', bg: 'bg-emerald-500' };
// //   } else if (isEngineOn) {
// //     return { label: 'IDLE', color: '#F59E0B', bg: 'bg-amber-500' };
// //   } else {
// //     return { label: 'PARKED', color: '#EF4444', bg: 'bg-rose-500' };
// //   }
// // };

// // const createTruckIcon = (truck) => {
// //   const status = getTruckStatus(truck);
// //   const name = truck.name || `Truck #${truck.traccar_id}`;

// //   return L.divIcon({
// //     className: 'custom-truck-marker',
// //     html: `
// //       <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
// //         <div style="
// //           background: #ffffff;
// //           color: #0f172a;
// //           font-weight: 800;
// //           font-size: 11px;
// //           padding: 3px 8px;
// //           border-radius: 6px;
// //           border: 1px solid #cbd5e1;
// //           box-shadow: 0 2px 6px rgba(0,0,0,0.25);
// //           white-space: nowrap;
// //           margin-bottom: 4px;
// //           font-family: sans-serif;
// //         ">
// //           ${name}
// //         </div>
// //         <div style="
// //           background-color: ${status.color};
// //           width: 24px;
// //           height: 24px;
// //           border-radius: 6px;
// //           border: 2px solid white;
// //           box-shadow: 0 3px 8px rgba(0,0,0,0.35);
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //         ">
// //           <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
// //         </div>
// //       </div>
// //     `,
// //     iconSize: [70, 50],
// //     iconAnchor: [35, 45],
// //   });
// // };

// // const MapRecenter = ({ vehicles }) => {
// //   const map = useMap();
  
// //   useEffect(() => {
// //     const validCoords = vehicles
// //       .filter(v => v.latitude && v.longitude)
// //       .map(v => [Number(v.latitude), Number(v.longitude)]);

// //     if (validCoords.length > 0) {
// //       const bounds = L.latLngBounds(validCoords);
// //       map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
// //     }
// //   }, [vehicles.length, map]);

// //   return null;
// // };

// // const LiveTracking = () => {
// //   const [vehicles, setVehicles] = useState([]);
// //   const [geofences, setGeofences] = useState([]);
// //   const [mapType, setMapType] = useState('satellite');

// //   const fetchLiveVehicles = async () => {
// //     try {
// //       const res = await axios.get(`${API_BASE_URL}/api/vehicles/live`);
// //       setVehicles(res.data || []);
// //     } catch (err) {
// //       console.error('Error fetching live vehicles:', err);
// //     }
// //   };

// //   const fetchGeofences = async () => {
// //     try {
// //       const res = await axios.get(`${API_BASE_URL}/api/geofences`);
// //       setGeofences(res.data || []);
// //     } catch (err) {
// //       console.error('Error fetching geofences:', err);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchLiveVehicles();
// //     fetchGeofences();

// //     socket.on('v-update', (data) => {
// //       setVehicles((prev) => {
// //         const exists = prev.find((v) => v.traccar_id === data.traccar_id);
// //         if (exists) {
// //           return prev.map((v) => (v.traccar_id === data.traccar_id ? { ...v, ...data } : v));
// //         }
// //         return [...prev, data];
// //       });
// //     });

// //     return () => socket.off('v-update');
// //   }, []);

// //   const defaultCenter = [22.348, 82.656];

// //   return (
// //     <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans select-none">
// //       <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-xl">
// //         <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
// //           <Activity size={18} />
// //         </div>
// //         <div>
// //           <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Fleet Live Monitoring</h2>
// //           <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
// //             <Radio size={12} className="animate-pulse" /> ACTIVE PINGS ({vehicles.length})
// //           </p>
// //         </div>
// //       </div>

// //       <div className="absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xl flex gap-1">
// //         <button
// //           onClick={() => setMapType('satellite')}
// //           className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
// //             mapType === 'satellite' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
// //           }`}
// //         >
// //           Satellite
// //         </button>
// //         <button
// //           onClick={() => setMapType('street')}
// //           className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
// //             mapType === 'street' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
// //           }`}
// //         >
// //           Street
// //         </button>
// //       </div>

// //       <MapContainer center={defaultCenter} zoom={13} zoomControl={false} className="w-full h-full z-0">
// //         {mapType === 'satellite' ? (
// //           <TileLayer
// //             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
// //             attribution="&copy; Esri"
// //           />
// //         ) : (
// //           <TileLayer
// //             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
// //             attribution="&copy; OpenStreetMap"
// //           />
// //         )}

// //         <MapRecenter vehicles={vehicles} />

// //         {geofences.map((gf) => {
// //           const type = (gf.type || gf.category || '').toLowerCase();
// //           const name = (gf.name || 'Zone').toUpperCase();

// //           const isUnloading = type === 'unloading';
// //           const strokeColor = isUnloading ? '#8B5CF6' : '#2563EB';
// //           const fillColor = isUnloading ? '#A78BFA' : '#60A5FA';

// //           if (gf.coordinates && Array.isArray(gf.coordinates) && gf.coordinates.length > 0) {
// //             return (
// //               <Polygon
// //                 key={gf.id || gf.name}
// //                 positions={gf.coordinates}
// //                 pathOptions={{
// //                   color: strokeColor,
// //                   fillColor: fillColor,
// //                   fillOpacity: 0.35,
// //                   weight: 2.5,
// //                   dashArray: '6, 6'
// //                 }}
// //               >
// //                 <Tooltip permanent direction="center" opacity={0.9}>
// //                   <span className="font-extrabold text-[10px] tracking-wider text-slate-900 px-1.5 py-0.5 bg-white/90 rounded border shadow-sm">
// //                     {name}
// //                   </span>
// //                 </Tooltip>
// //               </Polygon>
// //             );
// //           }

// //           if (gf.latitude && gf.longitude && gf.radius) {
// //             return (
// //               <Circle
// //                 key={gf.id || gf.name}
// //                 center={[Number(gf.latitude), Number(gf.longitude)]}
// //                 radius={Number(gf.radius)}
// //                 pathOptions={{
// //                   color: strokeColor,
// //                   fillColor: fillColor,
// //                   fillOpacity: 0.35,
// //                   weight: 2.5,
// //                   dashArray: '6, 6'
// //                 }}
// //               >
// //                 <Tooltip permanent direction="center" opacity={0.9}>
// //                   <span className="font-extrabold text-[10px] tracking-wider text-slate-900 px-1.5 py-0.5 bg-white/90 rounded border shadow-sm">
// //                     {name}
// //                   </span>
// //                 </Tooltip>
// //               </Circle>
// //             );
// //           }

// //           return null;
// //         })}

// //         {vehicles.map((truck) => {
// //           if (!truck.latitude || !truck.longitude) return null;
// //           const status = getTruckStatus(truck);

// //           return (
// //             <Marker
// //               key={truck.traccar_id}
// //               position={[Number(truck.latitude), Number(truck.longitude)]}
// //               icon={createTruckIcon(truck)}
// //             >
// //               <Popup className="custom-popup">
// //                 <div className="p-2 min-w-[210px] font-sans">
// //                   <div className="flex items-center justify-between border-b pb-2 mb-2">
// //                     <span className="font-black text-sm text-slate-900">{truck.name}</span>
// //                     <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${status.bg}`}>
// //                       {status.label}
// //                     </span>
// //                   </div>

// //                   <div className="space-y-1.5 text-xs text-slate-700">
// //                     <div className="flex justify-between items-center">
// //                       <span className="text-slate-400 font-medium">State:</span>
// //                       <span className="font-bold text-slate-900">{truck.current_state || 'IDLE'}</span>
// //                     </div>
// //                     <div className="flex justify-between items-center">
// //                       <span className="text-slate-400 font-medium">Speed:</span>
// //                       <span className="font-mono font-bold">{Number(truck.speed || 0).toFixed(1)} km/h</span>
// //                     </div>

// //                     {/* Ignition & Body Status Added Here */}
// //                     <div className="border-t pt-1.5 mt-1.5 space-y-1">
// //                       <div className="flex justify-between items-center">
// //                         <span className="text-slate-400 font-medium">Ignition:</span>
// //                         <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.ignition ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
// //                           {truck.ignition ? 'ON' : 'OFF'}
// //                         </span>
// //                       </div>
// //                       <div className="flex justify-between items-center">
// //                         <span className="text-slate-400 font-medium">Body Status:</span>
// //                         <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.bodyStatus === 'Up' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
// //                           {truck.bodyStatus || 'Down'}
// //                         </span>
// //                       </div>
// //                     </div>

// //                     {truck.distToLoading && (
// //                       <div className="flex justify-between items-center text-blue-600 font-semibold pt-1 border-t">
// //                         <span>To Loading:</span>
// //                         <span>{truck.distToLoading}</span>
// //                       </div>
// //                     )}
// //                     {truck.distToUnloading && (
// //                       <div className="flex justify-between items-center text-purple-600 font-semibold">
// //                         <span>To Unloading:</span>
// //                         <span>{truck.distToUnloading}</span>
// //                       </div>
// //                     )}
// //                   </div>
// //                 </div>
// //               </Popup>
// //             </Marker>
// //           );
// //         })}
// //       </MapContainer>

// //       <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl text-xs space-y-2 font-medium min-w-[210px]">
// //         <p className="font-extrabold uppercase tracking-widest text-[10px] text-slate-400 border-b pb-1">
// //           Live Fleet & Area Status
// //         </p>

// //         <div className="flex items-center gap-2.5">
// //           <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400 shadow-sm"></span>
// //           <span className="text-slate-800 font-bold">Loading Area (Mine Zone)</span>
// //         </div>

// //         <div className="flex items-center gap-2.5">
// //           <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400 shadow-sm"></span>
// //           <span className="text-slate-800 font-bold">Unloading Area (Plant Zone)</span>
// //         </div>

// //         <div className="flex items-center gap-2.5 pt-1 border-t">
// //           <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
// //           <span className="text-slate-800 font-bold">Moving (&gt; 2 km/h)</span>
// //         </div>

// //         <div className="flex items-center gap-2.5">
// //           <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
// //           <span className="text-slate-800 font-bold">Idle (Engine ON, 0 km/h)</span>
// //         </div>
 
// //         <div className="flex items-center gap-2.5">
// //           <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span>
// //           <span className="text-slate-800 font-bold">Stopped / Parked</span>
// //         </div>

// //         <div className="flex items-center gap-2 pt-1.5 border-t text-blue-600 font-semibold text-[11px]">
// //           <Layers size={12} />
// //           <span>Active Zones Overlay Enabled</span>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default LiveTracking;


// import React, { useState, useEffect } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Tooltip, useMap } from 'react-leaflet';
// import L from 'leaflet';
// import { io } from 'socket.io-client';
// import axios from 'axios';
// import { Radio, Activity, Layers, MapPin, Gauge, Weight, Power, Truck as TruckIcon } from 'lucide-react';
// import 'leaflet/dist/leaflet.css';

// const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
// const socket = io(API_BASE_URL);

// const getTruckStatus = (truck) => {
//   const speed = Number(truck.speed || 0);
//   const isEngineOn = truck.ignition || speed > 0.5;
//   const state = (truck.current_state || '').toUpperCase();

//   if (state.includes('UNLOAD') || state.includes('PLANT')) {
//     return { label: 'UNLOADING', color: '#8B5CF6', bg: 'bg-purple-600' };
//   }
//   if (state.includes('LOAD') || state.includes('MINE')) {
//     return { label: 'LOADING', color: '#2563EB', bg: 'bg-blue-600' };
//   }
//   if (speed > 2) {
//     return { label: 'MOVING', color: '#10B981', bg: 'bg-emerald-500' };
//   } else if (isEngineOn) {
//     return { label: 'IDLE', color: '#F59E0B', bg: 'bg-amber-500' };
//   } else {
//     return { label: 'PARKED', color: '#EF4444', bg: 'bg-rose-500' };
//   }
// };

// const createTruckIcon = (truck) => {
//   const status = getTruckStatus(truck);
//   const name = truck.name || `Truck #${truck.traccar_id}`;

//   return L.divIcon({
//     className: 'custom-truck-marker',
//     html: `
//       <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
//         <div style="
//           background: #0f172a;
//           color: #ffffff;
//           font-weight: 800;
//           font-size: 10px;
//           padding: 3px 8px;
//           border-radius: 6px;
//           border: 1px solid #334155;
//           box-shadow: 0 4px 12px rgba(0,0,0,0.3);
//           white-space: nowrap;
//           margin-bottom: 4px;
//           font-family: sans-serif;
//           letter-spacing: 0.5px;
//         ">
//           ${name}
//         </div>
//         <div style="
//           background-color: ${status.color};
//           width: 28px;
//           height: 28px;
//           border-radius: 8px;
//           border: 2px solid white;
//           box-shadow: 0 4px 10px rgba(0,0,0,0.4);
//           display: flex;
//           align-items: center;
//           center;
//           justify-content: center;
//         ">
//           <div style="width: 8px; height: 8px; background-color: white; border-radius: 50%; box-shadow: 0 0 4px rgba(255,255,255,0.8);"></div>
//         </div>
//       </div>
//     `,
//     iconSize: [80, 60],
//     iconAnchor: [40, 50],
//   });
// };

// const MapRecenter = ({ vehicles }) => {
//   const map = useMap();
  
//   useEffect(() => {
//     const validCoords = vehicles
//       .filter(v => v.latitude && v.longitude)
//       .map(v => [Number(v.latitude), Number(v.longitude)]);

//     if (validCoords.length > 0) {
//       const bounds = L.latLngBounds(validCoords);
//       map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
//     }
//   }, [vehicles.length, map]);

//   return null;
// };

// const LiveTracking = () => {
//   const [vehicles, setVehicles] = useState([]);
//   const [geofences, setGeofences] = useState([]);
//   const [mapType, setMapType] = useState('satellite');

//   const fetchLiveVehicles = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/vehicles/live`);
//       setVehicles(res.data || []);
//     } catch (err) {
//       console.error('Error fetching live vehicles:', err);
//     }
//   };

//   const fetchGeofences = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/geofences`);
//       setGeofences(res.data || []);
//     } catch (err) {
//       console.error('Error fetching geofences:', err);
//     }
//   };

//   useEffect(() => {
//     fetchLiveVehicles();
//     fetchGeofences();

//     socket.on('v-update', (data) => {
//       setVehicles((prev) => {
//         const exists = prev.find((v) => v.traccar_id === data.traccar_id);
//         if (exists) {
//           return prev.map((v) => (v.traccar_id === data.traccar_id ? { ...v, ...data } : v));
//         }
//         return [...prev, data];
//       });
//     });

//     return () => socket.off('v-update');
//   }, []);

//   const defaultCenter = [22.348, 82.656];

//   return (
//     <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans select-none">
      
//       {/* Top Header Floating Card */}
//       <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-2xl">
//         <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
//           <Activity size={20} />
//         </div>
//         <div>
//           <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Fleet Live Command Center</h2>
//           <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
//             <Radio size={12} className="animate-pulse" /> LIVE TRACKING ACTIVE ({vehicles.length} TRUCKS)
//           </p>
//         </div>
//       </div>

//       {/* Map Style Selector */}
//       <div className="absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-2xl flex gap-1">
//         <button
//           onClick={() => setMapType('satellite')}
//           className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
//             mapType === 'satellite' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
//           }`}
//         >
//           Satellite
//         </button>
//         <button
//           onClick={() => setMapType('street')}
//           className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
//             mapType === 'street' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
//           }`}
//         >
//           Street
//         </button>
//       </div>

//       {/* Map Container */}
//       <MapContainer center={defaultCenter} zoom={13} zoomControl={false} className="w-full h-full z-0">
//         {mapType === 'satellite' ? (
//           <TileLayer
//             url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
//             attribution="&copy; Esri"
//           />
//         ) : (
//           <TileLayer
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//             attribution="&copy; OpenStreetMap"
//           />
//         )}

//         <MapRecenter vehicles={vehicles} />

//         {/* Geofences rendering */}
//         {geofences.map((gf) => {
//           const type = (gf.type || gf.category || '').toLowerCase();
//           const name = (gf.name || 'Zone').toUpperCase();

//           const isUnloading = type === 'unloading';
//           const strokeColor = isUnloading ? '#8B5CF6' : '#2563EB';
//           const fillColor = isUnloading ? '#A78BFA' : '#60A5FA';

//           if (gf.coordinates && Array.isArray(gf.coordinates) && gf.coordinates.length > 0) {
//             return (
//               <Polygon
//                 key={gf.id || gf.name}
//                 positions={gf.coordinates}
//                 pathOptions={{
//                   color: strokeColor,
//                   fillColor: fillColor,
//                   fillOpacity: 0.3,
//                   weight: 2.5,
//                   dashArray: '6, 6'
//                 }}
//               >
//                 <Tooltip permanent direction="center" opacity={0.9}>
//                   <span className="font-black text-[10px] tracking-wider text-slate-900 px-2 py-1 bg-white/95 rounded-lg border shadow-md">
//                     {name}
//                   </span>
//                 </Tooltip>
//               </Polygon>
//             );
//           }

//           if (gf.latitude && gf.longitude && gf.radius) {
//             return (
//               <Circle
//                 key={gf.id || gf.name}
//                 center={[Number(gf.latitude), Number(gf.longitude)]}
//                 radius={Number(gf.radius)}
//                 pathOptions={{
//                   color: strokeColor,
//                   fillColor: fillColor,
//                   fillOpacity: 0.3,
//                   weight: 2.5,
//                   dashArray: '6, 6'
//                 }}
//               >
//                 <Tooltip permanent direction="center" opacity={0.9}>
//                   <span className="font-black text-[10px] tracking-wider text-slate-900 px-2 py-1 bg-white/95 rounded-lg border shadow-md">
//                     {name}
//                   </span>
//                 </Tooltip>
//               </Circle>
//             );
//           }
//           return null;
//         })}

//         {/* Trucks Markers */}
//         {vehicles.map((truck) => {
//           if (!truck.latitude || !truck.longitude) return null;
//           const status = getTruckStatus(truck);
          
//           // Load Logic calculation based on io9 or load value
//           const loadVal = Number(truck.io9 || truck.load || 0);
//           const isLoaded = loadVal >= 1000;

//           return (
//             <Marker
//               key={truck.traccar_id}
//               position={[Number(truck.latitude), Number(truck.longitude)]}
//               icon={createTruckIcon(truck)}
//             >
//               <Popup className="custom-popup">
//                 <div className="p-3 min-w-[240px] font-sans">
//                   <div className="flex items-center justify-between border-b pb-2 mb-2">
//                     <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
//                       <TruckIcon size={16} className="text-blue-600" /> {truck.name}
//                     </span>
//                     <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-wider ${status.bg}`}>
//                       {status.label}
//                     </span>
//                   </div>

//                   {/* Location Address */}
//                   {truck.address && (
//                     <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-2.5 bg-slate-50 p-2 rounded-xl border">
//                       <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
//                       <span className="font-medium leading-tight">{truck.address}</span>
//                     </div>
//                   )}

//                   <div className="space-y-2 text-xs text-slate-700">
//                     <div className="flex justify-between items-center">
//                       <span className="text-slate-400 font-medium flex items-center gap-1"><Gauge size={13}/> Speed:</span>
//                       <span className="font-mono font-bold text-slate-900">{Number(truck.speed || 0).toFixed(1)} km/h</span>
//                     </div>

//                     {/* Load status using IO9 */}
//                     <div className="flex justify-between items-center">
//                       <span className="text-slate-400 font-medium flex items-center gap-1"><Weight size={13}/> Payload (IO9):</span>
//                       <span className={`font-black px-2 py-0.5 rounded text-[10px] ${isLoaded ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
//                         {loadVal} ({isLoaded ? 'LOADED' : 'UNLOADED'})
//                       </span>
//                     </div>

//                     {/* Ignition & Body Status */}
//                     <div className="border-t pt-2 space-y-1.5">
//                       <div className="flex justify-between items-center">
//                         <span className="text-slate-400 font-medium flex items-center gap-1"><Power size={13}/> Ignition:</span>
//                         <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.ignition ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
//                           {truck.ignition ? 'ON' : 'OFF'}
//                         </span>
//                       </div>
//                       <div className="flex justify-between items-center">
//                         <span className="text-slate-400 font-medium">Body Tipping:</span>
//                         <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.bodyStatus === 'Up' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
//                           {truck.bodyStatus || 'Down'}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Distance from Zones */}
//                     {(truck.distToLoading || truck.distToUnloading) && (
//                       <div className="border-t pt-2 space-y-1 font-semibold text-[11px]">
//                         {truck.distToLoading && (
//                           <div className="flex justify-between items-center text-blue-600">
//                             <span>To Mine (Loading):</span>
//                             <span>{truck.distToLoading}</span>
//                           </div>
//                         )}
//                         {truck.distToUnloading && (
//                           <div className="flex justify-between items-center text-purple-600">
//                             <span>To Plant (Unloading):</span>
//                             <span>{truck.distToUnloading}</span>
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           );
//         })}
//       </MapContainer>

//       {/* Legend / Status Overlay Panel */}
//       <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-2xl text-xs space-y-2.5 font-medium min-w-[230px]">
//         <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 border-b pb-1.5">
//           Live Fleet & Zone Guide
//         </p>

//         <div className="flex items-center gap-2.5">
//           <span className="w-3.5 h-3.5 rounded-lg bg-blue-600 shadow-sm"></span>
//           <span className="text-slate-800 font-bold">Loading Zone (Mine)</span>
//         </div>

//         <div className="flex items-center gap-2.5">
//           <span className="w-3.5 h-3.5 rounded-lg bg-purple-600 shadow-sm"></span>
//           <span className="text-slate-800 font-bold">Unloading Zone (Plant)</span>
//         </div>

//         <div className="flex items-center gap-2.5 pt-1 border-t">
//           <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
//           <span className="text-slate-800 font-bold">Moving (&gt; 2 km/h)</span>
//         </div>

//         <div className="flex items-center gap-2.5">
//           <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
//           <span className="text-slate-800 font-bold">Idle (Engine ON)</span>
//         </div>
 
//         <div className="flex items-center gap-2.5">
//           <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span>
//           <span className="text-slate-800 font-bold">Parked / Stopped</span>
//         </div>

//         <div className="flex items-center gap-2 pt-2 border-t text-blue-600 font-black text-[11px]">
//           <Layers size={13} />
//           <span>Real-time Telemetry Synced</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LiveTracking;
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Radio, Activity, Layers, MapPin, Gauge, Weight, Power, Truck as TruckIcon, Sparkles, RefreshCw, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
const socket = io(API_BASE_URL);

// 🎨 Get Status & Color Mapping
const getTruckStatus = (truck) => {
  const speed = Number(truck.speed || 0);
  const isEngineOn = truck.ignition || speed > 0.5;
  const state = (truck.current_state || '').toUpperCase();
  const loadVal = Number(truck.io9 || truck.load || 0);
  const isLoaded = loadVal >= 1000;

  if (state.includes('UNLOAD') || state.includes('PLANT')) {
    return { 
      label: 'UNLOADING', 
      color: '#A855F7', 
      bg: 'bg-purple-600', 
      ringColor: '#D8B4FE',
      isUnloading: true,
      isLoaded: false
    };
  }

  if (!isLoaded) {
    return { 
      label: 'UNLOADED', 
      color: '#06B6D4', 
      bg: 'bg-cyan-600', 
      ringColor: '#67E8F9',
      isUnloading: false,
      isLoaded: false
    };
  }

  if (state.includes('LOAD') || state.includes('MINE')) {
    return { 
      label: 'LOADING', 
      color: '#3B82F6', 
      bg: 'bg-blue-600', 
      ringColor: '#93C5FD',
      isUnloading: false,
      isLoaded: true
    };
  }
  if (speed > 2) {
    return { 
      label: 'MOVING', 
      color: '#10B981', 
      bg: 'bg-emerald-500', 
      ringColor: '#6EE7B7',
      isUnloading: false,
      isLoaded: true
    };
  } else if (isEngineOn) {
    return { 
      label: 'IDLE', 
      color: '#F59E0B', 
      bg: 'bg-amber-500', 
      ringColor: '#FCD34D',
      isUnloading: false,
      isLoaded: true
    };
  } else {
    return { 
      label: 'PARKED', 
      color: '#EF4444', 
      bg: 'bg-rose-500', 
      ringColor: '#FCA5A5',
      isUnloading: false,
      isLoaded: true
    };
  }
};

// 🚛 Custom Dynamic Truck Icon Marker
const createTruckIcon = (truck) => {
  const status = getTruckStatus(truck);
  const name = truck.name || `Truck #${truck.traccar_id}`;
  const isUnloading = status.isUnloading;

  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background: ${isUnloading ? 'linear-gradient(135deg, #6b21a8 0%, #3b0764 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'};
          color: #ffffff;
          font-weight: 900;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          border: 2px solid ${isUnloading ? '#c084fc' : status.color};
          box-shadow: 0 8px 25px ${isUnloading ? 'rgba(168, 85, 247, 0.6)' : 'rgba(0,0,0,0.5)'};
          white-space: nowrap;
          margin-bottom: 6px;
          font-family: sans-serif;
          letter-spacing: 0.8px;
          display: flex;
          align-items: center;
          gap: 5px;
        ">
          <span style="
            width: 8px; 
            height: 8px; 
            background-color: ${status.color}; 
            border-radius: 50%; 
            display: inline-block;
            box-shadow: 0 0 8px ${status.color};
          "></span>
          ${name} (${status.label})
        </div>

        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="
            position: absolute;
            width: 46px;
            height: 46px;
            background-color: ${status.ringColor};
            border-radius: 50%;
            opacity: 0.6;
            animation: pulse-ring 1.6s infinite ease-out;
          "></div>
          <div style="
            background: linear-gradient(135deg, ${status.color} 0%, #090d16 150%);
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: 2.5px solid #ffffff;
            box-shadow: 0 6px 20px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          ">
            <div style="
              width: 12px; 
              height: 12px; 
              background-color: #ffffff; 
              border-radius: 50%; 
              box-shadow: 0 0 10px rgba(255,255,255,1);
            "></div>
          </div>
        </div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.9; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      </style>
    `,
    iconSize: [120, 80],
    iconAnchor: [60, 65],
  });
};

const MapRecenter = ({ vehicles }) => {
  const map = useMap();
  
  useEffect(() => {
    const validCoords = vehicles
      .filter(v => v.latitude && v.longitude)
      .map(v => [Number(v.latitude), Number(v.longitude)]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    }
  }, [vehicles.length, map]);

  return null;
};

const LiveTracking = () => {
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [mapType, setMapType] = useState('satellite');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchLiveVehicles = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/vehicles/live`);
      setVehicles(res.data || []);
    } catch (err) {
      console.error('Error fetching live vehicles:', err);
    }
  };

  const fetchGeofences = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/geofences`);
      setGeofences(res.data || []);
    } catch (err) {
      console.error('Error fetching geofences:', err);
    }
  };

  useEffect(() => {
    fetchLiveVehicles();
    fetchGeofences();

    socket.on('v-update', (data) => {
      setVehicles((prev) => {
        const exists = prev.find((v) => v.traccar_id === data.traccar_id);
        if (exists) {
          return prev.map((v) => (v.traccar_id === data.traccar_id ? { ...v, ...data } : v));
        }
        return [...prev, data];
      });
    });

    return () => socket.off('v-update');
  }, []);

  const unloadedTrucks = vehicles.filter(v => {
    const loadVal = Number(v.io9 || v.load || 0);
    const state = (v.current_state || '').toUpperCase();
    return loadVal < 1000 || state.includes('UNLOAD') || state.includes('PLANT');
  });

  const defaultCenter = [22.348, 82.656];

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none">
      
      {/* Top Floating Glass Command Bar */}
      <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3.5 bg-slate-900/85 backdrop-blur-2xl px-5 py-3.5 rounded-2xl border border-slate-700/60 shadow-2xl">
        <div className="p-2.5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
          <Activity size={20} />
        </div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-white">Fleet Control Command Center</h2>
          <p className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
            <Radio size={12} className="animate-pulse text-emerald-400" /> REALTIME TELEMETRY ACTIVE ({vehicles.length} TRUCKS)
          </p>
        </div>
      </div>

      {/* Unloaded Trucks Button in Bottom-Right Corner */}
      <div className="absolute bottom-6 right-6 z-[1000]">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-5 py-3 rounded-2xl shadow-2xl border border-cyan-400/40 font-black text-xs transition-all cursor-pointer active:scale-95"
        >
          <TruckIcon size={18} className="text-white animate-bounce" />
          <span>Unloaded / Unloading Trucks</span>
          <span className="bg-white text-slate-900 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow">
            {unloadedTrucks.length}
          </span>
        </button>
      </div>

      {/* Slide-out Unloaded Trucks Panel */}
      {isDrawerOpen && (
        <div className="absolute top-0 left-0 w-80 h-full bg-slate-900/95 backdrop-blur-2xl z-[2000] border-r border-slate-800 shadow-2xl flex flex-col p-5 font-sans animate-in slide-in-from-left duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/40 text-cyan-400">
                <TruckIcon size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider">Unloaded Fleet</h3>
                <p className="text-[10px] text-slate-400">Active Unloaded / Tipping Units</p>
              </div>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {unloadedTrucks.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-medium">
                No unloaded trucks currently active.
              </div>
            ) : (
              unloadedTrucks.map((truck) => {
                const status = getTruckStatus(truck);
                const loadVal = Number(truck.io9 || truck.load || 0);

                return (
                  <div 
                    key={truck.traccar_id}
                    className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 p-3.5 rounded-2xl shadow-lg transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }}></span>
                        {truck.name || `Truck #${truck.traccar_id}`}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white uppercase ${status.bg}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1 font-mono bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-400">IMEI:</span>
                        <span className="text-white font-bold">{truck.uniqueid || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payload (IO9):</span>
                        <span className="text-cyan-400 font-bold">{loadVal} (Unloaded)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Speed:</span>
                        <span className="text-emerald-400 font-bold">{Number(truck.speed || 0).toFixed(1)} km/h</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Map Switcher Control */}
      <div className="absolute top-6 right-6 z-[1000] bg-slate-900/85 backdrop-blur-2xl p-1.5 rounded-2xl border border-slate-700/60 shadow-2xl flex gap-1.5">
        <button
          onClick={() => setMapType('satellite')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            mapType === 'satellite' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapType('street')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            mapType === 'street' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Street
        </button>
      </div>

      {/* Map Renderer */}
      <MapContainer center={defaultCenter} zoom={13} zoomControl={false} className="w-full h-full z-0">
        {mapType === 'satellite' ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
        )}

        <MapRecenter vehicles={vehicles} />

        {/* 🟢 Geofence Overlay Rendering (Loading & Unloading Zones Restored) */}
        {geofences.map((gf) => {
          const type = (gf.type || gf.category || '').toLowerCase();
          const name = (gf.name || 'Zone').toUpperCase();

          const isUnloading = type === 'unloading';
          const strokeColor = isUnloading ? '#A855F7' : '#3B82F6';
          const fillColor = isUnloading ? '#C084FC' : '#60A5FA';

          if (gf.coordinates && Array.isArray(gf.coordinates) && gf.coordinates.length > 0) {
            return (
              <Polygon
                key={gf.id || gf.name}
                positions={gf.coordinates}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.28,
                  weight: 3,
                  dashArray: '8, 8'
                }}
              >
                <Tooltip permanent direction="center" opacity={0.95}>
                  <span className="font-black text-[10px] tracking-wider text-slate-900 px-2.5 py-1 bg-white/95 rounded-xl border shadow-lg">
                    {name}
                  </span>
                </Tooltip>
              </Polygon>
            );
          }

          if (gf.latitude && gf.longitude && gf.radius) {
            return (
              <Circle
                key={gf.id || gf.name}
                center={[Number(gf.latitude), Number(gf.longitude)]}
                radius={Number(gf.radius)}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.28,
                  weight: 3,
                  dashArray: '8, 8'
                }}
              >
                <Tooltip permanent direction="center" opacity={0.95}>
                  <span className="font-black text-[10px] tracking-wider text-slate-900 px-2.5 py-1 bg-white/95 rounded-lg border shadow-lg">
                    {name}
                  </span>
                </Tooltip>
              </Circle>
            );
          }
          return null;
        })}

        {/* Truck Marker Rendering */}
        {vehicles.map((truck) => {
          if (!truck.latitude || !truck.longitude) return null;
          const status = getTruckStatus(truck);
          
          const loadVal = Number(truck.io9 || truck.load || 0);
          const isLoaded = loadVal >= 1000;

          return (
            <Marker
              key={truck.traccar_id}
              position={[Number(truck.latitude), Number(truck.longitude)]}
              icon={createTruckIcon(truck)}
            >
              <Popup className="custom-popup">
                <div className="p-3.5 min-w-[250px] font-sans bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800">
                  
                  {/* Popup Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                    <span className="font-black text-sm text-white flex items-center gap-2">
                      <TruckIcon size={16} className={status.isUnloading ? 'text-purple-400 animate-bounce' : 'text-blue-400'} /> 
                      {truck.name}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider ${status.bg} shadow-md`}>
                      {status.label}
                    </span>
                  </div>

                  {status.isUnloading && (
                    <div className="mb-2.5 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 p-2.5 rounded-xl border border-purple-500/50 flex items-center justify-between animate-pulse">
                      <span className="text-[10px] font-black text-purple-200 tracking-wider flex items-center gap-1.5 uppercase">
                        <RefreshCw size={13} className="animate-spin text-purple-300" /> Tipping / Unloading Active
                      </span>
                      <span className="text-[10px] font-extrabold text-white bg-purple-600 px-2 py-0.5 rounded-md">PLANT</span>
                    </div>
                  )}

                  {truck.address && (
                    <div className="flex items-start gap-2 text-xs text-slate-300 mb-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                      <MapPin size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span className="font-medium leading-tight">{truck.address}</span>
                    </div>
                  )}

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><Gauge size={13}/> Speed:</span>
                      <span className="font-mono font-bold text-white">{Number(truck.speed || 0).toFixed(1)} km/h</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5"><Weight size={13}/> Payload (IO9):</span>
                      <span className={`font-black px-2.5 py-0.5 rounded-lg text-[10px] ${isLoaded ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                        {loadVal} ({isLoaded ? 'LOADED' : 'UNLOADED'})
                      </span>
                    </div>

                    <div className="border-t border-slate-800 pt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5"><Power size={13}/> Ignition:</span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.ignition ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                          {truck.ignition ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Body Tipping:</span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.bodyStatus === 'Up' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'}`}>
                          {truck.bodyStatus || 'Down'}
                        </span>
                      </div>
                    </div>

                    {(truck.distToLoading || truck.distToUnloading) && (
                      <div className="border-t border-slate-800 pt-2 space-y-1 font-semibold text-[11px]">
                        {truck.distToLoading && (
                          <div className="flex justify-between items-center text-blue-400">
                            <span>To Mine (Loading):</span>
                            <span>{truck.distToLoading}</span>
                          </div>
                        )}
                        {truck.distToUnloading && (
                          <div className="flex justify-between items-center text-purple-400">
                            <span>To Plant (Unloading):</span>
                            <span>{truck.distToUnloading}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Status Guide Panel */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-2xl p-5 rounded-3xl border border-slate-800 shadow-2xl text-xs space-y-3 font-medium min-w-[270px]">
        <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
          <Sparkles size={12} className="text-blue-400" /> Live Fleet & Zone Legend
        </p>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-xl bg-purple-600 shadow-md shadow-purple-600/30 shrink-0"></span>
          <span className="text-slate-200 font-bold whitespace-nowrap">Unloading / Plant (Active)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-xl bg-cyan-600 shadow-md shadow-cyan-600/30 shrink-0"></span>
          <span className="text-slate-200 font-bold whitespace-nowrap">Unloaded (Payload &lt; 1000)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-xl bg-blue-600 shadow-md shadow-blue-600/30 shrink-0"></span>
          <span className="text-slate-200 font-bold whitespace-nowrap">Loading / Loaded Zone</span>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/40 shrink-0"></span>
          <span className="text-slate-200 font-bold">Moving (&gt; 2 km/h)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-md shadow-amber-500/40 shrink-0"></span>
          <span className="text-slate-200 font-bold">Idle (Engine ON)</span>
        </div>
 
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-md shadow-rose-500/40 shrink-0"></span>
          <span className="text-slate-200 font-bold">Parked / Stopped</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-blue-400 font-black text-[11px]">
          <Layers size={13} />
          <span>Real-time Telemetry Synced</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
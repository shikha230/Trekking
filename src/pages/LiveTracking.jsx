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
// 
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Radio, Activity, Truck as TruckIcon, Sparkles, X, ChevronLeft, ChevronRight, Search, History } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
const socket = io(API_BASE_URL);

// 🎨 Status & Color Mapping
const getTruckStatus = (truck) => {
  const speed = Number(truck.speed || 0);
  const state = (truck.current_state || '').toUpperCase();

  if (state.includes('UNLOAD') || state.includes('PLANT')) {
    return { label: 'UNLOADING', color: '#22C55E', bg: 'bg-green-600', ringColor: '#86EFAC', isUnloading: true };
  }
  if (state.includes('LOAD') || state.includes('MINE')) {
    return { label: 'LOADING', color: '#EAB308', bg: 'bg-yellow-500', ringColor: '#FEF08A', isUnloading: false };
  }
  if (speed > 2) {
    return { label: 'MOVING', color: '#3B82F6', bg: 'bg-blue-600', ringColor: '#93C5FD', isUnloading: false };
  } else {
    return { label: 'IDLE / STOPPED', color: '#EF4444', bg: 'bg-red-600', ringColor: '#FCA5A5', isUnloading: false };
  }
};

// 🚛 Clean & Minimal Truck Marker
const createTruckIcon = (truck) => {
  const status = getTruckStatus(truck);
  const name = truck.name || `Truck #${truck.traccar_id}`;

  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; pointer-events: none;">
        <div style="
          background: #0f172a;
          color: #ffffff;
          font-weight: 800;
          font-size: 9px;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1.5px solid ${status.color};
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          white-space: nowrap;
          margin-bottom: 4px;
          font-family: sans-serif;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span style="width: 6px; height: 6px; background-color: ${status.color}; border-radius: 50%; display: inline-block;"></span>
          ${name}
        </div>
        <div style="
          background: ${status.color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [100, 60],
    iconAnchor: [50, 45],
  });
};

const MapController = ({ selectedTruck, vehicles }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedTruck && selectedTruck.latitude && selectedTruck.longitude) {
      map.setView([Number(selectedTruck.latitude), Number(selectedTruck.longitude)], 16, { animate: true });
    } else if (vehicles.length > 0 && !selectedTruck) {
      const validCoords = vehicles.filter(v => v.latitude && v.longitude).map(v => [Number(v.latitude), Number(v.longitude)]);
      if (validCoords.length > 0) {
        map.fitBounds(L.latLngBounds(validCoords), { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [selectedTruck, map]);

  return null;
};

const LiveTracking = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [mapType, setMapType] = useState('satellite');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);
  const markerRefs = useRef({});

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

  const filteredVehicles = vehicles.filter(v => 
    (v.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(v.traccar_id).includes(searchQuery)
  );

  const defaultCenter = [22.348, 82.656];

  const handleTruckSelect = (truck) => {
    setSelectedTruck(truck);
    if (truck.traccar_id && markerRefs.current[truck.traccar_id]) {
      markerRefs.current[truck.traccar_id].openPopup();
    }
  };

  // 🚀 Redirect to /history-playback with Device ID
  const handleRedirectToReplay = (e, truck) => {
    e.stopPropagation();
    const deviceId = truck.traccar_id || truck.id;
    navigate(`/history-playback?deviceId=${deviceId}`);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans select-none flex">
      
      {/* Left Sidebar - Devices List */}
      <div className={`relative z-[1500] bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/20 rounded-lg text-blue-400">
              <TruckIcon size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-white">Devices List</h3>
              <p className="text-[10px] text-slate-400">{vehicles.length} Units Connected</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer">
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-slate-800/60">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Device..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredVehicles.map((truck) => {
            const status = getTruckStatus(truck);
            const isSelected = selectedTruck?.traccar_id === truck.traccar_id;

            return (
              <div
                key={truck.traccar_id}
                onClick={() => handleTruckSelect(truck)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected ? 'bg-blue-600/20 border-blue-500/60' : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }}></span>
                  <div>
                    <h4 className="text-xs font-black text-white">{truck.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Speed: {Number(truck.speed || 0).toFixed(1)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${status.bg}`}>
                    {status.label}
                  </span>
                  
                  {/* Direct Replay Button */}
                  <button
                    onClick={(e) => handleRedirectToReplay(e, truck)}
                    title="Replay History"
                    className="p-1.5 bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <History size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toggle button when closed */}
      {!isSidebarOpen && (
        <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-[1600] bg-slate-900/90 p-2.5 rounded-xl border border-slate-700 text-white shadow-lg cursor-pointer">
          <ChevronRight size={16} />
        </button>
      )}

      {/* Map Area */}
      <div className="flex-1 relative h-full">
        
        {/* Top Floating Header */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 bg-slate-900/85 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-slate-700/60 shadow-xl">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg text-white">
            <Activity size={16} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-white">Fleet Command Center</h2>
            <p className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
              <Radio size={10} className="animate-pulse" /> LIVE TELEMETRY ACTIVE
            </p>
          </div>
        </div>

        {/* Map Switcher */}
        <div className="absolute top-4 right-4 z-[1000] bg-slate-900/85 backdrop-blur-xl p-1 rounded-xl border border-slate-700/60 shadow-xl flex gap-1">
          <button onClick={() => setMapType('satellite')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Satellite</button>
          <button onClick={() => setMapType('street')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer ${mapType === 'street' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Street</button>
        </div>

        {/* Unloaded Floating Button */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-xl border border-cyan-400/40 font-black text-xs cursor-pointer">
            <TruckIcon size={16} />
            <span>Unloaded / Unloading</span>
            <span className="bg-white text-slate-900 px-2 py-0.5 rounded-full text-[9px] font-black">{unloadedTrucks.length}</span>
          </button>
        </div>

        {/* Unloaded Drawer */}
        {isDrawerOpen && (
          <div className="absolute top-0 right-0 w-72 h-full bg-slate-900/95 backdrop-blur-xl z-[2000] border-l border-slate-800 shadow-2xl flex flex-col p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <h3 className="text-xs font-black uppercase text-white">Unloaded Fleet ({unloadedTrucks.length})</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {unloadedTrucks.map((truck) => (
                <div key={truck.traccar_id} onClick={() => handleTruckSelect(truck)} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 cursor-pointer">
                  <div className="flex justify-between text-xs font-black text-white">
                    <span>{truck.name}</span>
                    <span className="text-cyan-400 font-mono">IO9: {truck.io9 || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <MapContainer center={defaultCenter} zoom={13} zoomControl={false} className="w-full h-full z-0">
          <TileLayer url={mapType === 'satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
          <MapController selectedTruck={selectedTruck} vehicles={vehicles} />

          {/* Clean Geofences */}
          {geofences.map((gf) => {
            const isUnloading = (gf.type || gf.category || '').toLowerCase() === 'unloading';
            const color = isUnloading ? '#22C55E' : '#EAB308';
            if (gf.coordinates && Array.isArray(gf.coordinates)) {
              return <Polygon key={gf.id || gf.name} positions={gf.coordinates} pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }} />;
            }
            if (gf.latitude && gf.longitude && gf.radius) {
              return <Circle key={gf.id || gf.name} center={[Number(gf.latitude), Number(gf.longitude)]} radius={Number(gf.radius)} pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }} />;
            }
            return null;
          })}

          {/* Markers */}
          {vehicles.map((truck) => {
            if (!truck.latitude || !truck.longitude) return null;
            return (
              <Marker
                key={truck.traccar_id}
                position={[Number(truck.latitude), Number(truck.longitude)]}
                icon={createTruckIcon(truck)}
                ref={(el) => { if (el) markerRefs.current[truck.traccar_id] = el; }}
                eventHandlers={{ click: () => setSelectedTruck(truck) }}
              >
                <Popup className="custom-popup">
                  <div className="p-3 min-w-[220px] bg-slate-950 text-white rounded-2xl shadow-xl border border-slate-800 space-y-2.5">
                    <div className="text-center pb-2 border-b border-slate-800">
                      <h3 className="font-black text-xs text-white">{truck.name}</h3>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between"><span className="text-slate-400">Ignition:</span> <span className={truck.ignition ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{truck.ignition ? 'ON' : 'OFF'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Load Status (IO6):</span> <span className="font-mono font-bold text-cyan-400">{truck.io6 || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Dala Pos (IO9):</span> <span className="font-mono font-bold text-blue-400">{truck.io9 || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Speed:</span> <span className="font-mono font-bold text-emerald-400">{Number(truck.speed || 0).toFixed(1)} km/h</span></div>
                    </div>

                    {/* Replay Redirect Button */}
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={(e) => handleRedirectToReplay(e, truck)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                      >
                        <History size={14} />
                        Replay History
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800 shadow-xl text-[11px] space-y-2">
          <p className="font-black uppercase tracking-wider text-[9px] text-slate-400 border-b border-slate-800 pb-1.5 flex items-center gap-1">
            <Sparkles size={10} className="text-blue-400" /> Status Legend
          </p>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]"></span><span className="text-slate-200 font-bold">Loading</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></span><span className="text-slate-200 font-bold">Unloading</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span><span className="text-slate-200 font-bold">Moving</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span><span className="text-slate-200 font-bold">Idle / Stopped</span></div>
        </div>

      </div>
    </div>
  );
};

export default LiveTracking;
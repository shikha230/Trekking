import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Play, Pause, RotateCcw, FastForward, Clock, Truck as TruckIcon, MapPin, Gauge, Activity, Route } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

// 🚛 Custom Dynamic Truck Replay Marker Icon with Cargo Bed Color (Mitti/Material)
const createReplayTruckIcon = (heading = 0, isLoaded = false) => {
  const cargoColor = isLoaded ? '#8B5A2B' : '#94A3B8';
  const badgeText = isLoaded ? 'LOADED' : 'EMPTY';
  const badgeBg = isLoaded ? '#16A34A' : '#64748B';

  return L.divIcon({
    className: 'replay-truck-marker',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="
          background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 2.5px solid ${isLoaded ? '#22C55E' : '#FFFFFF'};
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          
          <div style="
            position: absolute;
            top: 6px;
            left: 6px;
            width: 13px;
            height: 10px;
            background-color: ${cargoColor};
            border-radius: 2px;
            border: 1px solid rgba(255,255,255,0.4);
          "></div>
        </div>
        <span style="
          background-color: ${badgeBg};
          color: white;
          font-size: 8px;
          font-weight: 900;
          padding: 1px 5px;
          border-radius: 6px;
          margin-top: 3px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.4);
          letter-spacing: 0.5px;
        ">${badgeText}</span>
      </div>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 30],
  });
};

const MapRecenter = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.setView(coords, 18, { animate: true });
    }
  }, [coords, map]);
  return null;
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  } catch (e) {
    return isoString;
  }
};

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const HistoricalPlayback = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectionMode, setSelectionMode] = useState('completed_trip');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tripDateFilter, setTripDateFilter] = useState('');
  const [completedTrips, setCompletedTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const [geofences, setGeofences] = useState([]);
  const [mapType, setMapType] = useState('google');

  const [playbackData, setPlaybackData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [currentAddress, setCurrentAddress] = useState('Kusmunda Mine Area');
  
  const [totalDistance, setTotalDistance] = useState(0);
  const [coveredDistance, setCoveredDistance] = useState(0);
  
  const timerRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/trips/vehicles-list`)
      .then(res => setDevices(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Error fetching vehicles list:', err));

    axios.get(`${API_BASE_URL}/api/trips/trip?page=1&limit=100`)
      .then(res => {
        const tripsArr = res.data.trips || res.data;
        const validCompletedTrips = Array.isArray(tripsArr) 
          ? tripsArr.filter(t => (t.status || '').toUpperCase() === 'COMPLETED') 
          : [];
        setCompletedTrips(validCompletedTrips);
      })
      .catch(err => console.error('Error fetching completed trips:', err));

    axios.get(`${API_BASE_URL}/api/geofences`)
      .then(res => setGeofences(res.data || []))
      .catch(err => console.error('Error fetching geofences:', err));
  }, []);

  const handleFetchPlayback = async (e) => {
    e.preventDefault();
    try {
      let queryUrl = '';
      if (selectionMode === 'completed_trip' && selectedTrip) {
        const tripObj = completedTrips.find(t => (t.id || t.tripId) == selectedTrip);
        if (tripObj) {
          const devId = tripObj.vehicle_id || tripObj.deviceid;
          const sTime = tripObj.start_time;
          const eTime = tripObj.end_time;
          queryUrl = `${API_BASE_URL}/api/trips/history/${devId}?startDate=${sTime}&endDate=${eTime}`;
        } else {
          queryUrl = `${API_BASE_URL}/api/trips/history/${selectedTrip}`;
        }
      } else {
        queryUrl = `${API_BASE_URL}/api/trips/history/${selectedDevice}?startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await axios.get(queryUrl);
      const historyArray = res.data.history || res.data;
      setPlaybackData(Array.isArray(historyArray) ? historyArray : []);
      
      if (Array.isArray(historyArray) && historyArray.length > 1) {
        let total = 0;
        for (let i = 0; i < historyArray.length - 1; i++) {
          total += getDistanceFromLatLonInKm(
            Number(historyArray[i].latitude), Number(historyArray[i].longitude),
            Number(historyArray[i+1].latitude), Number(historyArray[i+1].longitude)
          );
        }
        setTotalDistance(total);
      } else {
        setTotalDistance(0);
      }

      setCoveredDistance(0);
      setCurrentIndex(0);
      setIsPlaying(false);
    } catch (err) {
      alert('Failed to load playback data for the selected filter.');
      console.error(err);
    }
  };

  const currentPoint = playbackData[currentIndex] || playbackData[0] || {};
  const routeCoordinates = Array.isArray(playbackData) ? playbackData.map(p => [Number(p.latitude), Number(p.longitude)]) : [];
  const currentPos = currentPoint.latitude ? [Number(currentPoint.latitude), Number(currentPoint.longitude)] : [22.348, 82.656];

  const io9Val = Number(currentPoint.io9 ?? currentPoint.attributes?.io9 ?? 0);
  const isLoaded = io9Val >= 1000;

  useEffect(() => {
    if (playbackData.length > 1 && currentIndex > 0) {
      let covered = 0;
      for (let i = 0; i < currentIndex; i++) {
        covered += getDistanceFromLatLonInKm(
          Number(playbackData[i].latitude), Number(playbackData[i].longitude),
          Number(playbackData[i+1].latitude), Number(playbackData[i+1].longitude)
        );
      }
      setCoveredDistance(covered);
    } else {
      setCoveredDistance(0);
    }
  }, [currentIndex, playbackData]);

  const filteredCompletedTrips = completedTrips.filter(trip => {
    if (!tripDateFilter) return true;
    const tripDate = (trip.start_time || '').split('T')[0];
    return tripDate === tripDateFilter;
  });

  // ⚡ Throttled & Debounced Geocoding to prevent 429 Too Many Requests error
  useEffect(() => {
    if (currentPoint) {
      if (currentPoint.address && currentPoint.address.trim() !== '') {
        setCurrentAddress(currentPoint.address);
        return;
      }

      if (currentPoint.latitude && currentPoint.longitude) {
        const lat = currentPoint.latitude;
        const lon = currentPoint.longitude;

        if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

        geocodeTimeoutRef.current = setTimeout(() => {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
              if (data && data.display_name) {
                const parts = data.display_name.split(',');
                const shortAddress = parts.slice(0, 3).join(',').trim();
                setCurrentAddress(shortAddress || data.display_name);
              } else {
                setCurrentAddress(`Kusmunda Mining Area (${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)})`);
              }
            })
            .catch(() => {
              setCurrentAddress(`Kusmunda Area (${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)})`);
            });
        }, 800); // 800ms debounce delay to protect API limits
      }
    }
  }, [currentIndex, playbackData]);

  useEffect(() => {
    if (isPlaying && playbackData.length > 0) {
      const baseInterval = 1000;
      const activeInterval = baseInterval / speedMultiplier;

      timerRef.current = setTimeout(() => {
        if (currentIndex < playbackData.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentIndex(0);
        }
      }, activeInterval);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, playbackData, speedMultiplier]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans flex flex-col">
      
      {/* Top-Left Control Panel */}
      <div className="absolute top-5 left-5 z-[1000] bg-slate-900/95 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-800 shadow-2xl w-[380px] space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
              <Clock size={16} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Historical Replay</h2>
          </div>
          
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl text-[10px] font-black">
            <button 
              onClick={() => setSelectionMode('completed_trip')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${selectionMode === 'completed_trip' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Completed Trip
            </button>
            <button 
              onClick={() => setSelectionMode('custom')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${selectionMode === 'custom' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Custom
            </button>
          </div>
        </div>

        <form onSubmit={handleFetchPlayback} className="space-y-2.5 text-xs">
          {selectionMode === 'completed_trip' ? (
            <>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Filter by Date</label>
                <input 
                  type="date" 
                  value={tripDateFilter} 
                  onChange={(e) => setTripDateFilter(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Completed Trip ({filteredCompletedTrips.length} Available)</label>
                <select 
                  value={selectedTrip} 
                  onChange={(e) => setSelectedTrip(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500 text-xs"
                  required
                >
                  <option value="">-- Choose Completed Trip --</option>
                  {filteredCompletedTrips.map((trip, idx) => (
                    <option key={trip.id || idx} value={trip.id || idx}>
                      {trip.vehicle_name || trip.device_name || `Truck`} ({formatDateTime(trip.start_time)}) [COMPLETED]
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Truck / Device</label>
                <select 
                  value={selectedDevice} 
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500 text-xs"
                  required
                >
                  <option value="">-- Choose Truck --</option>
                  {devices.map(d => (
                    <option key={d.id || d.traccar_id} value={d.id || d.traccar_id}>
                      {d.name} (IMEI: {d.uniqueid || d.traccar_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500 text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">End Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500 text-xs"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl shadow-lg transition-all cursor-pointer mt-1"
          >
            Load Playback Route
          </button>
        </form>
      </div>

      {/* Top-Right Controls */}
      <div className="absolute top-5 right-5 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Map Type Switcher */}
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl p-1 rounded-xl border border-slate-800 shadow-2xl flex gap-1">
          <button
            onClick={() => setMapType('google')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mapType === 'google' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Google Map
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mapType === 'satellite' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Telemetry HUD Card with Load Status & Distance */}
        {playbackData.length > 0 && (
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-2 w-[310px] text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Activity size={13} className="animate-pulse text-emerald-400" /> Live HUD
              </span>
              <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">
                {currentIndex + 1} / {playbackData.length}
              </span>
            </div>
            <div className="space-y-1.5 font-medium text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Truck:</span>
                <span className="font-bold">{currentPoint.vehicle_name || currentPoint.device_name || 'Unit'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Material Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isLoaded ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-700 text-slate-300'}`}>
                  {isLoaded ? '🟢 LOADED (Mitti Bhari)' : '⚪ UNLOADED (Khali)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Speed:</span>
                <span className="font-mono text-emerald-400 font-bold">{Number(currentPoint.speed || 0).toFixed(1)} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Covered / Total:</span>
                <span className="font-mono text-cyan-400 font-bold flex items-center gap-1">
                  <Route size={12} /> {coveredDistance.toFixed(2)} / {totalDistance.toFixed(2)} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="font-mono text-blue-300 text-[10px]">{formatDateTime(currentPoint.devicetime || currentPoint.servertime)}</span>
              </div>
              <div className="pt-1 border-t border-slate-800 space-y-0.5">
                <span className="text-slate-400 flex items-center gap-1 font-bold text-[10px]">
                  <MapPin size={11} className="text-rose-400 shrink-0" /> Location:
                </span>
                <p className="text-[10px] text-slate-200 font-normal bg-slate-800/80 p-2 rounded-xl border border-slate-700/50 leading-tight">
                  {currentAddress}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Replay Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer center={currentPos} zoom={18} zoomControl={false} className="w-full h-full z-0">
          {mapType === 'satellite' ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri"
            />
          ) : (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
            />
          )}

          <MapRecenter coords={currentPos} />

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
                  pathOptions={{ color: strokeColor, fillColor: fillColor, fillOpacity: 0.25, weight: 2.5, dashArray: '6, 6' }}
                >
                  <Tooltip permanent direction="center" opacity={0.95}>
                    <span className="font-black text-[9px] text-slate-900 px-2 py-0.5 bg-white/95 rounded border shadow">
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
                  pathOptions={{ color: strokeColor, fillColor: fillColor, fillOpacity: 0.25, weight: 2.5, dashArray: '6, 6' }}
                >
                  <Tooltip permanent direction="center" opacity={0.95}>
                    <span className="font-black text-[9px] text-slate-900 px-2 py-0.5 bg-white/95 rounded border shadow">
                      {name}
                    </span>
                  </Tooltip>
                </Circle>
              );
            }
            return null;
          })}

          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} pathOptions={{ color: '#2563EB', weight: 4.5, opacity: 0.9 }} />
          )}

          {currentPoint.latitude && (
            <Marker position={currentPos} icon={createReplayTruckIcon(currentPoint.course || 0, isLoaded)}>
              <Popup className="custom-popup">
                <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1.5 font-sans min-w-[200px]">
                  <p className="font-black text-sm text-amber-400">{currentPoint.vehicle_name || currentPoint.device_name || 'Truck Unit'}</p>
                  <p className="text-slate-300"><b>Status:</b> {isLoaded ? '🟢 LOADED (Mitti)' : '⚪ UNLOADED'}</p>
                  <p className="text-slate-300"><b>Time:</b> {formatDateTime(currentPoint.devicetime || currentPoint.servertime)}</p>
                  <p className="text-slate-300"><b>Speed:</b> {Number(currentPoint.speed || 0).toFixed(1)} km/h</p>
                  <p className="text-slate-300"><b>Covered:</b> {coveredDistance.toFixed(2)} / {totalDistance.toFixed(2)} km</p>
                  <p className="text-slate-300"><b>Location:</b> {currentAddress}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Bottom Playback Control Dock */}
      {playbackData.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-5 w-[680px]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button 
              onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>{formatDateTime(playbackData[0]?.devicetime || playbackData[0]?.servertime)}</span>
              <span className="text-blue-400">{formatDateTime(currentPoint.devicetime || currentPoint.servertime)}</span>
              <span>{formatDateTime(playbackData[playbackData.length - 1]?.devicetime || playbackData[playbackData.length - 1]?.servertime)}</span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={playbackData.length - 1} 
              value={currentIndex} 
              onChange={(e) => { setIsPlaying(false); setCurrentIndex(Number(e.target.value)); }}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <FastForward size={14} className="text-slate-400 ml-1" />
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  speedMultiplier === speed ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}X
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalPlayback;
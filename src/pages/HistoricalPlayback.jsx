import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Play, Pause, RotateCcw, FastForward, Clock, Truck as TruckIcon, MapPin, Gauge, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

// 🚛 Custom Truck Replay Marker Icon
const createReplayTruckIcon = (heading = 0) => {
  return L.divIcon({
    className: 'replay-truck-marker',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center;">
        <div style="
          background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 2.5px solid #ffffff;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const MapRecenter = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.setView(coords, 15, { animate: true });
    }
  }, [coords, map]);
  return null;
};

const HistoricalPlayback = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectionMode, setSelectionMode] = useState('completed_trip'); // 'completed_trip' or 'custom'
  
  // Inputs
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [completedTrips, setCompletedTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');

  // Playback States
  const [playbackData, setPlaybackData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1X, 2X, 4X
  const [currentAddress, setCurrentAddress] = useState('Fetching location...');
  
  const timerRef = useRef(null);

  // Fetch Devices & Completed Trips on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/trips/vehicles-list`)
      .then(res => setDevices(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Error fetching vehicles list:', err));

    axios.get(`${API_BASE_URL}/api/trips/trip?page=1&limit=20`)
      .then(res => {
        const tripsArr = res.data.trips || res.data;
        setCompletedTrips(Array.isArray(tripsArr) ? tripsArr : []);
      })
      .catch(err => console.error('Error fetching completed trips:', err));
  }, []);

  // Fetch Playback Data
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

  // 📍 Reverse Geocoding to get exact Google-like location name from Lat/Lng
  useEffect(() => {
    if (currentPoint.latitude && currentPoint.longitude) {
      const lat = currentPoint.latitude;
      const lon = currentPoint.longitude;
      
      // OpenStreetMap Nominatim API for reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
          if (data && data.display_name) {
            setCurrentAddress(data.display_name);
          } else {
            setCurrentAddress('Location in transit / Mine Area');
          }
        })
        .catch(() => {
          setCurrentAddress(`${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`);
        });
    }
  }, [currentIndex, playbackData]);

  // Playback Animation Loop with 1X, 2X, 4X Speed Controls
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
      
      {/* Top Glass Control Command Panel */}
      <div className="absolute top-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur-2xl p-5 rounded-3xl border border-slate-800 shadow-2xl w-[420px] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
              <Clock size={18} />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Fleet Historical Replay</h2>
          </div>
          
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl text-[10px] font-black">
            <button 
              onClick={() => setSelectionMode('completed_trip')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${selectionMode === 'completed_trip' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Completed Trip
            </button>
            <button 
              onClick={() => setSelectionMode('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${selectionMode === 'custom' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Custom Interval
            </button>
          </div>
        </div>

        <form onSubmit={handleFetchPlayback} className="space-y-3 text-xs">
          {selectionMode === 'completed_trip' ? (
            <div>
              <label className="text-slate-400 font-bold block mb-1">Select Completed Trip (Mine ➔ Plant)</label>
              <select 
                value={selectedTrip} 
                onChange={(e) => setSelectedTrip(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">-- Choose Completed Trip --</option>
                {completedTrips.map((trip, idx) => (
                  <option key={trip.id || idx} value={trip.id || idx}>
                    {trip.vehicle_name || trip.device_name || `Truck`} ({trip.start_time || 'Start'} - {trip.end_time || 'End'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Select Truck / Device</label>
                <select 
                  value={selectedDevice} 
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
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
                <label className="text-slate-400 font-bold block mb-1">Start Date & Time (IST)</label>
                <input 
                  type="datetime-local" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">End Date & Time (IST)</label>
                <input 
                  type="datetime-local" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer mt-2"
          >
            Load Playback Route
          </button>
        </form>
      </div>

      {/* 📍 Floating Live Telemetry & Exact Location HUD Card (Top Right) */}
      {playbackData.length > 0 && (
        <div className="absolute top-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-2xl p-4 rounded-2xl border border-slate-800 shadow-2xl text-xs space-y-2.5 w-[320px] text-white">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="animate-pulse text-emerald-400" /> Replay Telemetry
            </span>
            <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">
              {playbackData.length > 0 ? `${currentIndex + 1} / ${playbackData.length}` : '0'}
            </span>
          </div>
          <div className="space-y-1.5 font-medium">
            <div className="flex justify-between">
              <span className="text-slate-400">Truck:</span>
              <span className="font-bold">{currentPoint.vehicle_name || currentPoint.device_name || 'Unit'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Speed:</span>
              <span className="font-mono text-emerald-400 font-bold">{Number(currentPoint.speed || 0).toFixed(1)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-amber-400">{currentPoint.status || 'In Transit'}</span>
            </div>
            <div className="pt-1 border-t border-slate-800 space-y-1">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin size={12} className="text-rose-400" /> Exact Location (Google Format):
              </span>
              <p className="text-[11px] text-slate-200 font-normal bg-slate-800/80 p-2 rounded-xl border border-slate-700/50 leading-tight line-clamp-3">
                {currentAddress}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Map Replay Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer center={currentPos} zoom={14} zoomControl={false} className="w-full h-full z-0">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
          <MapRecenter coords={currentPos} />

          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} pathOptions={{ color: '#3B82F6', weight: 4.5, opacity: 0.85 }} />
          )}

          {currentPoint.latitude && (
            <Marker position={currentPos} icon={createReplayTruckIcon(currentPoint.course || 0)}>
              <Popup className="custom-popup">
                <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1.5 font-sans min-w-[200px]">
                  <p className="font-black text-sm text-blue-400">{currentPoint.vehicle_name || currentPoint.device_name || 'Truck Unit'}</p>
                  <p className="text-slate-300"><b>Time:</b> {currentPoint.devicetime || currentPoint.servertime}</p>
                  <p className="text-slate-300"><b>Speed:</b> {Number(currentPoint.speed || 0).toFixed(1)} km/h</p>
                  <p className="text-slate-300"><b>Location:</b> {currentAddress}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Bottom Playback Control Dock */}
      {playbackData.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 backdrop-blur-2xl px-6 py-4 rounded-3xl border border-slate-800 shadow-2xl flex items-center gap-6 w-[720px]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              onClick={() => { setIsPlaying(false); setCurrentIndex(0); }}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all cursor-pointer"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>{playbackData[0]?.devicetime || playbackData[0]?.servertime || 'Start'}</span>
              <span className="text-blue-400">{currentPoint.devicetime || currentPoint.servertime || 'Current'}</span>
              <span>{playbackData[playbackData.length - 1]?.devicetime || playbackData[playbackData.length - 1]?.servertime || 'End'}</span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={playbackData.length - 1} 
              value={currentIndex} 
              onChange={(e) => { setIsPlaying(false); setCurrentIndex(Number(e.target.value)); }}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <FastForward size={14} className="text-slate-400 ml-1" />
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  speedMultiplier === speed ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
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
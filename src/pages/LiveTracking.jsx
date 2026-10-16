import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Radio, Activity, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;
const socket = io(API_BASE_URL);

const getTruckStatus = (truck) => {
  const speed = Number(truck.speed || 0);
  const isEngineOn = truck.ignition || speed > 0.5;
  const state = (truck.current_state || '').toUpperCase();

  if (state.includes('UNLOAD') || state.includes('PLANT')) {
    return { label: 'UNLOADING', color: '#8B5CF6', bg: 'bg-purple-600' };
  }
  if (state.includes('LOAD') || state.includes('MINE')) {
    return { label: 'LOADING', color: '#2563EB', bg: 'bg-blue-600' };
  }
  if (speed > 2) {
    return { label: 'MOVING', color: '#10B981', bg: 'bg-emerald-500' };
  } else if (isEngineOn) {
    return { label: 'IDLE', color: '#F59E0B', bg: 'bg-amber-500' };
  } else {
    return { label: 'PARKED', color: '#EF4444', bg: 'bg-rose-500' };
  }
};

const createTruckIcon = (truck) => {
  const status = getTruckStatus(truck);
  const name = truck.name || `Truck #${truck.traccar_id}`;

  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          background: #ffffff;
          color: #0f172a;
          font-weight: 800;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          white-space: nowrap;
          margin-bottom: 4px;
          font-family: sans-serif;
        ">
          ${name}
        </div>
        <div style="
          background-color: ${status.color};
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 2px solid white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background-color: white; border-radius: 50%;"></div>
        </div>
      </div>
    `,
    iconSize: [70, 50],
    iconAnchor: [35, 45],
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

  const defaultCenter = [22.348, 82.656];

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans select-none">
      <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-xl">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md">
          <Activity size={18} />
        </div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">Fleet Live Monitoring</h2>
          <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <Radio size={12} className="animate-pulse" /> ACTIVE PINGS ({vehicles.length})
          </p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xl flex gap-1">
        <button
          onClick={() => setMapType('satellite')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapType === 'satellite' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapType('street')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapType === 'street' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Street
        </button>
      </div>

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

        {geofences.map((gf) => {
          const type = (gf.type || gf.category || '').toLowerCase();
          const name = (gf.name || 'Zone').toUpperCase();

          const isUnloading = type === 'unloading';
          const strokeColor = isUnloading ? '#8B5CF6' : '#2563EB';
          const fillColor = isUnloading ? '#A78BFA' : '#60A5FA';

          if (gf.coordinates && Array.isArray(gf.coordinates) && gf.coordinates.length > 0) {
            return (
              <Polygon
                key={gf.id || gf.name}
                positions={gf.coordinates}
                pathOptions={{
                  color: strokeColor,
                  fillColor: fillColor,
                  fillOpacity: 0.35,
                  weight: 2.5,
                  dashArray: '6, 6'
                }}
              >
                <Tooltip permanent direction="center" opacity={0.9}>
                  <span className="font-extrabold text-[10px] tracking-wider text-slate-900 px-1.5 py-0.5 bg-white/90 rounded border shadow-sm">
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
                  fillOpacity: 0.35,
                  weight: 2.5,
                  dashArray: '6, 6'
                }}
              >
                <Tooltip permanent direction="center" opacity={0.9}>
                  <span className="font-extrabold text-[10px] tracking-wider text-slate-900 px-1.5 py-0.5 bg-white/90 rounded border shadow-sm">
                    {name}
                  </span>
                </Tooltip>
              </Circle>
            );
          }

          return null;
        })}

        {vehicles.map((truck) => {
          if (!truck.latitude || !truck.longitude) return null;
          const status = getTruckStatus(truck);

          return (
            <Marker
              key={truck.traccar_id}
              position={[Number(truck.latitude), Number(truck.longitude)]}
              icon={createTruckIcon(truck)}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[210px] font-sans">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-black text-sm text-slate-900">{truck.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">State:</span>
                      <span className="font-bold text-slate-900">{truck.current_state || 'IDLE'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Speed:</span>
                      <span className="font-mono font-bold">{Number(truck.speed || 0).toFixed(1)} km/h</span>
                    </div>

                    {/* Ignition & Body Status Added Here */}
                    <div className="border-t pt-1.5 mt-1.5 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Ignition:</span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.ignition ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {truck.ignition ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Body Status:</span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] ${truck.bodyStatus === 'Up' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                          {truck.bodyStatus || 'Down'}
                        </span>
                      </div>
                    </div>

                    {truck.distToLoading && (
                      <div className="flex justify-between items-center text-blue-600 font-semibold pt-1 border-t">
                        <span>To Loading:</span>
                        <span>{truck.distToLoading}</span>
                      </div>
                    )}
                    {truck.distToUnloading && (
                      <div className="flex justify-between items-center text-purple-600 font-semibold">
                        <span>To Unloading:</span>
                        <span>{truck.distToUnloading}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-2xl text-xs space-y-2 font-medium min-w-[210px]">
        <p className="font-extrabold uppercase tracking-widest text-[10px] text-slate-400 border-b pb-1">
          Live Fleet & Area Status
        </p>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400 shadow-sm"></span>
          <span className="text-slate-800 font-bold">Loading Area (Mine Zone)</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400 shadow-sm"></span>
          <span className="text-slate-800 font-bold">Unloading Area (Plant Zone)</span>
        </div>

        <div className="flex items-center gap-2.5 pt-1 border-t">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span>
          <span className="text-slate-800 font-bold">Moving (&gt; 2 km/h)</span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
          <span className="text-slate-800 font-bold">Idle (Engine ON, 0 km/h)</span>
        </div>
 
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span>
          <span className="text-slate-800 font-bold">Stopped / Parked</span>
        </div>

        <div className="flex items-center gap-2 pt-1.5 border-t text-blue-600 font-semibold text-[11px]">
          <Layers size={12} />
          <span>Active Zones Overlay Enabled</span>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
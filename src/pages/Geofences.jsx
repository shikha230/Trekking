import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Polygon, Marker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import { Map as MapIcon, Trash2, MapPin, Save, X, MoveHorizontal, Compass, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fixing Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const Geofences = () => {
  const [geofences, setGeofences] = useState([]);
  const [newFence, setNewFence] = useState(null); 
  const [loading, setLoading] = useState(false);

  const fetchGeofences = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/geofences`);
      setGeofences(res.data || []);
    } catch (err) { 
      console.error('Error fetching geofences:', err); 
    }
  };

  useEffect(() => { 
    fetchGeofences(); 
  }, []);

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setNewFence({ lat: e.latlng.lat, lng: e.latlng.lng, radius: 400, name: '', type: 'mine' });
      },
    });
    return null;
  };

  const saveFence = async () => {
    if (!newFence.name) return alert("Please enter a name");
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/geofences`, {
        name: newFence.name,
        type: newFence.type,
        latitude: newFence.lat,
        longitude: newFence.lng,
        radius: newFence.radius
      });
      setNewFence(null);
      fetchGeofences();
    } catch (err) { 
      alert("Error saving geofence"); 
    } finally { 
      setLoading(false); 
    }
  };

  const deleteFence = async (id) => {
    if(window.confirm("Are you sure you want to delete this zone perimeter?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/geofences/${id}`);
        fetchGeofences();
      } catch (err) {
        alert("Error deleting geofence");
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      
      {/* --- SIDEBAR PANEL --- */}
      <div className="w-88 bg-white border-r border-slate-200 flex flex-col z-[1001] shadow-xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl border border-blue-200/60">
              <MapIcon size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Geofence Control
              </h2>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                Spatial Perimeter Management
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* New Fence Card */}
          {newFence && (
            <div className="bg-blue-50/60 p-5 rounded-3xl border border-blue-200 shadow-sm animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass size={14} /> New Area Draft
                </span>
                <button 
                  onClick={() => setNewFence(null)} 
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-blue-100/60 rounded-xl transition-colors"
                >
                  <X size={16}/>
                </button>
              </div>
              
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                    Location Label
                  </label>
                  <input 
                    className="w-full p-3 rounded-2xl text-sm font-semibold border border-slate-200 shadow-sm focus:outline-none focus:border-blue-500 bg-white text-slate-900 placeholder-slate-400" 
                    placeholder="e.g. Pit Loading Bay A" 
                    onChange={(e) => setNewFence({...newFence, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                    Zone Type
                  </label>
                  <select 
                    className="w-full p-3 rounded-2xl text-sm font-bold border border-slate-200 shadow-sm bg-white text-slate-800 outline-none focus:border-blue-500"
                    onChange={(e) => setNewFence({...newFence, type: e.target.value})}
                  >
                    <option value="mine">Coal Mine / Loading Zone</option>
                    <option value="plant">Power Plant / Unloading Zone</option>
                  </select>
                </div>

                {/* Coverage Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Coverage Radius
                    </label>
                    <span className="text-xs font-black text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-lg">
                      {newFence.radius}m
                    </span>
                  </div>
                  <input 
                    type="range" min="100" max="2000" step="50"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={newFence.radius}
                    onChange={(e) => setNewFence({...newFence, radius: parseInt(e.target.value) || 100})}
                  />
                </div>

                <button 
                  onClick={saveFence} 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50 mt-2"
                >
                  {loading ? 'Deploying...' : <><Save size={16}/> Save Geofence</>}
                </button>
              </div>
            </div>
          )}

          {/* Active Geofences List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={13} /> Active Zones ({geofences.length})
              </h3>
            </div>

            {geofences.length === 0 && !newFence && (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <MapPin size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500">No Geofences Configured</p>
                <p className="text-[11px] text-slate-400 mt-1">Click anywhere on the map to place a target radius.</p>
              </div>
            )}
            
            {geofences.map(g => {
              const typeLower = (g.type || '').toLowerCase();
              const isMine = typeLower.includes('mine') || typeLower.includes('loading');
              return (
                <div key={g.id || g.name} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-sm hover:border-slate-300 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-10 rounded-xl ${isMine ? 'bg-amber-400' : 'bg-rose-500'}`} />
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{g.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${isMine ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {g.type || 'Zone'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {g.coordinates ? 'Polygon Shape' : `${g.radius || 300}m`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {g.id && (
                    <button 
                      onClick={() => deleteFence(g.id)} 
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-2 rounded-xl"
                      title="Delete Zone"
                    >
                      <Trash2 size={16}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MAP DISPLAY AREA --- */}
      <div className="flex-1 relative bg-slate-200">
        <MapContainer center={[22.34586, 82.63908]} zoom={14} className="h-full w-full z-0">
          <TileLayer 
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
            attribution="&copy; Esri World Imagery"
          />
          <MapEvents />
          
          {/* New Area Draft Preview */}
          {newFence && (
            <>
              <Circle 
                center={[newFence.lat, newFence.lng]} 
                radius={Number(newFence.radius) || 400} 
                pathOptions={{
                  color: '#2563eb', 
                  fillColor: '#3b82f6', 
                  fillOpacity: 0.25, 
                  weight: 2, 
                  dashArray: '6, 8'
                }} 
              />
              <Marker position={[newFence.lat, newFence.lng]} />
            </>
          )}
          
          {/* Active Geofence Areas */}
          {geofences.map(g => {
            const typeLower = (g.type || '').toLowerCase();
            const isMine = typeLower.includes('mine') || typeLower.includes('loading');
            const color = isMine ? '#f59e0b' : '#ef4444';
            const radius = Number(g.radius) || 300;

            const hasPolygon = g.coordinates && Array.isArray(g.coordinates) && g.coordinates.length > 0;
            const hasCenter = g.latitude && g.longitude;

            return (
              <React.Fragment key={g.id || g.name}>
                {/* Render Polygon if coordinates exist */}
                {hasPolygon ? (
                  <Polygon 
                    positions={g.coordinates}
                    pathOptions={{
                      color: color, 
                      fillColor: color, 
                      fillOpacity: 0.25,
                      weight: 2
                    }}
                  />
                ) : hasCenter ? (
                  <Circle 
                    center={[Number(g.latitude), Number(g.longitude)]} 
                    radius={radius} 
                    pathOptions={{
                      color: color, 
                      fillColor: color, 
                      fillOpacity: 0.2,
                      weight: 2
                    }} 
                  />
                ) : null}

                {/* Marker with Popup */}
                {hasCenter && (
                  <Marker position={[Number(g.latitude), Number(g.longitude)]}>
                    <Popup className="custom-popup">
                      <div className="p-1 font-sans">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isMine ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                          {g.type || 'Zone'}
                        </span>
                        <h4 className="font-black text-slate-900 text-sm mt-1">{g.name}</h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                          <MoveHorizontal size={11}/> {hasPolygon ? 'Polygon Boundary' : `Radius: ${radius}m`}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Instruction Widget */}
        <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md text-slate-800 px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-3 z-[1000] shadow-xl border border-slate-200/80">
          <MapPin size={16} className="text-blue-600 animate-bounce" /> 
          <span>Click anywhere on the satellite view to establish a new perimeter.</span>
        </div>
      </div>

    </div>
  );
};

export default Geofences;
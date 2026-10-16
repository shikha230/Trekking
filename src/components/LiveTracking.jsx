import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

const LiveTracking = () => {
  const [vehicles, setVehicles] = useState([]);

  // Backend se live data fetch karna
  const fetchLiveStatus = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/vehicles/live');
      setVehicles(res.data);
    } catch (err) {
      console.error("Live fetch error", err);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000); // Har 10 sec mein update
    return () => clearInterval(interval);
  }, []);

  // Truck Icon Color Logic
  const getIcon = (state) => {
    let color = 'gray'; // Default
    if (state === 'MOVING') color = 'green';
    if (state === 'LOADING') color = 'yellow';
    if (state === 'UNLOADING') color = 'blue';
    if (state === 'AT_MINE' || state === 'AT_PLANT') color = 'orange';

    return new L.DivIcon({
      className: 'custom-icon',
      html: `<div style="background-color: ${color}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`
    });
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer center={[22.34586, 82.63908]} zoom={14} className="h-full w-full">
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        {vehicles.map(v => (
          v.latitude && (
            <Marker key={v.traccar_id} position={[v.latitude, v.longitude]} icon={getIcon(v.current_state)}>
              <Popup>
                <div className="text-black font-sans">
                  <h3 className="font-bold border-b">{v.name}</h3>
                  <p>Status: <span className="text-blue-600 font-bold">{v.current_state}</span></p>
                  <p>Last Update: {new Date(v.last_update).toLocaleTimeString()}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
      
      {/* Mini Legend Overlay */}
      <div className="absolute bottom-5 right-5 bg-gray-800 p-4 rounded-lg z-[1000] border border-gray-600 shadow-xl text-xs space-y-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Moving</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Loading</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Unloading</div>
      </div>
    </div>
  );
};

export default LiveTracking;
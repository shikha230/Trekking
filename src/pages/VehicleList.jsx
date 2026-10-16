import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, Plus, Search, X, Cpu, 
  Edit2, Trash2, ShieldCheck, RefreshCw 
} from 'lucide-react';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form states
  const initialForm = { id: null, name: '', traccar_id: '', type: 'truck', imei: '' };
  const [formData, setFormData] = useState(initialForm);

  // Fetch all vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/vehicles/all');
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Vehicle fetch error", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle Add Vehicle
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/vehicles/add', formData);
      setIsAddModalOpen(false);
      setFormData(initialForm);
      fetchVehicles();
      alert("Asset registered successfully!");
    } catch (err) {
      alert("Registration Failed: " + (err.response?.data?.error || "Unknown Error"));
    }
  };

  // Open Edit Modal
  const openEditModal = (vehicle) => {
    setFormData({
      id: vehicle.id,
      name: vehicle.name || '',
      traccar_id: vehicle.traccar_id || '',
      type: vehicle.type || 'truck',
      imei: vehicle.imei || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle Edit Vehicle
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/vehicles/${formData.id}`, formData);
      setIsEditModalOpen(false);
      setFormData(initialForm);
      fetchVehicles();
      alert("Asset updated successfully!");
    } catch (err) {
      alert("Update Failed: " + (err.response?.data?.error || "Unknown Error"));
    }
  };

  // Handle Delete Vehicle
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete asset "${name}"?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        fetchVehicles();
        alert("Asset deleted successfully!");
      } catch (err) {
        alert("Delete Failed: " + (err.response?.data?.error || "Unknown Error"));
      }
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter(v => 
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.traccar_id?.toString().includes(searchQuery) ||
    v.imei?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Metrics counters
  const totalCount = vehicles.length;
  const truckCount = vehicles.filter(v => v.type?.toLowerCase() === 'truck').length;
  const loaderCount = vehicles.filter(v => v.type?.toLowerCase() === 'loader').length;

  return (
    <div className="p-6 md:p-10 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            Fleet Asset Management
          </h1>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">
            Register, edit & manage registered trucks and loaders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchVehicles}
            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh List"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button 
            onClick={() => { setFormData(initialForm); setIsAddModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} /> Register New Asset
          </button>
        </div>
      </div>

      {/* --- SUMMARY METRICS STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Fleet Assets</p>
            <h3 className="text-2xl font-black text-slate-900">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Trucks</p>
            <h3 className="text-2xl font-black text-slate-900">{truckCount}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Loaders</p>
            <h3 className="text-2xl font-black text-slate-900">{loaderCount}</h3>
          </div>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
        <Search size={20} className="text-slate-400 ml-2" />
        <input 
          type="text"
          placeholder="Search by asset name, Traccar ID, IMEI, or Category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent outline-none font-medium text-sm text-slate-800 placeholder-slate-400"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {/* --- MAIN VEHICLE TABLE --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="px-6 py-4">Asset Name & Hardware</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Ping Update</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 font-bold animate-pulse">
                    Synchronizing fleet data...
                  </td>
                </tr>
              ) : filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => {
                  const state = (v.current_state || 'IDLE').toUpperCase();
                  const isIdle = state.includes('IDLE');
                  const isMoving = state.includes('MOVING') || state.includes('LOAD');

                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 font-bold">
                            <Truck size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{v.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>ID: {v.traccar_id}</span>
                              {v.imei && <span>• IMEI: {v.imei}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-slate-100 border border-slate-200 text-slate-700 inline-block">
                          {v.type || 'Truck'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isIdle ? 'bg-amber-400' : isMoving ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                          <span className={`text-xs font-extrabold uppercase ${isIdle ? 'text-amber-600' : isMoving ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {v.current_state || 'IDLE'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {v.last_update ? new Date(v.last_update).toLocaleString() : 'No Recent Ping'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(v)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit Asset"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(v.id, v.name)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete Asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 font-bold">
                    No fleet assets found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD ASSET MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Register Asset</h2>
                <p className="text-xs text-slate-500 font-medium">Link hardware device to fleet management</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Asset Display Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. VOLVO-TRUCK-01" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all placeholder-slate-400" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Traccar ID</label>
                  <input 
                    required 
                    type="number" 
                    placeholder="101" 
                    value={formData.traccar_id}
                    onChange={(e) => setFormData({...formData, traccar_id: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all placeholder-slate-400" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all"
                  >
                    <option value="truck">Truck</option>
                    <option value="loader">Loader</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">IMEI Number (Hardware)</label>
                <input 
                  type="text" 
                  placeholder="867340001234567" 
                  value={formData.imei}
                  onChange={(e) => setFormData({...formData, imei: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all placeholder-slate-400" 
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-wider shadow-md shadow-blue-200 transition-all mt-4">
                Save & Link Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT ASSET MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Asset Details</h2>
                <p className="text-xs text-slate-500 font-medium">Update equipment attributes and IDs</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Asset Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Traccar ID</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.traccar_id}
                    onChange={(e) => setFormData({...formData, traccar_id: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all"
                  >
                    <option value="truck">Truck</option>
                    <option value="loader">Loader</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">IMEI Number</label>
                <input 
                  type="text" 
                  value={formData.imei}
                  onChange={(e) => setFormData({...formData, imei: e.target.value})}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-900 focus:border-blue-500 transition-all" 
                />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-wider shadow-md shadow-emerald-200 transition-all mt-4">
                Update Asset Info
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleList;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileDown, Calendar, Cpu, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const ReportExport = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // 1. Fetch available trucks/devices for dropdown
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

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 4000);
  };

  // 2. Handle Custom CSV Download
  const handleDownloadCSV = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ type: '', message: '' });

    try {
      let url = `${import.meta.env.VITE_API_URL}/api/download_custom_csv?`;
      const params = new URLSearchParams();

      if (selectedDevice !== 'all') {
        params.append('deviceId', selectedDevice);
      }
      if (startDate) {
        // Format ISO string for backend
        params.append('startDate', new Date(startDate).toISOString());
      }
      if (endDate) {
        params.append('endDate', new Date(endDate).toISOString());
      }

      // Axios call with responseType 'blob' for file download
      const response = await axios.get(url + params.toString(), {
        responseType: 'blob',
      });

      // Create a blob link to download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `filtered_truck_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showNotification('success', 'Report downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      showNotification('error', 'No data found for the selected filters or export failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-200">
            <FileDown className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Custom Fleet Report Export</h1>
            <p className="text-xs text-slate-500 font-medium">Download telemetry CSV by selecting device & time range</p>
          </div>
        </div>

        {/* Notification Alert */}
        {notification.message && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm ${
            notification.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={18} className="shrink-0"/> : <AlertCircle size={18} className="shrink-0"/>}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDownloadCSV} className="space-y-4">
          
          {/* Select Device */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Select Truck / Device</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Cpu size={16} />
              </span>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer"
              >
                <option value="all">All Trucks / Fleet (General)</option>
                {devices.map((d) => (
                  <option key={d.traccar_id} value={d.traccar_id}>
                    {d.name} (IMEI: {d.imei})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & Time */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">Start Date & Time</label>
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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">End Date & Time</label>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating CSV Report...
              </>
            ) : (
              <>
                <FileDown size={16} /> Download Filtered CSV Report
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ReportExport;
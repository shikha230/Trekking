import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  FileDown, Calendar, Cpu, CheckCircle, AlertCircle,
  Loader2, Search, X, CheckSquare, Square, FileSpreadsheet, Layers
} from 'lucide-react';

const ReportExport = () => {
  const [devices, setDevices] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [notification, setNotification] = useState({ type: '', message: '' });

  const dropdownRef = useRef(null);

  // 1. Fetch available trucks/devices
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 5000);
  };

  const isAllSelected = devices.length > 0 && selectedIds.length === devices.length;

  // Toggle single device
  const toggleDevice = (id) => {
    const strId = String(id);
    setSelectedIds((prev) =>
      prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId]
    );
  };

  // Select All / Deselect All ("All" option)
  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(devices.map((d) => String(d.traccar_id)));
    }
  };

  const filteredDevices = devices.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      String(d.name || '').toLowerCase().includes(q) ||
      String(d.imei || '').toLowerCase().includes(q)
    );
  });

  const selectedDevicesList = devices.filter((d) =>
    selectedIds.includes(String(d.traccar_id))
  );

  const safeName = (s) => String(s || 'Vehicle').replace(/[\\/:*?"<>|]/g, '_');

  // 2. Download Separate Excel (.xlsx) File Per Selected Device (Including "All")
  const handleDownloadSeparateExcels = async (e) => {
    e.preventDefault();

    if (selectedIds.length === 0) {
      showNotification('error', 'Please select "All Trucks" or at least one truck/device.');
      return;
    }

    setLoading(true);
    setNotification({ type: '', message: '' });

    let exportedCount = 0;
    const emptyDevices = [];

    try {
      const formattedStart = startDate.length === 16 ? `${startDate}:00` : startDate;
      const formattedEnd = endDate.length === 16 ? `${endDate}:00` : endDate;
      const dateTag = startDate ? startDate.slice(0, 10) : new Date().toISOString().slice(0, 10);

      for (let i = 0; i < selectedDevicesList.length; i++) {
        const dev = selectedDevicesList[i];
        setProgressText(`Exporting ${i + 1} of ${selectedDevicesList.length}: ${dev.name}...`);

        try {
          const params = new URLSearchParams();
          params.append('deviceId', dev.traccar_id);
          if (formattedStart) params.append('startDate', formattedStart);
          if (formattedEnd) params.append('endDate', formattedEnd);

          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/download_custom_csv?${params.toString()}`,
            { responseType: 'text' }
          );

          const csvText = response.data;
          if (!csvText || !csvText.trim()) {
            emptyDevices.push(dev.name);
            continue;
          }

          const parsedWb = XLSX.read(csvText, { type: 'string' });
          const firstSheet = parsedWb.Sheets[parsedWb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

          if (!rows.length) {
            emptyDevices.push(dev.name);
            continue;
          }

          const newWb = XLSX.utils.book_new();
          const newWs = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(newWb, newWs, 'RawData');

          const fileName = `${safeName(dev.name)}_${dateTag}.xlsx`;
          XLSX.writeFile(newWb, fileName);
          exportedCount += 1;

          // Delay so browser allows multiple files to download cleanly
          await new Promise((resolve) => setTimeout(resolve, 400));
        } catch (devErr) {
          console.error(`Failed for ${dev.name}:`, devErr);
          emptyDevices.push(dev.name);
        }
      }

      if (exportedCount > 0) {
        const skippedMsg = emptyDevices.length
          ? ` (No data found for: ${emptyDevices.join(', ')})`
          : '';
        showNotification(
          'success',
          `${exportedCount} separate Excel file(s) downloaded successfully!${skippedMsg}`
        );
      } else {
        showNotification('error', 'No telemetry data found for any of the selected trucks in this time range.');
      }
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Export failed. Please try again.');
    } finally {
      setLoading(false);
      setProgressText('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto font-sans text-slate-900">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600/10 p-3 rounded-2xl border border-blue-200">
            <FileSpreadsheet className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Custom Fleet Report Export</h1>
            <p className="text-xs text-slate-500 font-medium">
              Select "All" or multiple trucks to download a separate Excel (.xlsx) file for each device
            </p>
          </div>
        </div>

        {/* Notification Alert */}
        {notification.message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle size={18} className="shrink-0" />
            ) : (
              <AlertCircle size={18} className="shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDownloadSeparateExcels} className="space-y-4">

          {/* Multi-Select Device Dropdown with "All" Option */}
          <div ref={dropdownRef} className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                Select Trucks / Devices ({isAllSelected ? `All (${devices.length})` : `${selectedIds.length} Selected`})
              </label>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {isAllSelected ? 'Clear All' : 'Select All'}
              </button>
            </div>

            {/* Trigger Box */}
            <div
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full min-h-[46px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus-within:border-blue-600 transition-all cursor-pointer flex flex-wrap items-center gap-1.5"
            >
              <Cpu size={16} className="text-slate-400 mr-1 shrink-0" />
              {selectedDevicesList.length === 0 ? (
                <span className="text-slate-400 font-semibold">Click to select "All" or specific trucks...</span>
              ) : isAllSelected ? (
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5">
                  <Layers size={13} />
                  All Trucks ({devices.length})
                  <X
                    size={12}
                    className="hover:text-rose-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds([]);
                    }}
                  />
                </span>
              ) : (
                selectedDevicesList.map((dev) => (
                  <span
                    key={dev.traccar_id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDevice(dev.traccar_id);
                    }}
                    className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-blue-700"
                  >
                    {dev.name}
                    <X size={12} />
                  </span>
                ))
              )}
            </div>

            {/* Dropdown List */}
            {dropdownOpen && (
              <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="p-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Search size={14} className="text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Type truck name or IMEI..."
                    className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* "All Trucks / Fleet" Option Row */}
                {devices.length > 0 && (
                  <div
                    onClick={handleToggleAll}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer border-b border-slate-100 transition-colors ${
                      isAllSelected
                        ? 'bg-indigo-50 text-indigo-900 font-black'
                        : 'bg-slate-50/70 hover:bg-indigo-50/50 text-slate-800 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isAllSelected ? (
                        <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-400 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold">All Trucks / Fleet</p>
                        <p className="text-[10px] text-slate-500">
                          Download separate Excel file for all {devices.length} devices
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Device Options */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {filteredDevices.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No matching trucks found</div>
                  ) : (
                    filteredDevices.map((d) => {
                      const isChecked = selectedIds.includes(String(d.traccar_id));
                      return (
                        <div
                          key={d.traccar_id}
                          onClick={() => toggleDevice(d.traccar_id)}
                          className={`px-3.5 py-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-blue-50/70 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isChecked ? (
                              <CheckSquare size={16} className="text-blue-600 shrink-0" />
                            ) : (
                              <Square size={16} className="text-slate-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-bold">{d.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">IMEI: {d.imei}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Start Date & Time */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              Start Date & Time
            </label>
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
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              End Date & Time
            </label>
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
                <Loader2 size={16} className="animate-spin" /> {progressText || 'Generating Excel Files...'}
              </>
            ) : (
              <>
                <FileDown size={16} /> Download Separate Excel Files ({selectedIds.length})
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ReportExport;
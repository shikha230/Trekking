import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Calendar, Truck, Filter } from 'lucide-react';

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [fromDateTime, setFromDateTime] = useState('');
  const [toDateTime, setToDateTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch report based on date/time filters
  const fetchReport = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/reports/shift?';
      
      if (fromDateTime) url += `from=${encodeURIComponent(fromDateTime)}&`;
      if (toDateTime) url += `to=${encodeURIComponent(toDateTime)}&`;

      const res = await axios.get(url);
      setReportData(res.data);
    } catch (err) {
      console.error("Report Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fromDateTime, toDateTime]);

  const formatDuration = (totalMinutes) => {
    if (!totalMinutes || totalMinutes === 0) return '0 mins';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) {
        return `${minutes} mins`;
    }
    return `${hours} hrs ${minutes} mins`;
  };

  const calculateEfficiency = (trips, minutes) => {
    const targetTrips = 10;
    if (trips === 0) return '0%';
    
    let efficiency = Math.round((trips / targetTrips) * 100);
    return `${Math.min(efficiency, 100)}%`;
  };

  // Export Summary to CSV Function
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert("No data available to export!");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Truck Name,Total Trips,Total Time (Minutes),Efficiency\n";

    reportData.forEach(row => {
      const rowString = `"${row.truck_name}",${row.total_trips},"${row.total_minutes} mins","${calculateEfficiency(row.total_trips, row.total_minutes)}"`;
      csvContent += rowString + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shift_report_filtered.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shift Reports</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Operational Fleet Performance</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Download size={16} /> Export Summary
        </button>
      </div>

      {/* Date & Time Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase">
          <Filter size={16} className="text-blue-600"/> Filters:
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          From: 
          <input 
            type="datetime-local" 
            value={fromDateTime}
            onChange={(e) => setFromDateTime(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          To: 
          <input 
            type="datetime-local" 
            value={toDateTime}
            onChange={(e) => setToDateTime(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600"
          />
        </div>

        {(fromDateTime || toDateTime) && (
          <button 
            onClick={() => { setFromDateTime(''); setToDateTime(''); }}
            className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Report Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-blue-600" />
            <span className="font-bold text-slate-700 text-sm">
              Performance Summary based on Selected Range
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                <th className="p-6">Truck Name</th>
                <th className="p-6 text-center">Total Trips</th>
                <th className="p-6 text-center">Total Time</th>
                <th className="p-6 text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-slate-400 font-bold">
                    Loading report data...
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-6 flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 transition-colors">
                        <Truck size={18} className="text-slate-400 group-hover:text-blue-600" />
                      </div>
                      <span className="font-black text-slate-900">{row.truck_name}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full font-black text-xs border border-emerald-200">
                        {row.total_trips}
                      </span>
                    </td>
                    <td className="p-6 text-center font-bold text-slate-600">
                      {formatDuration(row.total_minutes)}
                    </td>
                    <td className="p-6 text-right font-black text-blue-600 text-sm">
                      {calculateEfficiency(row.total_trips, row.total_minutes)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center text-slate-400 font-medium">
                    No data available for the selected time range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
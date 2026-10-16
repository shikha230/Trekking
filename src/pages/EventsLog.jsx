import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Clock, ArrowRight, Truck } from 'lucide-react';

const EventLogs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`);
        setEvents(res.data);
      } catch (err) { 
        console.log("Event fetch error:", err); 
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-100 min-h-screen font-sans text-slate-900">
      <h1 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <div className="bg-blue-600/10 p-2 rounded-xl border border-blue-200">
          <History className="text-blue-600" size={22} />
        </div>
        Fleet Activity Timeline
      </h1>

      <div className="max-w-4xl">
        {loading ? (
          <div className="p-20 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-200 shadow-sm">
            Loading recent events...
          </div>
        ) : events.length > 0 ? (
          events.map((event, i) => (
            <div key={i} className="relative pl-8 pb-8 border-l-2 border-slate-300 last:border-0 ml-4">
              {/* Timeline Dot */}
              <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-sm"></div>
              
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 mt-0.5">
                    <Truck size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                       <span className="font-black text-slate-900 text-sm">{event.vehicle_name}</span>
                       <ArrowRight size={14} className="text-slate-400" />
                       <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-blue-100 text-blue-700 border border-blue-200">
                         {event.event_type}
                       </span>
                    </div>
                    {/* Fallback to details if status_text is null */}
                    <p className="text-xs font-bold text-slate-600 mt-1">
                      {event.status_text || event.details || "Status updated"}
                    </p>
                  </div>
                </div>
                
                <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                    <Clock size={12} className="text-blue-600" />
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 sm:mt-1">{new Date(event.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
              Monitoring truck movements... Events will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLogs;
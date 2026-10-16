import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, Truck, MapPin, ClipboardList, FileText, History, Activity, LogOut, X, KeyRound, UserPlus } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
// LocalStorage se user data read karein
  const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('adminUser') || '{}');
  
  // Smart Admin Check (Role match kare ya email admin ho)
  const userRole = (storedUser.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || storedUser.email === 'admin@trucktrak.com' || (storedUser.email || '').includes('admin');

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/' },
    { name: 'Live Tracking', icon: <MapIcon size={20}/>, path: '/live' },
    { name: 'Vehicles', icon: <Truck size={20}/>, path: '/vehicles' },
    { name: 'Geofences', icon: <MapPin size={20}/>, path: '/geofences', adminOnly: true },
    { name: 'Trip Logs', icon: <ClipboardList size={20}/>, path: '/trips' },
    { name: 'Reports', icon: <FileText size={20}/>, path: '/reports' },
    { name: 'Event Logs', icon: <Activity size={20}/>, path: '/events' },
    { name: 'History', icon: <History size={20}/>, path: '/history' },
    { name: 'Create User', icon: <UserPlus size={20}/>, path: '/users', adminOnly: true },
    { name: 'Change Password', icon: <KeyRound size={20}/>, path: '/change-password', adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#050A19] h-screen flex flex-col border-r border-[#152B4D] shadow-2xl
        transform transition-transform duration-300 ease-in-out 
        md:translate-x-0 md:relative 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        <div className="p-6 md:p-8 text-2xl font-black text-[#00A8E8] flex items-center justify-between tracking-tighter">
          <div className="flex items-center gap-3">
            <div className="bg-[#003566] p-2 rounded-xl shadow-[0_0_15px_rgba(0,168,232,0.3)]">
              <Truck className="text-[#00A8E8]" size={24} />
            </div>
            TRUCK-TRAK
          </div>

          <button 
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg bg-[#0A1931]"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768 && onClose) onClose();
                }}
                className={`flex items-center gap-4 p-3.5 rounded-2xl font-bold text-sm transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#003566] text-white shadow-[0_10px_20px_rgba(0,53,102,0.4)] border border-[#00509D]' 
                    : 'text-slate-400 hover:bg-[#0A1931] hover:text-[#00A8E8]'
                }`}
              >
                <span className={isActive ? 'text-[#00A8E8]' : 'text-inherit opacity-70'}>{item.icon}</span>
                <span className="tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#152B4D] space-y-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;
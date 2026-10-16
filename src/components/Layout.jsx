import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Truck } from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Mobile Top Header Bar with Hamburger Button */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#050A19] text-white border-b border-[#152B4D] sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#003566] p-1.5 rounded-lg">
              <Truck className="text-[#00A8E8]" size={18} />
            </div>
            <span className="font-black text-base text-[#00A8E8] tracking-tight">TRUCK-TRAK</span>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#003566] text-[#00A8E8] hover:bg-[#00509D] transition-colors"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Dynamic Route Content Renders Here */}
        <main className="flex-1">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default Layout;
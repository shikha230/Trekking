import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Menu, Truck } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveTracking from './pages/LiveTracking';
import TripLogs from './pages/TripLogs';
import VehicleList from './pages/VehicleList';
import Reports from './pages/Reports';
import EventLogs from './pages/EventsLog';
import Geofences from './pages/Geofences';
import HistoryPage from './pages/HistoryPage';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import CreateUser from './pages/CreateUser';
import UsersManagement from './pages/UsersManagement';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const savedUser = localStorage.getItem('user') || localStorage.getItem('adminUser');
  
  if (!savedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(savedUser);
    const userRole = (user.role || '').toLowerCase();
    
    if (adminOnly && userRole !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  } catch (err) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    return <Navigate to="/login" replace />;
  }
};

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Auth pages (jahan sidebar aur header nahi dikhana hai)
  const isAuthPage = 
    location.pathname === '/login' || 
    location.pathname === '/admin-login' || 
    location.pathname === '/auth/login' || 
    location.pathname === '/forgot-password';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/auth/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      /> 

      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#050A19] text-white border-b border-gray-800 sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#003566] p-1.5 rounded-lg">
              <Truck className="text-[#00A8E8]" size={18} />
            </div>
            <span className="font-black text-base text-[#00A8E8] tracking-tight">TRUCK-TRAK</span>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#003566] text-[#00A8E8] hover:bg-[#00509D] transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Main Application Routes */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
            <Route path="/trips" element={<ProtectedRoute><TripLogs /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventLogs /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            
            {/* Admin-Only Protected Routes */}
            <Route path="/geofences" element={<ProtectedRoute adminOnly={true}><Geofences /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly={true}><UsersManagement /></ProtectedRoute>} />
            <Route path="/users-list" element={<ProtectedRoute adminOnly={true}><UsersManagement /></ProtectedRoute>} />
            <Route path="/create-user" element={<ProtectedRoute adminOnly={true}><CreateUser /></ProtectedRoute>} />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
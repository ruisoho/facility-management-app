import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import Maintenance from './components/Maintenance/Maintenance';
import Consumption from './components/Consumption/Consumption';
import ElectricalMeter from './components/ElectricalMeter/ElectricalMeter';
import Tasks from './components/Tasks/Tasks';
import Facilities from './pages/Facilities';
import { DashboardProvider } from './contexts/DashboardContext';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <ErrorBoundary>
      <DashboardProvider>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <div className="min-h-screen bg-gray-50">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
            
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            
            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
              {/* Header */}
              <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              
              {/* Page Content */}
              <main className="p-4 sm:p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="/consumption" element={<Consumption />} />
                  <Route path="/electrical-meters" element={<ElectricalMeter />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/facilities" element={<Facilities />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </DashboardProvider>
    </ErrorBoundary>
  );
}

export default App;
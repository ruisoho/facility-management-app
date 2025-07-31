import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/Common/ErrorBoundary';
import TopNavigation from './components/Layout/TopNavigation';
import Dashboard from './components/Dashboard/Dashboard';
import Tasks from './components/Tasks/Tasks';
import Maintenance from './components/Maintenance/Maintenance';
import Facilities from './pages/Facilities';
import ElectricalMeter from './components/ElectricalMeter/ElectricalMeter';
import HeatGasMeter from './components/HeatGasMeter/HeatGasMeter';
import { DashboardProvider } from './contexts/DashboardContext';
import './App.css';

function App() {

  return (
    <ErrorBoundary>
      <DashboardProvider>
        <Router future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}>
          <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <TopNavigation />
            
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
            
            {/* Main Content */}
            <div className="w-full">
              {/* Page Content */}
              <main className="p-4 sm:p-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/maintenance" element={<Maintenance />} />
                  <Route path="/electrical-meters" element={<ElectricalMeter />} />
                  <Route path="/heat-gas-meters" element={<HeatGasMeter />} />
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
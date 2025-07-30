import React, { createContext, useContext, useState, useCallback } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerDashboardRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const value = {
    refreshTrigger,
    triggerDashboardRefresh
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
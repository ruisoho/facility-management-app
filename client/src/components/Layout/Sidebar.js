import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Wrench,
  CheckSquare,
  Building,
  Thermometer,
  Battery,
  X
} from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Maintenance',
      href: '/maintenance',
      icon: Wrench,
      current: location.pathname === '/maintenance'
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      current: location.pathname === '/tasks'
    },
    {
      name: 'Facilities',
      href: '/facilities',
      icon: Building,
      current: location.pathname === '/facilities'
    },
    {
      name: 'Heat & Gas Meters',
      href: '/heat-gas-meters',
      icon: Thermometer,
      current: location.pathname === '/heat-gas-meters'
    },
    {
      name: 'Electrical Meters',
      href: '/electrical-meters',
      icon: Battery,
      current: location.pathname === '/electrical-meters'
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full bg-white shadow-xl border-r border-gray-200 transition-all duration-300 ease-in-out
        ${open ? 'w-64' : 'w-20'}
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 flex flex-col">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center justify-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group h-10
                  ${isActive 
                    ? 'bg-purple-100 text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    setOpen(false);
                  }
                }}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center transition-all duration-200 ${item.current ? 'bg-purple-100 border-purple-200' : 'group-hover:bg-gray-100 group-hover:shadow-md'}`}>
                  <Icon className={`w-5 h-5 ${item.current ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                </div>
                <span className={`ml-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center space-x-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
            <div className="px-2 py-1 rounded-lg bg-purple-600 text-white text-xs font-bold hover:shadow-md transition-shadow duration-200">
              FM
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">FacilityPro</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
          
          {/* Toggle button - only visible on desktop */}
          <button
            onClick={() => setOpen(!open)}
            className="hidden lg:block px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 hover:shadow-md rounded-lg border border-gray-200 transition-all duration-200"
          >
            {open ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center space-x-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@facility.com</p>
            </div>
          </div>
          

        </div>
      </div>
    </>
  );
};

export default Sidebar;
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench, 
  Zap, 
  CheckSquare, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  Activity
} from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Maintenance',
      href: '/maintenance',
      icon: Wrench,
      current: location.pathname === '/maintenance'
    },
    {
      name: 'Consumption',
      href: '/consumption',
      icon: Zap,
      current: location.pathname === '/consumption'
    },
    {
      name: 'Electrical Meters',
      href: '/electrical-meters',
      icon: Activity,
      current: location.pathname === '/electrical-meters'
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
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center space-x-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
            <div className="p-2 bg-purple-600 rounded-xl">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">FacilityPro</h1>
              <p className="text-xs text-gray-500">Management System</p>
            </div>
          </div>
          
          {/* Toggle button - only visible on desktop */}
          <button
            onClick={() => setOpen(!open)}
            className="hidden lg:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {open ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => `
                  flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
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
                <Icon className={`h-5 w-5 flex-shrink-0 ${item.current ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className={`ml-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center space-x-3 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">admin@facility.com</p>
            </div>
          </div>
          
          {/* Settings button when collapsed */}
          {!open && (
            <button className="w-full flex justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 mt-2">
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
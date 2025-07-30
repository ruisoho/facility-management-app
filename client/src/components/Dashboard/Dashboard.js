import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users,
  Building,
  Wrench,
  Calendar,
  Activity,
  Target
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalCost: 0,
    monthlyCost: 0,
    activeEmployees: 0,
    facilities: 0
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call for dashboard data
    const fetchDashboardData = async () => {
      try {
        // Mock data - replace with actual API calls
        setStats({
          totalTasks: 156,
          completedTasks: 89,
          pendingTasks: 45,
          overdueTasks: 22,
          totalCost: 125000,
          monthlyCost: 15000,
          activeEmployees: 24,
          facilities: 8
        });

        setRecentTasks([
          {
            id: 1,
            description: 'HVAC System Maintenance - Building A',
            status: 'completed',
            priority: 'high',
            deadline: '2024-01-15',
            cost: 2500
          },
          {
            id: 2,
            description: 'Elevator Inspection - Building B',
            status: 'in-progress',
            priority: 'medium',
            deadline: '2024-01-20',
            cost: 800
          },
          {
            id: 3,
            description: 'Fire Safety System Check',
            status: 'pending',
            priority: 'high',
            deadline: '2024-01-18',
            cost: 1200
          }
        ]);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const TaskItem = ({ task }) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };

    const priorityColors = {
      high: 'border-red-500',
      medium: 'border-yellow-500',
      low: 'border-green-500'
    };

    return (
      <div className={`p-4 border-l-4 ${priorityColors[task.priority]} bg-white rounded-r-lg shadow-sm hover:shadow-md transition-shadow duration-200`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 text-sm">{task.description}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {task.status.replace('-', ' ')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>${task.cost.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your facilities.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={Target}
          color="bg-blue-500"
          trend="up"
          trendValue="+12% from last month"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircle}
          color="bg-green-500"
          trend="up"
          trendValue="+8% from last month"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          color="bg-red-500"
          trend="down"
          trendValue="-5% from last month"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Cost"
          value={`$${(stats.monthlyCost / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees}
          icon={Users}
          color="bg-indigo-500"
        />
        <StatCard
          title="Facilities"
          value={stats.facilities}
          icon={Building}
          color="bg-teal-500"
        />
        <StatCard
          title="Maintenance Score"
          value="92%"
          icon={Activity}
          color="bg-emerald-500"
          trend="up"
          trendValue="+3% from last month"
        />
      </div>

      {/* Recent Tasks and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <Wrench className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-gray-700">Create New Task</span>
              </button>
              <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <Users className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-gray-700">Manage Employees</span>
              </button>
              <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <Building className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-gray-700">Add Facility</span>
              </button>
              <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors duration-200">
                <BarChart3 className="w-5 h-5 text-orange-600 mr-3" />
                <span className="text-gray-700">View Reports</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">HVAC Systems</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Fire Safety</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Security</span>
                <span className="flex items-center text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Maintenance
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Elevators</span>
                <span className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
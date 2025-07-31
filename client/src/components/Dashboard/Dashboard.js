import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Building,
  Calendar,
  Activity,
  Target,
  Plus,
  FileText
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { tasksAPI, facilitiesAPI, maintenanceAPI } from '../../services/api';
import ReportsModal from './ReportsModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const { refreshTrigger } = useDashboard();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalCost: 0,
    monthlyCost: 0,
    facilities: 0,
    maintenanceScore: 0
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from all APIs
      const [tasksResponse, facilitiesResponse, maintenanceResponse, tasksStatsResponse] = await Promise.all([
        tasksAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        facilitiesAPI.getAll(),
        maintenanceAPI.getAll(),
        tasksAPI.getStats()
      ]);
      
      // Handle API response structure
      const tasksData = tasksResponse.data.data || tasksResponse.data.tasks || tasksResponse.data;
      const facilitiesData = facilitiesResponse.data.data || facilitiesResponse.data.facilities || facilitiesResponse.data;
      const maintenanceData = maintenanceResponse.data.data || maintenanceResponse.data.maintenance || maintenanceResponse.data;
      const statsData = tasksStatsResponse.data.summary || tasksStatsResponse.data;
      
      // Calculate stats from the API responses
      const totalTasks = statsData.total || 0;
      const overdueTasks = statsData.overdue || 0;
      const completedThisMonth = statsData.completed || 0;
      const pendingTasks = statsData.pending || 0;
      const inProgressTasks = statsData.inProgress || 0;
      
      // Calculate pending tasks if not provided
      const calculatedPendingTasks = pendingTasks || Math.max(0, totalTasks - completedThisMonth - overdueTasks - inProgressTasks);
      
      // Calculate maintenance score based on completed vs total maintenance items
      const totalMaintenance = Array.isArray(maintenanceData) ? maintenanceData.length : 0;
      const completedMaintenance = Array.isArray(maintenanceData) 
        ? maintenanceData.filter(item => item.status === 'completed').length 
        : 0;
      const maintenanceScore = totalMaintenance > 0 ? Math.round((completedMaintenance / totalMaintenance) * 100) : 92;
      
      setStats({
        totalTasks,
        completedTasks: completedThisMonth,
        pendingTasks: calculatedPendingTasks,
        overdueTasks,
        totalCost: 0,
        monthlyCost: 0,
        facilities: Array.isArray(facilitiesData) ? facilitiesData.length : 0,
        maintenanceScore: totalMaintenance > 0 ? maintenanceScore : 0
      });

      // Format recent tasks - ensure tasksData is always an array
      const tasksArray = Array.isArray(tasksData) ? tasksData : [];
      const formattedTasks = tasksArray.slice(0, 3).map(task => ({
        id: task.id || task._id,
        description: task.title || task.what || task.description,
        status: task.status?.toLowerCase().replace(' ', '-') || 'pending',
        priority: task.priority?.toLowerCase() || 'medium',
        deadline: task.deadline,
        cost: task.estimatedCost || task.cost?.estimated || 0
      }));
      
      setRecentTasks(formattedTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]); // Re-fetch when refreshTrigger changes

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
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
      <div className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow duration-200 border border-gray-200">
        <div className={`w-1 h-full absolute left-0 top-0 ${priorityColors[task.priority]} rounded-l-lg`}></div>
        <div className="flex items-center justify-between mb-3 ml-3">
          <h4 className="font-semibold text-gray-900 text-sm">{task.description}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {task.status.replace('-', ' ')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600 ml-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">${task.cost.toLocaleString()}</span>
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
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setShowReportsModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
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
          color="blue"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Overdue Tasks"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Monthly Cost"
          value={`$${(stats.monthlyCost / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Facilities"
          value={stats.facilities}
          icon={Building}
          color="teal"
        />
        <StatCard
          title="Maintenance Score"
          value={`${stats.maintenanceScore}%`}
          icon={Activity}
          color="indigo"
        />
      </div>

        {/* Recent Tasks and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
                <button 
                  onClick={() => navigate('/tasks')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors duration-200"
                >
                  View All →
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/tasks')}
                  className="w-full flex items-center p-4 text-left hover:bg-blue-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-blue-300"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mr-4">
                    <Plus className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Create New Task</span>
                </button>
                <button 
                  onClick={() => navigate('/facilities')}
                  className="w-full flex items-center p-4 text-left hover:bg-purple-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-purple-300"
                >
                  <div className="p-2 bg-purple-100 rounded-lg mr-4">
                    <Building className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Facilities</span>
                </button>
                <button 
                  onClick={() => setShowReportsModal(true)}
                  className="w-full flex items-center p-4 text-left hover:bg-orange-50 rounded-lg transition-colors duration-200 border border-gray-200 hover:border-orange-300"
                >
                  <div className="p-2 bg-orange-100 rounded-lg mr-4">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-gray-700 font-medium">View Reports</span>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">System Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-700 font-medium">HVAC Systems</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-700 font-medium">Fire Safety</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-700 font-medium">Security</span>
                  <span className="flex items-center text-yellow-600">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                    Maintenance
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-700 font-medium">Elevators</span>
                  <span className="flex items-center text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Modal */}
        {showReportsModal && (
          <ReportsModal 
            onClose={() => setShowReportsModal(false)}
            stats={stats}
            recentTasks={recentTasks}
          />
        )}
      </div>
    );
};

export default Dashboard;
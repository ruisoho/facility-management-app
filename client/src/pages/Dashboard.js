import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Zap, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import StatsCard from '../components/Dashboard/StatsCard';
import ChartCard from '../components/Dashboard/ChartCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import UpcomingTasks from '../components/Dashboard/UpcomingTasks';
import { fetchDashboardData } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalMaintenance: 0,
      overdueMaintenance: 0,
      totalTasks: 0,
      overdueTasks: 0,
      monthlyElectricity: 0,
      monthlyGas: 0,
      totalCost: 0,
      completedThisMonth: 0
    },
    charts: {
      consumptionTrend: [],
      maintenanceStatus: [],
      tasksPriority: []
    },
    recentActivity: [],
    upcomingTasks: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Maintenance',
      value: dashboardData.stats.totalMaintenance,
      icon: Wrench,
      color: 'blue',
      description: 'Active maintenance cycles'
    },
    {
      title: 'Overdue Items',
      value: dashboardData.stats.overdueMaintenance,
      icon: AlertTriangle,
      color: 'red',
      description: 'Require immediate attention'
    },
    {
      title: 'Active Tasks',
      value: dashboardData.stats.totalTasks,
      icon: CheckSquare,
      color: 'green',
      description: 'Pending and in progress'
    },
    {
      title: 'Monthly Energy',
      value: `${dashboardData.stats.monthlyElectricity} kWh`,
      icon: Zap,
      color: 'yellow',
      description: 'Electricity consumption'
    },
    {
      title: 'Energy Cost',
      value: `€${dashboardData.stats.totalCost}`,
      icon: DollarSign,
      color: 'purple',
      description: 'This month total'
    },
    {
      title: 'Completed',
      value: dashboardData.stats.completedThisMonth,
      icon: Activity,
      color: 'indigo',
      description: 'Tasks completed this month'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
            <p className="text-blue-100 text-lg">
              Welcome back! Here's what's happening with your facility.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
              <Calendar className="h-8 w-8 text-white mb-2" />
              <div className="text-sm font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
            description={card.description}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Energy Consumption Trend"
          subtitle="Last 30 days"
          data={dashboardData.charts.consumptionTrend}
          type="line"
        />
        <ChartCard
          title="Maintenance Status"
          subtitle="Current distribution"
          data={dashboardData.charts.maintenanceStatus}
          type="doughnut"
        />
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={dashboardData.recentActivity} />
        <UpcomingTasks tasks={dashboardData.upcomingTasks} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors duration-200 group">
            <Wrench className="h-6 w-6 text-blue-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-blue-900">Add Maintenance</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors duration-200 group">
            <CheckSquare className="h-6 w-6 text-green-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-green-900">New Task</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition-colors duration-200 group">
            <Zap className="h-6 w-6 text-yellow-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-yellow-900">Log Consumption</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors duration-200 group">
            <TrendingUp className="h-6 w-6 text-purple-600 mr-3 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-medium text-purple-900">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
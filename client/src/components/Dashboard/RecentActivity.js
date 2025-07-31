import React from 'react';
import { 
  Wrench, 
  CheckSquare, 
  Zap, 
  AlertTriangle, 
  User, 
  Calendar,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return Wrench;
      case 'task':
        return CheckSquare;
      case 'alert':
        return AlertTriangle;
      default:
        return User;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'maintenance':
        return 'text-blue-600 bg-blue-50';
      case 'task':
        return 'text-green-600 bg-green-50';
      case 'alert':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const defaultActivities = [
    {
      id: 1,
      type: 'maintenance',
      title: 'HVAC System Maintenance',
      description: 'Completed routine maintenance check',
      user: 'John Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: 'completed'
    },
    {
      id: 2,
      type: 'task',
      title: 'Fire Safety Inspection',
      description: 'Scheduled for next week',
      user: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: 'scheduled'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Maintenance Overdue',
      description: 'Elevator maintenance is 3 days overdue',
      user: 'System Alert',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: 'overdue'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Latest updates and actions</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {displayActivities.slice(0, 5).map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClasses = getActivityColor(activity.type);

          return (
            <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
              <div className={`p-2 rounded-lg ${colorClasses} flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {activity.description}
                </p>
                
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <User className="h-3 w-3 mr-1" />
                  <span>{activity.user}</span>
                  <span className="mx-2">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayActivities.length === 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
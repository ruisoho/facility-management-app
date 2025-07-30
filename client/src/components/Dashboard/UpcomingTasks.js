import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  User,
  Building
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

const UpcomingTasks = ({ tasks = [] }) => {
  const defaultTasks = [
    {
      id: 1,
      what: 'HVAC Filter Replacement',
      whatToDo: 'Replace air filters in main HVAC system',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: 'high',
      responsible: {
        type: 'company',
        name: 'TechServ Solutions',
        contact: 'john@techserv.com'
      },
      category: 'Maintenance',
      status: 'pending'
    },
    {
      id: 2,
      what: 'Fire Extinguisher Inspection',
      whatToDo: 'Monthly inspection of all fire extinguishers',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      priority: 'medium',
      responsible: {
        type: 'employee',
        name: 'Sarah Johnson',
        contact: 'sarah.j@company.com'
      },
      category: 'Safety',
      status: 'in-progress'
    },
    {
      id: 3,
      what: 'Elevator Maintenance',
      whatToDo: 'Quarterly maintenance check and certification',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday (overdue)
      priority: 'high',
      responsible: {
        type: 'company',
        name: 'Elevator Tech Inc.',
        contact: 'service@elevatortech.com'
      },
      category: 'Maintenance',
      status: 'overdue'
    },
    {
      id: 4,
      what: 'Security System Check',
      whatToDo: 'Test all security cameras and access controls',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      priority: 'low',
      responsible: {
        type: 'employee',
        name: 'Mike Wilson',
        contact: 'mike.w@company.com'
      },
      category: 'Security',
      status: 'scheduled'
    }
  ];

  const displayTasks = tasks.length > 0 ? tasks : defaultTasks;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDeadline = (deadline) => {
    if (isToday(deadline)) {
      return 'Today';
    } else if (isTomorrow(deadline)) {
      return 'Tomorrow';
    } else if (isPast(deadline)) {
      return `Overdue (${format(deadline, 'MMM dd')})`;
    } else {
      return format(deadline, 'MMM dd, yyyy');
    }
  };

  const getDeadlineIcon = (deadline) => {
    if (isPast(deadline)) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    } else if (isToday(deadline) || isTomorrow(deadline)) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
          <p className="text-sm text-gray-500 mt-1">Tasks requiring attention</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {displayTasks.slice(0, 5).map((task) => (
          <div key={task.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {task.what}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {task.whatToDo}
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                {getDeadlineIcon(task.deadline)}
                <span className="ml-2">{formatDeadline(task.deadline)}</span>
              </div>

              <div className="flex items-center text-gray-500">
                {task.responsible.type === 'company' ? (
                  <Building className="h-4 w-4 mr-1" />
                ) : (
                  <User className="h-4 w-4 mr-1" />
                )}
                <span className="truncate max-w-32">{task.responsible.name}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                  {task.category}
                </span>
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {displayTasks.length === 0 && (
        <div className="text-center py-8">
          <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No upcoming tasks</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks;
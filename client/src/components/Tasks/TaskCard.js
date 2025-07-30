import React, { useState } from 'react';
import { 
  Edit, 
  Trash2, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  Building,
  FileText,
  Upload,
  Download,
  Tag,
  MapPin
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays, isPast } from 'date-fns';

const TaskCard = ({ 
  task, 
  viewMode = 'grid', 
  onEdit, 
  onDelete, 
  onComplete,
  onFileUpload 
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    
    const taskDate = new Date(date);
    if (isToday(taskDate)) {
      return 'Today';
    } else if (isYesterday(taskDate)) {
      return 'Yesterday';
    } else {
      const daysDiff = differenceInDays(taskDate, new Date());
      if (daysDiff > 0 && daysDiff <= 7) {
        return `In ${daysDiff} days`;
      } else if (daysDiff < 0 && daysDiff >= -7) {
        return `${Math.abs(daysDiff)} days ago`;
      }
      return format(taskDate, 'MMM dd, yyyy');
    }
  };

  const isOverdue = () => {
    return task.deadline && isPast(new Date(task.deadline)) && task.status !== 'completed';
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(task._id, files);
      setShowFileUpload(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-medium transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            {/* Status Icon */}
            <div className={`p-3 rounded-xl ${
              task.status === 'completed' 
                ? 'bg-green-100' 
                : isOverdue() 
                  ? 'bg-red-100' 
                  : 'bg-purple-100'
            }`}>
              {task.status === 'completed' ? (
                <CheckSquare className="h-6 w-6 text-green-600" />
              ) : isOverdue() ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <Clock className="h-6 w-6 text-purple-600" />
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor()}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
                {task.category && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                    {task.category}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {task.what}
              </h3>
              
              {task.description && (
                <p className="text-gray-600 mb-2 line-clamp-2">{task.description}</p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {task.deadline && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className={isOverdue() ? 'text-red-600 font-medium' : ''}>
                      {formatDate(task.deadline)}
                    </span>
                  </div>
                )}
                
                {task.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {task.location}
                  </div>
                )}

                {(task.responsibleCompany || task.responsibleEmployee) && (
                  <div className="flex items-center">
                    {task.responsibleCompany ? (
                      <>
                        <Building className="h-4 w-4 mr-1" />
                        {task.responsibleCompany}
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 mr-1" />
                        {task.responsibleEmployee}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Cost */}
            {task.estimatedCost && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="text-lg font-semibold text-gray-900">
                  €{task.estimatedCost.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {task.status !== 'completed' && (
              <button
                onClick={() => onComplete(task._id)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200"
                title="Mark as Complete"
              >
                <CheckSquare className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors duration-200"
              title="Upload Files"
            >
              <Upload className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(task)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File Upload */}
        {showFileUpload && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-medium transition-all duration-200 group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${
            task.status === 'completed' 
              ? 'bg-green-100' 
              : isOverdue() 
                ? 'bg-red-100' 
                : 'bg-purple-100'
          }`}>
            {task.status === 'completed' ? (
              <CheckSquare className="h-6 w-6 text-green-600" />
            ) : isOverdue() ? (
              <AlertTriangle className="h-6 w-6 text-red-600" />
            ) : (
              <Clock className="h-6 w-6 text-purple-600" />
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {task.status !== 'completed' && (
              <button
                onClick={() => onComplete(task._id)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                title="Mark as Complete"
              >
                <CheckSquare className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Upload Files"
            >
              <Upload className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onEdit(task)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(task)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor()}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {task.what}
        </h3>

        {task.description && (
          <p className="text-gray-600 mb-4 line-clamp-3">{task.description}</p>
        )}

        {task.deadline && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Calendar className="h-4 w-4 mr-1" />
            <span className={isOverdue() ? 'text-red-600 font-medium' : ''}>
              Due: {formatDate(task.deadline)}
            </span>
          </div>
        )}
      </div>

      {/* File Upload */}
      {showFileUpload && (
        <div className="px-6 pb-4">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          {task.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              {task.location}
            </div>
          )}

          {task.estimatedCost && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Est. Cost</p>
              <p className="text-lg font-semibold text-gray-900">
                €{task.estimatedCost.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {(task.responsibleCompany || task.responsibleEmployee) && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            {task.responsibleCompany ? (
              <>
                <Building className="h-4 w-4 mr-1" />
                <span className="font-medium">{task.responsibleCompany}</span>
                {task.responsibleContact && (
                  <span className="ml-2">({task.responsibleContact})</span>
                )}
              </>
            ) : (
              <>
                <User className="h-4 w-4 mr-1" />
                <span className="font-medium">{task.responsibleEmployee}</span>
              </>
            )}
          </div>
        )}

        {task.category && (
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-1 text-gray-400" />
            <span className="text-sm text-gray-600">{task.category}</span>
          </div>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <FileText className="h-4 w-4 mr-1" />
              {task.attachments.length} attachment{task.attachments.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
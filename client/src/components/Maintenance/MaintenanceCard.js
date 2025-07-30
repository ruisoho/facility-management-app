import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Eye,
  Building,
  User,
  FileText,
  DollarSign
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

const MaintenanceCard = ({ 
  record, 
  viewMode, 
  onEdit, 
  onDelete, 
  onMarkComplete, 
  onFileUpload,
  getStatusColor,
  getPriorityColor 
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);

  const daysUntilNext = differenceInDays(new Date(record.nextMaintenance), new Date());
  const isOverdue = isPast(new Date(record.nextMaintenance));

  const handleFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files));
  };

  const handleUpload = () => {
    if (uploadFiles.length > 0) {
      onFileUpload(record._id, uploadFiles);
      setUploadFiles([]);
      setShowFileUpload(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-medium transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            {/* System Info */}
            <div className="md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-1">{record.system}</h3>
              <p className="text-sm text-gray-600">{record.systemType}</p>
              <div className="flex items-center mt-2 space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}>
                  {record.priority}
                </span>
              </div>
            </div>

            {/* Company */}
            <div>
              <div className="flex items-center text-sm text-gray-600">
                <Building className="h-4 w-4 mr-1" />
                <span className="font-medium">{record.company.name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{record.company.contact}</p>
            </div>

            {/* Last Maintenance */}
            <div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Last</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(record.lastMaintenance), 'MMM dd, yyyy')}
              </p>
            </div>

            {/* Next Maintenance */}
            <div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Next</span>
              </div>
              <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                {format(new Date(record.nextMaintenance), 'MMM dd, yyyy')}
              </p>
              <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                {isOverdue ? `${Math.abs(daysUntilNext)} days overdue` : `${daysUntilNext} days`}
              </p>
            </div>

            {/* Cost */}
            <div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>Cost</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                €{record.cost || 0}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {record.status !== 'completed' && (
              <button
                onClick={() => onMarkComplete(record._id)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                title="Mark as Complete"
              >
                <CheckCircle className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Upload Files"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              onClick={() => onEdit(record)}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              title="Edit"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(record)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        {showFileUpload && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Upload
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
            {record.system}
          </h3>
          <p className="text-sm text-gray-600">{record.systemType}</p>
        </div>
        <div className="flex space-x-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}>
            {record.priority}
          </span>
        </div>
      </div>

      {/* Company Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <Building className="h-4 w-4 mr-2" />
          <span className="font-medium">{record.company.name}</span>
        </div>
        <p className="text-xs text-gray-500 ml-6">{record.company.contact}</p>
      </div>

      {/* Maintenance Dates */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Last Maintenance</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {format(new Date(record.lastMaintenance), 'MMM dd, yyyy')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>Next Maintenance</span>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              {format(new Date(record.nextMaintenance), 'MMM dd, yyyy')}
            </span>
            <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
              {isOverdue ? `${Math.abs(daysUntilNext)} days overdue` : `in ${daysUntilNext} days`}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <DollarSign className="h-4 w-4 mr-1" />
          <span>€{record.cost || 0}</span>
        </div>
        {record.proofDocuments && record.proofDocuments.length > 0 && (
          <div className="flex items-center text-gray-600">
            <FileText className="h-4 w-4 mr-1" />
            <span>{record.proofDocuments.length} files</span>
          </div>
        )}
      </div>

      {/* Cycle Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Cycle:</span> {record.cycle.type === 'custom' 
            ? `Every ${record.cycle.customDays} days`
            : record.cycle.type
          }
        </p>
        {record.norms && (
          <p className="text-xs text-blue-600 mt-1">
            <span className="font-medium">Norms:</span> {record.norms}
          </p>
        )}
      </div>

      {/* Notes */}
      {record.notes && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">{record.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          {record.status !== 'completed' && (
            <button
              onClick={() => onMarkComplete(record._id)}
              className="flex items-center px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Complete
            </button>
          )}
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </button>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(record)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(record)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {showFileUpload && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploadFiles.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {uploadFiles.length} file(s) selected
                </span>
                <button
                  onClick={handleUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  Upload Files
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceCard;
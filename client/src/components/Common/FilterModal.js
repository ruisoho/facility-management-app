import React, { useState } from 'react';
import { X, Filter, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';

const FilterModal = ({ filters, onApply, onClose, type }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (name, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateRangeChange = (field, date) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date
      }
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      priority: '',
      systemType: '',
      category: '',
      dateRange: { start: '', end: '' }
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  const renderMaintenanceFilters = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={localFilters.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={localFilters.priority}
          onChange={(e) => handleInputChange('priority', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Type
        </label>
        <select
          value={localFilters.systemType}
          onChange={(e) => handleInputChange('systemType', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All System Types</option>
          <option value="HVAC">HVAC</option>
          <option value="Electrical">Electrical</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Fire Safety">Fire Safety</option>
          <option value="Security">Security</option>
          <option value="Elevator">Elevator</option>
          <option value="Lighting">Lighting</option>
          <option value="Ventilation">Ventilation</option>
        </select>
      </div>
    </>
  );

  const renderTaskFilters = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={localFilters.status}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={localFilters.priority}
          onChange={(e) => handleInputChange('priority', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          value={localFilters.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Inspection">Inspection</option>
          <option value="Repair">Repair</option>
          <option value="Safety">Safety</option>
          <option value="Cleaning">Cleaning</option>
          <option value="Documentation">Documentation</option>
          <option value="Other">Other</option>
        </select>
      </div>
    </>
  );

  const renderConsumptionFilters = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type
        </label>
        <select
          value={localFilters.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          <option value="electricity">Electricity</option>
          <option value="gas">Gas</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Status
        </label>
        <select
          value={localFilters.verified}
          onChange={(e) => handleInputChange('verified', e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Records</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-hard max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Filter className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Filter Options</h2>
              <p className="text-gray-600 text-sm mt-1">
                Refine your search results
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6">
          {/* Type-specific filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'maintenance' && renderMaintenanceFilters()}
            {type === 'tasks' && renderTaskFilters()}
            {type === 'consumption' && renderConsumptionFilters()}
          </div>

          {/* Date Range Filter */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <DatePicker
                  selected={localFilters.dateRange.start ? new Date(localFilters.dateRange.start) : null}
                  onChange={(date) => handleDateRangeChange('start', date)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select start date"
                  isClearable
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <DatePicker
                  selected={localFilters.dateRange.end ? new Date(localFilters.dateRange.end) : null}
                  onChange={(date) => handleDateRangeChange('end', date)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select end date"
                  isClearable
                  minDate={localFilters.dateRange.start ? new Date(localFilters.dateRange.start) : null}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
          >
            Reset All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Edit,
  Trash2,
  Upload,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { maintenanceAPI, uploadAPI, handleApiError } from '../services/api';
import MaintenanceForm from '../components/Maintenance/MaintenanceForm';
import MaintenanceCard from '../components/Maintenance/MaintenanceCard';
import FilterModal from '../components/Common/FilterModal';
import ConfirmModal from '../components/Common/ConfirmModal';

const Maintenance = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    systemType: '',
    dateRange: { start: '', end: '' }
  });
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('nextMaintenance');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    loadMaintenanceRecords();
  }, [filters, sortBy, sortOrder]);

  const loadMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        ...filters,
        sortBy,
        sortOrder
      };
      const response = await maintenanceAPI.getAll(params);
      setMaintenanceRecords(response.data.data || []);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      loadMaintenanceRecords();
    }, 500);
  };

  const handleCreate = async (data) => {
    try {
      await maintenanceAPI.create(data);
      toast.success('Maintenance record created successfully');
      setShowForm(false);
      loadMaintenanceRecords();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await maintenanceAPI.update(id, data);
      toast.success('Maintenance record updated successfully');
      setEditingRecord(null);
      setShowForm(false);
      loadMaintenanceRecords();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await maintenanceAPI.delete(id);
      toast.success('Maintenance record deleted successfully');
      setDeleteConfirm(null);
      loadMaintenanceRecords();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await maintenanceAPI.markComplete(id);
      toast.success('Maintenance marked as complete');
      loadMaintenanceRecords();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const handleFileUpload = async (recordId, files) => {
    try {
      await uploadAPI.uploadMaintenanceFiles(recordId, files);
      toast.success('Files uploaded successfully');
      loadMaintenanceRecords();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'upcoming':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Management</h1>
            <p className="text-blue-100 text-lg">
              Track and manage all maintenance cycles and schedules
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors duration-200 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Maintenance
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search maintenance records..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </button>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="nextMaintenance-asc">Next Maintenance (Earliest)</option>
              <option value="nextMaintenance-desc">Next Maintenance (Latest)</option>
              <option value="lastMaintenance-desc">Last Maintenance (Recent)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="system-asc">System (A-Z)</option>
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Records */}
      {maintenanceRecords.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance records found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first maintenance record</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            Add Maintenance Record
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {maintenanceRecords.map((record) => (
            <MaintenanceCard
              key={record._id}
              record={record}
              viewMode={viewMode}
              onEdit={(record) => {
                setEditingRecord(record);
                setShowForm(true);
              }}
              onDelete={(record) => setDeleteConfirm(record)}
              onMarkComplete={handleMarkComplete}
              onFileUpload={handleFileUpload}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <MaintenanceForm
          record={editingRecord}
          onSubmit={editingRecord ? 
            (data) => handleUpdate(editingRecord._id, data) : 
            handleCreate
          }
          onClose={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}

      {showFilters && (
        <FilterModal
          filters={filters}
          onApply={setFilters}
          onClose={() => setShowFilters(false)}
          type="maintenance"
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Maintenance Record"
          message={`Are you sure you want to delete the maintenance record for "${deleteConfirm.system}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm._id)}
          onCancel={() => setDeleteConfirm(null)}
          type="danger"
        />
      )}
    </div>
  );
};

export default Maintenance;
import React, { useState, useEffect } from 'react';
import { facilitiesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { 
  FaTimes, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaUser, 
  FaPhone, 
  FaEdit, 
  FaTasks, 
  FaTools,
  FaCalendarAlt,
  FaRuler,
  FaLayerGroup
} from 'react-icons/fa';

const FacilityDetails = ({ facility, onClose, onEdit }) => {
  const [facilityStats, setFacilityStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (facility) {
      fetchFacilityData();
    }
  }, [facility]);

  const fetchFacilityData = async () => {
    try {
      setLoading(true);
      const [statsResponse, tasksResponse, maintenanceResponse] = await Promise.all([
        facilitiesAPI.getStats(facility.id),
        facilitiesAPI.getTasks(facility.id, { limit: 5 }),
        facilitiesAPI.getMaintenance(facility.id, { limit: 5 })
      ]);

      setFacilityStats(statsResponse.data.data);
      setRecentTasks(tasksResponse.data.data);
      setRecentMaintenance(maintenanceResponse.data.data);
    } catch (error) {
      console.error('Error fetching facility data:', error);
      toast.error('Error loading facility details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Inactive': return 'text-gray-600 bg-gray-100';
      case 'Under Maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'Under Construction': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading facility details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FaBuilding className="text-blue-600 text-xl" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{facility.name}</h2>
              <p className="text-gray-600">{facility.type} • {facility.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(facility.status)}`}>
              {facility.status}
            </span>
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Facility"
            >
              <FaEdit />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tasks ({facilityStats?.tasks?.total || 0})
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'maintenance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Maintenance ({facilityStats?.maintenance?.total || 0})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FaMapMarkerAlt className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{facility.location}</p>
                      </div>
                    </div>
                    
                    {facility.address && (
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{facility.address}</p>
                        </div>
                      </div>
                    )}
                    
                    {facility.manager && (
                      <div className="flex items-center gap-3">
                        <FaUser className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Manager</p>
                          <p className="font-medium">{facility.manager}</p>
                        </div>
                      </div>
                    )}
                    
                    {facility.contact && (
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Contact</p>
                          <p className="font-medium">{facility.contact}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Physical Details</h3>
                  
                  <div className="space-y-3">
                    {facility.area && (
                      <div className="flex items-center gap-3">
                        <FaRuler className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Area</p>
                          <p className="font-medium">{facility.area.toLocaleString()} sq ft</p>
                        </div>
                      </div>
                    )}
                    
                    {facility.floors && (
                      <div className="flex items-center gap-3">
                        <FaLayerGroup className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Floors</p>
                          <p className="font-medium">{facility.floors}</p>
                        </div>
                      </div>
                    )}
                    
                    {facility.yearBuilt && (
                      <div className="flex items-center gap-3">
                        <FaCalendarAlt className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Year Built</p>
                          <p className="font-medium">{facility.yearBuilt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {facility.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{facility.description}</p>
                </div>
              )}

              {/* Statistics */}
              {facilityStats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaTasks className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Total Tasks</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{facilityStats.tasks.total}</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaTasks className="text-green-600" />
                        <span className="text-sm font-medium text-green-600">Completed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">{facilityStats.tasks.completed}</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaTasks className="text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-600">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">{facilityStats.tasks.pending}</p>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaTasks className="text-red-600" />
                        <span className="text-sm font-medium text-red-600">Overdue</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{facilityStats.tasks.overdue}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {facility.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                  <p className="text-gray-700 leading-relaxed">{facility.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All Tasks
                </button>
              </div>
              
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Category: {task.category}</span>
                        <span>Due: {formatDate(task.deadline)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaTasks className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No tasks found for this facility</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Maintenance</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All Maintenance
                </button>
              </div>
              
              {recentMaintenance.length > 0 ? (
                <div className="space-y-3">
                  {recentMaintenance.map((maintenance) => (
                    <div key={maintenance.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{maintenance.equipment}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(maintenance.status)}`}>
                          {maintenance.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{maintenance.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Type: {maintenance.type}</span>
                        <span>Scheduled: {formatDate(maintenance.scheduledDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaTools className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No maintenance records found for this facility</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityDetails;
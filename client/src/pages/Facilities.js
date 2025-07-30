import React, { useState, useEffect, useCallback } from 'react';
import { facilitiesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBuilding, FaMapMarkerAlt, FaUser, FaPhone } from 'react-icons/fa';
import FacilityForm from '../components/Facilities/FacilityForm';
import FacilityDetails from '../components/Facilities/FacilityDetails';

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFacilities, setTotalFacilities] = useState(0);
  const itemsPerPage = 10;

  const facilityTypes = ['Office', 'Industrial', 'Storage', 'Retail', 'Healthcare', 'Educational', 'Apartment', 'Other'];
  const facilityStatuses = ['Active', 'Inactive', 'Under Maintenance', 'Under Construction'];

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      };

      const response = await facilitiesAPI.getAll(params);
      setFacilities(response.data.data);
      setTotalPages(response.data.pagination.pages);
      setTotalFacilities(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast.error('Error fetching facilities');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, typeFilter, statusFilter, sortBy, sortOrder, itemsPerPage]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);



  const handleCreateFacility = () => {
    setSelectedFacility(null);
    setShowForm(true);
  };

  const handleEditFacility = (facility) => {
    setSelectedFacility(facility);
    setShowForm(true);
  };

  const handleViewFacility = (facility) => {
    setSelectedFacility(facility);
    setShowDetails(true);
  };

  const handleDeleteFacility = async (facilityId, cascade = false) => {
    const confirmMessage = cascade 
      ? 'Are you sure you want to delete this facility and ALL associated tasks and maintenance records? This action cannot be undone.'
      : 'Are you sure you want to delete this facility?';
      
    if (window.confirm(confirmMessage)) {
      try {
        const url = cascade ? `${facilityId}?cascade=true` : facilityId;
        await facilitiesAPI.delete(url);
        toast.success('Facility deleted successfully');
        fetchFacilities();
      } catch (error) {
        console.error('Error deleting facility:', error);
        const errorData = error.response?.data;
        
        // If facility has associated records, offer cascade deletion
        if (errorData?.details?.canCascade && !cascade) {
          const cascadeConfirm = window.confirm(
            `${errorData.message}\n\nWould you like to delete the facility along with all associated records?`
          );
          
          if (cascadeConfirm) {
            handleDeleteFacility(facilityId, true);
            return;
          }
        }
        
        toast.error(errorData?.message || 'Error deleting facility');
      }
    }
  };

  const handleFormSubmit = async (facilityData) => {
    try {
      if (selectedFacility) {
        await facilitiesAPI.update(selectedFacility.id, facilityData);
        toast.success('Facility updated successfully');
      } else {
        await facilitiesAPI.create(facilityData);
        toast.success('Facility created successfully');
      }
      setShowForm(false);
      fetchFacilities();
    } catch (error) {
      console.error('Error saving facility:', error);
      toast.error(error.response?.data?.message || 'Error saving facility');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Office': return <FaBuilding className="text-blue-500" />;
      case 'Industrial': return <FaBuilding className="text-gray-600" />;
      case 'Storage': return <FaBuilding className="text-yellow-600" />;
      default: return <FaBuilding className="text-gray-500" />;
    }
  };

  if (loading && facilities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Facilities Management</h1>
            <p className="text-gray-600 mt-1">Manage and oversee all facilities</p>
          </div>
          <button
            onClick={handleCreateFacility}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FaPlus /> Add Facility
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={handleTypeFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {facilityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {facilityStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {facilities.length} of {totalFacilities} facilities
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {facilities.map((facility) => (
          <div key={facility.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(facility.type)}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{facility.name}</h3>
                    <p className="text-sm text-gray-600">{facility.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(facility.status)}`}>
                  {facility.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>{facility.location}</span>
                </div>
                {facility.manager && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaUser className="text-gray-400" />
                    <span>{facility.manager}</span>
                  </div>
                )}
                {facility.contact && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaPhone className="text-gray-400" />
                    <span>{facility.contact}</span>
                  </div>
                )}
              </div>

              {facility.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{facility.description}</p>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-xs text-gray-500">
                  {facility.area && `${facility.area} sq ft`}
                  {facility.floors && ` • ${facility.floors} floors`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewFacility(facility)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleEditFacility(facility)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Edit Facility"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteFacility(facility.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Facility"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {facilities.length === 0 && !loading && (
        <div className="text-center py-12">
          <FaBuilding className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No facilities found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first facility.</p>
          <button
            onClick={handleCreateFacility}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <FaPlus /> Add Facility
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <FacilityForm
          facility={selectedFacility}
          onSave={handleFormSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {showDetails && selectedFacility && (
        <FacilityDetails
          facility={selectedFacility}
          onClose={() => setShowDetails(false)}
          onEdit={() => {
            setShowDetails(false);
            setShowForm(true);
          }}
        />
      )}
    </div>
  );
};

export default Facilities;
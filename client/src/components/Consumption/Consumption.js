import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  TrendingUp, 
  Zap, 
  Flame,
  Calendar,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { consumptionAPI } from '../../services/api';
import ConsumptionCard from './ConsumptionCard';
import ConsumptionForm from './ConsumptionForm';
import FilterModal from '../Common/FilterModal';
import ConfirmModal from '../Common/ConfirmModal';

const Consumption = () => {
  const navigate = useNavigate();
  const [consumptions, setConsumptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState(null);
  const [deletingConsumption, setDeletingConsumption] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    verified: '',
    dateFrom: null,
    dateTo: null
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalElectricity: 0,
    totalGas: 0,
    monthlyElectricity: 0,
    monthlyGas: 0,
    averageDaily: 0,
    unverifiedCount: 0
  });

  useEffect(() => {
    fetchConsumptions();
    fetchStats();
  }, [currentPage, sortBy, sortOrder, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConsumptions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        search: searchTerm,
        sortBy,
        sortOrder,
        ...filters
      };

      const response = await consumptionAPI.getAll(params);
      const responseData = response.data || {};
      setConsumptions(responseData.consumptions || []);
      setTotalPages(responseData.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch consumption records');
      console.error('Error fetching consumptions:', error);
      // Set fallback values on error
      setConsumptions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await consumptionAPI.getStats();
      const statsData = response.data || {};
      setStats({
        totalElectricity: statsData.totalElectricity || 0,
        totalGas: statsData.totalGas || 0,
        monthlyElectricity: statsData.monthlyElectricity || 0,
        monthlyGas: statsData.monthlyGas || 0,
        averageDaily: statsData.averageDaily || 0,
        unverifiedCount: statsData.unverifiedCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default values on error
      setStats({
        totalElectricity: 0,
        totalGas: 0,
        monthlyElectricity: 0,
        monthlyGas: 0,
        averageDaily: 0,
        unverifiedCount: 0
      });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchConsumptions();
    }, 500);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setFilters({
      type: '',
      verified: '',
      dateFrom: null,
      dateTo: null
    });
    setCurrentPage(1);
  };

  const handleCreateConsumption = async (consumptionData) => {
    try {
      await consumptionAPI.create(consumptionData);
      toast.success('Consumption record created successfully');
      setShowForm(false);
      fetchConsumptions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create consumption record');
      console.error('Error creating consumption:', error);
    }
  };

  const handleUpdateConsumption = async (consumptionData) => {
    try {
      await consumptionAPI.update(editingConsumption._id, consumptionData);
      toast.success('Consumption record updated successfully');
      setShowForm(false);
      setEditingConsumption(null);
      fetchConsumptions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update consumption record');
      console.error('Error updating consumption:', error);
    }
  };

  const handleEditConsumption = (consumption) => {
    setEditingConsumption(consumption);
    setShowForm(true);
  };

  const handleDeleteConsumption = (consumption) => {
    setDeletingConsumption(consumption);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await consumptionAPI.delete(deletingConsumption._id);
      toast.success('Consumption record deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingConsumption(null);
      fetchConsumptions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete consumption record');
      console.error('Error deleting consumption:', error);
    }
  };

  const handleVerifyConsumption = async (consumptionId) => {
    try {
      await consumptionAPI.verify(consumptionId);
      toast.success('Consumption record verified successfully');
      fetchConsumptions();
      fetchStats();
    } catch (error) {
      toast.error('Failed to verify consumption record');
      console.error('Error verifying consumption:', error);
    }
  };

  const handleExportData = async () => {
    try {
      toast.success('Export functionality will be implemented soon');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== '' && value !== null && value !== undefined
    ).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Consumption Management
              </h1>
              <p className="text-gray-600">
                Track and manage electricity and gas consumption
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportData}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => {
                  navigate('/electrical-meters');
                }}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Consumption
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl mr-4">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Electricity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalElectricity.toLocaleString()} kWh
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-xl mr-4">
                  <Flame className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Gas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalGas.toLocaleString()} m³
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Electricity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.monthlyElectricity.toLocaleString()} kWh
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl mr-4">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Gas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.monthlyGas.toLocaleString()} m³
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl mr-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageDaily.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-xl mr-4">
                  <BarChart3 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unverified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.unverifiedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search consumption records..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>

              <button
                onClick={() => setShowFilters(true)}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                  getActiveFiltersCount() > 0
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              <button
                onClick={fetchConsumptions}
                className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="consumption-desc">Consumption (High to Low)</option>
                <option value="consumption-asc">Consumption (Low to High)</option>
                <option value="type-asc">Type (A-Z)</option>
                <option value="type-desc">Type (Z-A)</option>
              </select>

              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !consumptions || consumptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No consumption records found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first consumption record.
            </p>

          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {consumptions.map((consumption) => (
                <ConsumptionCard
                  key={consumption._id}
                  consumption={consumption}
                  viewMode={viewMode}
                  onEdit={handleEditConsumption}
                  onDelete={handleDeleteConsumption}
                  onVerify={handleVerifyConsumption}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ConsumptionForm
          consumption={editingConsumption}
          onSubmit={editingConsumption ? handleUpdateConsumption : handleCreateConsumption}
          onCancel={() => {
            setShowForm(false);
            setEditingConsumption(null);
          }}
        />
      )}

      {showFilters && (
        <FilterModal
          type="consumption"
          filters={filters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Consumption Record"
          message={`Are you sure you want to delete this ${deletingConsumption?.type} consumption record from ${new Date(deletingConsumption?.date).toLocaleDateString()}? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeletingConsumption(null);
          }}
          type="danger"
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default Consumption;
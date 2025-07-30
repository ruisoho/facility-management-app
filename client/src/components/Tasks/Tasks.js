import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  CheckSquare, 
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  Building,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { tasksAPI, uploadAPI } from '../../services/api';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import FilterModal from '../Common/FilterModal';
import ConfirmModal from '../Common/ConfirmModal';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    responsibleType: '',
    dateFrom: null,
    dateTo: null
  });
  const [sortBy, setSortBy] = useState('insertDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    highPriorityTasks: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [currentPage, sortBy, sortOrder, filters]);

  const fetchTasks = async () => {
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

      const response = await tasksAPI.getAll(params);
      setTasks(response.data.tasks);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await tasksAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchTasks();
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
      status: '',
      priority: '',
      category: '',
      responsibleType: '',
      dateFrom: null,
      dateTo: null
    });
    setCurrentPage(1);
  };

  const handleCreateTask = async (taskData) => {
    try {
      await tasksAPI.create(taskData);
      toast.success('Task created successfully');
      setShowForm(false);
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create task');
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await tasksAPI.update(editingTask._id, taskData);
      toast.success('Task updated successfully');
      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update task');
      console.error('Error updating task:', error);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = (task) => {
    setDeletingTask(task);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await tasksAPI.delete(deletingTask._id);
      toast.success('Task deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingTask(null);
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await tasksAPI.complete(taskId);
      toast.success('Task marked as completed');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to complete task');
      console.error('Error completing task:', error);
    }
  };

  const handleFileUpload = async (taskId, files) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      await uploadAPI.uploadTaskFiles(taskId, formData);
      toast.success('Files uploaded successfully');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Error uploading files:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Task Management
              </h1>
              <p className="text-gray-600">
                Organize and track your daily tasks and to-dos
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
                  setEditingTask(null);
                  setShowForm(true);
                }}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Task
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-xl mr-4">
                  <CheckSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl mr-4">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-xl mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.overdueTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-xl mr-4">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.todayTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-xl mr-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.highPriorityTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-xl mr-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingTasks}
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
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80"
                />
              </div>

              <button
                onClick={() => setShowFilters(true)}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 ${
                  getActiveFiltersCount() > 0
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              <button
                onClick={fetchTasks}
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
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="insertDate-desc">Created (Newest)</option>
                <option value="insertDate-asc">Created (Oldest)</option>
                <option value="deadline-asc">Deadline (Earliest)</option>
                <option value="deadline-desc">Deadline (Latest)</option>
                <option value="priority-desc">Priority (High to Low)</option>
                <option value="priority-asc">Priority (Low to High)</option>
                <option value="what-asc">Title (A-Z)</option>
                <option value="what-desc">Title (Z-A)</option>
              </select>

              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-purple-600 shadow-sm'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckSquare className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first task.
            </p>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Task
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  viewMode={viewMode}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  onComplete={handleCompleteTask}
                  onFileUpload={handleFileUpload}
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
                        ? 'bg-purple-600 text-white'
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
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      {showFilters && (
        <FilterModal
          type="tasks"
          filters={filters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete Task"
          message={`Are you sure you want to delete the task "${deletingTask?.what}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeletingTask(null);
          }}
          type="danger"
          confirmText="Delete"
        />
      )}
    </div>
  );
};

export default Tasks;
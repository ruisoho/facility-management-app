import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Building, MapPin, DollarSign, FileText, Tag, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TaskForm = ({ task, onSave, onCancel, loading = false }) => {
  const [formData, setFormData] = useState({
    what: '',
    description: '',
    deadline: null,
    priority: 'medium',
    status: 'pending',
    category: '',
    location: '',
    responsibleType: 'company', // 'company' or 'employee'
    responsibleCompany: '',
    responsibleContact: '',
    responsiblePhone: '',
    responsibleEmail: '',
    responsibleEmployee: '',
    estimatedCost: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setFormData({
        what: task.what || '',
        description: task.description || '',
        deadline: task.deadline ? new Date(task.deadline) : null,
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        category: task.category || '',
        location: task.location || '',
        responsibleType: task.responsibleCompany ? 'company' : 'employee',
        responsibleCompany: task.responsibleCompany || '',
        responsibleContact: task.responsibleContact || '',
        responsiblePhone: task.responsiblePhone || '',
        responsibleEmail: task.responsibleEmail || '',
        responsibleEmployee: task.responsibleEmployee || '',
        estimatedCost: task.estimatedCost || '',
        notes: task.notes || ''
      });
    }
  }, [task]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      deadline: date
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.what.trim()) {
      newErrors.what = 'Task description is required';
    }

    if (formData.responsibleType === 'company') {
      if (!formData.responsibleCompany.trim()) {
        newErrors.responsibleCompany = 'Company name is required';
      }
    } else {
      if (!formData.responsibleEmployee.trim()) {
        newErrors.responsibleEmployee = 'Employee name is required';
      }
    }

    if (formData.estimatedCost && isNaN(parseFloat(formData.estimatedCost))) {
      newErrors.estimatedCost = 'Please enter a valid cost';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const taskData = {
      ...formData,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null
    };

    // Clean up based on responsible type
    if (formData.responsibleType === 'company') {
      delete taskData.responsibleEmployee;
    } else {
      delete taskData.responsibleCompany;
      delete taskData.responsibleContact;
      delete taskData.responsiblePhone;
      delete taskData.responsibleEmail;
    }

    delete taskData.responsibleType;

    onSave(taskData);
  };

  const categories = [
    'Maintenance',
    'Repair',
    'Inspection',
    'Cleaning',
    'Security',
    'Utilities',
    'HVAC',
    'Electrical',
    'Plumbing',
    'Landscaping',
    'Safety',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-600" />
              Task Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What needs to be done? *
                </label>
                <input
                  type="text"
                  name="what"
                  value={formData.what}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                    errors.what ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Fix broken air conditioning unit"
                />
                {errors.what && <p className="mt-1 text-sm text-red-600">{errors.what}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Additional details about the task..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Deadline
                </label>
                <DatePicker
                  selected={formData.deadline}
                  onChange={handleDateChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  placeholderText="Select deadline"
                  dateFormat="MMM dd, yyyy"
                  minDate={new Date()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                  placeholder="e.g., Building A, Floor 2, Room 201"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Estimated Cost (€)
                </label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                    errors.estimatedCost ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.estimatedCost && <p className="mt-1 text-sm text-red-600">{errors.estimatedCost}</p>}
              </div>
            </div>
          </div>

          {/* Responsible Party */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Responsible Party
            </h3>

            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="responsibleType"
                    value="company"
                    checked={formData.responsibleType === 'company'}
                    onChange={handleInputChange}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <Building className="h-4 w-4 mr-1" />
                  Company
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="responsibleType"
                    value="employee"
                    checked={formData.responsibleType === 'employee'}
                    onChange={handleInputChange}
                    className="mr-2 text-purple-600 focus:ring-purple-500"
                  />
                  <User className="h-4 w-4 mr-1" />
                  Employee
                </label>
              </div>

              {formData.responsibleType === 'company' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      name="responsibleCompany"
                      value={formData.responsibleCompany}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                        errors.responsibleCompany ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Company name"
                    />
                    {errors.responsibleCompany && <p className="mt-1 text-sm text-red-600">{errors.responsibleCompany}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="responsibleContact"
                      value={formData.responsibleContact}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="responsiblePhone"
                      value={formData.responsiblePhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="responsibleEmail"
                      value={formData.responsibleEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Email address"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    name="responsibleEmployee"
                    value={formData.responsibleEmployee}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200 ${
                      errors.responsibleEmployee ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Employee name"
                  />
                  {errors.responsibleEmployee && <p className="mt-1 text-sm text-red-600">{errors.responsibleEmployee}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-200"
              placeholder="Any additional notes or special instructions..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && <Clock className="h-4 w-4 mr-2 animate-spin" />}
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
import React, { useState, useEffect } from 'react';
import { X, Calendar, Building, User, AlertTriangle, Info } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { toast } from 'react-hot-toast';
import "react-datepicker/dist/react-datepicker.css";

const MaintenanceForm = ({ record, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    system: '',
    systemType: 'HVAC',
    cycle: {
      type: 'monthly',
      customDays: 30
    },
    company: {
      name: '',
      contact: '',
      phone: '',
      email: ''
    },
    norms: '',
    lastMaintenance: new Date(),
    nextMaintenance: new Date(),
    priority: 'medium',
    cost: '',
    location: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        lastMaintenance: new Date(record.lastMaintenance),
        nextMaintenance: new Date(record.nextMaintenance)
      });
    }
  }, [record]);

  const systemTypes = [
    'HVAC', 'Electrical', 'Plumbing', 'Fire Safety', 'Security', 
    'Elevator', 'Lighting', 'Ventilation', 'Heating', 'Cooling',
    'Generator', 'UPS', 'Network', 'Access Control', 'CCTV'
  ];

  const cycleTypes = [
    { value: 'weekly', label: 'Weekly', days: 7 },
    { value: 'monthly', label: 'Monthly', days: 30 },
    { value: 'quarterly', label: 'Quarterly', days: 90 },
    { value: 'semi-annual', label: 'Semi-Annual', days: 180 },
    { value: 'annual', label: 'Annual', days: 365 },
    { value: 'custom', label: 'Custom', days: null }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCycleChange = (cycleType) => {
    const selectedCycle = cycleTypes.find(c => c.value === cycleType);
    setFormData(prev => ({
      ...prev,
      cycle: {
        type: cycleType,
        customDays: selectedCycle?.days || prev.cycle.customDays
      }
    }));

    // Auto-calculate next maintenance date
    if (selectedCycle && selectedCycle.days) {
      const nextDate = new Date(formData.lastMaintenance);
      nextDate.setDate(nextDate.getDate() + selectedCycle.days);
      setFormData(prev => ({
        ...prev,
        nextMaintenance: nextDate
      }));
    }
  };

  const handleCustomDaysChange = (days) => {
    setFormData(prev => ({
      ...prev,
      cycle: {
        ...prev.cycle,
        customDays: parseInt(days) || 30
      }
    }));

    // Auto-calculate next maintenance date
    const nextDate = new Date(formData.lastMaintenance);
    nextDate.setDate(nextDate.getDate() + (parseInt(days) || 30));
    setFormData(prev => ({
      ...prev,
      nextMaintenance: nextDate
    }));
  };

  const handleLastMaintenanceChange = (date) => {
    setFormData(prev => ({
      ...prev,
      lastMaintenance: date
    }));

    // Auto-calculate next maintenance date
    const days = formData.cycle.type === 'custom' 
      ? formData.cycle.customDays 
      : cycleTypes.find(c => c.value === formData.cycle.type)?.days || 30;
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    setFormData(prev => ({
      ...prev,
      nextMaintenance: nextDate
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.system.trim()) {
      newErrors.system = 'System name is required';
    }

    if (!formData.company.name.trim()) {
      newErrors['company.name'] = 'Company name is required';
    }

    if (!formData.company.contact.trim()) {
      newErrors['company.contact'] = 'Contact person is required';
    }

    if (formData.company.email && !/\S+@\S+\.\S+/.test(formData.company.email)) {
      newErrors['company.email'] = 'Invalid email format';
    }

    if (formData.cycle.type === 'custom' && (!formData.cycle.customDays || formData.cycle.customDays < 1)) {
      newErrors['cycle.customDays'] = 'Custom days must be at least 1';
    }

    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      newErrors.cost = 'Cost must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-hard max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {record ? 'Edit Maintenance Record' : 'Add New Maintenance Record'}
            </h2>
            <p className="text-gray-600 mt-1">
              {record ? 'Update maintenance information' : 'Create a new maintenance schedule'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* System Information */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2 text-blue-600" />
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Name *
                </label>
                <input
                  type="text"
                  name="system"
                  value={formData.system}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.system ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g., Main HVAC Unit"
                />
                {errors.system && <p className="text-red-500 text-sm mt-1">{errors.system}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Type
                </label>
                <select
                  name="systemType"
                  value={formData.systemType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {systemTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Building A, Floor 3"
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2 text-green-600" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company.name"
                  value={formData.company.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['company.name'] ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g., TechServ Solutions"
                />
                {errors['company.name'] && <p className="text-red-500 text-sm mt-1">{errors['company.name']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  name="company.contact"
                  value={formData.company.contact}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['company.contact'] ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g., John Smith"
                />
                {errors['company.contact'] && <p className="text-red-500 text-sm mt-1">{errors['company.contact']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="company.phone"
                  value={formData.company.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., +49 30 12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="company.email"
                  value={formData.company.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors['company.email'] ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="e.g., contact@techserv.com"
                />
                {errors['company.email'] && <p className="text-red-500 text-sm mt-1">{errors['company.email']}</p>}
              </div>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="bg-yellow-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-yellow-600" />
              Maintenance Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance Cycle
                </label>
                <select
                  value={formData.cycle.type}
                  onChange={(e) => handleCycleChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {cycleTypes.map(cycle => (
                    <option key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.cycle.type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cycle.customDays}
                    onChange={(e) => handleCustomDaysChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors['cycle.customDays'] ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="30"
                  />
                  {errors['cycle.customDays'] && <p className="text-red-500 text-sm mt-1">{errors['cycle.customDays']}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Maintenance Date
                </label>
                <DatePicker
                  selected={formData.lastMaintenance}
                  onChange={handleLastMaintenanceChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Maintenance Date
                </label>
                <DatePicker
                  selected={formData.nextMaintenance}
                  onChange={(date) => setFormData(prev => ({ ...prev, nextMaintenance: date }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-purple-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Norms/Standards
                </label>
                <input
                  type="text"
                  name="norms"
                  value={formData.norms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., DIN EN 12599, VDI 6022"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Cost (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cost ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="0.00"
                />
                {errors.cost && <p className="text-red-500 text-sm mt-1">{errors.cost}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes, special requirements, or maintenance details..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {record ? 'Update Record' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;
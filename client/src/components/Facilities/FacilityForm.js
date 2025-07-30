import React, { useState, useEffect } from 'react';
import { FaTimes, FaBuilding } from 'react-icons/fa';

const FacilityForm = ({ facility, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    address: '',
    description: '',
    status: 'Active',
    manager: '',
    contact: '',
    area: '',
    floors: '',
    yearBuilt: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const facilityTypes = ['Office', 'Industrial', 'Storage', 'Retail', 'Healthcare', 'Educational', 'Apartment', 'Other'];
  const facilityStatuses = ['Active', 'Inactive', 'Under Maintenance', 'Under Construction'];

  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name || '',
        type: facility.type || '',
        location: facility.location || '',
        address: facility.address || '',
        description: facility.description || '',
        status: facility.status || 'Active',
        manager: facility.manager || '',
        contact: facility.contact || '',
        area: facility.area || '',
        floors: facility.floors || '',
        yearBuilt: facility.yearBuilt || '',
        notes: facility.notes || ''
      });
    }
  }, [facility]);

  const handleChange = (e) => {
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Facility name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Facility type is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.area && isNaN(parseFloat(formData.area))) {
      newErrors.area = 'Area must be a valid number';
    }

    if (formData.floors && (!Number.isInteger(parseInt(formData.floors)) || parseInt(formData.floors) < 1)) {
      newErrors.floors = 'Floors must be a positive integer';
    }

    if (formData.yearBuilt && (isNaN(parseInt(formData.yearBuilt)) || parseInt(formData.yearBuilt) < 1800 || parseInt(formData.yearBuilt) > new Date().getFullYear())) {
      newErrors.yearBuilt = 'Year built must be a valid year';
    }

    if (formData.contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact) && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.contact.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.contact = 'Contact must be a valid email or phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const facilityData = {
        ...formData,
        area: formData.area ? parseFloat(formData.area) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null
      };
      
      await onSave(facilityData);
    } catch (error) {
      console.error('Error saving facility:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FaBuilding className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {facility ? 'Edit Facility' : 'Add New Facility'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter facility name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select facility type</option>
                {facilityTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter location"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {facilityStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter facility description"
              />
            </div>

            {/* Management Information */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Management Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager
              </label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter manager name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact
              </label>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.contact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email or phone number"
              />
              {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
            </div>

            {/* Physical Information */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area (sq ft)
              </label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.area ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter area in square feet"
                min="0"
                step="0.01"
              />
              {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Floors
              </label>
              <input
                type="number"
                name="floors"
                value={formData.floors}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.floors ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter number of floors"
                min="1"
              />
              {errors.floors && <p className="text-red-500 text-sm mt-1">{errors.floors}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Built
              </label>
              <input
                type="number"
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.yearBuilt ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter year built"
                min="1800"
                max={new Date().getFullYear()}
              />
              {errors.yearBuilt && <p className="text-red-500 text-sm mt-1">{errors.yearBuilt}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter additional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {facility ? 'Update Facility' : 'Create Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacilityForm;
import React, { useState, useEffect } from 'react';
import { X, Zap, Flame, Calendar, DollarSign, FileText, Save } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ConsumptionForm = ({ consumption, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'electricity',
    date: new Date(),
    consumption: '',
    meterReading: '',
    cost: '',
    notes: '',
    verified: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (consumption) {
      setFormData({
        type: consumption.type || 'electricity',
        date: consumption.date ? new Date(consumption.date) : new Date(),
        consumption: consumption.consumption || '',
        meterReading: consumption.meterReading || '',
        cost: consumption.cost || '',
        notes: consumption.notes || '',
        verified: consumption.verified || false
      });
    }
  }, [consumption]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.consumption) {
      newErrors.consumption = 'Consumption value is required';
    } else if (isNaN(formData.consumption) || parseFloat(formData.consumption) <= 0) {
      newErrors.consumption = 'Consumption must be a positive number';
    }

    if (formData.meterReading && (isNaN(formData.meterReading) || parseFloat(formData.meterReading) < 0)) {
      newErrors.meterReading = 'Meter reading must be a positive number';
    }

    if (formData.cost && (isNaN(formData.cost) || parseFloat(formData.cost) < 0)) {
      newErrors.cost = 'Cost must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      date
    }));

    if (errors.date) {
      setErrors(prev => ({
        ...prev,
        date: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        consumption: parseFloat(formData.consumption),
        meterReading: formData.meterReading ? parseFloat(formData.meterReading) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case 'electricity':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'gas':
        return <Flame className="h-5 w-5 text-orange-600" />;
      default:
        return <Zap className="h-5 w-5 text-gray-600" />;
    }
  };

  const getUnit = () => {
    switch (formData.type) {
      case 'electricity':
        return 'kWh';
      case 'gas':
        return 'm³';
      default:
        return 'units';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-hard max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`p-3 rounded-xl mr-4 ${
              formData.type === 'electricity' ? 'bg-yellow-100' : 'bg-orange-100'
            }`}>
              {getTypeIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {consumption ? 'Edit Consumption Record' : 'Add Consumption Record'}
              </h2>
              <p className="text-gray-600">
                {consumption ? 'Update consumption details' : 'Enter new consumption data'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  errors.type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="electricity">Electricity</option>
                <option value="gas">Gas</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  dateFormat="MMM dd, yyyy"
                  maxDate={new Date()}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholderText="Select date"
                />
              </div>
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Consumption and Meter Reading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consumption ({getUnit()}) *
              </label>
              <input
                type="number"
                name="consumption"
                value={formData.consumption}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  errors.consumption ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={`Enter consumption in ${getUnit()}`}
              />
              {errors.consumption && (
                <p className="mt-1 text-sm text-red-600">{errors.consumption}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meter Reading (Optional)
              </label>
              <input
                type="number"
                name="meterReading"
                value={formData.meterReading}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  errors.meterReading ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter meter reading"
              />
              {errors.meterReading && (
                <p className="mt-1 text-sm text-red-600">{errors.meterReading}</p>
              )}
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost (€) (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                  errors.cost ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter cost in euros"
              />
            </div>
            {errors.cost && (
              <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
                placeholder="Add any additional notes or observations..."
              />
            </div>
          </div>

          {/* Verification */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="verified"
              id="verified"
              checked={formData.verified}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="verified" className="ml-2 block text-sm text-gray-700">
              Mark as verified
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              <Save className="h-4 w-4 mr-2" />
              {consumption ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsumptionForm;
import React from 'react';
import { 
  Edit, 
  Trash2, 
  Zap, 
  Flame, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';

const ConsumptionCard = ({ 
  consumption, 
  viewMode = 'grid', 
  onEdit, 
  onDelete, 
  onVerify 
}) => {
  const getTypeIcon = () => {
    switch (consumption.type) {
      case 'electricity':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'gas':
        return <Flame className="h-5 w-5 text-orange-600" />;
      default:
        return <Zap className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeColor = () => {
    switch (consumption.type) {
      case 'electricity':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'gas':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerificationStatus = () => {
    if (consumption.verified) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: 'Verified',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    } else {
      return {
        icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }
  };

  const formatDate = (date) => {
    const consumptionDate = new Date(date);
    if (isToday(consumptionDate)) {
      return 'Today';
    } else if (isYesterday(consumptionDate)) {
      return 'Yesterday';
    } else {
      const daysDiff = differenceInDays(new Date(), consumptionDate);
      if (daysDiff <= 7) {
        return `${daysDiff} days ago`;
      }
      return format(consumptionDate, 'MMM dd, yyyy');
    }
  };

  const getTrendIcon = () => {
    if (!consumption.previousConsumption) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }

    const current = consumption.consumption;
    const previous = consumption.previousConsumption;
    
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendPercentage = () => {
    if (!consumption.previousConsumption) {
      return null;
    }

    const current = consumption.consumption;
    const previous = consumption.previousConsumption;
    const percentage = ((current - previous) / previous * 100).toFixed(1);
    
    return Math.abs(percentage);
  };

  const getUnit = () => {
    switch (consumption.type) {
      case 'electricity':
        return 'kWh';
      case 'gas':
        return 'm³';
      default:
        return 'units';
    }
  };

  const verificationStatus = getVerificationStatus();

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 hover:shadow-medium transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Type Icon */}
            <div className={`p-3 rounded-xl ${consumption.type === 'electricity' ? 'bg-yellow-100' : 'bg-orange-100'}`}>
              {getTypeIcon()}
            </div>

            {/* Main Info */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor()}`}>
                  {consumption.type.charAt(0).toUpperCase() + consumption.type.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center ${verificationStatus.className}`}>
                  {verificationStatus.icon}
                  <span className="ml-1">{verificationStatus.text}</span>
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {consumption.consumption.toLocaleString()} {getUnit()}
              </h3>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate(consumption.date)}
              </div>
            </div>

            {/* Trend */}
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              {getTrendPercentage() && (
                <span className={`text-sm font-medium ${
                  consumption.consumption > (consumption.previousConsumption || 0)
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {getTrendPercentage()}%
                </span>
              )}
            </div>

            {/* Cost */}
            {consumption.cost && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Cost</p>
                <p className="text-lg font-semibold text-gray-900">
                  €{consumption.cost.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {!consumption.verified && (
              <button
                onClick={() => onVerify(consumption._id)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200"
                title="Verify"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(consumption)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(consumption)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {consumption.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">{consumption.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-medium transition-all duration-200 group">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${consumption.type === 'electricity' ? 'bg-yellow-100' : 'bg-orange-100'}`}>
            {getTypeIcon()}
          </div>
          <div className="flex items-center space-x-2">
            {!consumption.verified && (
              <button
                onClick={() => onVerify(consumption._id)}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                title="Verify"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onEdit(consumption)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(consumption)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor()}`}>
            {consumption.type.charAt(0).toUpperCase() + consumption.type.slice(1)}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center ${verificationStatus.className}`}>
            {verificationStatus.icon}
            <span className="ml-1">{verificationStatus.text}</span>
          </span>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {consumption.consumption.toLocaleString()} {getUnit()}
        </h3>

        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(consumption.date)}
        </div>

        {/* Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            {getTrendPercentage() ? (
              <span className={`text-sm font-medium ${
                consumption.consumption > (consumption.previousConsumption || 0)
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                {getTrendPercentage()}% vs previous
              </span>
            ) : (
              <span className="text-sm text-gray-500">No comparison data</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {consumption.cost ? (
            <div>
              <p className="text-sm text-gray-600">Cost</p>
              <p className="text-lg font-semibold text-gray-900">
                €{consumption.cost.toFixed(2)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">No cost data</p>
            </div>
          )}

          {consumption.meterReading && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Meter Reading</p>
              <p className="text-sm font-medium text-gray-900">
                {consumption.meterReading.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {consumption.notes && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 line-clamp-2">{consumption.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionCard;
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color, trend, description }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      gradient: 'from-red-500 to-red-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      gradient: 'from-green-500 to-green-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      gradient: 'from-yellow-500 to-yellow-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;
  const isPositiveTrend = trend && trend.startsWith('+');

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${
            isPositiveTrend ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositiveTrend ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {trend}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      {/* Decorative gradient line */}
      <div className={`mt-4 h-1 bg-gradient-to-r ${colors.gradient} rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300`}></div>
    </div>
  );
};

export default StatsCard;
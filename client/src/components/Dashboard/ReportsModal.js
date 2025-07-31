import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  FileText,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Wrench
} from 'lucide-react';

const ReportsModal = ({ onClose, stats, recentTasks }) => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('last30days');

  const reportTypes = [
    { id: 'overview', name: 'Overview Report', icon: BarChart3 },
    { id: 'tasks', name: 'Tasks Report', icon: CheckCircle },
    { id: 'facilities', name: 'Facilities Report', icon: Building },
    { id: 'maintenance', name: 'Maintenance Report', icon: Wrench },
    { id: 'financial', name: 'Financial Report', icon: TrendingUp }
  ];

  const dateRanges = [
    { id: 'last7days', name: 'Last 7 Days' },
    { id: 'last30days', name: 'Last 30 Days' },
    { id: 'last90days', name: 'Last 90 Days' },
    { id: 'lastyear', name: 'Last Year' },
    { id: 'custom', name: 'Custom Range' }
  ];

  const generateReport = () => {
    // Mock report generation - in real app, this would call an API
    const reportData = {
      overview: {
        title: 'Facility Management Overview Report',
        data: {
          totalTasks: stats.totalTasks,
          completedTasks: stats.completedTasks,
          pendingTasks: stats.pendingTasks,
          overdueTasks: stats.overdueTasks,
          facilities: stats.facilities,
          maintenanceScore: stats.maintenanceScore,
          monthlyCost: stats.monthlyCost
        }
      },
      tasks: {
        title: 'Tasks Performance Report',
        data: {
          totalTasks: stats.totalTasks,
          completionRate: Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0,
          averageCompletionTime: '3.2 days',
          recentTasks: recentTasks
        }
      },
      facilities: {
        title: 'Facilities Status Report',
        data: {
          totalFacilities: stats.facilities,
          activeMaintenanceItems: stats.pendingTasks,
          maintenanceScore: stats.maintenanceScore,
          utilizationRate: '87%'
        }
      },
      maintenance: {
        title: 'Maintenance Performance Report',
        data: {
          maintenanceScore: stats.maintenanceScore,
          preventiveMaintenance: '78%',
          emergencyRepairs: stats.overdueTasks,
          averageResponseTime: '2.1 hours'
        }
      },
      financial: {
        title: 'Financial Summary Report',
        data: {
          monthlyCost: stats.monthlyCost,
          yearlyProjection: stats.monthlyCost * 12,
          costPerFacility: Math.round(stats.monthlyCost / (stats.facilities || 1)),
          budgetUtilization: '73%'
        }
      }
    };

    // Create and download report
    const report = reportData[selectedReport];
    const reportContent = `
${report.title}
Generated on: ${new Date().toLocaleDateString()}
Date Range: ${dateRanges.find(d => d.id === dateRange)?.name}

${Object.entries(report.data).map(([key, value]) => 
  `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ReportPreview = () => {
    const currentReport = reportTypes.find(r => r.id === selectedReport);
    
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <currentReport.icon className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{currentReport.name}</h3>
        </div>
        
        <div className="space-y-4">
          {selectedReport === 'overview' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.facilities}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Maintenance Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.maintenanceScore}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-gray-900">${(stats.monthlyCost / 1000).toFixed(0)}K</p>
              </div>
            </div>
          )}
          
          {selectedReport === 'tasks' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">{Math.round((stats.completedTasks / stats.totalTasks) * 100) || 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Pending Tasks</span>
                <span className="font-semibold">{stats.pendingTasks}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Overdue Tasks</span>
                <span className="font-semibold text-red-600">{stats.overdueTasks}</span>
              </div>
            </div>
          )}
          
          {selectedReport === 'facilities' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Total Facilities</span>
                <span className="font-semibold">{stats.facilities}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Maintenance Score</span>
                <span className="font-semibold text-green-600">{stats.maintenanceScore}%</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Utilization Rate</span>
                <span className="font-semibold">87%</span>
              </div>
            </div>
          )}
          
          {selectedReport === 'maintenance' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Maintenance Score</span>
                <span className="font-semibold text-green-600">{stats.maintenanceScore}%</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Preventive Maintenance</span>
                <span className="font-semibold">78%</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Emergency Repairs</span>
                <span className="font-semibold text-orange-600">{stats.overdueTasks}</span>
              </div>
            </div>
          )}
          
          {selectedReport === 'financial' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Monthly Cost</span>
                <span className="font-semibold">${(stats.monthlyCost / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Yearly Projection</span>
                <span className="font-semibold">${(stats.monthlyCost * 12 / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-gray-600">Cost per Facility</span>
                <span className="font-semibold">${Math.round(stats.monthlyCost / (stats.facilities || 1)).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <div className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Report Type</h3>
                <div className="space-y-2">
                  {reportTypes.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`w-full flex items-center p-3 text-left rounded-lg transition-colors duration-200 ${
                        selectedReport === report.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <report.icon className="w-4 h-4 mr-3" />
                      <span className="text-sm">{report.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Date Range</h3>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {dateRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <ReportPreview />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Report will be generated for: {dateRanges.find(d => d.id === dateRange)?.name}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;
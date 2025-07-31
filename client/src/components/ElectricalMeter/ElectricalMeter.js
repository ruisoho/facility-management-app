import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaDownload, 
  FaSearch, 
  FaFilter,
  FaBolt,
  FaBuilding,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPause,
  FaCalendarAlt,
  FaChartBar,
  FaGripVertical,
  FaTimes
} from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import { facilitiesAPI } from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ElectricalMeter = () => {
  const [meters, setMeters] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFacility, setFilterFacility] = useState('');
  const [stats, setStats] = useState({});
  const [consumptionStats, setConsumptionStats] = useState({ meterConsumption: [], dailyTrend: [] });
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    location: '',
    facility_id: '',
    currentReading: 0,
    previousReading: 0,
    installationDate: '',
    meterType: 'Digital',
    voltage: 230,
    maxCapacity: 100,
    status: 'Active',
    notes: ''
  });
  const [readingData, setReadingData] = useState({
    reading_date: new Date().toISOString().split('T')[0],
    reading_value: 0,
    notes: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchMeters();
    fetchFacilities();
    fetchStats();
    fetchConsumptionStats();
  }, []);

  // Fetch consumption stats when date range changes
  useEffect(() => {
    fetchConsumptionStats();
  }, [dateRange]);

  // Fetch meters from API
  const fetchMeters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterFacility) params.append('facility_id', filterFacility);

      const response = await fetch(`/api/electric-meters?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMeters(data.data);
      } else {
        toast.error(data.message || 'Fehler beim Laden der Stromzähler');
      }
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast.error('Fehler beim Laden der Stromzähler');
    } finally {
      setLoading(false);
    }
  };

  // Fetch facilities for dropdown
  const fetchFacilities = async () => {
    try {
      const response = await facilitiesAPI.getAll({ limit: 100 });
      
      if (response.data && response.data.data) {
        setFacilities(response.data.data);
        // Automatically select the first facility if available and no facility is currently selected
        if (response.data.data.length > 0 && !formData.facility_id) {
          setFormData(prev => ({ ...prev, facility_id: response.data.data[0].id.toString() }));
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      toast.error('Failed to load facilities');
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/electric-meters/stats/overview');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchConsumptionStats = async () => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await fetch(`/api/electric-meters/stats/consumption?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConsumptionStats(data);
      }
    } catch (error) {
      console.error('Error fetching consumption stats:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    fetchMeters();
  }, [searchTerm, filterStatus, filterFacility]);

  // Handle drag and drop reordering
  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    // Reorder meters locally
    const newMeters = Array.from(meters);
    const [reorderedMeter] = newMeters.splice(sourceIndex, 1);
    newMeters.splice(destinationIndex, 0, reorderedMeter);

    // Update local state immediately for better UX
    setMeters(newMeters);

    try {
      // Prepare order data for API
      const meterOrders = newMeters.map((meter, index) => ({
        id: meter.id,
        display_order: index + 1
      }));

      // Send to API
      const response = await fetch('/api/electric-meters/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ meterOrders })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Meter order updated successfully!');
        // Refetch meters to ensure consistency with database
        fetchMeters();
      } else {
        throw new Error(result.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating meter order:', error);
      toast.error('Failed to save new order. Please try again.');
      // Revert to original order on error
      fetchMeters();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingMeter 
        ? `/api/electric-meters/${editingMeter.id}`
        : '/api/electric-meters';
      
      const method = editingMeter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        resetForm();
        fetchMeters();
        fetchStats();
      } else {
        toast.error(data.message || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error saving meter:', error);
      toast.error('Fehler beim Speichern des Stromzählers');
    }
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/electric-meters/${selectedMeter.id}/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Zählerstand erfolgreich hinzugefügt! Verbrauch: ${result.consumption.toFixed(2)} kWh`);
        fetchMeters();
        fetchStats();
        fetchConsumptionStats();
        setShowReadingForm(false);
        setSelectedMeter(null);
        setReadingData({
          reading_date: new Date().toISOString().split('T')[0],
          reading_value: 0,
          notes: ''
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Fehler beim Hinzufügen des Zählerstands');
      }
    } catch (error) {
      console.error('Error submitting reading:', error);
      toast.error('Verbindungsfehler beim Speichern des Zählerstands');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Stromzähler löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`/api/electric-meters/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchMeters();
        fetchStats();
      } else {
        toast.error(data.message || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Error deleting meter:', error);
      toast.error('Fehler beim Löschen des Stromzählers');
    }
  };

  // Handle edit
  const handleEdit = (meter) => {
    setEditingMeter(meter);
    setFormData({
      name: meter.name,
      number: meter.number,
      location: meter.location || '',
      facility_id: meter.facility_id || '',
      currentReading: meter.currentReading,
      previousReading: meter.previousReading,
      installationDate: meter.installationDate || '',
      meterType: meter.meterType,
      voltage: meter.voltage,
      maxCapacity: meter.maxCapacity,
      status: meter.status,
      notes: meter.notes || ''
    });
    setShowModal(true);
  };

  // Update meter reading
  const handleUpdateReading = async (id, newReading) => {
    const reading = prompt('Neuer Zählerstand:', newReading);
    if (!reading || isNaN(reading) || parseFloat(reading) < 0) {
      return;
    }

    try {
      const response = await fetch(`/api/electric-meters/${id}/reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentReading: parseFloat(reading) }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchMeters();
        fetchStats();
      } else {
        toast.error(data.message || 'Fehler beim Aktualisieren');
      }
    } catch (error) {
      console.error('Error updating reading:', error);
      toast.error('Fehler beim Aktualisieren des Zählerstands');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      number: '',
      location: '',
      facility_id: '',
      currentReading: 0,
      previousReading: 0,
      installationDate: '',
      lastReadingDate: '',
      meterType: 'Digital',
      voltage: 230,
      maxCapacity: 100,
      status: 'Active',
      notes: ''
    });
    setEditingMeter(null);
    setShowModal(false);
  };

  const openReadingForm = (meter) => {
    setSelectedMeter(meter);
    setReadingData({
      reading_date: new Date().toISOString().split('T')[0],
      reading_value: meter.currentReading || 0,
      notes: ''
    });
    setShowReadingForm(true);
  };

  // Chart configurations
  const consumptionChartData = {
    labels: consumptionStats.meterConsumption?.map(meter => meter.name) || [],
    datasets: [
      {
        label: 'Total Consumption (kWh)',
        data: consumptionStats.meterConsumption?.map(meter => meter.total_consumption || 0) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const dailyTrendChartData = {
    labels: consumptionStats.dailyTrend?.map(day => day.reading_date) || [],
    datasets: [
      {
        label: 'Daily Consumption (kWh)',
        data: consumptionStats.dailyTrend?.map(day => day.daily_total || 0) || [],
        fill: false,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Electricity Consumption Analysis',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Export data
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Nummer', 'Standort', 'Anlage', 'Aktueller Stand', 'Vorheriger Stand', 'Verbrauch', 'Status', 'Typ', 'Spannung', 'Max. Kapazität'],
      ...meters.map(meter => [
        meter.name,
        meter.number,
        meter.location || '',
        meter.facility_name || '',
        meter.currentReading,
        meter.previousReading,
        meter.consumptionFormatted,
        meter.status,
        meter.meterType,
        meter.voltage,
        meter.maxCapacity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stromzaehler_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Daten erfolgreich exportiert');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Standby': return 'text-yellow-600 bg-yellow-100';
      case 'Maintenance': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <FaCheckCircle />;
      case 'Standby': return <FaPause />;
      case 'Maintenance': return <FaExclamationTriangle />;
      default: return <FaCheckCircle />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <FaBolt className="text-yellow-500" />
                Electric Meter Management
              </h1>
              <p className="text-gray-600">Manage all electric meters and their consumption</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowGraphs(!showGraphs)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaChartBar />
                {showGraphs ? 'Hide Charts' : 'Consumption Charts'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaDownload />
                Export
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                <FaPlus />
                New Meter
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Meters</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMeters || 0}</p>
              </div>
              <FaBolt className="text-3xl text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Meters</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeMeters || 0}</p>
              </div>
              <FaCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Consumption</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalConsumption || 0} kWh</p>
              </div>
              <FaChartLine className="text-3xl text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Consumption</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgConsumption || 0} kWh</p>
              </div>
              <FaBuilding className="text-3xl text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {showGraphs && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaChartLine className="text-blue-500" />
                Consumption Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Consumption per Meter</h4>
                <Bar data={consumptionChartData} options={chartOptions} />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Daily Consumption Trend</h4>
                <Line data={dailyTrendChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Standby">Standby</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            
            <select
              value={filterFacility}
              onChange={(e) => setFilterFacility(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Facilities</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterFacility('');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaFilter />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Meters Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="min-w-full">
                  {/* Header */}
                  <div className="bg-gray-50 grid grid-cols-7 gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <div>Drag</div>
                    <div>Meter</div>
                    <div>Facility</div>
                    <div>Reading</div>
                    <div>Consumption</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  
                  <Droppable droppableId="meters-table">
                    {(provided) => (
                      <div 
                        className="bg-white divide-y divide-gray-200"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {meters.map((meter, index) => (
                          <Draggable key={meter.id} draggableId={meter.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`hover:bg-gray-50 grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-200 items-center ${
                                  snapshot.isDragging ? 'bg-blue-50 shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-center justify-center">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                    title="Drag to reorder"
                                  >
                                    <FaGripVertical />
                                  </div>
                                </div>
                      <div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{meter.name}</div>
                          <div className="text-sm text-gray-500">Nr: {meter.number}</div>
                          <div className="text-sm text-gray-500">{meter.location}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">{meter.facility_name || 'Keine Anlage'}</div>
                        <div className="text-sm text-gray-500">{meter.meterType} • {meter.voltage}V</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {meter.currentReading.toLocaleString()} kWh
                        </div>
                        <div className="text-sm text-gray-500">
                          Vorher: {meter.previousReading.toLocaleString()} kWh
                        </div>
                        <button
                          onClick={() => handleUpdateReading(meter.id, meter.currentReading)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Stand aktualisieren
                        </button>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {meter.consumptionFormatted} kWh
                        </div>
                        <div className="text-xs text-gray-500">
                          {meter.lastReadingDate ? `Letzte Ablesung: ${meter.lastReadingDate}` : 'Keine Ablesung'}
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(meter.status)}`}>
                          {getStatusIcon(meter.status)}
                          {meter.status}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openReadingForm(meter)}
                            className="text-green-600 hover:text-green-900 p-1 rounded" 
                            title="Add Reading"
                          >
                            <FaCalendarAlt />
                          </button>
                          <button
                            onClick={() => handleEdit(meter)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(meter.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </DragDropContext>
            )}
          </div>
          
          {!loading && meters.length === 0 && (
            <div className="text-center py-12">
              <FaBolt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Electric Meters Found</h3>
              <p className="text-gray-500">Create your first electric meter.</p>
            </div>
          )}
        </div>

        {/* Reading Form Modal */}
        {showReadingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Add Meter Reading
                </h2>
                
                {selectedMeter && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800">{selectedMeter.name}</h3>
                    <p className="text-sm text-gray-600">Nr: {selectedMeter.number}</p>
                    <p className="text-sm text-gray-600">Current Reading: {selectedMeter.currentReading} kWh</p>
                  </div>
                )}
                
                <form onSubmit={handleReadingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reading Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={readingData.reading_date}
                      onChange={(e) => setReadingData({...readingData, reading_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meter Reading (kWh) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={readingData.reading_value}
                      onChange={(e) => setReadingData({...readingData, reading_value: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="3"
                      value={readingData.notes}
                      onChange={(e) => setReadingData({...readingData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional notes for the reading..."
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowReadingForm(false);
                        setSelectedMeter(null);
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Reading
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {editingMeter ? 'Edit Electric Meter' : 'New Electric Meter'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meter Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.number}
                        onChange={(e) => setFormData({...formData, number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facility
                      </label>
                      <select
                        value={formData.facility_id}
                        onChange={(e) => setFormData({...formData, facility_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">No Facility</option>
                        {facilities.map(facility => (
                          <option key={facility.id} value={facility.id}>
                            {facility.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Reading (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.currentReading}
                        onChange={(e) => setFormData({...formData, currentReading: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Previous Reading (kWh)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.previousReading}
                        onChange={(e) => setFormData({...formData, previousReading: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Installation Date
                      </label>
                      <input
                        type="date"
                        value={formData.installationDate}
                        onChange={(e) => setFormData({...formData, installationDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meter Type
                      </label>
                      <select
                        value={formData.meterType}
                        onChange={(e) => setFormData({...formData, meterType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Digital">Digital</option>
                        <option value="Analog">Analog</option>
                        <option value="Smart">Smart Meter</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Voltage (V)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.voltage}
                        onChange={(e) => setFormData({...formData, voltage: parseInt(e.target.value) || 230})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max. Capacity (A)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxCapacity}
                        onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 100})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Active">Active</option>
                        <option value="Standby">Standby</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingMeter ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectricalMeter;
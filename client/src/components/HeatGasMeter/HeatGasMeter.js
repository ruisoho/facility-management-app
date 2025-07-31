import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaDownload, 
  FaSearch, 
  FaFilter,
  FaFire,
  FaBuilding,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPause,
  FaCalendarAlt,
  FaChartBar,
  FaArrowUp,
  FaArrowDown,
  FaThermometerHalf,
  FaTimes
} from 'react-icons/fa';
import { Flame } from 'lucide-react';
import { toast } from 'react-toastify';
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

const HeatGasMeter = () => {
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
  const [filterMeterType, setFilterMeterType] = useState('');
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
    meter_type: 'heat',
    unit: 'MWh',
    currentReading: 0,
    previousReading: 0,
    installationDate: '',
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
  }, []);

  // Fetch meters from API
  const fetchMeters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);
      if (filterFacility) params.append('facility_id', filterFacility);
      if (filterMeterType) params.append('meter_type', filterMeterType);

      const response = await fetch(`http://localhost:5000/api/heat-gas-meters?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setMeters(data.data);
      } else {
        toast.error(data.message || 'Fehler beim Laden der Wärme-/Gaszähler');
      }
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast.error('Fehler beim Laden der Wärme-/Gaszähler');
    } finally {
      setLoading(false);
    }
  };

  // Fetch facilities for dropdown
  const fetchFacilities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/facilities');
      const data = await response.json();
      
      if (data.success) {
        setFacilities(data.data);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/heat-gas-meters/stats/overview');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch consumption stats when date range changes
  useEffect(() => {
    fetchConsumptionStats();
  }, [dateRange]);

  const fetchConsumptionStats = async () => {
    try {
      const params = new URLSearchParams(dateRange);
      const response = await fetch(`http://localhost:5000/api/heat-gas-meters/stats/consumption?${params}`);
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
  }, [searchTerm, filterStatus, filterFacility, filterMeterType]);

  // Add reordering functions
  const moveUp = (index) => {
    if (index > 0) {
      const newMeters = [...meters];
      [newMeters[index], newMeters[index - 1]] = [newMeters[index - 1], newMeters[index]];
      setMeters(newMeters);
      toast.success('Zähler nach oben verschoben');
    }
  };

  const moveDown = (index) => {
    if (index < meters.length - 1) {
      const newMeters = [...meters];
      [newMeters[index], newMeters[index + 1]] = [newMeters[index + 1], newMeters[index]];
      setMeters(newMeters);
      toast.success('Zähler nach unten verschoben');
    }
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`http://localhost:5000/api/heat-gas-meters/${selectedMeter.id}/readings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(readingData),
      });

      if (response.ok) {
        const result = await response.json();
        const unit = selectedMeter.meter_type === 'gas' ? 'm³' : 'MWh';
        toast.success(`Zählerstand erfolgreich hinzugefügt! Verbrauch: ${result.consumption.toFixed(2)} ${unit}`);
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingMeter 
        ? `http://localhost:5000/api/heat-gas-meters/${editingMeter.id}`
        : 'http://localhost:5000/api/heat-gas-meters';
      
      const method = editingMeter ? 'PUT' : 'POST';
      
      // Set unit based on meter type
      const submitData = {
        ...formData,
        unit: formData.meter_type === 'gas' ? 'm³' : 'MWh'
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        setEditingMeter(null);
        resetForm();
        fetchMeters();
        fetchStats();
        fetchConsumptionStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error saving meter:', error);
      toast.error('Fehler beim Speichern des Zählers');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Zähler löschen möchten?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/heat-gas-meters/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success(data.message);
          fetchMeters();
          fetchStats();
          fetchConsumptionStats();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        console.error('Error deleting meter:', error);
        toast.error('Fehler beim Löschen des Zählers');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      number: '',
      location: '',
      facility_id: '',
      meter_type: 'heat',
      unit: 'MWh',
      currentReading: 0,
      previousReading: 0,
      installationDate: '',
      status: 'Active',
      notes: ''
    });
  };

  // Handle edit
  const handleEdit = (meter) => {
    setEditingMeter(meter);
    setFormData({
      name: meter.name,
      number: meter.number,
      location: meter.location,
      facility_id: meter.facility_id || '',
      meter_type: meter.meter_type,
      unit: meter.unit,
      currentReading: meter.currentReading,
      previousReading: meter.previousReading,
      installationDate: meter.installationDate || '',
      status: meter.status,
      notes: meter.notes || ''
    });
    setShowModal(true);
  };

  // Handle add new
  const handleAddNew = () => {
    setEditingMeter(null);
    resetForm();
    setShowModal(true);
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
        label: 'Gesamtverbrauch',
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
        label: 'Täglicher Verbrauch',
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
        text: 'Wärme-/Gasverbrauch Analyse',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get meter type icon and color
  const getMeterTypeIcon = (meterType) => {
    switch (meterType) {
      case 'heat':
        return { icon: FaFire, color: 'text-orange-600' };
      case 'gas':
        return { icon: Flame, color: 'text-blue-600' };
      default:
        return { icon: FaThermometerHalf, color: 'text-gray-600' };
    }
  };

  // Export data
  const exportData = () => {
    const csvContent = [
      ['Name', 'Zählernummer', 'Typ', 'Standort', 'Aktueller Stand', 'Vorheriger Stand', 'Verbrauch', 'Einheit', 'Status'],
      ...meters.map(meter => [
        meter.name,
        meter.number,
        meter.meter_type === 'heat' ? 'Wärme' : 'Gas',
        meter.location,
        meter.currentReading,
        meter.previousReading,
        meter.consumption,
        meter.unit,
        meter.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waerme-gas-zaehler.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaThermometerHalf className="text-orange-600" />
              Wärme- & Gaszähler
            </h1>
            <p className="text-gray-600 mt-2">Verwaltung von Wärme- und Gaszählern</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGraphs(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <FaChartLine /> Verbrauchsanalyse
            </button>
            <button
              onClick={exportData}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <FaDownload /> Export
            </button>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <FaPlus /> Neuer Zähler
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Zähler</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMeters || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaThermometerHalf className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Zähler</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeMeters || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaCheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Wärmezähler</p>
              <p className="text-2xl font-bold text-orange-600">{stats.heatMeters || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FaFire className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gaszähler</p>
              <p className="text-2xl font-bold text-blue-600">{stats.gasMeters || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Flame className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaSearch className="inline mr-2" />
              Suchen
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, Nummer oder Standort..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaFilter className="inline mr-2" />
              Zählertyp
            </label>
            <select
              value={filterMeterType}
              onChange={(e) => setFilterMeterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Alle Typen</option>
              <option value="heat">Wärme</option>
              <option value="gas">Gas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaBuilding className="inline mr-2" />
              Anlage
            </label>
            <select
              value={filterFacility}
              onChange={(e) => setFilterFacility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Alle Anlagen</option>
              {facilities.map(facility => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Alle Status</option>
              <option value="Active">Aktiv</option>
              <option value="Inactive">Inaktiv</option>
              <option value="Maintenance">Wartung</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zähler
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anlage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zählerstand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verbrauch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reihenfolge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {meters.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Keine Zähler gefunden</p>
                    <p className="text-sm">Fügen Sie einen neuen Zähler hinzu oder ändern Sie die Filter.</p>
                  </td>
                </tr>
              ) : (
                meters.map((meter, index) => {
                  const { icon: TypeIcon, color } = getMeterTypeIcon(meter.meter_type);
                  return (
                    <tr key={meter.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ${color}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{meter.name}</div>
                            <div className="text-sm text-gray-500">#{meter.number}</div>
                            <div className="text-sm text-gray-500">{meter.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <TypeIcon className={`h-4 w-4 mr-2 ${color}`} />
                          <span className="text-sm text-gray-900">
                            {meter.meter_type === 'heat' ? 'Wärme' : 'Gas'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{meter.facility_name || 'Nicht zugeordnet'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>Aktuell: {meter.currentReading.toLocaleString()} {meter.unit}</div>
                          <div className="text-gray-500">Vorher: {meter.previousReading.toLocaleString()} {meter.unit}</div>
                        </div>
                        <button
                          onClick={() => openReadingForm(meter)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Stand hinzufügen
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{meter.consumption.toLocaleString()} {meter.unit}</div>
                          {meter.conversionNote && (
                            <div className="text-xs text-blue-600 mt-1">
                              {meter.conversionNote}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(meter.status)}`}>
                          {meter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            className={`p-2 rounded-lg transition-colors ${
                              index === 0 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Nach oben verschieben"
                          >
                            <FaArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === meters.length - 1}
                            className={`p-2 rounded-lg transition-colors ${
                              index === meters.length - 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Nach unten verschieben"
                          >
                            <FaArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(meter)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Bearbeiten"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(meter.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Löschen"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit Meter */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMeter ? 'Zähler bearbeiten' : 'Neuer Zähler'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zählernummer *
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zählertyp *
                  </label>
                  <select
                    value={formData.meter_type}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      meter_type: e.target.value,
                      unit: e.target.value === 'gas' ? 'm³' : 'MWh'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="heat">Wärme (MWh)</option>
                    <option value="gas">Gas (m³)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standort
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anlage
                  </label>
                  <select
                    value={formData.facility_id}
                    onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Keine Anlage zugeordnet</option>
                    {facilities.map(facility => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Aktiv</option>
                    <option value="Inactive">Inaktiv</option>
                    <option value="Maintenance">Wartung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aktueller Zählerstand ({formData.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentReading}
                    onChange={(e) => setFormData({ ...formData, currentReading: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorheriger Zählerstand ({formData.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.previousReading}
                    onChange={(e) => setFormData({ ...formData, previousReading: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Installationsdatum
                  </label>
                  <input
                    type="date"
                    value={formData.installationDate}
                    onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMeter(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingMeter ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reading Form Modal */}
      {showReadingForm && selectedMeter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Zählerstand hinzufügen
              </h2>
              
              {selectedMeter && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800">{selectedMeter.name}</h3>
                  <p className="text-sm text-gray-600">Nr: {selectedMeter.number}</p>
                  <p className="text-sm text-gray-600">Aktueller Stand: {selectedMeter.currentReading} {selectedMeter.unit}</p>
                </div>
              )}
              
              <form onSubmit={handleReadingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ablesedatum *
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
                    Zählerstand ({selectedMeter.unit}) *
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
                    Notizen
                  </label>
                  <textarea
                    value={readingData.notes}
                    onChange={(e) => setReadingData({...readingData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optionale Notizen zur Ablesung..."
                    rows="3"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReadingForm(false);
                      setSelectedMeter(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Hinzufügen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Graphs Section */}
      {showGraphs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Verbrauchsanalyse</h2>
                <button
                   onClick={() => setShowGraphs(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <FaTimes className="h-6 w-6" />
                 </button>
              </div>
              
              <div className="mt-4 flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Von
                  </label>
                  <input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Gesamtverbrauch pro Zähler</h3>
                  <div className="h-80">
                    <Bar data={consumptionChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Täglicher Verbrauchstrend</h3>
                  <div className="h-80">
                    <Line data={dailyTrendChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatGasMeter;
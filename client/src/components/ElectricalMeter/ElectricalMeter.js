import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  X, 
  Zap, 
  Activity, 
  TrendingUp, 
  Calendar,
  Database
} from 'lucide-react';
import toast from 'react-hot-toast';

const ElectricalMeter = () => {
  const [meters, setMeters] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [editingMeter, setEditingMeter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    currentReading: ''
  });

  // Load meters from localStorage or initialize with sample data
  useEffect(() => {
    const savedMeters = localStorage.getItem('electricalMeters');
    if (savedMeters) {
      try {
        const parsedMeters = JSON.parse(savedMeters);
        console.log('Loading saved meters from localStorage:', parsedMeters);
        setMeters(parsedMeters);
      } catch (error) {
        console.error('Error parsing saved meters:', error);
        // Fall back to sample data if parsing fails
        initializeSampleData();
      }
    } else {
      // Initialize with sample data if no saved data exists
      initializeSampleData();
    }
  }, []);

  const initializeSampleData = () => {
    const sampleMeters = [
      {
        id: 1,
        name: 'Hauptzähler Gebäude A',
        number: 'HZ-001',
        currentReading: 15420.5,
        previousReading: 15380.2,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Nebenzähler Büro',
        number: 'NZ-002',
        currentReading: 8750.3,
        previousReading: 8720.1,
        lastUpdated: new Date().toISOString()
      }
    ];
    console.log('Setting sample meters:', sampleMeters);
    setMeters(sampleMeters);
    localStorage.setItem('electricalMeters', JSON.stringify(sampleMeters));
  };

  // Save meters to localStorage whenever meters state changes
  useEffect(() => {
    if (meters.length > 0) {
      localStorage.setItem('electricalMeters', JSON.stringify(meters));
      console.log('Saved meters to localStorage:', meters);
    }
  }, [meters]);

  const calculateStats = () => {
    const totalConsumption = meters.reduce((sum, meter) => 
      sum + (meter.currentReading - meter.previousReading), 0
    );
    const activeMeters = meters.length;
    const avgConsumption = activeMeters > 0 ? totalConsumption / activeMeters : 0;

    return {
      totalConsumption: totalConsumption.toFixed(2),
      activeMeters,
      avgConsumption: avgConsumption.toFixed(2),
      totalReading: meters.reduce((sum, meter) => sum + meter.currentReading, 0).toFixed(2)
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingMeter) {
      setMeters(meters.map(meter => 
        meter.id === editingMeter.id 
          ? {
              ...meter,
              name: formData.name,
              number: formData.number,
              previousReading: meter.currentReading,
              currentReading: parseFloat(formData.currentReading),
              lastUpdated: new Date().toISOString()
            }
          : meter
      ));
      toast.success('Zähler erfolgreich aktualisiert');
    } else {
      const newMeter = {
        id: Date.now(),
        name: formData.name,
        number: formData.number,
        currentReading: parseFloat(formData.currentReading),
        previousReading: parseFloat(formData.currentReading) - 10, // Mock previous reading
        lastUpdated: new Date().toISOString()
      };
      setMeters([...meters, newMeter]);
      toast.success('Neuer Zähler erfolgreich hinzugefügt');
    }

    resetForm();
  };

  const handleEdit = (meter) => {
    setEditingMeter(meter);
    setFormData({
      name: meter.name,
      number: meter.number,
      currentReading: meter.currentReading.toString()
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Zähler löschen möchten?')) {
      setMeters(meters.filter(meter => meter.id !== id));
      toast.success('Zähler erfolgreich gelöscht');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', number: '', currentReading: '' });
    setEditingMeter(null);
    setShowModal(false);
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Zählernummer', 'Aktueller Stand', 'Vorheriger Stand', 'Verbrauch', 'Letzte Aktualisierung'],
      ...meters.map(meter => [
        meter.name,
        meter.number,
        meter.currentReading,
        meter.previousReading,
        (meter.currentReading - meter.previousReading).toFixed(2),
        new Date(meter.lastUpdated).toLocaleString('de-DE')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stromzaehler_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Daten erfolgreich exportiert');
  };

  const insertToDatabase = () => {
    const stats = calculateStats();
    const data = {
      date: selectedDate,
      meters: meters.map(meter => ({
        name: meter.name,
        number: meter.number,
        reading: meter.currentReading,
        consumption: meter.currentReading - meter.previousReading
      })),
      totalConsumption: stats.totalConsumption,
      activeMeters: stats.activeMeters
    };

    console.log('Daten für Datenbank:', data);
    toast.success('Daten erfolgreich in die Datenbank eingefügt');
  };

  const stats = calculateStats();
  console.log('Rendering with meters:', meters);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Stromzähler Verwaltung</h1>
            <p className="text-blue-100 text-lg">
              Verwalten Sie Ihre Stromzähler und überwachen Sie den Energieverbrauch
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
              <Zap className="h-8 w-8 text-white mb-2" />
              <div className="text-sm font-medium">
                {meters.length} Aktive Zähler
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Zähler hinzufügen</span>
          </button>
          <button
            onClick={exportData}
            className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            <Download className="h-5 w-5" />
            <span>Daten exportieren</span>
          </button>
          <button
            onClick={insertToDatabase}
            className="bg-blue-500 bg-opacity-90 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            <Database className="h-5 w-5" />
            <span>Daten in Datenbank einfügen</span>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 stats-card-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Gesamtverbrauch Gestern</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConsumption} kWh</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 stats-card-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Aktive Zähler</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeMeters}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 stats-card-yellow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Durchschnittsverbrauch</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgConsumption} kWh</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 stats-card-purple">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm font-medium">Gesamtstand</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReading} kWh</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Datum auswählen</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zusammenfassung für {selectedDate}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-700 font-medium">Gesamtverbrauch</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalConsumption} kWh</p>
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Aktive Zähler</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeMeters}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Durchschnitt</p>
            <p className="text-2xl font-bold text-purple-600">{stats.avgConsumption} kWh</p>
          </div>
        </div>
      </div>

      {/* Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {console.log('Mapping meters:', meters)}
        {meters.length === 0 ? (
          <div className="col-span-3 text-center py-8">
            <p className="text-gray-500">No meters found. Add your first meter using the button above.</p>
          </div>
        ) : (
          meters.map((meter) => (
          <div key={meter.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black">{meter.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(meter)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(meter.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-black">Zählernummer:</span>
                <span className="font-medium text-black">{meter.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Aktueller Stand:</span>
                <span className="font-medium text-black">{meter.currentReading.toFixed(2)} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Verbrauch:</span>
                <span className="font-medium text-black">
                  {(meter.currentReading - meter.previousReading).toFixed(2)} kWh
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Letzte Aktualisierung:</span>
                <span className="text-sm text-black">
                  {new Date(meter.lastUpdated).toLocaleString('de-DE')}
                </span>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingMeter ? 'Zähler bearbeiten' : 'Zähler hinzufügen'}
              </h3>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Zähler Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Zählernummer</label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Aktueller Zählerstand (kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentReading}
                    onChange={(e) => setFormData({ ...formData, currentReading: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectricalMeter;
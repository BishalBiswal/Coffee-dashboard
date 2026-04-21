import { useState, useEffect } from 'react';
import { weatherAPI } from '../lib/api';
import { CloudRain, Thermometer, Droplets, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Weather() {
  const [records, setRecords] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthRecords, setMonthRecords] = useState([]);
  const [formData, setFormData] = useState({ date: '', rainfall_mm: '', temperature_max: '', temperature_min: '', humidity: '', notes: '' });

  const [year, setYear] = useState(new Date().getFullYear());
  const availableYears = Array.from({ length: 20 }, (_, i) => year - i);
  const minYear = 2015;
  const maxYear = new Date().getFullYear();

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    try {
      const res = await weatherAPI.yearly(year);
      setMonthlyData(res.data.monthly_data);
      
      const listRes = await weatherAPI.list({ date_from: `${year}-01-01`, date_to: `${year}-12-31` });
      const data = listRes.data.results || listRes.data;
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load weather data:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthRecords = async (month) => {
    try {
      const res = await weatherAPI.monthly(year, month);
      setMonthRecords(res.data.records || []);
    } catch (error) {
      console.error('Failed to load month records:', error);
      setMonthRecords([]);
    }
  };

  const handleMonthClick = (monthIndex) => {
    setSelectedMonth(monthIndex + 1);
    loadMonthRecords(monthIndex + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await weatherAPI.create(formData);
      setShowForm(false);
      setFormData({ date: '', rainfall_mm: '', temperature_max: '', temperature_min: '', humidity: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Weather & Rainfall</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : 'Add Record'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input type="date" max={new Date().toISOString().split('T')[0]} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="input" required />
              <input type="number" step="0.1" placeholder="Rainfall (mm)" value={formData.rainfall_mm} onChange={(e) => setFormData({...formData, rainfall_mm: e.target.value})} className="input" />
              <input type="number" step="0.1" placeholder="Max Temp" value={formData.temperature_max} onChange={(e) => setFormData({...formData, temperature_max: e.target.value})} className="input" />
              <input type="number" step="0.1" placeholder="Min Temp" value={formData.temperature_min} onChange={(e) => setFormData({...formData, temperature_min: e.target.value})} className="input" />
              <input type="number" placeholder="Humidity %" value={formData.humidity} onChange={(e) => setFormData({...formData, humidity: e.target.value})} className="input" />
              <input type="text" placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input" />
            </div>
            <button type="submit" className="btn btn-primary">Save Record</button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setYear(year - 1)} disabled={year <= minYear} className="btn btn-secondary"><ChevronLeft className="w-4 h-4" /></button>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input w-32">
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => setYear(year + 1)} disabled={year >= maxYear} className="btn btn-secondary"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {monthlyData && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Monthly Rainfall</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {monthlyData.map((m, i) => (
              <button
                key={i}
                onClick={() => handleMonthClick(i)}
                className={`p-3 rounded-lg text-left hover:ring-2 hover:ring-primary-500 transition-all ${m.total_rainfall > 0 ? 'bg-blue-100' : 'bg-gray-50'}`}
              >
                <p className="font-medium text-gray-900">{months[i]}</p>
                <p className="text-2xl font-bold text-blue-600">{m.total_rainfall.toFixed(1)} mm</p>
                <p className="text-sm text-gray-500">{m.rainy_days} rainy days</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMonth && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{months[selectedMonth - 1]} {year} - Daily Rainfall</h2>
            <button onClick={() => setSelectedMonth(null)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Rainfall</th>
                  <th className="text-left p-2">Temp</th>
                  <th className="text-left p-2">Humidity</th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {monthRecords.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2 font-medium text-blue-600">{r.rainfall_mm > 0 ? `${r.rainfall_mm} mm` : '-'}</td>
                    <td className="p-2">{r.temperature_max && `${r.temperature_max}/${r.temperature_min}`}</td>
                    <td className="p-2">{r.humidity || '-'}</td>
                    <td className="p-2">{r.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Rainfall</th>
                <th className="text-left p-2">Temp</th>
                <th className="text-left p-2">Humidity</th>
                <th className="text-left p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 30).map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.date}</td>
                  <td className="p-2">{r.rainfall_mm} mm</td>
                  <td className="p-2">{r.temperature_max && `${r.temperature_max}/${r.temperature_min}`}</td>
                  <td className="p-2">{r.humidity || '-'}%</td>
                  <td className="p-2">{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
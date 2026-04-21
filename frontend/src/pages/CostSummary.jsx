import { useState, useEffect } from 'react';
import { analyticsAPI } from '../lib/api';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CostSummary() {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadData();
  }, [period, selectedYear]);

  const loadData = async () => {
    try {
      const today = new Date();
      let dateFrom;
      
      if (period === 'daily') {
        dateFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === 'weekly') {
        dateFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (period === 'monthly') {
        dateFrom = `${selectedYear}-01-01`;
        const dateTo = `${selectedYear}-12-31`;
        const res = await analyticsAPI.costSummary({ period: 'monthly', date_from: dateFrom, date_to: dateTo });
        setCostData(res.data || { data: [] });
        setLoading(false);
        return;
      } else {
        dateFrom = new Date(today.getFullYear() - 2, 0, 1).toISOString().split('T')[0];
      }
      
      const dateTo = `${selectedYear}-12-31`;
      const res = await analyticsAPI.costSummary({ period, date_from: dateFrom, date_to: dateTo });
      setCostData(res.data || { data: [] });
    } catch (error) {
      console.error('Failed to load cost data:', error);
      setCostData({ data: [] });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const chartData = costData?.data || [];
  const totalCost = chartData.reduce((a, b) => a + (b.total_cost || 0), 0);
  const totalLabour = chartData.reduce((a, b) => a + (b.total_labour || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cost Summary</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input w-32"
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold">₹{totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Labour Days</p>
              <p className="text-2xl font-bold">{totalLabour.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Periods</p>
              <p className="text-2xl font-bold">{chartData.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Cost Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week_start' : period === 'monthly' ? 'month' : 'year'}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="total_cost" stroke="#22c55e" strokeWidth={2} name="Cost (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Labour Days Over Time</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={period === 'daily' ? 'date' : period === 'weekly' ? 'week_start' : period === 'monthly' ? 'month' : 'year'}
                  tick={{ fontSize: 10 }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total_labour" fill="#3b82f6" name="Labour Days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Period Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Period</th>
                <th className="text-right p-2">Work Items</th>
                <th className="text-right p-2">Labour Days</th>
                <th className="text-right p-2">Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, i) => (
                <tr key={i} className="border-b">
                  <td className="p-2">
                    {period === 'daily' ? d.date : 
                     period === 'weekly' ? `${d.week_start} to ${d.week_end}` :
                     period === 'monthly' ? `${d.year}-${String(d.month).padStart(2, '0')}` :
                     d.year}
                  </td>
                  <td className="p-2 text-right">{d.work_items}</td>
                  <td className="p-2 text-right">{d.total_labour}</td>
                  <td className="p-2 text-right font-medium">₹{d.total_cost?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="p-2">Total</td>
                <td className="p-2 text-right">{chartData.reduce((a, b) => a + (b.work_items || 0), 0)}</td>
                <td className="p-2 text-right">{chartData.reduce((a, b) => a + (b.total_labour || 0), 0)}</td>
                <td className="p-2 text-right">₹{totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
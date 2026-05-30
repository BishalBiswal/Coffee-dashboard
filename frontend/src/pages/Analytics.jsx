import { useState, useEffect } from 'react';
import { analyticsAPI, exportAPI } from '../lib/api';
import { 
  BarChart3, Download, TrendingUp, Trees, Wheat
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays } from 'date-fns';

export default function Analytics() {
  const [trendData, setTrendData] = useState([]);
  const [blockData, setBlockData] = useState([]);
  const [cropData, setCropData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('90');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedYear]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      let dateFrom, dateTo;
      
      if (dateRange === 'year') {
        dateFrom = `${selectedYear}-01-01`;
        dateTo = `${selectedYear}-12-31`;
      } else {
        const days = parseInt(dateRange);
        dateFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');
        dateTo = format(new Date(), 'yyyy-MM-dd');
      }
      
      const [trendRes, blockRes, cropRes] = await Promise.all([
        analyticsAPI.trend({ date_from: dateFrom, date_to: dateTo, group_by: dateRange === 'year' ? 'month' : 'day' }),
        analyticsAPI.blockSummary({ date_from: dateFrom, date_to: dateTo }),
        analyticsAPI.cropSummary({ date_from: dateFrom, date_to: dateTo }),
      ]);
      
      setTrendData(trendRes.data.slice(-30));
      setBlockData(blockRes.data);
      setCropData(cropRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const days = parseInt(dateRange);
      const dateFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const dateTo = format(new Date(), 'yyyy-MM-MM');
      
      const response = await exportAPI.excel({ date_from: dateFrom, date_to: dateTo });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `work_logs_${dateFrom}_${dateTo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Detailed reports and trends</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-full sm:w-40"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="365">Last Year</option>
            <option value="year">Select Year</option>
          </select>
          {dateRange === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-full sm:w-32"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
          <button onClick={handleExport} className="btn btn-primary flex items-center gap-2 whitespace-nowrap">
            <Download className="w-4 h-4 shrink-0" /> Export Excel
          </button>
        </div>
      </div>

      {/* Labour Trend */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Labour Trend</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'dd MMMM yyyy')}
              />
              <Line type="monotone" dataKey="male_count" stroke="#3b82f6" name="Male" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="female_count" stroke="#ec4899" name="Female" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Work by Block */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Work by Block</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                <Tooltip />
                <Bar dataKey="work_items" fill="#22c55e" name="Work Items" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work by Crop */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Work by Crop</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropData}
                  dataKey="work_items"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {cropData.map((entry, index) => (
                    <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Block Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Block</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-right py-2">Labour Days</th>
                  <th className="text-right py-2">Avg/Item</th>
                </tr>
              </thead>
              <tbody>
                {blockData.map((block) => (
                  <tr key={block.id} className="border-b">
                    <td className="py-2">{block.name}</td>
                    <td className="text-right">{block.work_items}</td>
                    <td className="text-right">{block.total_labour_days}</td>
                    <td className="text-right">{block.average_labour_per_item?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Crop Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Crop</th>
                  <th className="text-right py-2">Items</th>
                  <th className="text-right py-2">Labour Days</th>
                  <th className="text-right py-2">Blocks</th>
                </tr>
              </thead>
              <tbody>
                {cropData.map((crop) => (
                  <tr key={crop.id} className="border-b">
                    <td className="py-2">{crop.name}</td>
                    <td className="text-right">{crop.work_items}</td>
                    <td className="text-right">{crop.total_labour_days}</td>
                    <td className="text-right">{crop.blocks_growing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

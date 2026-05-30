import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyticsAPI, workLogsAPI } from '../lib/api';
import { 
  BarChart3, Users, TrendingUp, DollarSign, 
  ClipboardList, Calendar, Home
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [blockData, setBlockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('90');
  const [cachedData, setCachedData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [dateRange]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const dateFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const dateTo = format(new Date(), 'yyyy-MM-dd');
      
      const [dashRes, trendRes, blockRes] = await Promise.all([
        analyticsAPI.dashboard(),
        analyticsAPI.trend({ date_from: dateFrom, date_to: dateTo, group_by: days > 365 ? 'week' : 'day' }),
        analyticsAPI.blockSummary({ date_from: dateFrom, date_to: dateTo }),
      ]);
      
      const data = {
        dashboard: dashRes.data,
        trend: trendRes.data,
        blocks: blockRes.data,
        dateRange,
        timestamp: Date.now()
      };
      
      setCachedData(data);
      setDashboardData(dashRes.data);
      
      const trend = trendRes.data || [];
      setTrendData(trend.length > 60 ? trend.slice(-60) : trend);
      setBlockData(blockRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      if (cachedData && cachedData.dateRange === dateRange) {
        setDashboardData(cachedData.dashboard);
        setTrendData(cachedData.trend.slice(-60));
        setBlockData(cachedData.blocks);
      }
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

  const stats = [
    { 
      label: "Today's Work Items", 
      value: dashboardData?.work_items_today || 0, 
      icon: ClipboardList,
      color: 'bg-blue-500'
    },
    { 
      label: 'Total Labour', 
      value: dashboardData?.total_labour_today || 0, 
      icon: Users,
      color: 'bg-green-500'
    },
    { 
      label: 'Men', 
      value: dashboardData?.male_count || 0, 
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    { 
      label: 'Women', 
      value: dashboardData?.female_count || 0, 
      icon: Users,
      color: 'bg-pink-500'
    },
    { 
      label: "Today's Cost (₹)", 
      value: `₹${(dashboardData?.cost_today_rs || 0).toLocaleString()}`, 
      icon: DollarSign,
      color: 'bg-amber-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
            <Home className="w-6 h-6 text-primary-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 truncate">{dashboardData?.date}</p>
          </div>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="180">Last 6 Months</option>
          <option value="365">Last Year</option>
          <option value="730">Last 2 Years</option>
          <option value="1825">Last 5 Years</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Chart - Full Width for Larger Timeline */}
        <div className="card col-span-full">
          <h2 className="text-lg font-semibold mb-4">Work Trend ({dateRange} days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={dateRange > 365 ? 'week' : 'date'} 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(trendData.length / 15)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                />
                <Line 
                  type="monotone" 
                  dataKey="work_items" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 2 }}
                  name="Work Items"
                />
                <Line 
                  type="monotone" 
                  dataKey="total_labour_hours" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 2 }}
                  name="Labour Hours"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block Summary */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Work by Block</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={blockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="work_items" fill="#22c55e" name="Work Items" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_labour_days" fill="#3b82f6" name="Labour Days" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/work-logs/new" className="card hover:border-primary-300 transition-colors cursor-pointer">
          <ClipboardList className="w-8 h-8 text-primary-600 mb-2" />
          <p className="font-medium">New Work Log</p>
          <p className="text-sm text-gray-500">Create daily entry</p>
        </Link>
        <Link to="/blocks" className="card hover:border-primary-300 transition-colors cursor-pointer">
          <BarChart3 className="w-8 h-8 text-primary-600 mb-2" />
          <p className="font-medium">View Blocks</p>
          <p className="text-sm text-gray-500">Farm overview</p>
        </Link>
        <Link to="/workers" className="card hover:border-primary-300 transition-colors cursor-pointer">
          <Users className="w-8 h-8 text-primary-600 mb-2" />
          <p className="font-medium">Manage Workers</p>
          <p className="text-sm text-gray-500">Worker directory</p>
        </Link>
        <Link to="/analytics" className="card hover:border-primary-300 transition-colors cursor-pointer">
          <TrendingUp className="w-8 h-8 text-primary-600 mb-2" />
          <p className="font-medium">Analytics</p>
          <p className="text-sm text-gray-500">Detailed reports</p>
        </Link>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workLogsAPI } from '../lib/api';
import { format } from 'date-fns';
import { ClipboardList, Calendar, MapPin, Wheat, Clock, Plus } from 'lucide-react';

export default function MyLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, this_week: 0, pending: 0 });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await workLogsAPI.list();
      const allLogs = response.data.results || response.data;
      setLogs(allLogs.slice(0, 20));
      
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      setStats({
        total: allLogs.length,
        this_week: allLogs.filter(l => new Date(l.log_date) >= weekAgo).length,
        pending: allLogs.filter(l => l.status === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'synced': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">My Work Logs</h2>
        <button
          onClick={() => navigate('/work-logs/new')}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-primary-600">{stats.this_week}</p>
          <p className="text-xs text-gray-500">This Week</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No work logs yet</p>
          <button
            onClick={() => navigate('/work-logs/new')}
            className="mt-2 text-primary-600 text-sm"
          >
            Add your first work log
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={() => navigate(`/work-logs/${log.id}/edit`)}
              className="bg-white p-4 rounded-lg border border-gray-200 touch-manipulation"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">{log.work_type_name || log.work_type?.name || 'Work'}</p>
                  <p className="text-sm text-gray-500">{log.block_name || log.block?.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(log.status)}`}>
                  {log.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(log.log_date), 'dd MMM')}
                </span>
                <span className="flex items-center gap-1">
                  <Wheat className="w-3 h-3" />
                  {log.crop?.name || '-'}
                </span>
                <span>Men: {log.male_labour_count}</span>
                <span>Women: {log.female_labour_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
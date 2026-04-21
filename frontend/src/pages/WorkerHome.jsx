import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workLogsAPI } from '../lib/api';
import { format } from 'date-fns';
import { ClipboardList, Plus, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkerHome() {
  const navigate = useNavigate();
  const [todayLog, setTodayLog] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await workLogsAPI.list();
      const allLogs = response.data.results || response.data;
      
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = allLogs.find(l => l.log_date === today);
      setTodayLog(todayEntry);
      
      setRecentLogs(allLogs.slice(0, 5));
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-600 text-white p-4 rounded-lg">
        <p className="text-sm opacity-80">Today</p>
        <p className="text-2xl font-bold">{format(new Date(), 'dd MMM yyyy')}</p>
      </div>

      {todayLog ? (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-gray-900">Work Logged Today</span>
          </div>
          <p className="text-gray-600">{todayLog.work_type_name}</p>
          <p className="text-sm text-gray-500">{todayLog.block_name} • {todayLog.crop_name}</p>
          <div className="mt-2 text-sm text-gray-500">
            Men: {todayLog.male_labour_count} | Women: {todayLog.female_labour_count}
          </div>
          <button
            onClick={() => navigate(`/work-logs/${todayLog.id}/edit`)}
            className="mt-3 text-sm text-primary-600"
          >
            Edit Today's Log
          </button>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 mb-3">No work logged today</p>
          <button
            onClick={() => navigate('/work-logs/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Log Today's Work
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Recent Work</h3>
        <button onClick={() => navigate('/my-logs')} className="text-sm text-primary-600">
          View All
        </button>
      </div>

      <div className="space-y-2">
        {recentLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white p-3 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{log.work_type_name || log.work_type?.name}</p>
                <p className="text-xs text-gray-500">{log.block_name || log.block?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{format(new Date(log.log_date), 'dd MMM')}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  log.status === 'completed' ? 'bg-green-100 text-green-700' :
                  log.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  log.status === 'synced' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {log.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/work-logs/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
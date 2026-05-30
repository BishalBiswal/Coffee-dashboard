import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cropsAPI, exportAPI } from '../lib/api';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Filter, Download } from 'lucide-react';

export default function CropActivityHistory() {
  const { id } = useParams();
  const [crop, setCrop] = useState(null);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    loadHistory();
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    try {
      const cropRes = await cropsAPI.get(id);
      setCrop(cropRes.data);
    } catch (error) {
      console.error('Failed to load crop:', error);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const response = await cropsAPI.getActivityHistory(id, params);
      setLogs(response.data.logs || []);
      setSummary(response.data.summary || []);
    } catch (error) {
      console.error('Failed to load activity history:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalLabour = logs.reduce((sum, log) => sum + (log.male_labour_count || 0) + (log.female_labour_count || 0), 0);
  const totalHours = logs.reduce((sum, log) => sum + ((log.male_labour_count || 0) + (log.female_labour_count || 0)) * (log.hours_worked || 8), 0);

  const handleExport = async () => {
    try {
      const params = { crop: id };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const response = await exportAPI.excel(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${crop?.name}_activity_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/crops" className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{crop?.name}</h1>
            <p className="text-gray-500 truncate">{crop?.crop_type} • {crop?.scientific_name}</p>
          </div>
        </div>
        <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2 whitespace-nowrap shrink-0">
          <Download className="w-4 h-4 shrink-0" /> Export XLSX
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input flex-1 min-w-[140px] sm:min-w-0 sm:w-auto"
            placeholder="From"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input flex-1 min-w-[140px] sm:min-w-0 sm:w-auto"
            placeholder="To"
          />

          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-sm text-red-600 hover:underline shrink-0"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          <p className="text-sm text-gray-500">Total Activities</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-primary-600">{totalLabour}</p>
          <p className="text-sm text-gray-500">Total Labour</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-amber-600">{totalHours.toFixed(1)}</p>
          <p className="text-sm text-gray-500">Total Hours</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-2xl font-bold text-blue-600">{summary.length}</p>
          <p className="text-sm text-gray-500">Activity Types</p>
        </div>
      </div>

      {summary.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Activity Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summary.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedWorkType(item.work_type__id)}
                className="p-3 bg-gray-50 rounded-lg hover:bg-primary-50 text-left transition-colors"
              >
                <p className="font-medium text-gray-900">{item.work_type__name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-primary-600 font-semibold">{item.count}</span>
                  <span className="text-xs text-gray-500">activities</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Men: {item.total_male || 0} | Women: {item.total_female || 0}
                </p>
                {item.total_hours && (
                  <p className="text-xs text-gray-500">
                    <Clock className="w-3 h-3 inline" /> {Number(item.total_hours).toFixed(0)} hours
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Activity History</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activities found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{log.work_type_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        log.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        log.status === 'synced' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(log.log_date), 'dd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {log.block_name}
                      </span>
                      <span>Men: {log.male_labour_count} | Women: {log.female_labour_count}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {((log.male_labour_count + log.female_labour_count) * (log.hours_worked || 8)).toFixed(1)} hrs
                      </span>
                    </div>
                    {log.work_detail && (
                      <p className="mt-2 text-sm text-gray-600">{log.work_detail}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
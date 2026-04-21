import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workLogsAPI, blocksAPI, cropsAPI, seasonsAPI } from '../lib/api';
import { ClipboardList, Plus, Search, Calendar, Users, Edit2, Trash2, Download, X, Check, Filter, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [crops, setCrops] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, statusFilter, seasonFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (search) {
      const timer = setTimeout(() => {
        setPage(1);
        loadLogs(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const loadOptions = async () => {
    try {
      const [blocksRes, cropsRes, seasonsRes] = await Promise.all([
        blocksAPI.list(),
        cropsAPI.list(),
        seasonsAPI.list()
      ]);
      setBlocks(blocksRes.data.results || blocksRes.data);
      setCrops(cropsRes.data.results || cropsRes.data);
      setSeasons(seasonsRes.data.results || seasonsRes.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadLogs = async (pageNum = page) => {
    setLoading(true);
    try {
      const params = { 
        page: pageNum, 
        search: search || undefined,
        status: statusFilter || undefined,
        season: seasonFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page_size: 50 
      };
      const response = await workLogsAPI.list(params);
      const newLogs = response.data.results || response.data;
      if (pageNum === 1) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
      setHasMore(!!response.data.next);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load work logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setEditForm({
      log_date: log.log_date,
      block: log.block,
      crop: log.crop,
      row_number: log.row_number || '',
      work_detail: log.work_detail || '',
      male_labour_count: log.male_labour_count,
      female_labour_count: log.female_labour_count,
      notes: log.notes || '',
      status: log.status || 'draft',
    });
  };

  const handleSave = async (id) => {
    try {
      const payload = {
        log_date: editForm.log_date,
        block_id: editForm.block,
        crop_id: editForm.crop,
        row_number: editForm.row_number || null,
        work_detail: editForm.work_detail || '',
        male_labour_count: editForm.male_labour_count,
        female_labour_count: editForm.female_labour_count,
        notes: editForm.notes || '',
        status: editForm.status || 'draft',
      };
      await workLogsAPI.update(id, payload);
      setLogs(logs.map(l => l.id === id ? { ...l, ...editForm } : l));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this work log?')) {
      try {
        await workLogsAPI.delete(id);
        setLogs(logs.filter(l => l.id !== id));
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await workLogsAPI.list({ 
        search: search || undefined, 
        status: statusFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page_size: 10000 
      });
      const allLogs = response.data.results || response.data;
      
      // Build XLSX manually with XML
      const xlsContent = [
        ['Date', 'Block', 'Crop', 'Row', 'Work Type', 'Work Detail', 'Male', 'Female', 'Total', 'Status', 'Notes'].join('\t'),
        ...allLogs.map(log => [
          log.log_date,
          log.block_name,
          log.crop_name,
          log.row_number || '',
          log.work_type_name,
          (log.work_detail || '').replace(/\t/g, ' '),
          log.male_labour_count,
          log.female_labour_count,
          log.total_labour_count,
          log.status,
          (log.notes || '').replace(/\t/g, ' ')
        ].join('\t'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + xlsContent], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work_logs_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSeasonFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
    loadLogs(1);
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    synced: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Logs</h1>
          <p className="text-gray-500">Daily work entries - {logs.length} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export XLSX
          </button>
          <Link to="/work-logs/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Entry
          </Link>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)} 
          className="btn btn-secondary flex items-center gap-2"
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Date Filters */}
      {showFilters && (
        <div className="card bg-gray-50">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="synced">Synced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Season</label>
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="input"
              >
                <option value="">All</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.crop_name} - {s.name}</option>
                ))}
              </select>
            </div>
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="card">
            {editingId === log.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.log_date}
                      onChange={(e) => setEditForm({...editForm, log_date: e.target.value})}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Block</label>
                    <select
                      value={editForm.block}
                      onChange={(e) => setEditForm({...editForm, block: parseInt(e.target.value)})}
                      className="input text-sm"
                    >
                      {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Crop</label>
                    <select
                      value={editForm.crop}
                      onChange={(e) => setEditForm({...editForm, crop: parseInt(e.target.value)})}
                      className="input text-sm"
                    >
                      {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="input text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="synced">Synced</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Work Detail</label>
                    <input
                      type="text"
                      value={editForm.work_detail}
                      onChange={(e) => setEditForm({...editForm, work_detail: e.target.value})}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Male Labour</label>
                    <input
                      type="number"
                      value={editForm.male_labour_count}
                      onChange={(e) => setEditForm({...editForm, male_labour_count: parseInt(e.target.value)})}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Female Labour</label>
                    <input
                      type="number"
                      value={editForm.female_labour_count}
                      onChange={(e) => setEditForm({...editForm, female_labour_count: parseInt(e.target.value)})}
                      className="input text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Notes</label>
                    <input
                      type="text"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                      className="input text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(log.id)} className="btn btn-primary flex items-center gap-1 text-sm">
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary flex items-center gap-1 text-sm">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{log.work_type_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[log.status]}`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {log.block_name} • {log.crop_name} 
                      {log.row_number && ` • Row ${log.row_number}`}
                    </p>
                    {log.work_detail && (
                      <p className="text-sm mt-1">{log.work_detail}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(log)} className="p-1 text-gray-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(log.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(log.log_date), 'dd MMM yyyy')}
                      </div>
                      <div className="flex items-center gap-1 text-sm mt-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{log.total_labour_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span>{log.male_labour_count} Male</span>
                  <span>{log.female_labour_count} Female</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && hasMore && (
        <div className="text-center">
          <button onClick={() => loadLogs(page + 1)} className="btn btn-secondary">
            Load More
          </button>
        </div>
      )}

      {logs.length === 0 && !loading && (
        <div className="card text-center py-12">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No work logs found.</p>
          <Link to="/work-logs/new" className="btn btn-primary mt-4">
            Create First Entry
          </Link>
        </div>
      )}
    </div>
  );
}

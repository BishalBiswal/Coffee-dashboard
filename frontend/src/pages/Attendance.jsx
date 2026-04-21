import { useState, useEffect } from 'react';
import { workersAPI, attendanceAPI } from '../lib/api';
import { format } from 'date-fns';
import { Users, Check, X, Save, Loader, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Attendance() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workersRes, attRes] = await Promise.all([
        workersAPI.list(),
        attendanceAPI.list({ date })
      ]);

      const workersData = workersRes.data.results || workersRes.data;
      setWorkers(workersData);

      const attData = attRes.data.results || attRes.data;
      const attMap = {};
      attData.forEach(a => {
        attMap[a.worker] = a.present;
      });
      setAttendance(attMap);
      setSelectAll(workersData.length > 0 && workersData.every(w => attMap[w.id]));
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorker = (workerId) => {
    setAttendance(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setAttendance({});
    } else {
      const all = {};
      workers.forEach(w => { all[w.id] = true; });
      setAttendance(all);
    }
    setSelectAll(!selectAll);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const presentWorkerIds = Object.entries(attendance)
        .filter(([_, present]) => present)
        .map(([id, _]) => parseInt(id));

      if (presentWorkerIds.length === 0) {
        toast.error('Select at least one worker');
        setSaving(false);
        return;
      }

      await attendanceAPI.mark({
        date,
        worker_ids: presentWorkerIds,
        present: true
      });

      toast.success('Attendance saved');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getPresentCount = () => {
    return Object.values(attendance).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500">Mark daily attendance</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-40"
          />
        </div>
        <div className="flex-1"></div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">{getPresentCount()}</p>
          <p className="text-sm text-gray-500">present</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-gray-300"
            />
            <span className="font-medium">Select All</span>
          </div>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Attendance
          </button>
        </div>

        <div className="divide-y">
          {workers.map(worker => (
            <div 
              key={worker.id} 
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={attendance[worker.id] || false}
                  onChange={() => toggleWorker(worker.id)}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <div>
                  <p className="font-medium text-gray-900">{worker.name}</p>
                  <p className="text-sm text-gray-500">{worker.employment_type} • {worker.gender}</p>
                </div>
              </div>
              {attendance[worker.id] ? (
                <span className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" /> Present
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-400">
                  <X className="w-4 h-4" /> Absent
                </span>
              )}
            </div>
          ))}
        </div>

        {workers.length === 0 && (
          <p className="p-4 text-center text-gray-500">No workers found</p>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { workersAPI } from '../lib/api';
import { Link } from 'react-router-dom';
import { Users, Search, Download, Edit2, Trash2, X, Check, Plus, Phone, MapPin, Calendar } from 'lucide-react';

export default function WorkerList() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: '', gender: 'M', village: '', phone_number: '', daily_rate_rs: 170, employment_type: 'temporary'
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const response = await workersAPI.list();
      setWorkers(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.village?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (worker) => {
    setEditingId(worker.id);
    setEditForm({
      name: worker.name,
      gender: worker.gender,
      village: worker.village || '',
      phone_number: worker.phone_number || '',
      daily_rate_rs: worker.daily_rate_rs,
      employment_type: worker.employment_type,
      status: worker.status,
    });
  };

  const handleSave = async (id) => {
    try {
      await workersAPI.update(id, editForm);
      setWorkers(workers.map(w => w.id === id ? { ...w, ...editForm } : w));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = async () => {
    try {
      await workersAPI.create(newWorker);
      setShowAdd(false);
      setNewWorker({ name: '', gender: 'M', village: '', phone_number: '', daily_rate_rs: 170, employment_type: 'temporary' });
      loadWorkers();
    } catch (error) {
      console.error('Failed to add worker:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
        await workersAPI.delete(id);
        setWorkers(workers.filter(w => w.id !== id));
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Gender', 'Village', 'Phone', 'Daily Rate', 'Employment Type', 'Status'].join(','),
      ...workers.map(w => [
        w.name,
        w.gender,
        (w.village || '').replace(/,/g, ';'),
        w.phone_number || '',
        w.daily_rate_rs,
        w.employment_type,
        w.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const genderColors = {
    M: 'bg-blue-100 text-blue-700',
    F: 'bg-pink-100 text-pink-700',
    O: 'bg-gray-100 text-gray-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-500">Labour force directory - {workers.length} workers</p>
        </div>
        <div className="flex gap-2">
          <Link to="/workers/attendance" className="btn btn-secondary flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Attendance
          </Link>
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search workers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {showAdd && (
        <div className="card">
          <h3 className="font-semibold mb-3">Add New Worker</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              value={newWorker.name}
              onChange={(e) => setNewWorker({...newWorker, name: e.target.value})}
              className="input"
              placeholder="Name"
            />
            <select
              value={newWorker.gender}
              onChange={(e) => setNewWorker({...newWorker, gender: e.target.value})}
              className="input"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            <input
              type="text"
              value={newWorker.village}
              onChange={(e) => setNewWorker({...newWorker, village: e.target.value})}
              className="input"
              placeholder="Village"
            />
            <input
              type="text"
              value={newWorker.phone_number}
              onChange={(e) => setNewWorker({...newWorker, phone_number: e.target.value})}
              className="input"
              placeholder="Phone"
            />
            <input
              type="number"
              value={newWorker.daily_rate_rs}
              onChange={(e) => setNewWorker({...newWorker, daily_rate_rs: parseFloat(e.target.value)})}
              className="input"
              placeholder="Daily Rate (Rs)"
            />
            <select
              value={newWorker.employment_type}
              onChange={(e) => setNewWorker({...newWorker, employment_type: e.target.value})}
              className="input"
            >
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary</option>
              <option value="contract">Contract</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn btn-primary">Add Worker</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div key={worker.id} className="card">
            {editingId === worker.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="input text-sm"
                  placeholder="Name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="input text-sm"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  <input
                    type="text"
                    value={editForm.village}
                    onChange={(e) => setEditForm({...editForm, village: e.target.value})}
                    className="input text-sm"
                    placeholder="Village"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                    className="input text-sm"
                    placeholder="Phone"
                  />
                  <input
                    type="number"
                    value={editForm.daily_rate_rs}
                    onChange={(e) => setEditForm({...editForm, daily_rate_rs: parseFloat(e.target.value)})}
                    className="input text-sm"
                    placeholder="Daily Rate"
                  />
                </div>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="input text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="left">Left</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(worker.id)} className="btn btn-primary flex items-center gap-1 text-sm py-1">
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary flex items-center gap-1 text-sm py-1">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{worker.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${genderColors[worker.gender]}`}>
                      {worker.gender === 'M' ? 'Male' : worker.gender === 'F' ? 'Female' : 'Other'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(worker)} className="p-1 text-gray-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(worker.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2 text-sm text-gray-500">
                  {worker.village && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{worker.village}</span>
                    </div>
                  )}
                  {worker.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{worker.phone_number}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{worker.employment_type}</span>
                  <span className="font-semibold text-primary-600">₹{worker.daily_rate_rs}/day</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{search ? 'No workers match your search.' : 'No workers found.'}</p>
        </div>
      )}
    </div>
  );
}

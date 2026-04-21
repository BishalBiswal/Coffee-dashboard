import { useState, useEffect } from 'react';
import { cropsAPI, seasonsAPI } from '../lib/api';
import { Calendar, Plus, Edit2, Trash2, X, Check, Download } from 'lucide-react';

export default function Seasons() {
  const [seasons, setSeasons] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newSeason, setNewSeason] = useState({
    name: '',
    crop: '',
    start_date: '',
    end_date: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [seasonsRes, cropsRes] = await Promise.all([
        seasonsAPI.list(),
        cropsAPI.list()
      ]);
      setSeasons(seasonsRes.data.results || seasonsRes.data);
      setCrops(cropsRes.data.results || cropsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSeason.name || !newSeason.crop || !newSeason.start_date || !newSeason.end_date) {
      alert('Please fill required fields');
      return;
    }
    try {
      await seasonsAPI.create(newSeason);
      setShowAdd(false);
      setNewSeason({ name: '', crop: '', start_date: '', end_date: '', description: '', is_active: true });
      loadData();
    } catch (error) {
      console.error('Failed to add season:', error);
    }
  };

  const handleEdit = (season) => {
    setEditingId(season.id);
    setEditForm({
      name: season.name,
      crop: season.crop,
      start_date: season.start_date,
      end_date: season.end_date,
      description: season.description || '',
      is_active: season.is_active
    });
  };

  const handleSave = async (id) => {
    try {
      await seasonsAPI.update(id, editForm);
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this season?')) {
      try {
        await seasonsAPI.delete(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seasons</h1>
          <p className="text-gray-500">Manage crop seasons</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Season
        </button>
      </div>

      {showAdd && (
        <div className="card">
          <h3 className="font-semibold mb-3">Add New Season</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Season Name *</label>
              <input
                type="text"
                value={newSeason.name}
                onChange={(e) => setNewSeason({...newSeason, name: e.target.value})}
                className="input"
                placeholder="e.g., Summer 2026, Monsoon"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Crop *</label>
              <select
                value={newSeason.crop}
                onChange={(e) => setNewSeason({...newSeason, crop: e.target.value})}
                className="input"
              >
                <option value="">Select Crop</option>
                {crops.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                value={newSeason.start_date}
                onChange={(e) => setNewSeason({...newSeason, start_date: e.target.value})}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date *</label>
              <input
                type="date"
                value={newSeason.end_date}
                onChange={(e) => setNewSeason({...newSeason, end_date: e.target.value})}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Description</label>
              <textarea
                value={newSeason.description}
                onChange={(e) => setNewSeason({...newSeason, description: e.target.value})}
                className="input"
                rows={2}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSeason.is_active}
                  onChange={(e) => setNewSeason({...newSeason, is_active: e.target.checked})}
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn btn-primary">Add Season</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Crop</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Start</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">End</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {seasons.map((season) => (
              <tr key={season.id} className="hover:bg-gray-50">
                {editingId === season.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="input text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={editForm.crop}
                        onChange={(e) => setEditForm({...editForm, crop: e.target.value})}
                        className="input text-sm"
                      >
                        {crops.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={editForm.start_date}
                        onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                        className="input text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                        className="input text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={editForm.is_active}
                        onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                      />
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => handleSave(season.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{season.name}</td>
                    <td className="px-4 py-3">{season.crop_name}</td>
                    <td className="px-4 py-3">{season.start_date}</td>
                    <td className="px-4 py-3">{season.end_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${season.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {season.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <button onClick={() => handleEdit(season)} className="p-1 text-gray-400 hover:text-primary-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(season.id)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seasons.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>No seasons found. Add a season to get started.</p>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cropsAPI } from '../lib/api';
import { Wheat, Download, Edit2, Trash2, X, Check, Plus, History } from 'lucide-react';

export default function Crops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newCrop, setNewCrop] = useState({ name: '', scientific_name: '', crop_type: 'tree_crop' });

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      const response = await cropsAPI.list();
      setCrops(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (crop) => {
    setEditingId(crop.id);
    setEditForm({
      name: crop.name,
      scientific_name: crop.scientific_name || '',
      crop_type: crop.crop_type,
    });
  };

  const handleSave = async (id) => {
    try {
      await cropsAPI.update(id, editForm);
      setCrops(crops.map(c => c.id === id ? { ...c, ...editForm } : c));
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
      await cropsAPI.create(newCrop);
      setShowAdd(false);
      setNewCrop({ name: '', scientific_name: '', crop_type: 'tree_crop' });
      loadCrops();
    } catch (error) {
      console.error('Failed to add crop:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Scientific Name', 'Type', 'Density/ha', 'Created At'].join(','),
      ...crops.map(c => [
        c.name,
        (c.scientific_name || '').replace(/,/g, ';'),
        c.crop_type,
        c.planting_density_per_hectare || '',
        c.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crops_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const cropTypeColors = {
    tree_crop: 'bg-green-100 text-green-700',
    spice: 'bg-orange-100 text-orange-700',
    plantation: 'bg-blue-100 text-blue-700',
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
          <h1 className="text-2xl font-bold text-gray-900">Crops</h1>
          <p className="text-gray-500">All crops in the plantation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Crop
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card">
          <h3 className="font-semibold mb-3">Add New Crop</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              value={newCrop.name}
              onChange={(e) => setNewCrop({...newCrop, name: e.target.value})}
              className="input"
              placeholder="Crop Name"
            />
            <input
              type="text"
              value={newCrop.scientific_name}
              onChange={(e) => setNewCrop({...newCrop, scientific_name: e.target.value})}
              className="input"
              placeholder="Scientific Name"
            />
            <select
              value={newCrop.crop_type}
              onChange={(e) => setNewCrop({...newCrop, crop_type: e.target.value})}
              className="input"
            >
              <option value="tree_crop">Tree Crop</option>
              <option value="spice">Spice</option>
              <option value="plantation">Plantation</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="btn btn-primary">Add Crop</button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crops.map((crop) => (
          <div key={crop.id} className="card">
            {editingId === crop.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="input text-sm"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={editForm.scientific_name}
                  onChange={(e) => setEditForm({...editForm, scientific_name: e.target.value})}
                  className="input text-sm"
                  placeholder="Scientific Name"
                />
                <select
                  value={editForm.crop_type}
                  onChange={(e) => setEditForm({...editForm, crop_type: e.target.value})}
                  className="input text-sm"
                >
                  <option value="tree_crop">Tree Crop</option>
                  <option value="spice">Spice</option>
                  <option value="plantation">Plantation</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(crop.id)} className="btn btn-primary flex items-center gap-1 text-sm py-1">
                    <Check className="w-4 h-4" /> Save
                  </button>
                  <button onClick={handleCancel} className="btn btn-secondary flex items-center gap-1 text-sm py-1">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Wheat className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{crop.name}</h3>
                      {crop.scientific_name && (
                        <p className="text-sm text-gray-500 italic">{crop.scientific_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link 
                      to={`/crops/${crop.id}/activity`}
                      className="p-1 text-gray-400 hover:text-primary-600"
                      title="View Activity History"
                    >
                      <History className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleEdit(crop)} className="p-1 text-gray-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${cropTypeColors[crop.crop_type] || 'bg-gray-100'}`}>
                  {crop.crop_type?.replace('_', ' ')}
                </span>
                {crop.planting_density_per_hectare && (
                  <p className="text-sm text-gray-500">
                    Density: {crop.planting_density_per_hectare} trees/ha
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {crops.length === 0 && (
        <div className="card text-center py-12">
          <Wheat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No crops found.</p>
        </div>
      )}
    </div>
  );
}

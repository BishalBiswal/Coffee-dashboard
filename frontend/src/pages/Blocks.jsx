import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blocksAPI, cropsAPI } from '../lib/api';
import { Trees, ChevronRight, Plus, Download, Edit2, Trash2, X, Check, History } from 'lucide-react';

export default function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      const response = await blocksAPI.list();
      setBlocks(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (block) => {
    setEditingId(block.id);
    setEditForm({
      name: block.name,
      location: block.location || '',
      total_area_hectares: block.total_area_hectares || '',
    });
  };

  const handleSave = async (id) => {
    try {
      await blocksAPI.update(id, editForm);
      setBlocks(blocks.map(b => b.id === id ? { ...b, ...editForm } : b));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Location', 'Area (Ha)', 'Created At'].join(','),
      ...blocks.map(b => [
        b.name,
        (b.location || '').replace(/,/g, ';'),
        b.total_area_hectares || '',
        b.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
          <h1 className="text-2xl font-bold text-gray-900">Blocks</h1>
          <p className="text-gray-500">Click a block to view crops and work logs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {blocks.map((block) => (
          <div key={block.id} className="card">
            {editingId === block.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="input text-sm"
                  placeholder="Block Name"
                />
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  className="input text-sm"
                  placeholder="Location"
                />
                <input
                  type="number"
                  value={editForm.total_area_hectares}
                  onChange={(e) => setEditForm({...editForm, total_area_hectares: e.target.value})}
                  className="input text-sm"
                  placeholder="Area (Ha)"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleSave(block.id)} className="btn btn-primary flex items-center gap-1 text-sm py-1">
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
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Trees className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex gap-1">
                    <Link to={`/blocks/${block.id}/activity`} className="p-1 text-gray-400 hover:text-primary-600" title="View Activity History">
                      <History className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleEdit(block)} className="p-1 text-gray-400 hover:text-primary-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <Link to={`/blocks/${block.id}`} className="block group">
                  <h3 className="mt-4 text-lg font-semibold group-hover:text-primary-600">Block {block.name}</h3>
                  <p className="text-sm text-gray-500">{block.location || 'No location'}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">{block.crop_count || 0} crops</span>
                    <span className="text-gray-500">{block.work_log_count || 0} logs</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="card text-center py-12">
          <Trees className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No blocks found. Add blocks to get started.</p>
        </div>
      )}
    </div>
  );
}

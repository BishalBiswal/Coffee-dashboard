import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blocksAPI } from '../lib/api';
import { Trees, ArrowLeft, Calendar, Users } from 'lucide-react';

export default function BlockDetail() {
  const { id } = useParams();
  const [block, setBlock] = useState(null);
  const [crops, setCrops] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('crops');

  const currentYear = new Date().getFullYear();
  
  useEffect(() => {
    loadBlockData();
  }, [id]);

  const loadBlockData = async () => {
    try {
      const [blockRes, cropsRes, logsRes] = await Promise.all([
        blocksAPI.get(id),
        blocksAPI.getCrops(id),
        blocksAPI.getWorkLogs(id, { date_from: '2020-01-01', date_to: `${currentYear}-12-31` }),
      ]);
      setBlock(blockRes.data);
      setCrops(cropsRes.data);
      setWorkLogs(logsRes.data.results || logsRes.data);
    } catch (error) {
      console.error('Failed to load block:', error);
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

  return (
    <div className="space-y-6">
      <Link to="/blocks" className="inline-flex items-center text-gray-600 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Blocks
      </Link>

      {/* Block Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Trees className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Block {block?.name}</h1>
              <p className="text-gray-500">{block?.location || 'No location'}</p>
            </div>
          </div>
          {block?.total_area_hectares && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Area</p>
              <p className="text-lg font-semibold">{block.total_area_hectares} ha</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('crops')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'crops' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Crops ({crops.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'logs' 
              ? 'text-primary-600 border-b-2 border-primary-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Work Logs ({workLogs.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'crops' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map((lot) => (
            <div key={lot.id} className="card">
              <h3 className="font-semibold text-lg">{lot.crop_name}</h3>
              <p className="text-sm text-gray-500">Rows: {lot.num_rows}</p>
              <p className="text-sm text-gray-500">Total Trees: {lot.total_trees}</p>
              {lot.harvest_season && (
                <p className="text-sm text-gray-500">Harvest: {lot.harvest_season}</p>
              )}
            </div>
          ))}
          {crops.length === 0 && (
            <p className="text-gray-500">No crops assigned to this block.</p>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-3">
          {workLogs.map((log) => (
            <div key={log.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">{log.work_type_name}</p>
                <p className="text-sm text-gray-500">
                  {log.crop_name} • Row {log.row_number || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date(log.log_date).toLocaleDateString('en-IN')}
                </p>
                <p className="text-sm">
                  <Users className="w-4 h-4 inline mr-1" />
                  {log.total_labour_count} labour • {log.total_hours?.toFixed(1) || ((log.male_labour_count + log.female_labour_count) * (log.hours_worked || 8)).toFixed(1)} hrs
                </p>
              </div>
            </div>
          ))}
          {workLogs.length === 0 && (
            <p className="text-gray-500">No work logs for this block.</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { workLogsAPI, workTypesAPI } from '../lib/api';
import { format } from 'date-fns';
import { Search, ChevronDown, ChevronRight, Trees, Wheat, Leaf, Factory, Wrench, X, Calendar, MapPin, Sprout } from 'lucide-react';

export default function Activity() {
  const [workTypes, setWorkTypes] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedWorkType, setSelectedWorkType] = useState(null);

  const categories = [
    { name: 'Nursery', icon: Trees },
    { name: 'Field', icon: Wheat },
    { name: 'Tree', icon: Leaf },
    { name: 'Processing', icon: Factory },
    { name: 'Misc', icon: Wrench },
  ];

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesRes, logsRes] = await Promise.all([
        workTypesAPI.list(),
        workLogsAPI.list({
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
        }),
      ]);

      const types = typesRes.data.results || typesRes.data;
      const logs = logsRes.data.results || logsRes.data;

      setWorkTypes(types);
      setWorkLogs(logs);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogsForType = (typeName) => {
    return workLogs.filter(log => log.work_type_name === typeName);
  };

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const getCategoryCount = (catName) => {
    return workTypes.filter(t => t.category === catName).length;
  };

  const getTypesForCategory = (catName) => {
    const types = workTypes.filter(t => t.category === catName);
    if (!searchTerm) return types;
    return types.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          <p className="text-gray-500">View all work types</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search work types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input w-40"
          placeholder="From"
        />
        
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input w-40"
          placeholder="To"
        />
      </div>

      <div className="grid gap-4">
        {categories.map(({ name, icon: Icon }) => {
          const types = getTypesForCategory(name);
          const totalTypes = getCategoryCount(name);
          const isExpanded = expandedCategories[name];

          return (
            <div key={name} className="card">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 rounded-lg"
                onClick={() => toggleCategory(name)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <Icon className="w-6 h-6 text-primary-600" />
                  <h2 className="text-lg font-semibold">{name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{totalTypes}</p>
                  <p className="text-xs text-gray-500">work types</p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {types.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center py-4">No work types found</p>
                  ) : (
                    types.map((type) => {
                      const logs = getLogsForType(type.name);
                      return (
                        <div 
                          key={type.id} 
                          className="border rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                          onClick={() => setSelectedWorkType({ ...type, logs })}
                        >
                          <h3 className="font-medium text-gray-900">{type.name}</h3>
                          <p className={`text-sm ${logs.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {logs.length} {logs.length === 1 ? 'log' : 'logs'}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedWorkType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-bold">{selectedWorkType.name}</h2>
                <p className="text-sm text-gray-500">{selectedWorkType.category} • {selectedWorkType.logs.length} logs</p>
              </div>
              <button 
                onClick={() => setSelectedWorkType(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {selectedWorkType.logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No logs found for this work type</p>
              ) : (
                <div className="space-y-3">
                  {selectedWorkType.logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {log.log_date ? format(new Date(log.log_date), 'dd MMM yyyy') : '-'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {log.block_name || '-'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Sprout className="w-4 h-4" />
                          {log.crop_name || '-'}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        <span className="text-blue-600">Male: {log.male_labour_count || 0}</span>
                        <span className="text-pink-600">Female: {log.female_labour_count || 0}</span>
                        <span className="text-gray-500">{log.hours_worked || 8} hrs</span>
                      </div>
                      {log.work_detail && (
                        <p className="mt-2 text-sm text-gray-600">{log.work_detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

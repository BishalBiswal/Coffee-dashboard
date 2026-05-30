import { useState, useEffect } from 'react';
import { analyticsAPI } from '../lib/api';
import { DollarSign, TrendingUp, Calendar, ChevronDown, ChevronRight, X } from 'lucide-react';

export default function CostSummary() {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWorkType, setSelectedWorkType] = useState(null);
  const [selectedMaterialCat, setSelectedMaterialCat] = useState(null);
  const [selectedMaterialSubCat, setSelectedMaterialSubCat] = useState(null);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async (manualFrom = null, manualTo = null) => {
    try {
      setLoading(true);
      const today = new Date();
      let from, to;
      
      if (manualFrom && manualTo) {
        from = manualFrom;
        to = manualTo;
      } else if (period === 'daily') {
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        to = today.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        from = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        to = today.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        from = `${today.getFullYear()}-01-01`;
        to = `${today.getFullYear()}-12-31`;
      } else {
        from = `${today.getFullYear() - 2}-01-01`;
        to = `${today.getFullYear()}-12-31`;
      }
      
      const res = await analyticsAPI.costBreakdown({ date_from: from, date_to: to });
      console.log('API Response:', res.data);
      setBreakdown(res.data);
      setDateFrom(from);
      setDateTo(to);
    } catch (error) {
      console.error('Failed to load cost data:', error);
      setBreakdown({ categories: {}, materials: {} });
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

  const categories = breakdown?.categories || {};
  const materials = breakdown?.materials || {};
  
  const totalLabourCost = Object.values(categories).reduce((sum, cat) => sum + (cat.cost || 0), 0);
  const totalLabour = Object.values(categories).reduce((sum, cat) => sum + (cat.labour || 0), 0);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat === selectedCategory ? null : cat);
    setSelectedWorkType(null);
  };

  const handleWorkTypeClick = (wt) => {
    setSelectedWorkType(wt === selectedWorkType ? null : wt);
  };

  const handleMaterialCatClick = (cat) => {
    setSelectedMaterialCat(cat === selectedMaterialCat ? null : cat);
    setSelectedMaterialSubCat(null);
  };

  const handleMaterialSubCatClick = (subCat) => {
    setSelectedMaterialSubCat(subCat === selectedMaterialSubCat ? null : subCat);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Cost Summary</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => loadData(e.target.value, dateTo)}
            className="input w-full sm:w-40"
          />
          <span className="text-gray-500 hidden sm:inline">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => loadData(dateFrom, e.target.value)}
            className="input w-full sm:w-40"
          />
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm ${period === p ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Labour Cost</p>
              <p className="text-2xl font-bold">₹{totalLabourCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Labour Days</p>
              <p className="text-2xl font-bold">{totalLabour.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold">{Object.keys(categories).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Labour Cost by Category</h2>
          <div className="space-y-2">
            {Object.entries(categories).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No labour cost data</p>
            ) : (
              Object.entries(categories).map(([cat, data]) => (
                <div key={cat}>
                  <div 
                    onClick={() => handleCategoryClick(cat)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      {selectedCategory === cat ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-medium">{cat}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">₹{data.cost?.toLocaleString() || 0}</span>
                      <span className="text-gray-500 text-sm ml-2">({data.labour} days)</span>
                    </div>
                  </div>
                  
                  {selectedCategory === cat && (
                    <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                      {data.work_types?.map((wt) => (
                        <div key={wt.name}>
                          <div 
                            onClick={() => handleWorkTypeClick(wt.name)}
                            className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2">
                              {selectedWorkType === wt.name ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              <span className="text-sm">{wt.name}</span>
                            </div>
                            <span className="text-sm font-medium">₹{wt.cost?.toLocaleString() || 0}</span>
                          </div>
                          
                          {selectedWorkType === wt.name && wt.logs && (
                            <div className="ml-6 mt-1 space-y-1 border-l border-gray-100 pl-2">
                              {wt.logs.map((log, idx) => (
                                <div key={idx} className="flex justify-between p-1 text-xs bg-gray-50 rounded">
                                  <span>{log.date} {log.block ? `(${log.block})` : ''}</span>
                                  <span>₹{log.cost} ({log.labour} lab)</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Material Cost</h2>
          <div className="space-y-2">
            {Object.keys(materials).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No material cost data</p>
            ) : (
              Object.entries(materials).map(([cat, subCats]) => {
                const totalIn = Object.values(subCats).reduce((s, sc) => s + (sc.in_cost || 0), 0);
                const totalOut = Object.values(subCats).reduce((s, sc) => s + (sc.out_cost || 0), 0);
                const netChange = totalIn - totalOut;
                return (
                  <div key={cat}>
                    <button 
                      type="button"
                      onClick={() => handleMaterialCatClick(cat)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        {selectedMaterialCat === cat ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium">{cat}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-green-600 text-sm">+₹{totalIn.toLocaleString()}</span>
                        <span className="text-red-600 text-sm ml-2">-₹{totalOut.toLocaleString()}</span>
                        <span className={`text-sm ml-2 font-medium ${netChange >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          ({netChange >= 0 ? '+' : ''}₹{netChange.toLocaleString()})
                        </span>
                      </div>
                    </button>
                    
                    {selectedMaterialCat === cat && (
                      <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                        {Object.entries(subCats).map(([subCat, data]) => {
                          const subNet = (data.in_cost || 0) - (data.out_cost || 0);
                          return (
                          <div key={subCat}>
                            <button 
                              type="button"
                              onClick={() => handleMaterialSubCatClick(subCat)}
                              className="w-full flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                {selectedMaterialSubCat === subCat ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span className="text-sm">{subCat}</span>
                              </div>
                              <div className="text-right text-sm">
                                <span className="text-green-600">+₹{data.in_cost?.toLocaleString() || 0}</span>
                                <span className="text-red-600 ml-2">-₹{data.out_cost?.toLocaleString() || 0}</span>
                                <span className={`ml-2 ${subNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                  ({subNet >= 0 ? '+' : ''}₹{subNet.toLocaleString()})
                                </span>
                              </div>
                            </button>
                            
                            {selectedMaterialSubCat === subCat && data.items && (
                              <div className="ml-6 mt-1 space-y-1 border-l border-gray-100 pl-2">
                                {Object.entries(data.items).map(([itemName, itemData]) => (
                                  <div key={itemName} className="flex flex-col sm:flex-row sm:justify-between gap-1 p-1 text-xs bg-gray-50 rounded">
                                    <span className="font-medium truncate">{itemName}</span>
                                    <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                      <span className="text-green-600 whitespace-nowrap">+{itemData.in_qty} {itemData.unit}</span>
                                      <span className="text-gray-500 whitespace-nowrap">(₹{itemData.in_cost?.toLocaleString() || 0})</span>
                                      <span className="text-red-600 whitespace-nowrap">-{itemData.out_qty} {itemData.unit}</span>
                                      <span className="text-gray-500 whitespace-nowrap">(₹{itemData.out_cost?.toLocaleString() || 0})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
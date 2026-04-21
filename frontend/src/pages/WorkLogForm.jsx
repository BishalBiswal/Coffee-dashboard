import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { workLogsAPI, blocksAPI, cropsAPI, workersAPI, seasonsAPI, attendanceAPI, workTypesAPI, inventoryAPI, inventoryTransactionsAPI } from '../lib/api';
import { Save, ArrowLeft, Loader, Users, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkLogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [blocks, setBlocks] = useState([]);
  const [crops, setCrops] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [presentWorkers, setPresentWorkers] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [workerHours, setWorkerHours] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [materials, setMaterials] = useState([]);
  const [usedMaterials, setUsedMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [materialQty, setMaterialQty] = useState('');

  const materialCategoryMap = {
    'Nursery': ['BaseMaterial', 'Solutions'],
    'Field': ['BaseMaterial', 'Solutions'],
    'Tree': ['BaseMaterial', 'Solutions'],
    'Processing': ['BaseMaterial', 'Solutions', 'Consumables'],
    'Misc': ['BaseMaterial', 'Solutions', 'Tools', 'Consumables'],
  };
  const filteredMaterials = selectedCategory && materialCategoryMap[selectedCategory]
    ? materials.filter(m => materialCategoryMap[selectedCategory].includes(m.category))
    : materials;

  const addMaterial = () => {
    if (!selectedMaterial || !materialQty) return;
    const mat = materials.find(m => m.id === parseInt(selectedMaterial));
    if (mat) {
      setUsedMaterials([...usedMaterials, { ...mat, qty: parseFloat(materialQty) }]);
      setSelectedMaterial('');
      setMaterialQty('');
    }
  };

  const removeMaterial = (index) => {
    setUsedMaterials(usedMaterials.filter((_, i) => i !== index));
  };
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      male_labour_count: 0,
      female_labour_count: 0,
      hours_worked: 8,
    }
  });

  const selectedCrop = watch('crop');
  const selectedBlock = watch('block');
  const selectedWorkType = watch('work_type');

  useEffect(() => {
    loadOptions();
    if (isEdit) loadLog();
  }, [id]);

  useEffect(() => {
    loadAttendanceForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedCrop) {
      loadSeasons(selectedCrop);
    }
  }, [selectedCrop]);

  useEffect(() => {
    if (selectedWorkType) {
      const wt = workTypes.find(w => w.id === parseInt(selectedWorkType));
      if (wt) setSelectedCategory(wt.category);
    }
  }, [selectedWorkType]);

  const loadAttendanceForDate = async (date) => {
    try {
      const attRes = await attendanceAPI.list({ date });
      const attData = attRes.data.results || attRes.data;
      const presentIds = attData.filter(a => a.present).map(a => a.worker);
      setPresentWorkers(presentIds);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const loadOptions = async () => {
    try {
      const [blocksRes, cropsRes, workersRes, wtRes, invRes] = await Promise.all([
        blocksAPI.list(),
        cropsAPI.list(),
        workersAPI.list(),
        workTypesAPI.list(),
        inventoryAPI.list(),
      ]);
      setBlocks(blocksRes.data.results || blocksRes.data);
      setCrops(cropsRes.data.results || cropsRes.data);
      setWorkers(workersRes.data.results || workersRes.data);
      setWorkTypes(wtRes.data.results || wtRes.data);
      setMaterials(invRes.data.results || invRes.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadSeasons = async (cropId) => {
    setSeasons([]);
    try {
      const response = await seasonsAPI.list({ crop: cropId });
      const allSeasons = response.data.results || response.data;
      const today = new Date();
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      const filteredSeasons = allSeasons.filter(s => {
        const endDate = new Date(s.end_date);
        const startDate = new Date(s.start_date);
        return endDate >= threeMonthsAgo && startDate <= today;
      });
      setSeasons(filteredSeasons);
    } catch (error) {
      console.error('Failed to load seasons:', error);
    }
  };

  const loadLog = async () => {
    try {
      const response = await workLogsAPI.get(id);
      const log = response.data;
      reset({
        ...log,
        block: log.block,
        crop: log.crop,
        category: log.work_type_category,
        work_type: log.work_type,
        season: log.season || '',
        status: log.status || 'draft',
        log_date: log.log_date,
      });
      setSelectedCategory(log.work_type_category);
      setValue('block', log.block);
      if (log.crop) {
        loadSeasons(log.crop);
      }
    } catch (error) {
      console.error('Failed to load log:', error);
      toast.error('Failed to load work log');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        block_id: data.block,
        crop_id: data.crop,
        work_type_id: data.work_type,
        season_id: data.season || null,
        male_labour_count: selectedWorkers.length,
        female_labour_count: 0,
      };
      
      let logId;
      if (isEdit) {
        payload.status = data.status;
        await workLogsAPI.update(id, payload);
        logId = id;
        toast.success('Work log updated');
      } else {
        const response = await workLogsAPI.create(payload);
        logId = response.data.id;
        if (selectedWorkers.length > 0) {
          const workersWithHours = selectedWorkers.map(workerId => ({
            worker_id: workerId,
            hours_worked: workerHours[workerId] !== undefined ? workerHours[workerId] : 8
          }));
          await workLogsAPI.assignWorkers(response.data.id, workersWithHours);
        }
        toast.success('Work log created');
      }
      
      if (usedMaterials.length > 0 && !isEdit) {
        try {
          for (const mat of usedMaterials) {
            await inventoryTransactionsAPI.create({
              date: data.log_date,
              item: mat.id,
              transaction_type: 'OUT',
              quantity: mat.qty,
              notes: `Used in work log #${logId}`
            });
          }
          toast.success(`${usedMaterials.length} material(s) deducted from stock`);
        } catch (matError) {
          console.error('Material deduction failed:', matError);
          toast.error('Work log saved but material deduction failed');
        }
      }
      
      navigate(-1);
    } catch (error) {
      console.error('Failed to save:', error);
      const errData = error.response?.data;
      let msg = 'Failed to save work log';
      if (errData) {
        if (typeof errData === 'string') msg = errData;
        else if (errData.detail) msg = errData.detail;
        else {
          const msgs = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
          msg = msgs.join('; ');
        }
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-gray-600 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Work Log' : 'New Work Log'}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {/* Step 1: Date & Block */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  id="log-date-input"
                  type="date"
                  value={selectedDate}
                  {...register('log_date', { required: 'Date is required' })}
                  className="input cursor-pointer"
                  onChange={(e) => {
                    const today = new Date().toISOString().split('T')[0];
                    if (e.target.value > today) e.target.value = today;
                    setSelectedDate(e.target.value);
                  }}
                  onClick={(e) => {
                    if (e.target.showPicker) {
                      try { e.target.showPicker(); } catch {}
                    }
                  }}
                />
                {errors.log_date && <p className="text-red-500 text-sm mt-1">{errors.log_date.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
                <select {...register('block', { required: 'Block is required' })} className="input">
                  <option value="">Select Block</option>
                  {blocks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.block && <p className="text-red-500 text-sm mt-1">{errors.block.message}</p>}
              </div>
            </div>

            {/* Step 2: Crop (after Block selected) */}
            {selectedBlock && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                  <select {...register('crop', { required: 'Crop is required' })} className="input">
                    <option value="">Select Crop</option>
                    {crops.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.crop && <p className="text-red-500 text-sm mt-1">{errors.crop.message}</p>}
                </div>

                {selectedCrop && seasons.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                    <select {...register('season')} className="input">
                      <option value="">Select Season (optional)</option>
                      {seasons.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.start_date} - {s.end_date})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Category (after Crop selected) */}
            {selectedCrop && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  {...register('category', { required: 'Category is required' })} 
                  className="input"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setValue('work_type', '');
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Nursery">Nursery</option>
                  <option value="Field">Field</option>
                  <option value="Tree">Tree Management</option>
                  <option value="Processing">Processing</option>
                  <option value="Misc">Miscellaneous</option>
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>
            )}

            {/* Step 4: Work Type (after Category selected) */}
            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                <select {...register('work_type', { required: 'Work type is required' })} className="input">
                  <option value="">Select Work Type</option>
                  {workTypes
                    .filter(wt => wt.category === selectedCategory)
                    .map(wt => (
                      <option key={wt.id} value={wt.id}>{wt.name}</option>
                    ))}
                </select>
                {errors.work_type && <p className="text-red-500 text-sm mt-1">{errors.work_type.message}</p>}
              </div>
            )}

            {/* Step 5: Materials (after Work Type selected) */}
            {selectedWorkType && selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Materials Used</label>
                <div className="flex gap-2 mb-2">
                  <select 
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="">Select Material</option>
                    {filteredMaterials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <input 
                    type="number"
                    value={materialQty}
                    onChange={(e) => setMaterialQty(e.target.value)}
                    className="input w-24"
                    placeholder="Qty"
                  />
                  <button 
                    type="button"
                    onClick={addMaterial}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {usedMaterials.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2">
                    {usedMaterials.map((mat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                        <span>{mat.name} - {mat.qty} {mat.unit}</span>
                        <button type="button" onClick={() => removeMaterial(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Work Detail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Detail</label>
              <input
                type="text"
                {...register('work_detail')}
                className="input"
                placeholder="Details about the work done"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Row Number (optional)</label>
              <input
                type="number"
                {...register('row_number', { valueAsNumber: true })}
                className="input"
                placeholder="1-6"
                min="1"
                max="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Workers & Hours
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {presentWorkers.length === 0 ? (
                <p className="text-gray-500 text-sm">No workers marked present today. Mark attendance first.</p>
              ) : (
                workers.filter(w => presentWorkers.includes(w.id)).map(worker => {
                  const isSelected = selectedWorkers.includes(worker.id);
                  return (
<div key={worker.id} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWorkers([...selectedWorkers, worker.id]);
                            setWorkerHours(prev => ({ ...prev, [worker.id]: 8 }));
                          } else {
                            setSelectedWorkers(selectedWorkers.filter(id => id !== worker.id));
                            setWorkerHours(prev => {
                              const updated = { ...prev };
                              delete updated[worker.id];
                              return updated;
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{worker.name}</span>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            value={workerHours[worker.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                              setWorkerHours(prev => ({ ...prev, [worker.id]: val }));
                            }}
                            className="input w-14 py-1 text-xs px-1"
                            placeholder="0"
                          />
                          <span className="text-xs text-gray-400">h</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select workers and specify hours for each</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              className="input"
              rows={3}
              placeholder="Additional notes"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className="input">
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="synced">Synced</option>
              </select>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

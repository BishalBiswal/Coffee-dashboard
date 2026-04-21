import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { workLogsAPI, blocksAPI, cropsAPI, workersAPI, seasonsAPI, attendanceAPI } from '../lib/api';
import { Save, ArrowLeft, Loader, Users } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      male_labour_count: 0,
      female_labour_count: 0,
      hours_worked: 8,
    }
  });

  const selectedCrop = watch('crop');

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
      const [blocksRes, cropsRes, workersRes] = await Promise.all([
        blocksAPI.list(),
        cropsAPI.list(),
        workersAPI.list(),
      ]);
      setBlocks(blocksRes.data.results || blocksRes.data);
      setCrops(cropsRes.data.results || cropsRes.data);
      setWorkers(workersRes.data.results || workersRes.data);
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const loadSeasons = async (cropId) => {
    setSeasons([]);
    try {
      const response = await seasonsAPI.list({ crop: cropId });
      const allSeasons = response.data.results || response.data;
      setSeasons(allSeasons);
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
        work_type: log.work_type,
        season: log.season || '',
        status: log.status || 'draft',
        log_date: log.log_date,
      });
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
      };
      
      if (isEdit) {
        payload.status = data.status;
        await workLogsAPI.update(id, payload);
        toast.success('Work log updated');
      } else {
        const response = await workLogsAPI.create(payload);
        if (selectedWorkers.length > 0) {
          await workLogsAPI.assignWorkers(response.data.id, selectedWorkers);
        }
        toast.success('Work log created');
      }
      navigate(-1);
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error(error.response?.data?.detail || 'Failed to save work log');
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                {...register('log_date', { required: 'Date is required' })}
                className="input"
                onChange={(e) => setSelectedDate(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
              <select {...register('work_type', { required: 'Work type is required' })} className="input">
                <option value="">Select Work Type</option>
                <option value="1">Nursery - Polybag filling</option>
                <option value="2">Nursery - Watering</option>
                <option value="3">Nursery - Transplanting</option>
                <option value="4">Field - Weeding</option>
                <option value="5">Field - Mulching</option>
                <option value="6">Field - Planting</option>
                <option value="7">Tree - Irrigation</option>
                <option value="8">Tree - Harvesting</option>
                <option value="9">Tree - Spraying</option>
                <option value="10">Processing - Coffee Processing</option>
                <option value="11">Misc - Wood Chipping</option>
                <option value="12">Misc - Path Maintenance</option>
              </select>
              {errors.work_type && <p className="text-red-500 text-sm mt-1">{errors.work_type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Row Number (optional)</label>
              <input
                type="number"
                {...register('row_number')}
                className="input"
                placeholder="1-6"
                min="1"
                max="20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Detail</label>
            <input
              type="text"
              {...register('work_detail')}
              className="input"
              placeholder="Details about the work done"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male Labour Count</label>
              <input
                type="number"
                {...register('male_labour_count', { valueAsNumber: true, min: 0 })}
                className="input"
                defaultValue={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female Labour Count</label>
              <input
                type="number"
                {...register('female_labour_count', { valueAsNumber: true, min: 0 })}
                className="input"
                defaultValue={0}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked (per labourer)</label>
            <input
              type="number"
              step="0.5"
              {...register('hours_worked', { valueAsNumber: true, min: 0, max: 24 })}
              className="input"
              defaultValue={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Assign Present Workers
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {presentWorkers.length === 0 ? (
                <p className="col-span-full text-gray-500 text-sm p-2">
                  No workers marked present today. Mark attendance first.
                </p>
              ) : (
                workers.filter(w => presentWorkers.includes(w.id)).map(worker => (
                  <label key={worker.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWorkers.includes(worker.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorkers([...selectedWorkers, worker.id]);
                        } else {
                          setSelectedWorkers(selectedWorkers.filter(id => id !== worker.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    {worker.name}
                  </label>
                ))
              )}
            </div>
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

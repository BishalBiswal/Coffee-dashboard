import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { Save, CloudOff, RefreshCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PWAWorkForm() {
  const { isOnline, saveOffline, syncPendingEntries } = useOfflineSync();
  const [savedLocally, setSavedLocally] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [crops, setCrops] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      log_date: new Date().toISOString().split('T')[0],
      male_labour_count: 0,
      female_labour_count: 0,
    }
  });

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const storedBlocks = localStorage.getItem('pwa_blocks');
      const storedCrops = localStorage.getItem('pwa_crops');
      const storedWorkers = localStorage.getItem('pwa_workers');
      
      if (storedBlocks && storedCrops) {
        setBlocks(JSON.parse(storedBlocks));
        setCrops(JSON.parse(storedCrops));
      }
      if (storedWorkers) {
        setWorkers(JSON.parse(storedWorkers));
      }
    } catch (error) {
      console.error('Failed to load options:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        block_id: data.block,
        crop_id: data.crop,
        work_type_id: data.work_type,
        worker_ids: selectedWorkers,
      };
      
      await saveOffline(payload);
      setSavedLocally(true);
      setSelectedWorkers([]);
      reset();
      toast.success('Saved locally!');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Field Entry</h1>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <RefreshCw className="w-3 h-3" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                <CloudOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Saved indicator */}
        {savedLocally && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Saved offline - will sync when online</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              {...register('log_date', { required: 'Required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
            <select {...register('block', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select</option>
              {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
            <select {...register('crop', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
            <select {...register('work_type', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select</option>
              <option value="1">Weeding</option>
              <option value="2">Planting</option>
              <option value="3">Harvesting</option>
              <option value="4">Irrigation</option>
              <option value="5">Spraying</option>
              <option value="6">Mulching</option>
              <option value="7">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Row</label>
            <input
              type="number"
              {...register('row_number')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Male</label>
              <input
                type="number"
                {...register('male_labour_count', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                defaultValue={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Female</label>
              <input
                type="number"
                {...register('female_labour_count', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                defaultValue={0}
              />
            </div>
          </div>

          {workers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Workers</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {workers.map(worker => (
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
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Save
          </button>
        </form>
      </div>
    </div>
  );
}

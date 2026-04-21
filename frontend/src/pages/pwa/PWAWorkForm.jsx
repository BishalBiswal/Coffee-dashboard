import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { workTypesAPI, blocksAPI, cropsAPI } from '../../lib/api';
import { Save, CloudOff, RefreshCw, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PWAWorkForm() {
  const { isOnline, saveOffline, syncPendingEntries } = useOfflineSync();
  const [savedLocally, setSavedLocally] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [crops, setCrops] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
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
      let storedBlocks = localStorage.getItem('pwa_blocks');
      let storedCrops = localStorage.getItem('pwa_crops');
      const storedWorkers = localStorage.getItem('pwa_workers');
      let storedWorkTypes = localStorage.getItem('pwa_work_types');
      
      // Fetch from API if not in localStorage
      if (!storedBlocks || !storedCrops || !storedWorkTypes) {
        try {
          const [blocksRes, cropsRes, wtRes] = await Promise.all([
            workTypesAPI.list().catch(() => ({ data: [] })),
          ]);
          
          const blocksData = blocksRes.data.results || blocksRes.data;
          const cropsData = cropsRes.data.results || cropsRes.data;
          const wtData = wtRes.data.results || wtRes.data;
          
          if (blocksData.length) localStorage.setItem('pwa_blocks', JSON.stringify(blocksData));
          if (cropsData.length) localStorage.setItem('pwa_crops', JSON.stringify(cropsData));
          if (wtData.length) localStorage.setItem('pwa_work_types', JSON.stringify(wtData));
          
          setBlocks(blocksData);
          setCrops(cropsData);
          setWorkTypes(wtData);
          if (storedWorkers) setWorkers(JSON.parse(storedWorkers));
          return;
        } catch (apiError) {
          console.error('API fetch failed, using cached:', apiError);
        }
      }
      
      if (storedBlocks && storedCrops) {
        setBlocks(JSON.parse(storedBlocks));
        setCrops(JSON.parse(storedCrops));
      }
      if (storedWorkers) {
        setWorkers(JSON.parse(storedWorkers));
      }
      if (storedWorkTypes) {
        setWorkTypes(JSON.parse(storedWorkTypes));
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
              max={new Date().toISOString().split('T')[0]}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              {...register('category', { required: 'Required' })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setValue('work_type', '');
              }}
            >
              <option value="">Select</option>
              <option value="Nursery">Nursery</option>
              <option value="Field">Field</option>
              <option value="Tree">Tree Management</option>
              <option value="Processing">Processing</option>
              <option value="Misc">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
            <select {...register('work_type', { required: 'Required' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">Select</option>
              {workTypes
                .filter(wt => wt.category === selectedCategory)
                .map(wt => (
                  <option key={wt.id} value={wt.id}>{wt.name}</option>
                ))}
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

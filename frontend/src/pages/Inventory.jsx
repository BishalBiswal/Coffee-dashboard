import { useState, useEffect } from 'react';
import { inventoryAPI, inventoryTransactionsAPI } from '../lib/api';
import { Package, Plus, ArrowUpCircle, ArrowDownCircle, Search, Filter, Edit2, X, ChevronDown, ChevronRight } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [showItemForm, setShowItemForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'BaseMaterial', sub_category: '', unit: 'NOS', current_stock: 0, min_stock_level: 0, rate_per_unit: 0 });
  const [transForm, setTransForm] = useState({ date: '', item: '', transaction_type: 'IN', quantity: '', notes: '' });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [selectedStockCategory, setSelectedStockCategory] = useState(null);
  const [quickAddItem, setQuickAddItem] = useState(null);
  const [quickAddQty, setQuickAddQty] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, transRes] = await Promise.all([
        inventoryAPI.list(),
        inventoryTransactionsAPI.list()
      ]);
      const itemsData = itemsRes.data.results || itemsRes.data;
      const transData = transRes.data.results || transRes.data;
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setTransactions(Array.isArray(transData) ? transData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setItems([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const transYear = new Date(t.date).getFullYear();
    return transYear === yearFilter;
  });

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, itemForm);
        setEditingItem(null);
      } else {
        await inventoryAPI.create(itemForm);
      }
      setShowItemForm(false);
      setItemForm({ name: '', category: 'BaseMaterial', sub_category: '', unit: 'NOS', current_stock: 0, min_stock_level: 0, rate_per_unit: 0 });
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      sub_category: item.sub_category || '',
      unit: item.unit,
      current_stock: item.current_stock,
      min_stock_level: item.min_stock_level,
      rate_per_unit: item.rate_per_unit
    });
    setShowItemForm(true);
  };

  const handleCancelItemForm = () => {
    setShowItemForm(false);
    setEditingItem(null);
    setItemForm({ name: '', category: 'BaseMaterial', sub_category: '', unit: 'NOS', current_stock: 0, min_stock_level: 0, rate_per_unit: 0 });
  };

  const handleTransSubmit = async (e) => {
    e.preventDefault();
    try {
      await inventoryTransactionsAPI.create(transForm);
      setShowTransForm(false);
      setTransForm({ date: '', item: '', transaction_type: 'IN', quantity: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleQuickStockAdd = async () => {
    if (!quickAddItem || !quickAddQty) return;
    try {
      await inventoryTransactionsAPI.create({
        date: new Date().toISOString().split('T')[0],
        item: quickAddItem.id,
        transaction_type: 'IN',
        quantity: quickAddQty,
        notes: 'Quick add'
      });
      setQuickAddItem(null);
      setQuickAddQty('');
      loadData();
    } catch (error) {
      console.error('Failed to add stock:', error);
    }
  };

  const categories = ['BaseMaterial', 'Solutions', 'Tools', 'Consumables', 'Produce', 'Expense'];

  const subCategories = {
    BaseMaterial: ['Micronutrients', 'SoilAmendments', 'Microorganisms', 'Other'],
    Solutions: ['GrowthPromoters', 'PestControl', 'Fertilizers', 'Other'],
    Tools: ['HandTools', 'PowerTools', 'Other'],
    Consumables: ['Hardware', 'Safety', 'Other'],
    Produce: ['Spices', 'Timber', 'Compost', 'Other'],
    Expense: ['Labour', 'Transport', 'Maintenance', 'Other'],
  };

  const defaultUnits = {
    Micronutrients: 'GMS',
    SoilAmendments: 'KG',
    Microorganisms: 'GMS',
    Other: 'NOS',
    GrowthPromoters: 'LTR',
    PestControl: 'LTR',
    Fertilizers: 'LTR',
    HandTools: 'NOS',
    PowerTools: 'NOS',
    Hardware: 'NOS',
    Safety: 'NOS',
    Spices: 'KG',
    Timber: 'MT',
    Compost: 'KG',
    Labour: 'NOS',
    Transport: 'NOS',
    Maintenance: 'NOS',
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowItemForm(!showItemForm); setShowTransForm(false); }} className="btn btn-primary">Add Item</button>
          <button onClick={() => { setShowTransForm(!showTransForm); setShowItemForm(false); }} className="btn btn-secondary">Add/Remove Stock</button>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('items')} className={`pb-2 px-1 ${activeTab === 'items' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Items</button>
        <button onClick={() => setActiveTab('transactions')} className={`pb-2 px-1 ${activeTab === 'transactions' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Transactions</button>
        <button onClick={() => setActiveTab('stock')} className={`pb-2 px-1 ${activeTab === 'stock' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Stock by Category</button>
      </div>

      {showItemForm && (
        <div className="card">
          <form onSubmit={handleItemSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input type="text" placeholder="Item Name" value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} className="input" required />
              <select value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value, sub_category: ''})} className="input">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={itemForm.sub_category} onChange={(e) => setItemForm({...itemForm, sub_category: e.target.value, unit: defaultUnits[e.target.value] || 'NOS'})} className="input">
                <option value="">Select Sub Category</option>
                {subCategories[itemForm.category]?.map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </select>
              <select value={itemForm.unit} onChange={(e) => setItemForm({...itemForm, unit: e.target.value})} className="input">
                <option value="NOS">Numbers</option>
                <option value="GMS">Grams</option>
                <option value="KG">Kilograms</option>
                <option value="LTR">Liters</option>
              </select>
              <input type="number" placeholder="Current Stock" value={itemForm.current_stock} onChange={(e) => setItemForm({...itemForm, current_stock: e.target.value})} className="input" />
              <input type="number" placeholder="Min Stock Level" value={itemForm.min_stock_level} onChange={(e) => setItemForm({...itemForm, min_stock_level: e.target.value})} className="input" />
              <input type="number" step="0.01" placeholder="Rate per Unit" value={itemForm.rate_per_unit} onChange={(e) => setItemForm({...itemForm, rate_per_unit: e.target.value})} className="input" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">{editingItem ? 'Update Item' : 'Save Item'}</button>
              <button type="button" onClick={handleCancelItemForm} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showTransForm && (
        <div className="card">
          <form onSubmit={handleTransSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input type="date" max={new Date().toISOString().split('T')[0]} value={transForm.date} onChange={(e) => setTransForm({...transForm, date: e.target.value})} className="input" required />
              <select value={transForm.item} onChange={(e) => setTransForm({...transForm, item: e.target.value})} className="input" required>
                <option value="">Select Item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <select value={transForm.transaction_type} onChange={(e) => setTransForm({...transForm, transaction_type: e.target.value})} className="input">
                <option value="IN">Stock In</option>
                <option value="OUT">Stock Out</option>
              </select>
              <input type="number" placeholder="Quantity" value={transForm.quantity} onChange={(e) => setTransForm({...transForm, quantity: e.target.value})} className="input" required />
              <input type="text" placeholder="Notes" value={transForm.notes} onChange={(e) => setTransForm({...transForm, notes: e.target.value})} className="input" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">Save Transaction</button>
              <button type="button" onClick={() => setShowTransForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-48"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Sub Category</th>
                    <th className="text-left p-2">Stock</th>
                    <th className="text-left p-2">Min Level</th>
                    <th className="text-left p-2">Rate</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2">{item.category}</td>
                      <td className="p-2">{item.sub_category || '-'}</td>
                      <td className="p-2">{item.current_stock} {item.unit}</td>
                      <td className="p-2">{item.min_stock_level}</td>
                      <td className="p-2">₹{item.rate_per_unit}</td>
                      <td className="p-2">
                        <button 
                          onClick={() => handleEditItem(item)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <p className="p-4 text-center text-gray-500">No items found</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Year:</label>
            <select 
              value={yearFilter} 
              onChange={(e) => setYearFilter(parseInt(e.target.value))}
              className="input w-32"
            >
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Qty</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.slice(0, 50).map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="p-2">{t.date}</td>
                      <td className="p-2">{t.item_name}</td>
                      <td className="p-2">
                        <span className={`flex items-center gap-1 ${t.transaction_type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.transaction_type === 'IN' ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="p-2">{t.quantity} {t.item_unit}</td>
                      <td className="p-2">{t.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const catItems = items.filter(i => i.category === cat);
              return (
                <button 
                  key={cat}
                  type="button"
                  onClick={() => setSelectedStockCategory(cat === selectedStockCategory ? null : cat)}
                  className="card text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg mb-2">{cat}</h3>
                    {selectedStockCategory === cat ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{catItems.length} items</p>
                  <p className="text-sm text-gray-500">{catItems.reduce((a, b) => a + Number(b.current_stock), 0)} total stock</p>
                </button>
              );
            })}
          </div>
          
          {selectedStockCategory && (
            <div className="card">
              <h3 className="font-semibold text-lg mb-4">{selectedStockCategory} - By Sub Category</h3>
              {Object.entries(
                items.filter(i => i.category === selectedStockCategory).reduce((acc, item) => {
                  const subCat = item.sub_category || 'Other';
                  if (!acc[subCat]) acc[subCat] = [];
                  acc[subCat].push(item);
                  return acc;
                }, {})
              ).map(([subCat, subItems]) => (
                <div key={subCat} className="border-b last:border-b-0 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{subCat}</span>
                    <span className="text-sm text-gray-500">{subItems.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {subItems.map(item => (
                      <div key={item.id} className="bg-gray-50 p-2 rounded text-sm flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-gray-500">{item.current_stock} {item.unit}</div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setQuickAddItem(item)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {quickAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Add Stock</h3>
              <button onClick={() => setQuickAddItem(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Item</p>
              <p className="font-medium">{quickAddItem.name}</p>
              <p className="text-sm text-gray-500">Current: {quickAddItem.current_stock} {quickAddItem.unit}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Quantity to Add</label>
              <input 
                type="number" 
                value={quickAddQty}
                onChange={(e) => setQuickAddQty(e.target.value)}
                className="input w-full"
                placeholder="Enter quantity"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleQuickStockAdd}
                className="btn btn-primary flex-1"
              >
                Add Stock
              </button>
              <button 
                onClick={() => setQuickAddItem(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
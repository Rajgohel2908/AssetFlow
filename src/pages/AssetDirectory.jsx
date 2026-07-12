import React, { useState } from 'react';
import { Plus, X, ChevronRight } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { assets, assetHistory, categories, departments } from '../data/mockData';

const COLUMNS = [
  { key: 'id',          label: 'Asset ID' },
  { key: 'name',        label: 'Name' },
  { key: 'category',    label: 'Category' },
  { key: 'status',      label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'department',  label: 'Department', render: v => v ?? '—' },
  { key: 'assignedTo',  label: 'Assigned To', render: v => v ?? '—' },
  { key: 'location',    label: 'Location' },
  { key: 'value',       label: 'Value', render: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
  { key: 'purchaseDate',label: 'Purchase Date' },
];

export default function AssetDirectory() {
  const [assetsList, setAssetsList] = useState(assets);
  const [showForm,  setShowForm]  = useState(false);
  const [selected, setSelected]  = useState(null); // asset for drawer
  const [drawerTab, setDrawerTab] = useState('details');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [editingId,    setEditingId]    = useState(null);
  const [disposeAsset, setDisposeAsset] = useState(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newPurchDate, setNewPurchDate] = useState('');
  const [newPurchVal, setNewPurchVal] = useState('');
  const [newStatus, setNewStatus] = useState('Available');
  const [newIsBookable, setNewIsBookable] = useState(false);

  const filtered = assetsList.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (catFilter    && a.category !== catFilter)  return false;
    return true;
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!newName || !newCat) return alert('Name and Category are required');
    
    if (editingId) {
      setAssetsList(prev => prev.map(a => a.id === editingId ? {
        ...a,
        name: newName,
        category: newCat,
        serialNo: newSerial,
        department: newDept || null,
        location: newLoc,
        purchaseDate: newPurchDate,
        value: newPurchVal,
        status: newStatus
      } : a));
    } else {
      const newAsset = {
        id: `AF-0${100 + assetsList.length + 1}`,
        name: newName,
        category: newCat,
        serialNo: newSerial,
        department: newDept || null,
        assignedTo: null,
        location: newLoc,
        purchaseDate: newPurchDate,
        value: newPurchVal,
        status: newStatus,
        isBookable: newIsBookable
      };
      setAssetsList([newAsset, ...assetsList]);
    }
    
    setShowForm(false);
    setEditingId(null);
    setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('Available'); setNewIsBookable(false);
  };

  const handleEditClick = () => {
    setEditingId(selected.id);
    setNewName(selected.name);
    setNewCat(selected.category);
    setNewSerial(selected.serialNo || '');
    setNewDept(selected.department || '');
    setNewLoc(selected.location || '');
    setNewPurchDate(selected.purchaseDate || '');
    setNewPurchVal(selected.value || '');
    setNewStatus(selected.status);
    setNewIsBookable(selected.isBookable || false);
    setSelected(null);
    setShowForm(true);
  };

  const handleDisposeClick = () => {
    setDisposeAsset(selected);
  };

  const colsWithAction = React.useMemo(() => [
    ...COLUMNS,
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <button
          type="button"
          className="btn-ghost py-1 px-2 text-xs text-primary-600 flex items-center gap-1"
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation();
            setSelected(row); 
            setDrawerTab('details'); 
          }}
        >
          View <ChevronRight size={12} />
        </button>
      )
    }
  ], []);

  const history = selected ? (assetHistory[selected.id] ?? []) : [];

  return (
    <div className="space-y-5 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Asset Directory</h2>
          <p className="page-subtitle">All {assetsList.length} registered assets</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> Register Asset
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">{editingId ? 'Edit Asset Details' : 'Register New Asset'}</span>
            <button onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('Available'); setNewIsBookable(false);
            }} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <form onSubmit={handleRegister} className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="form-label">Asset Name *</label><input required className="form-input" placeholder="e.g. Dell XPS 15" value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div>
                <label className="form-label">Category *</label>
                <select required className="form-select" value={newCat} onChange={e => setNewCat(e.target.value)}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Serial Number</label><input className="form-input" placeholder="SN-XXXX" value={newSerial} onChange={e => setNewSerial(e.target.value)} /></div>
              <div>
                <label className="form-label">Department</label>
                <select className="form-select" value={newDept} onChange={e => setNewDept(e.target.value)}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Location</label><input className="form-input" placeholder="e.g. Floor 2, Storage A" value={newLoc} onChange={e => setNewLoc(e.target.value)} /></div>
              <div><label className="form-label">Purchase Date</label><input className="form-input" type="date" value={newPurchDate} onChange={e => setNewPurchDate(e.target.value)} /></div>
              <div><label className="form-label">Purchase Value (₹)</label><input className="form-input" type="number" placeholder="0" value={newPurchVal} onChange={e => setNewPurchVal(e.target.value)} /></div>
              <div><label className="form-label">Warranty Expiry</label><input className="form-input" type="date" /></div>
              <div>
                <label className="form-label">Initial Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="flex items-center gap-2 lg:mt-7">
                <input type="checkbox" id="isBookable" className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500" checked={newIsBookable} onChange={e => setNewIsBookable(e.target.checked)} />
                <label htmlFor="isBookable" className="text-sm font-medium text-gray-700">Mark as Shared Bookable Resource</label>
              </div>
            </div>
            <div className="mt-4">
              <label className="form-label">Notes</label>
              <textarea className="form-input h-20 resize-none" placeholder="Additional notes…" />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Register Asset'}</button>
              <button type="button" className="btn-secondary" onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('Available'); setNewIsBookable(false);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="form-select w-44 text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['Available','Allocated','Under Maintenance','Lost','Retired','Disposed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-select w-52 text-xs" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
        {(statusFilter || catFilter) && (
          <button
            className="btn-ghost text-xs text-gray-500"
            onClick={() => { setStatusFilter(''); setCatFilter(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          <DataTable
            columns={colsWithAction}
            data={filtered}
            searchKeys={['id', 'name', 'assignedTo', 'department', 'serialNo']}
          />
        </div>
      </div>

      {/* Asset Detail Drawer */}
      {selected && (
        <div style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-[9999] flex flex-col transform transition-transform">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-xs text-gray-400">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost py-1 px-2"><X size={16} /></button>
            </div>

            {/* Status + badge */}
            <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-gray-400">{selected.category} · {selected.location}</span>
            </div>

            {/* Drawer tabs */}
            <div className="flex border-b border-gray-100 px-6 gap-1">
              {['details', 'history'].map(t => (
                <button
                  key={t}
                  className={`tab-btn capitalize ${drawerTab === t ? 'active' : ''}`}
                  onClick={() => setDrawerTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {drawerTab === 'details' ? (
                <div className="space-y-3">
                  {[
                    ['Asset ID',      selected.id],
                    ['Serial Number', selected.serialNo],
                    ['Category',      selected.category],
                    ['Status',        <StatusBadge key="s" status={selected.status} />],
                    ['Department',    selected.department ?? '—'],
                    ['Assigned To',   selected.assignedTo ?? '—'],
                    ['Location',      selected.location],
                    ['Purchase Date', selected.purchaseDate],
                    ['Value',         selected.value ? `₹${Number(selected.value).toLocaleString()}` : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className="text-xs font-medium text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-400">No history available.</p>
                  ) : history.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                        {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-semibold text-gray-800">{h.action}</p>
                        <p className="text-xs text-gray-500">{h.note}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{h.date} · {h.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button onClick={handleEditClick} className="btn-primary text-xs flex-1">Edit Asset</button>
              <button onClick={handleDisposeClick} className="btn-secondary text-xs text-red-600 border-red-200 hover:bg-red-50">Dispose</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispose Confirmation Modal */}
      {disposeAsset && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDisposeAsset(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-[400px] flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <X className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Dispose Asset</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to mark <span className="font-semibold text-gray-800">{disposeAsset.name}</span> as Disposed? This action will permanently update the asset's status.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="btn-secondary" 
                onClick={() => setDisposeAsset(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary !bg-red-600 hover:!bg-red-700 border-transparent shadow-sm" 
                onClick={() => {
                  setAssetsList(prev => prev.map(a => a.id === disposeAsset.id ? { ...a, status: 'Disposed' } : a));
                  setDisposeAsset(null);
                  setSelected(null);
                }}
              >
                Yes, Dispose
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

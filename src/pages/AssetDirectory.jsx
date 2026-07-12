import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, ChevronRight } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { assetHistory } from '../data/mockData';
import api from '../utils/api';

const COLUMNS = [
  { key: 'assetTag',    label: 'Asset ID' },
  { key: 'name',        label: 'Name' },
  { key: 'category',    label: 'Category', render: v => v?.name || v },
  { key: 'status',      label: 'Status', render: v => <StatusBadge status={v} /> },
  { key: 'holderDepartment',  label: 'Department', render: v => v?.name ?? '—' },
  { key: 'holderUser',  label: 'Assigned To', render: v => v?.name ?? '—' },
  { key: 'location',    label: 'Location' },
  { key: 'acquisitionCost', label: 'Value', render: v => v ? `₹${Number(v).toLocaleString()}` : '—' },
  { key: 'acquisitionDate', label: 'Purchase Date', render: v => v ? new Date(v).toISOString().split('T')[0] : '—' },
];

export default function AssetDirectory() {
  const [assetsList, setAssetsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assRes, catRes, deptRes] = await Promise.all([
          api.get('/assets'),
          api.get('/asset-categories'),
          api.get('/departments')
        ]);
        setAssetsList(assRes.data.data || []);
        setCategoriesList(catRes.data.data || []);
        setDepartmentsList(deptRes.data.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);
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
  const [newStatus, setNewStatus] = useState('AVAILABLE');
  const [newIsBookable, setNewIsBookable] = useState(false);

  const filtered = assetsList.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (catFilter    && a.category?.name !== catFilter)  return false;
    return true;
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newName || !newCat) return toast.error('Name and Category are required');
    
    const payload = {
      name: newName,
      categoryId: newCat,
      holderDepartmentId: newDept || null,
      location: newLoc || null,
      acquisitionDate: newPurchDate ? new Date(newPurchDate).toISOString() : null,
      acquisitionCost: newPurchVal ? Number(newPurchVal) : null,
      serialNumber: newSerial || null,
      condition: 'Good',
      isBookable: newIsBookable,
    };

    try {
      if (editingId) {
        const res = await api.put(`/assets/${editingId}`, payload);
        if (newStatus !== selected.status) {
          await api.patch(`/assets/${editingId}/status`, { status: newStatus, reason: 'Updated via UI' });
          res.data.data.status = newStatus;
        }
        setAssetsList(prev => prev.map(a => a.id === editingId ? res.data.data : a));
        toast.success('Asset successfully updated!');
      } else {
        const res = await api.post('/assets', payload);
        if (newStatus !== 'AVAILABLE') {
          await api.patch(`/assets/${res.data.data.id}/status`, { status: newStatus, reason: 'Initial status setup' });
          res.data.data.status = newStatus;
        }
        setAssetsList([res.data.data, ...assetsList]);
        toast.success('Asset successfully registered!');
      }
      setShowForm(false);
      setEditingId(null);
      setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('AVAILABLE'); setNewIsBookable(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving asset');
    }
  };

  const handleEditClick = () => {
    setEditingId(selected.id);
    setNewName(selected.name);
    setNewCat(selected.category?.id || selected.categoryId);
    setNewSerial(selected.serialNumber || '');
    setNewDept(selected.holderDepartment?.id || selected.holderDepartmentId || '');
    setNewLoc(selected.location || '');
    setNewPurchDate(selected.acquisitionDate ? new Date(selected.acquisitionDate).toISOString().split('T')[0] : '');
    setNewPurchVal(selected.acquisitionCost || '');
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
          className="btn-ghost py-1 px-2 text-xs text-[#52525b] flex items-center gap-1"
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

  const history = selected ? (assetHistory[selected.assetTag] ?? []) : [];

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
              setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('AVAILABLE'); setNewIsBookable(false);
            }} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <form onSubmit={handleRegister} className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="form-label">Asset Name *</label><input required className="form-input" placeholder="e.g. Dell XPS 15" value={newName} onChange={e => setNewName(e.target.value)} /></div>
              <div>
                <label className="form-label">Category *</label>
                <select required className="form-select" value={newCat} onChange={e => setNewCat(e.target.value)}>
                  <option value="">Select category…</option>
                  {categoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Serial Number</label><input className="form-input" placeholder="SN-XXXX" value={newSerial} onChange={e => setNewSerial(e.target.value)} /></div>
              <div>
                <label className="form-label">Department</label>
                <select className="form-select" value={newDept} onChange={e => setNewDept(e.target.value)}>
                  <option value="">None</option>
                  {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Location</label><input className="form-input" placeholder="e.g. Floor 2, Storage A" value={newLoc} onChange={e => setNewLoc(e.target.value)} /></div>
              <div><label className="form-label">Purchase Date</label><input className="form-input" type="date" value={newPurchDate} onChange={e => setNewPurchDate(e.target.value)} /></div>
              <div><label className="form-label">Purchase Value (₹)</label><input className="form-input" type="number" placeholder="0" value={newPurchVal} onChange={e => setNewPurchVal(e.target.value)} /></div>
              <div><label className="form-label">Warranty Expiry</label><input className="form-input" type="date" /></div>
              <div>
                <label className="form-label">Initial Status</label>
                <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="AVAILABLE">Available</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
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
                setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('AVAILABLE'); setNewIsBookable(false);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="form-select w-44 text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="LOST">Lost</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>
        <select className="form-select w-52 text-xs" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categoriesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {(statusFilter || catFilter) && (
          <button
            className="btn-ghost text-xs text-[#71717a]"
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
            searchKeys={['assetTag', 'name', 'holderUser', 'holderDepartment', 'serialNumber']}
          />
        </div>
      </div>

      {/* Asset Detail Drawer */}
      {selected && (
        <div style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-[9999] flex flex-col transform transition-transform">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f4f4f5]">
              <div>
                <h3 className="text-base font-semibold text-[#111111]">{selected.name}</h3>
                <p className="text-xs text-[#a1a1aa]">{selected.assetTag}</p>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost py-1 px-2"><X size={16} /></button>
            </div>

            {/* Status + badge */}
            <div className="px-6 py-3 border-b border-[#f4f4f5] flex items-center gap-3">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-[#a1a1aa]">{selected.category?.name} · {selected.location}</span>
            </div>

            {/* Drawer tabs */}
            <div className="flex border-b border-[#f4f4f5] px-6 gap-1">
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
                    ['Asset ID',      selected.assetTag],
                    ['Serial Number', selected.serialNumber],
                    ['Category',      selected.category?.name],
                    ['Status',        <StatusBadge key="s" status={selected.status} />],
                    ['Department',    selected.holderDepartment?.name ?? '—'],
                    ['Assigned To',   selected.holderUser?.name ?? '—'],
                    ['Location',      selected.location],
                    ['Purchase Date', selected.acquisitionDate ? new Date(selected.acquisitionDate).toISOString().split('T')[0] : '—'],
                    ['Value',         selected.acquisitionCost ? `₹${Number(selected.acquisitionCost).toLocaleString()}` : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-[#f4f4f5]">
                      <span className="text-xs text-[#71717a]">{label}</span>
                      <span className="text-xs font-medium text-[#18181b]">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-sm text-[#a1a1aa]">No history available.</p>
                  ) : history.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-[#18181b] mt-1.5 flex-shrink-0" />
                        {i < history.length - 1 && <div className="w-0.5 flex-1 bg-[#e4e4e7] my-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-semibold text-[#18181b]">{h.action}</p>
                        <p className="text-xs text-[#71717a]">{h.note}</p>
                        <p className="text-[10px] text-[#a1a1aa] mt-0.5">{h.date} · {h.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#f4f4f5] flex gap-2">
              <button onClick={handleEditClick} className="btn-primary text-xs flex-1">Edit Asset</button>
              <button onClick={handleDisposeClick} className="btn-secondary text-xs text-[#991b1b] border-[#fecaca] hover:bg-[#fef2f2]">Dispose</button>
            </div>
          </div>
        </div>
      )}

      {/* Dispose Confirmation Modal */}
      {disposeAsset && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDisposeAsset(null)} />
          <div className="relative bg-white rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.1)] p-6 w-[400px] flex flex-col gap-4 border border-[#e4e4e7]">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center mb-2">
                <X className="text-[#991b1b]" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-[#111111]">Dispose Asset</h3>
              <p className="text-sm text-[#71717a]">
                Are you sure you want to mark <span className="font-semibold text-[#18181b]">{disposeAsset.name}</span> as Disposed? This action will permanently update the asset's status.
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
                onClick={async () => {
                  try {
                    await api.patch(`/assets/${disposeAsset.id}/status`, { status: 'Disposed', reason: 'Disposed via UI' });
                    setAssetsList(prev => prev.map(a => a.id === disposeAsset.id ? { ...a, status: 'Disposed' } : a));
                  } catch (err) { toast.error('Error disposing asset'); }
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

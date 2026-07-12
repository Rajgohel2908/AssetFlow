import { useState } from 'react';
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
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newPurchDate, setNewPurchDate] = useState('');
  const [newPurchVal, setNewPurchVal] = useState('');
  const [newStatus, setNewStatus] = useState('Available');

  const filtered = assetsList.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (catFilter    && a.category !== catFilter)  return false;
    return true;
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (!newName || !newCat) return alert('Name and Category are required');
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
      status: newStatus
    };
    setAssetsList([newAsset, ...assetsList]);
    setShowForm(false);
    setNewName(''); setNewCat(''); setNewSerial(''); setNewDept(''); setNewLoc(''); setNewPurchDate(''); setNewPurchVal(''); setNewStatus('Available');
  };

  const colsWithAction = [
    ...COLUMNS,
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <button
          className="btn-ghost py-1 px-2 text-xs text-primary-600 flex items-center gap-1"
          onClick={() => { setSelected(row); setDrawerTab('details'); }}
        >
          View <ChevronRight size={12} />
        </button>
      )
    }
  ];

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
            <span className="text-sm font-semibold">Register New Asset</span>
            <button onClick={() => setShowForm(false)} className="btn-ghost py-1 px-2"><X size={14} /></button>
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
            </div>
            <div className="mt-4">
              <label className="form-label">Notes</label>
              <textarea className="form-input h-20 resize-none" placeholder="Additional notes…" />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">Register Asset</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
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
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
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
              <button className="btn-primary text-xs flex-1">Edit Asset</button>
              <button className="btn-secondary text-xs">Dispose</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

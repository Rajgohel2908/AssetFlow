import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConflictModal from '../components/common/ConflictModal';
import ApprovalWorkflowStepper from '../components/common/ApprovalWorkflowStepper';
import api from '../utils/api';

const ALLOC_COLS = [
  { key: 'id',         label: 'ID' },
  { key: 'asset',      label: 'Asset', render: v => v?.name || '—' },
  { key: 'user',       label: 'Assigned To', render: v => v?.name || '—' },
  { key: 'user.department', label: 'Department', render: (_, row) => row.user?.department?.name || '—' },
  { key: 'createdAt',  label: 'Allocated On', render: v => new Date(v).toLocaleDateString() },
  { key: 'expectedReturnDate',  label: 'Due Return', render: v => v ? new Date(v).toLocaleDateString() : 'Indefinite' },
  { key: 'status',     label: 'Status', render: v => <StatusBadge status={v} /> },
];

const TRF_COLS = [
  { key: 'id',        label: 'ID' },
  { key: 'asset',     label: 'Asset', render: v => v?.name || '—' },
  { key: 'fromUser',  label: 'From', render: v => v?.name || '—' },
  { key: 'toUser',    label: 'To', render: v => v?.name || '—' },
  { key: 'toHolderDept', label: 'To Dept', render: v => v?.name || '—' },
  { key: 'createdAt', label: 'Requested', render: v => new Date(v).toLocaleDateString() },
  { key: 'status',    label: 'Status', render: v => <StatusBadge status={v} /> },
];

export default function AssetAllocation() {
  const [tab,          setTab]          = useState(0); // 0=allocations, 1=transfers
  const [showForm,     setShowForm]     = useState(false);
  const [showTrfForm,  setShowTrfForm]  = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictInfo, setConflictInfo] = useState('');
  
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const [trfAsset, setTrfAsset] = useState('');
  const [trfUser, setTrfUser] = useState('');
  const [trfReason, setTrfReason] = useState('');

  const [stepperStatus, setStepperStatus] = useState('All');
  
  const [allocs, setAllocs] = useState([]);
  const [trfs, setTrfs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);

  const fetchData = async () => {
    try {
      const [allocRes, trfRes, assetRes, empRes] = await Promise.all([
        api.get('/allocations'),
        api.get('/transfer-requests'),
        api.get('/assets'),
        api.get('/employees')
      ]);
      setAllocs(allocRes.data.data || []);
      setTrfs(trfRes.data.data || []);
      setAssets(assetRes.data.data || []);
      setEmployees(empRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load allocation data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTransfer = async (id, action) => { // action = 'approve' | 'reject'
    try {
      await api.patch(`/transfer-requests/${id}/${action}`);
      toast.success(`Transfer request ${action}d successfully`);
      fetchData(); // refresh data
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} transfer`);
    }
  };

  const availableAssets = assets.filter(a => a.status === 'AVAILABLE');

  const handleAllocate = async () => {
    if (!selectedAsset || !selectedUser) return toast.error('Select asset and user');
    try {
      await api.post('/allocations', {
        assetId: selectedAsset,
        userId: selectedUser,
        expectedReturnDate: dueDate ? new Date(dueDate).toISOString() : null,
        conditionNotes: purpose || null,
      });
      toast.success('Asset allocated successfully!');
      setShowForm(false);
      setSelectedAsset(''); setSelectedUser(''); setDueDate(''); setPurpose('');
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        const holder = err.response.data.details?.[0]?.currentHolder;
        if (holder) {
          setConflictInfo(`${holder.name} (${holder.department || 'Unknown'})`);
        } else {
          setConflictInfo('Someone else');
        }
        setConflictOpen(true);
      } else {
        toast.error('Failed to allocate: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSubmitTransfer = async () => {
    if (!trfAsset || !trfUser) return toast.error('Select asset and user');
    try {
      await api.post('/transfer-requests', {
        assetId: trfAsset,
        toUserId: trfUser,
        reason: trfReason || null,
      });
      toast.success('Transfer requested successfully!');
      setShowTrfForm(false);
      setTrfAsset(''); setTrfUser(''); setTrfReason('');
      fetchData();
    } catch (err) {
      toast.error('Failed to request transfer: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Asset Allocation & Transfer</h2>
          <p className="page-subtitle">Manage allocations and transfer requests</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => { setShowTrfForm(s => !s); setShowForm(false); }}>
            <Plus size={14} /> New Transfer
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(s => !s); setShowTrfForm(false); }}>
            <Plus size={14} /> Allocate Asset
          </button>
        </div>
      </div>

      {/* Allocate Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">New Allocation</span>
            <button onClick={() => setShowForm(false)} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Asset *</label>
                <select className="form-select" value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
                  <option value="">Select asset…</option>
                  {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Assign To *</label>
                <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department?.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Due Return Date</label><input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              <div>
                <label className="form-label">Purpose / Notes</label>
                <input className="form-input" placeholder="Reason for allocation" value={purpose} onChange={e => setPurpose(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary" onClick={handleAllocate}>Submit Allocation</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Form */}
      {showTrfForm && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">New Transfer Request</span>
            <button onClick={() => setShowTrfForm(false)} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Asset *</label>
                <select className="form-select" value={trfAsset} onChange={e => setTrfAsset(e.target.value)}>
                  <option value="">Select allocated asset…</option>
                  {allocs.filter(a => a.status === 'ACTIVE').map(a => <option key={a.id} value={a.asset.id}>{a.asset.name} ({a.asset.assetTag}) - Held by {a.user?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Transfer To *</label>
                <select className="form-select" value={trfUser} onChange={e => setTrfUser(e.target.value)}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department?.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Reason</label><input className="form-input" placeholder="Reason for transfer" value={trfReason} onChange={e => setTrfReason(e.target.value)} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary" onClick={handleSubmitTransfer}>Submit Transfer</button>
              <button className="btn-secondary" onClick={() => setShowTrfForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e4e4e7] gap-1 mt-6">
        {['Active Allocations', 'Transfer Requests'].map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div className="card">
          <div className="card-body">
            <DataTable
              columns={ALLOC_COLS}
              data={allocs}
              searchKeys={['asset.name', 'user.name', 'user.department.name']}
            />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Transfer Requests</span>
            <div className="flex gap-2">
              {['All', 'REQUESTED','APPROVED','REJECTED'].map(s => (
                <button key={s} onClick={() => { setStepperStatus(s); }}
                  className={`text-xs px-2 py-1 rounded border ${stepperStatus===s ? 'bg-[#18181b] text-white border-[#18181b]' : 'border-[#d4d4d8] text-[#52525b] hover:bg-[#fafafa]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f4f4f5]">
              <thead>
                <tr>
                  {TRF_COLS.map(c => (
                    <th key={c.key} className="table-th">{c.label}</th>
                  ))}
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#f4f4f5]">
                {trfs.filter(r => stepperStatus === 'All' || r.status === stepperStatus).map(r => (
                  <tr key={r.id} className="table-tr">
                    <td className="table-td">{r.id.substring(0,8)}</td>
                    <td className="table-td font-medium">{r.asset?.name}</td>
                    <td className="table-td">{r.fromUser?.name}</td>
                    <td className="table-td">{r.toUser?.name}</td>
                    <td className="table-td">{r.toHolderDept?.name || '—'}</td>
                    <td className="table-td">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="table-td"><StatusBadge status={r.status} /></td>
                    <td className="table-td">
                      {r.status === 'REQUESTED' && (
                        <div className="flex gap-1">
                          <button 
                            className="btn-ghost py-1 px-2 text-xs text-emerald-600"
                            onClick={() => handleUpdateTransfer(r.id, 'approve')}
                          >
                            <CheckCircle size={13}/> Approve
                          </button>
                          <button 
                            className="btn-ghost py-1 px-2 text-xs text-red-500"
                            onClick={() => handleUpdateTransfer(r.id, 'reject')}
                          >
                            <XCircle size={13}/> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {trfs.filter(r => stepperStatus === 'All' || r.status === stepperStatus).length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-sm text-[#71717a]">
                      No transfer requests found for status: {stepperStatus}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConflictModal
        isOpen={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Asset Already Allocated"
        message="This asset is currently allocated to another employee and cannot be directly assigned."
        conflictDetail={`This asset is currently held by ${conflictInfo}.`}
        alternativeLabel="Request Transfer Instead"
        onAlternative={() => { setConflictOpen(false); setShowTrfForm(true); setShowForm(false); }}
      />
    </div>
  );
}

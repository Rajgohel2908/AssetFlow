import { useState } from 'react';
import { Plus, X, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConflictModal from '../components/common/ConflictModal';
import ApprovalWorkflowStepper from '../components/common/ApprovalWorkflowStepper';
import { allocations as initialAllocations, transferRequests, assets, employees } from '../data/mockData';
import api from '../utils/api';

const ALLOC_COLS = [
  { key: 'id',         label: 'ID' },
  { key: 'assetName',  label: 'Asset' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'department', label: 'Department' },
  { key: 'allocatedOn',label: 'Allocated On' },
  { key: 'dueReturn',  label: 'Due Return', render: v => v ?? 'Indefinite' },
  { key: 'status',     label: 'Status', render: v => <StatusBadge status={v} /> },
];

const TRF_COLS = [
  { key: 'id',        label: 'ID' },
  { key: 'assetName', label: 'Asset' },
  { key: 'from',      label: 'From' },
  { key: 'to',        label: 'To' },
  { key: 'toDept',    label: 'To Dept' },
  { key: 'date',      label: 'Requested' },
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
  const [stepperStatus, setStepperStatus] = useState('Approved');
  const [allocs, setAllocs] = useState(initialAllocations);
  const [trfs, setTrfs] = useState(transferRequests);

  const handleUpdateTransfer = (id, newStatus) => {
    setTrfs(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const availableAssets = assets.filter(a => a.status === 'Available');

  const handleAllocate = async () => {
    if (!selectedAsset || !selectedUser) return alert('Select asset and user');
    try {
      const res = await api.post('/allocations', {
        assetId: selectedAsset,
        userId: selectedUser,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      // success!
      setAllocs([{
        id: res.data.data.id,
        assetName: assets.find(a => a.id === selectedAsset)?.name || selectedAsset,
        assignedTo: employees.find(e => e.id === selectedUser)?.name || selectedUser,
        department: 'N/A',
        allocatedOn: new Date().toLocaleDateString(),
        dueReturn: dueDate || null,
        status: 'Active'
      }, ...allocs]);
      setShowForm(false);
      setSelectedAsset(''); setSelectedUser(''); setDueDate('');
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
        alert('Failed to allocate: ' + (err.response?.data?.message || err.message));
      }
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
                  {availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Assign To *</label>
                <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
              <div><label className="form-label">Due Return Date</label><input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
              <div>
                <label className="form-label">Purpose</label>
                <input className="form-input" placeholder="Reason for allocation" />
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
                <select className="form-select">
                  <option value="">Select asset…</option>
                  {allocs.map(a => <option key={a.id}>{a.assetName} ({a.assetId})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Transfer To *</label>
                <select className="form-select">
                  <option value="">Select employee…</option>
                  {employees.map(e => <option key={e.id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
              <div><label className="form-label">Reason</label><input className="form-input" placeholder="Reason for transfer" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary">Submit Transfer</button>
              <button className="btn-secondary" onClick={() => setShowTrfForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Stepper Demo */}
      <div className="card">
        <div className="card-header">
          <span className="text-sm font-semibold">Transfer Approval Progress — TRF-002</span>
          <div className="flex gap-2">
            {['All', 'Pending','Approved','In Progress','Resolved'].map(s => (
              <button key={s} onClick={() => { setStepperStatus(s); setTab(1); }}
                className={`text-xs px-2 py-1 rounded border ${stepperStatus===s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body">
          <ApprovalWorkflowStepper currentStatus={stepperStatus === 'All' ? 'Pending' : stepperStatus} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
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
              searchKeys={['assetName', 'assignedTo', 'department']}
            />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Transfer Requests</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  {['ID','Asset','From','To','To Dept','Requested','Status','Action'].map(h=>(
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {trfs.filter(r => stepperStatus === 'All' || r.status === stepperStatus).map(r => (
                  <tr key={r.id} className="table-tr">
                    <td className="table-td">{r.id}</td>
                    <td className="table-td font-medium">{r.assetName}</td>
                    <td className="table-td">{r.from}</td>
                    <td className="table-td">{r.to}</td>
                    <td className="table-td">{r.toDept}</td>
                    <td className="table-td">{r.date}</td>
                    <td className="table-td"><StatusBadge status={r.status} /></td>
                    <td className="table-td">
                      {r.status === 'Pending' && (
                        <div className="flex gap-1">
                          <button 
                            className="btn-ghost py-1 px-2 text-xs text-emerald-600"
                            onClick={() => handleUpdateTransfer(r.id, 'Approved')}
                          >
                            <CheckCircle size={13}/> Approve
                          </button>
                          <button 
                            className="btn-ghost py-1 px-2 text-xs text-red-500"
                            onClick={() => handleUpdateTransfer(r.id, 'Rejected')}
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
                    <td colSpan="8" className="text-center py-8 text-sm text-gray-500">
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

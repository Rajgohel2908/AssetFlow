import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, GripVertical } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import ApprovalWorkflowStepper from '../components/common/ApprovalWorkflowStepper';
import api from '../utils/api';

const STAGES = ['Pending', 'Approved', 'In Progress', 'Resolved'];

const STAGE_COLORS = {
  'Pending':     'border-amber-300 bg-amber-50',
  'Approved':    'border-blue-300 bg-blue-50',
  'In Progress': 'border-indigo-300 bg-indigo-50',
  'Resolved':    'border-emerald-300 bg-emerald-50',
};

const STAGE_HEADER_COLORS = {
  'Pending':     'text-amber-700',
  'Approved':    'text-blue-700',
  'In Progress': 'text-indigo-700',
  'Resolved':    'text-emerald-700',
};

const PRIORITY_COLORS = {
  'High':   'text-red-600',
  'Critical': 'text-red-700 font-bold',
  'Medium': 'text-amber-600',
  'Low':    'text-blue-600',
};

export default function Maintenance() {
  const [reqs, setReqs] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  
  // Form State
  const [assetId, setAssetId] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [cost, setCost] = useState('');
  const [issue, setIssue] = useState('');
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [reqsRes, assetsRes] = await Promise.all([
        api.get('/maintenance-requests'),
        api.get('/assets')
      ]);
      
      const mappedReqs = reqsRes.data.data.map(r => ({
        ...r,
        assetName: r.asset?.name || 'Unknown',
        assetTag: r.asset?.assetTag || '',
        raisedBy: r.raisedBy?.name || 'Unknown',
        raisedDate: new Date(r.createdAt).toLocaleDateString(),
        issue: r.issueDescription || '',
        status: r.status === 'PENDING' ? 'Pending' : 
                r.status === 'APPROVED' ? 'Approved' : 
                ['TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(r.status) ? 'In Progress' : 'Resolved',
        priority: r.priority === 'CRITICAL' ? 'Critical' : 
                  r.priority === 'HIGH' ? 'High' : 
                  r.priority === 'MEDIUM' ? 'Medium' : 'Low'
      }));
      setReqs(mappedReqs);
      setAssetsList(assetsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load maintenance data', err);
      toast.error('Failed to load maintenance requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = reqs.filter(r => r.status === s);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId || !issue) return toast.error('Asset and Issue are required');
    try {
      await api.post('/maintenance-requests', {
        assetId,
        priority: priority.toUpperCase(),
        issueDescription: issue,
        estimatedCost: cost ? parseFloat(cost) : null
      });
      toast.success('Maintenance request submitted successfully');
      setShowForm(false);
      setAssetId(''); setIssue(''); setCost(''); setPriority('LOW');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.patch(`/maintenance-requests/${id}/${action}`);
      toast.success(`Request ${action}d successfully`);
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Maintenance Management</h2>
          <p className="page-subtitle">Track and manage asset maintenance requests</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> Raise Request
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">New Maintenance Request</span>
            <button onClick={() => setShowForm(false)} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Asset *</label>
                <select className="form-select" value={assetId} onChange={e => setAssetId(e.target.value)}>
                  <option value="">Select asset…</option>
                  {assetsList.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetTag})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority *</label>
                <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div><label className="form-label">Estimated Cost (₹)</label><input className="form-input" type="number" placeholder="0" value={cost} onChange={e => setCost(e.target.value)} /></div>
              <div className="lg:col-span-3">
                <label className="form-label">Issue Description *</label>
                <textarea className="form-input h-20 resize-none" placeholder="Describe the issue in detail…" value={issue} onChange={e => setIssue(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">Submit Request</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-8 text-sm text-[#71717a]">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {STAGES.map(stage => (
            <div key={stage} className={`rounded-xl border-2 ${STAGE_COLORS[stage]} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wide ${STAGE_HEADER_COLORS[stage]}`}>{stage}</h3>
                <span className="text-xs font-bold text-[#71717a] bg-white rounded-full px-2 py-0.5">
                  {grouped[stage]?.length || 0}
                </span>
              </div>

              <div className="space-y-2">
                {grouped[stage]?.map(req => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-[#e4e4e7] p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelected(req)}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className="text-xs font-semibold text-[#111111] leading-tight">{req.assetName}</p>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span>
                    </div>
                    <p className="text-[11px] text-[#71717a] mb-2 line-clamp-2">{req.issue}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#a1a1aa]">{req.id.substring(0,8)}</span>
                      <span className="text-[10px] text-[#a1a1aa]">{req.raisedDate}</span>
                    </div>
                  </div>
                ))}

                {(!grouped[stage] || grouped[stage].length === 0) && (
                  <p className="text-[11px] text-center text-[#a1a1aa] py-4">No requests</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#f4f4f5]">
              <h3 className="text-sm font-semibold">{selected.assetName} — {selected.id.substring(0,8)}</h3>
              <button onClick={() => setSelected(null)} className="btn-ghost py-1 px-2"><X size={14} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <ApprovalWorkflowStepper currentStatus={selected.status} />
              <div className="mt-4 space-y-2">
                {[
                  ['Issue',    selected.issue],
                  ['Priority', <span key="priority" className={`font-semibold ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span>],
                  ['Raised By', selected.raisedBy],
                  ['Raised On', selected.raisedDate],
                  ['Assigned To', selected.technician?.name ?? '—'],
                  ['Est. Cost', selected.estimatedCost ? `₹${selected.estimatedCost}` : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-[#f4f4f5]">
                    <span className="text-xs text-[#71717a]">{label}</span>
                    <span className="text-xs font-medium text-[#18181b]">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#f4f4f5] flex gap-2">
              {selected.status === 'Pending' && (
                <button className="btn-primary text-xs" onClick={() => handleAction(selected.id, 'approve')}>Approve</button>
              )}
              {(selected.status === 'Approved' || selected.status === 'In Progress') && (
                <button className="btn-secondary text-xs" onClick={() => handleAction(selected.id, 'resolve')}>Mark Resolved</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

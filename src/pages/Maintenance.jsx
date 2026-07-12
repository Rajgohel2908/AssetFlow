import { useState } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import ApprovalWorkflowStepper from '../components/common/ApprovalWorkflowStepper';
import { maintenanceRequests, assets } from '../data/mockData';

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
  'Medium': 'text-amber-600',
  'Low':    'text-blue-600',
};

export default function Maintenance() {
  const [reqs, setReqs] = useState(maintenanceRequests);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const grouped = STAGES.reduce((acc, s) => {
    acc[s] = reqs.filter(r => r.status === s);
    return acc;
  }, {});

  const moveCard = (id, newStatus) => {
    setReqs(rs => rs.map(r => r.id === id ? { ...r, status: newStatus } : r));
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
          <div className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Asset *</label>
                <select className="form-select">
                  <option value="">Select asset…</option>
                  {assets.map(a => <option key={a.id}>{a.name} ({a.id})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority *</label>
                <select className="form-select">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
              <div><label className="form-label">Estimated Cost ($)</label><input className="form-input" type="number" placeholder="0" /></div>
              <div className="lg:col-span-3">
                <label className="form-label">Issue Description *</label>
                <textarea className="form-input h-20 resize-none" placeholder="Describe the issue in detail…" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary">Submit Request</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {STAGES.map(stage => (
          <div key={stage} className={`rounded-xl border-2 ${STAGE_COLORS[stage]} p-3`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold uppercase tracking-wide ${STAGE_HEADER_COLORS[stage]}`}>{stage}</h3>
              <span className="text-xs font-bold text-gray-500 bg-white rounded-full px-2 py-0.5">
                {grouped[stage].length}
              </span>
            </div>

            <div className="space-y-2">
              {grouped[stage].map(req => (
                <div
                  key={req.id}
                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelected(req)}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{req.assetName}</p>
                    <span className={`text-[10px] font-bold flex-shrink-0 ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">{req.issue}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{req.id}</span>
                    <span className="text-[10px] text-gray-400">{req.raisedDate}</span>
                  </div>
                  {/* Move buttons */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {STAGES.filter(s => s !== stage).map(s => (
                      <button
                        key={s}
                        onClick={e => { e.stopPropagation(); moveCard(req.id, s); }}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {grouped[stage].length === 0 && (
                <p className="text-[11px] text-center text-gray-400 py-4">No requests</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold">{selected.assetName} — {selected.id}</h3>
              <button onClick={() => setSelected(null)} className="btn-ghost py-1 px-2"><X size={14} /></button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <ApprovalWorkflowStepper currentStatus={selected.status} />
              <div className="mt-4 space-y-2">
                {[
                  ['Issue',    selected.issue],
                  ['Priority', <span className={`font-semibold ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span>],
                  ['Raised By', selected.raisedBy],
                  ['Raised On', selected.raisedDate],
                  ['Assigned To', selected.assignedTo ?? '—'],
                  ['Est. Cost', selected.estimatedCost ? `$${selected.estimatedCost}` : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-medium text-gray-800">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              <button className="btn-primary text-xs">Approve</button>
              <button className="btn-secondary text-xs">Mark Resolved</button>
              <button className="btn-ghost text-xs text-red-500">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

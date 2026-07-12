import { useState } from 'react';
import { Plus, X, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { auditCycles, assets } from '../data/mockData';

const CHECKLIST_STATUS = ['Verified', 'Missing', 'Damaged'];
const STATUS_ICONS = {
  'Verified': <Check size={13} className="text-emerald-600" />,
  'Missing':  <X size={13} className="text-red-500" />,
  'Damaged':  <AlertTriangle size={13} className="text-orange-500" />,
};

export default function AssetAudit() {
  const [cycles, setCycles]     = useState(auditCycles);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const updateChecklistItem = (cycleId, assetId, newStatus) => {
    setCycles(cs => cs.map(c =>
      c.id === cycleId
        ? { ...c, checklist: c.checklist.map(item => item.assetId === assetId ? { ...item, status: newStatus } : item) }
        : c
    ));
    if (selected?.id === cycleId) {
      setSelected(prev => ({
        ...prev,
        checklist: prev.checklist.map(item => item.assetId === assetId ? { ...item, status: newStatus } : item)
      }));
    }
  };

  const discrepancies = selected
    ? selected.checklist.filter(i => i.status !== 'Verified')
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Asset Audit</h2>
          <p className="page-subtitle">Create and manage audit cycles for physical asset verification</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> Create Audit Cycle
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">New Audit Cycle</span>
            <button onClick={() => setShowForm(false)} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="form-label">Audit Name *</label>
                <input className="form-input" placeholder="e.g. Q1 2024 Full Audit" />
              </div>
              <div>
                <label className="form-label">Scope</label>
                <select className="form-select">
                  <option>All Assets</option>
                  <option>IT Assets</option>
                  <option>Furniture</option>
                  <option>Vehicles</option>
                </select>
              </div>
              <div><label className="form-label">Start Date</label><input className="form-input" type="date" /></div>
              <div><label className="form-label">End Date</label><input className="form-input" type="date" /></div>
              <div>
                <label className="form-label">Assign Auditor</label>
                <select className="form-select">
                  <option>Frank Miller</option>
                  <option>Carol Smith</option>
                  <option>Alice Johnson</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-primary">Create Audit</button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cycle list */}
        <div className="lg:col-span-1 space-y-3">
          {cycles.map(cycle => {
            const verified = cycle.checklist.filter(i => i.status === 'Verified').length;
            const total    = cycle.checklist.length;
            const pct      = total ? Math.round((verified / total) * 100) : 0;

            return (
              <div
                key={cycle.id}
                onClick={() => setSelected(cycle)}
                className={`card p-4 cursor-pointer hover:border-primary-300 transition-colors ${selected?.id === cycle.id ? 'border-primary-400 ring-1 ring-primary-200' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{cycle.name}</p>
                    <p className="text-xs text-gray-400">{cycle.id} · {cycle.startDate} → {cycle.endDate}</p>
                  </div>
                  <StatusBadge status={cycle.status} />
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{verified}/{total} verified</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Checklist + Discrepancy */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="text-sm font-semibold">{selected.name} — Checklist</h3>
                    <p className="text-xs text-gray-400">Mark each asset as Verified, Missing, or Damaged</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        {['Asset ID','Asset Name','Status','Note','Action'].map(h => (
                          <th key={h} className="table-th">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {selected.checklist.map(item => (
                        <tr key={item.assetId} className="table-tr">
                          <td className="table-td">{item.assetId}</td>
                          <td className="table-td font-medium">{item.assetName}</td>
                          <td className="table-td">
                            <div className="flex items-center gap-1">
                              {STATUS_ICONS[item.status]}
                              <StatusBadge status={item.status} />
                            </div>
                          </td>
                          <td className="table-td text-gray-400">{item.note || '—'}</td>
                          <td className="table-td">
                            <div className="flex gap-1">
                              {CHECKLIST_STATUS.filter(s => s !== item.status).map(s => (
                                <button
                                  key={s}
                                  onClick={() => updateChecklistItem(selected.id, item.assetId, s)}
                                  className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discrepancy Report */}
              {discrepancies.length > 0 && (
                <div className="card border-orange-200">
                  <div className="card-header bg-orange-50 border-orange-100">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle size={16} />
                      <h3 className="text-sm font-semibold">Discrepancy Report ({discrepancies.length})</h3>
                    </div>
                    <button className="btn-secondary text-xs">Export Report</button>
                  </div>
                  <div className="card-body space-y-2">
                    {discrepancies.map(d => (
                      <div key={d.assetId} className="flex items-center gap-3 p-2 rounded-lg bg-orange-50 border border-orange-100">
                        <span className="flex-shrink-0">{STATUS_ICONS[d.status]}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{d.assetName} ({d.assetId})</p>
                          <p className="text-[11px] text-gray-500">{d.note || `Status: ${d.status}`}</p>
                        </div>
                        <StatusBadge status={d.status} className="ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <HelpCircle size={32} className="text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">Select an audit cycle to view its checklist</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

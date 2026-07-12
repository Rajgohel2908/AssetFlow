import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import api from '../utils/api';

const CHECKLIST_STATUS = ['VERIFIED', 'MISSING', 'DAMAGED'];
const STATUS_ICONS = {
  'VERIFIED': <Check size={13} className="text-emerald-600" />,
  'MISSING':  <X size={13} className="text-red-500" />,
  'DAMAGED':  <AlertTriangle size={13} className="text-orange-500" />,
  'PENDING':  <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
};

export default function AssetAudit() {
  const [cycles, setCycles]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [auditName, setAuditName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [auditorId, setAuditorId] = useState('');

  const [categories, setCategories] = useState([]);
  const [scopeSelect, setScopeSelect] = useState('ALL');

  const fetchData = async () => {
    try {
      const [auditRes, empRes, catRes] = await Promise.all([
        api.get('/audit-cycles'),
        api.get('/employees'),
        api.get('/asset-categories')
      ]);
      setCycles(auditRes.data.data || []);
      setEmployees(empRes.data.data || []);
      setCategories(catRes.data.data || []);
      
      // Refresh selected if needed
      if (selected) {
        const fullDetail = await api.get(`/audit-cycles/${selected.id}`);
        setSelected(fullDetail.data.data);
      }
    } catch (err) {
      toast.error('Failed to load audit data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectCycle = async (cycle) => {
    try {
      const res = await api.get(`/audit-cycles/${cycle.id}`);
      setSelected(res.data.data);
    } catch (err) {
      toast.error('Failed to load audit details');
    }
  };

  const handleCreateAudit = async (e) => {
    e.preventDefault();
    if (!auditName || !auditorId) return toast.error('Name and Auditor are required');
    try {
      await api.post('/audit-cycles', {
        name: auditName,
        scope: scopeSelect === 'ALL' ? { allAssets: true } : { categoryIds: [scopeSelect] },
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString(),
        auditorIds: [auditorId]
      });
      toast.success('Audit cycle created successfully');
      setShowForm(false);
      setAuditName(''); setStartDate(''); setEndDate(''); setAuditorId(''); setScopeSelect('ALL');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create audit');
    }
  };

  const handleCloseAudit = async (id) => {
    if (window.confirm("Are you sure you want to close this audit? Missing assets will be marked as LOST.")) {
      try {
        await api.patch(`/audit-cycles/${id}/close`);
        toast.success('Audit closed successfully');
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to close audit');
      }
    }
  };

  const updateChecklistItem = async (cycleId, assetId, newResult) => {
    try {
      await api.patch(`/audit-cycles/${cycleId}/items/${assetId}`, {
        result: newResult
      });
      toast.success('Item updated');
      // Refresh the selected cycle details silently
      handleSelectCycle({ id: cycleId });
      // Update the main list so counts refresh
      const auditRes = await api.get('/audit-cycles');
      setCycles(auditRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item');
    }
  };

  const discrepancies = selected?.items
    ? selected.items.filter(i => i.result !== 'VERIFIED' && i.result !== 'PENDING')
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
          <form onSubmit={handleCreateAudit} className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="form-label">Audit Name *</label>
                <input required className="form-input" placeholder="e.g. Q1 2024 Full Audit" value={auditName} onChange={e => setAuditName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Scope</label>
                <select className="form-select" value={scopeSelect} onChange={e => setScopeSelect(e.target.value)}>
                  <option value="ALL">All Assets</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Start Date</label><input required className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><label className="form-label">End Date</label><input required className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              <div>
                <label className="form-label">Assign Auditor *</label>
                <select required className="form-select" value={auditorId} onChange={e => setAuditorId(e.target.value)}>
                  <option value="">Select Auditor…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">Create Audit</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cycle list */}
        <div className="lg:col-span-1 space-y-3">
          {cycles.map(cycle => {
            return (
              <div
                key={cycle.id}
                onClick={() => handleSelectCycle(cycle)}
                className={`card p-4 cursor-pointer hover:border-primary-300 transition-colors ${selected?.id === cycle.id ? 'border-primary-400 ring-1 ring-primary-200' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{cycle.name}</p>
                    <p className="text-xs text-[#a1a1aa]">{cycle.id.substring(0,8)} · {new Date(cycle.dateRangeStart).toLocaleDateString()} → {new Date(cycle.dateRangeEnd).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={cycle.status} />
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-[#71717a] mb-1">
                    <span>{cycle._count?.items} items in scope</span>
                  </div>
                </div>
              </div>
            );
          })}
          {cycles.length === 0 && (
            <p className="text-center text-sm text-[#71717a] py-4">No audit cycles found.</p>
          )}
        </div>

        {/* Checklist + Discrepancy */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <div className="card">
                <div className="card-header flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{selected.name} — Checklist</h3>
                    <p className="text-xs text-[#a1a1aa]">Mark each asset as Verified, Missing, or Damaged</p>
                  </div>
                  {selected.status === 'OPEN' && (
                    <button 
                      className="btn-primary py-1 px-3 text-xs" 
                      onClick={() => handleCloseAudit(selected.id)}
                    >
                      Close Audit
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full divide-y divide-[#f4f4f5]">
                    <thead className="bg-[#fafafa] sticky top-0 z-10">
                      <tr>
                        {['Asset Tag','Asset Name','Result','Note','Action'].map(h => (
                          <th key={h} className="table-th bg-[#fafafa]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f4f4f5]">
                      {selected.items?.map(item => (
                        <tr key={item.asset.id} className="table-tr">
                          <td className="table-td">{item.asset.assetTag}</td>
                          <td className="table-td font-medium">{item.asset.name}</td>
                          <td className="table-td">
                            <div className="flex items-center gap-1">
                              {STATUS_ICONS[item.result]}
                              <span className="text-xs">{item.result}</span>
                            </div>
                          </td>
                          <td className="table-td text-[#a1a1aa]">{item.notes || '—'}</td>
                          <td className="table-td">
                            {selected.status === 'OPEN' && (
                              <div className="flex gap-1">
                                {CHECKLIST_STATUS.filter(s => s !== item.result).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => updateChecklistItem(selected.id, item.asset.id, s)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-[#e4e4e7] text-[#52525b] hover:bg-[#fafafa]"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {!selected.items?.length && (
                        <tr><td colSpan="5" className="text-center py-4 text-sm text-[#71717a]">No assets in this audit.</td></tr>
                      )}
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
                  </div>
                  <div className="card-body space-y-2">
                    {discrepancies.map(d => (
                      <div key={d.asset.id} className="flex items-center gap-3 p-2 rounded-xl bg-orange-50 border border-orange-100">
                        <span className="flex-shrink-0">{STATUS_ICONS[d.result]}</span>
                        <div>
                          <p className="text-xs font-semibold text-[#18181b]">{d.asset.name} ({d.asset.assetTag})</p>
                          <p className="text-[11px] text-[#71717a]">{d.notes || `Result: ${d.result}`}</p>
                        </div>
                        <span className="text-xs ml-auto font-bold text-orange-700">{d.result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <HelpCircle size={32} className="text-[#d4d4d8] mb-3" />
              <p className="text-sm text-[#a1a1aa]">Select an audit cycle to view its checklist</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

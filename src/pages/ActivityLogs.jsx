import { useState } from 'react';
import { activityLogs } from '../data/mockData';
import DataTable from '../components/common/DataTable';
import { Download } from 'lucide-react';

const MODULES = ['All', 'Allocation', 'Transfer', 'Maintenance', 'Booking', 'Audit', 'Reports', 'Org Setup', 'Assets'];

const MODULE_COLORS = {
  'Allocation':  'bg-blue-100 text-blue-700',
  'Transfer':    'bg-purple-100 text-purple-700',
  'Maintenance': 'bg-amber-100 text-amber-700',
  'Booking':     'bg-emerald-100 text-emerald-700',
  'Audit':       'bg-orange-100 text-orange-700',
  'Reports':     'bg-[#f4f4f5] text-[#3f3f46]',
  'Org Setup':   'bg-indigo-100 text-indigo-700',
  'Assets':      'bg-[#f4f4f5] text-[#18181b]',
};

export default function ActivityLogs() {
  const [moduleFilter, setModuleFilter] = useState('All');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const filtered = activityLogs.filter(log => {
    if (moduleFilter !== 'All' && log.module !== moduleFilter) return false;
    if (dateFrom && log.timestamp < dateFrom) return false;
    if (dateTo   && log.timestamp > dateTo + 'T23:59:59') return false;
    return true;
  });

  const columns = [
    {
      key: 'timestamp', label: 'Timestamp',
      render: v => (
        <span className="text-xs text-[#71717a]">
          {new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      )
    },
    { key: 'user',   label: 'User' },
    { key: 'action', label: 'Action', render: v => <span className="font-medium text-[#18181b]">{v}</span> },
    { key: 'details', label: 'Details', render: v => <span className="text-[#71717a]">{v}</span> },
    {
      key: 'module', label: 'Module', sortable: false,
      render: v => (
        <span className={`badge ${MODULE_COLORS[v] ?? 'bg-[#f4f4f5] text-[#52525b]'}`}>{v}</span>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Activity Logs</h2>
          <p className="page-subtitle">Full audit trail of all system actions</p>
        </div>
        <button className="btn-primary">
          <Download size={14} /> Export Logs
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="form-label">Module</label>
              <select
                className="form-select w-44"
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
              >
                {MODULES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
            <button
              className="btn-secondary"
              onClick={() => { setModuleFilter('All'); setDateFrom(''); setDateTo(''); }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body">
          <DataTable
            columns={columns}
            data={filtered}
            searchKeys={['user', 'action', 'details']}
          />
        </div>
      </div>
    </div>
  );
}

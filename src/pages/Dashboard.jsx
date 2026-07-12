import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/common/KPICard';
import StatusBadge from '../components/common/StatusBadge';
import {
  Package, CheckCircle, Inbox, Wrench, Clock, IndianRupee,
  Plus, Search, ArrowLeftRight, ClipboardList
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { dashboardKPIs, overdueReturns, utilizationTrend } from '../data/mockData';

const KPI_CONFIG = [
  { key: 'totalAssets',      icon: Package,      color: 'primary' },
  { key: 'allocated',        icon: CheckCircle,  color: 'blue' },
  { key: 'available',        icon: Inbox,        color: 'emerald' },
  { key: 'underMaintenance', icon: Wrench,       color: 'amber' },
  { key: 'overdueReturns',   icon: Clock,        color: 'red' },
  { key: 'totalValue',       icon: IndianRupee,   color: 'purple' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');

  const filteredOverdue = overdueReturns.filter(r =>
    !searchQ ||
    r.assetName.toLowerCase().includes(searchQ.toLowerCase()) ||
    r.employee.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Welcome row */}
      <div className="hero-strip px-5 py-5 sm:px-6 sm:py-6 flex items-center justify-between gap-4">
        <div>
          <p className="section-title mb-2">Overview</p>
          <h2 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="page-subtitle">Here's what's happening across your organization today.</p>
        </div>
        <div className="flex gap-2 relative z-10">
          <button onClick={() => navigate('/assets')} className="btn-secondary">
            <Search size={14} /> Find Asset
          </button>
          <button onClick={() => navigate('/assets')} className="btn-primary">
            <Plus size={14} /> Register Asset
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPI_CONFIG.map(({ key, icon, color }) => {
          const kpi = dashboardKPIs[key];
          return (
            <KPICard
              key={key}
              label={kpi.label}
              value={kpi.value}
              change={kpi.change}
              trend={kpi.trend}
              icon={icon}
              color={color}
            />
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Utilization chart */}
        <div className="card xl:col-span-3">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Asset Utilization Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 months — % of assets allocated</p>
            </div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={utilizationTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[60, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [`${v}%`, 'Utilization']}
                />
                <Line type="monotone" dataKey="utilization" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body space-y-2">
            {[
              { label: 'Register New Asset',    icon: Plus,           path: '/assets',      color: 'bg-primary-50 text-primary-700' },
              { label: 'Allocate Asset',        icon: ArrowLeftRight, path: '/allocation',  color: 'bg-blue-50 text-blue-700' },
              { label: 'Book a Resource',       icon: ClipboardList,  path: '/booking',     color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Raise Maintenance',     icon: Wrench,         path: '/maintenance', color: 'bg-amber-50 text-amber-700' },
              { label: 'Start Asset Audit',     icon: ClipboardList,  path: '/audit',       color: 'bg-purple-50 text-purple-700' },
            ].map(action => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <action.icon size={14} />
                </span>
                <span className="text-sm text-gray-700 font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue Returns */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">⚠️ Overdue Returns</h3>
            <p className="text-xs text-gray-400 mt-0.5">{overdueReturns.length} assets past their return date</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="form-input pl-8 text-xs py-1.5 w-48"
              placeholder="Search…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr>
                {['Asset', 'Employee', 'Department', 'Due Date', 'Days Overdue', 'Action'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredOverdue.map(row => (
                <tr key={row.assetId} className="table-tr">
                  <td className="table-td font-medium text-gray-900">{row.assetName}</td>
                  <td className="table-td">{row.employee}</td>
                  <td className="table-td">{row.dept}</td>
                  <td className="table-td">{row.dueDate}</td>
                  <td className="table-td">
                    <span className={`font-semibold ${row.daysOverdue > 30 ? 'text-red-600' : 'text-amber-600'}`}>
                      {row.daysOverdue}d
                    </span>
                  </td>
                  <td className="table-td">
                    <button className="btn-ghost text-xs py-1 text-primary-600">Send Reminder</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Download } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { utilizationTrend, maintenanceFrequency, deptAllocationData } from '../data/mockData';

const PIE_COLORS = ['#4f46e5','#6366f1','#818cf8','#a5b4fc','#c7d2fe','#e0e7ff'];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Reports & Analytics</h2>
          <p className="page-subtitle">Visualize asset utilization, maintenance trends, and department allocation</p>
        </div>
        <button className="btn-primary">
          <Download size={14} /> Export All (CSV)
        </button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Utilization trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold">Asset Utilization Trend</h3>
              <p className="text-xs text-gray-400">% of assets allocated per month</p>
            </div>
            <button className="btn-ghost text-xs"><Download size={13} /> CSV</button>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={utilizationTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="%" domain={[60, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Utilization']} contentStyle={{ borderRadius: 8 }} />
                <Line type="monotone" dataKey="utilization" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance frequency */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold">Maintenance Frequency by Category</h3>
              <p className="text-xs text-gray-400">Number of maintenance requests per category</p>
            </div>
            <button className="btn-ghost text-xs"><Download size={13} /> CSV</button>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={maintenanceFrequency} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Dept allocation stacked */}
        <div className="card xl:col-span-2">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold">Department Allocation Summary</h3>
              <p className="text-xs text-gray-400">Allocated vs Available assets per department</p>
            </div>
            <button className="btn-ghost text-xs"><Download size={13} /> CSV</button>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptAllocationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="allocated" name="Allocated" fill="#4f46e5" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="available" name="Available" fill="#a5b4fc" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset status pie */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="text-sm font-semibold">Asset Status Distribution</h3>
              <p className="text-xs text-gray-400">Current fleet status breakdown</p>
            </div>
          </div>
          <div className="card-body flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Available',    value: 198 },
                    { name: 'Allocated',    value: 281 },
                    { name: 'Maintenance',  value: 24  },
                    { name: 'Lost',         value: 3   },
                    { name: 'Retired',      value: 67  },
                    { name: 'Disposed',     value: 30  },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {['#4f46e5','#6366f1','#f59e0b','#ef4444','#8b5cf6','#6b7280'].map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Asset Utilization', value: '78.5%', desc: 'Last 7 months' },
          { label: 'Total Maintenance Cost', value: '$1,980', desc: 'Current FY' },
          { label: 'Most Allocated Dept',    value: 'Engineering', desc: '85 assets' },
          { label: 'Top Maintenance Cat.',   value: 'Laptops', desc: '12 requests' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

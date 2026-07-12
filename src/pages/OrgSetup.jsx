import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { departments, categories, employees, ROLES } from '../data/mockData';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';

const TABS = ['Departments', 'Categories', 'Employee Directory'];

const ROLE_LABELS = {
  [ROLES.EMPLOYEE]:      'Employee',
  [ROLES.DEPT_HEAD]:     'Dept Head',
  [ROLES.ASSET_MANAGER]: 'Asset Manager',
  [ROLES.ADMIN]:         'Admin',
};

export default function OrgSetup() {
  const [tab, setTab] = useState(0);
  
  const [deptsList, setDeptsList] = useState(departments);
  const [catsList, setCatsList] = useState(categories);
  const [empsList, setEmpsList] = useState(employees);

  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showCatForm,  setShowCatForm]  = useState(false);
  const [showEmpForm,  setShowEmpForm]  = useState(false);
  
  // Dept Form
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptBudget, setDeptBudget] = useState('');
  
  // Cat Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  
  // Emp Form
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empRole, setEmpRole] = useState(ROLES.EMPLOYEE);

  const handleAddDept = (e) => {
    e.preventDefault();
    if (!deptName) return;
    setDeptsList([...deptsList, { id: Date.now(), name: deptName, head: deptHead || 'Unassigned', employeeCount: 0, budget: deptBudget || 0 }]);
    setDeptName(''); setDeptHead(''); setDeptBudget('');
    setShowDeptForm(false);
  };
  
  const handleAddCat = (e) => {
    e.preventDefault();
    if (!catName) return;
    setCatsList([...catsList, { id: Date.now(), name: catName, description: catDesc, assetCount: 0 }]);
    setCatName(''); setCatDesc('');
    setShowCatForm(false);
  };
  
  const handleAddEmp = (e) => {
    e.preventDefault();
    if (!empName || !empEmail) return;
    setEmpsList([...empsList, { id: Date.now(), name: empName, email: empEmail, department: empDept || 'Unassigned', role: empRole, status: 'Active', joinDate: new Date().toISOString().split('T')[0] }]);
    setEmpName(''); setEmpEmail(''); setEmpDept(''); setEmpRole(ROLES.EMPLOYEE);
    setShowEmpForm(false);
  };

  // Department columns
  const deptCols = [
    { key: 'name',          label: 'Department' },
    { key: 'head',          label: 'Head' },
    { key: 'employeeCount', label: 'Employees' },
    { key: 'budget',        label: 'Budget', render: v => `₹${Number(v).toLocaleString()}` },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <button className="btn-ghost py-1 px-2 text-xs"><Pencil size={12} /></button>
          <button className="btn-ghost py-1 px-2 text-xs text-red-500"><Trash2 size={12} /></button>
        </div>
      )
    },
  ];

  // Category columns
  const catCols = [
    { key: 'name',        label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'assetCount',  label: 'Assets' },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: () => (
        <div className="flex gap-1">
          <button className="btn-ghost py-1 px-2 text-xs"><Pencil size={12} /></button>
          <button className="btn-ghost py-1 px-2 text-xs text-red-500"><Trash2 size={12} /></button>
        </div>
      )
    },
  ];

  // Employee columns
  const empCols = [
    { key: 'name',       label: 'Name' },
    { key: 'email',      label: 'Email' },
    { key: 'department', label: 'Department' },
    {
      key: 'role', label: 'Role',
      render: v => <StatusBadge status={ROLE_LABELS[v] ?? v} />
    },
    {
      key: 'status', label: 'Status',
      render: v => <StatusBadge status={v} />
    },
    { key: 'joinDate', label: 'Joined' },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-1">
          <button
            title="Promote / Change Role"
            className="btn-ghost py-1 px-2 text-xs text-primary-600"
          >
            <UserCog size={13} /> Promote
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Organization Setup</h2>
          <p className="page-subtitle">Manage departments, categories, and employees across your organization.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map((t, i) => (
          <button
            key={t}
            className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Departments ({deptsList.length})</span>
            <button onClick={() => setShowDeptForm(s => !s)} className="btn-primary text-xs">
              <Plus size={13} /> Add Department
            </button>
          </div>
          {showDeptForm && (
            <form onSubmit={handleAddDept} className="border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="form-label">Name</label><input required className="form-input" placeholder="Department name" value={deptName} onChange={e => setDeptName(e.target.value)} /></div>
                <div><label className="form-label">Head</label><input className="form-input" placeholder="Head name" value={deptHead} onChange={e => setDeptHead(e.target.value)} /></div>
                <div><label className="form-label">Budget (₹)</label><input className="form-input" type="number" placeholder="0" value={deptBudget} onChange={e => setDeptBudget(e.target.value)} /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="submit" className="btn-primary text-xs">Save</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowDeptForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="card-body">
            <DataTable columns={deptCols} data={deptsList} searchKeys={['name', 'head']} />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Asset Categories ({catsList.length})</span>
            <button onClick={() => setShowCatForm(s => !s)} className="btn-primary text-xs">
              <Plus size={13} /> Add Category
            </button>
          </div>
          {showCatForm && (
            <form onSubmit={handleAddCat} className="border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Category Name</label><input required className="form-input" placeholder="e.g. Networking Gear" value={catName} onChange={e => setCatName(e.target.value)} /></div>
                <div><label className="form-label">Description</label><input className="form-input" placeholder="Short description" value={catDesc} onChange={e => setCatDesc(e.target.value)} /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="submit" className="btn-primary text-xs">Save</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowCatForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="card-body">
            <DataTable columns={catCols} data={catsList} searchKeys={['name', 'description']} />
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Employee Directory ({empsList.length})</span>
            <button onClick={() => setShowEmpForm(s => !s)} className="btn-primary text-xs"><Plus size={13} /> Add Employee</button>
          </div>
          {showEmpForm && (
            <form onSubmit={handleAddEmp} className="border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div><label className="form-label">Name</label><input required className="form-input" placeholder="Employee Name" value={empName} onChange={e => setEmpName(e.target.value)} /></div>
                <div><label className="form-label">Email</label><input required type="email" className="form-input" placeholder="Email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} /></div>
                <div>
                  <label className="form-label">Department</label>
                  <select className="form-select" value={empDept} onChange={e => setEmpDept(e.target.value)}>
                    <option value="">None</option>
                    {deptsList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-select" value={empRole} onChange={e => setEmpRole(e.target.value)}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="submit" className="btn-primary text-xs">Save</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => setShowEmpForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="card-body">
            <DataTable columns={empCols} data={empsList} searchKeys={['name', 'email', 'department']} />
          </div>
        </div>
      )}
    </div>
  );
}

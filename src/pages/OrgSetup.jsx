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
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [showCatForm,  setShowCatForm]  = useState(false);

  // Department columns
  const deptCols = [
    { key: 'name',          label: 'Department' },
    { key: 'head',          label: 'Head' },
    { key: 'employeeCount', label: 'Employees' },
    { key: 'budget',        label: 'Budget', render: v => `$${Number(v).toLocaleString()}` },
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
            <span className="text-sm font-semibold">Departments ({departments.length})</span>
            <button onClick={() => setShowDeptForm(s => !s)} className="btn-primary text-xs">
              <Plus size={13} /> Add Department
            </button>
          </div>
          {showDeptForm && (
            <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="form-label">Name</label><input className="form-input" placeholder="Department name" /></div>
                <div><label className="form-label">Head</label><input className="form-input" placeholder="Head name" /></div>
                <div><label className="form-label">Budget ($)</label><input className="form-input" type="number" placeholder="0" /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn-primary text-xs">Save</button>
                <button className="btn-secondary text-xs" onClick={() => setShowDeptForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div className="card-body">
            <DataTable columns={deptCols} data={departments} searchKeys={['name', 'head']} />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Asset Categories ({categories.length})</span>
            <button onClick={() => setShowCatForm(s => !s)} className="btn-primary text-xs">
              <Plus size={13} /> Add Category
            </button>
          </div>
          {showCatForm && (
            <div className="border-b border-gray-100 px-6 py-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="form-label">Category Name</label><input className="form-input" placeholder="e.g. Networking Gear" /></div>
                <div><label className="form-label">Description</label><input className="form-input" placeholder="Short description" /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn-primary text-xs">Save</button>
                <button className="btn-secondary text-xs" onClick={() => setShowCatForm(false)}>Cancel</button>
              </div>
            </div>
          )}
          <div className="card-body">
            <DataTable columns={catCols} data={categories} searchKeys={['name', 'description']} />
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">Employee Directory ({employees.length})</span>
            <button className="btn-primary text-xs"><Plus size={13} /> Add Employee</button>
          </div>
          <div className="card-body">
            <DataTable columns={empCols} data={employees} searchKeys={['name', 'email', 'department']} />
          </div>
        </div>
      )}
    </div>
  );
}

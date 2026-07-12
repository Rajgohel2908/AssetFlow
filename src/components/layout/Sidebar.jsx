import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../utils/access';
import {
  LayoutDashboard, Package, ArrowLeftRight, BookOpen,
  Wrench, ClipboardList, BarChart2, ScrollText,
  Building2, Layers, LogOut, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',       path: '/dashboard',       routeKey: 'dashboard',       icon: LayoutDashboard },
  { label: 'Asset Directory', path: '/assets',          routeKey: 'assets',          icon: Package },
  { label: 'Allocation',      path: '/allocation',      routeKey: 'allocation_mgmt', icon: ArrowLeftRight },
  { label: 'My Allocations',  path: '/my-allocations',  routeKey: 'allocations',     icon: Layers },
  { label: 'Resource Booking',path: '/booking',         routeKey: 'booking',         icon: BookOpen },
  { label: 'Maintenance',     path: '/maintenance',     routeKey: 'maintenance',     icon: Wrench },
  { label: 'Asset Audit',     path: '/audit',           routeKey: 'audit',           icon: ClipboardList },
  { label: 'Reports',         path: '/reports',         routeKey: 'reports',         icon: BarChart2 },
  { label: 'Activity Logs',   path: '/logs',            routeKey: 'logs',            icon: ScrollText },
  { label: 'Org Setup',       path: '/org-setup',       routeKey: 'org_setup',       icon: Building2 },
];

const ROLE_LABELS = {
  employee:      'Employee',
  dept_head:     'Dept Head',
  asset_manager: 'Asset Manager',
  admin:         'Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  const visible = NAV_ITEMS.filter(item => canAccess(item.routeKey, user?.role));

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-gray-900">AssetFlow</span>
            <p className="text-[10px] text-gray-400 -mt-0.5">Enterprise ERM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
            {user?.name?.[0] ?? 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400">{ROLE_LABELS[user?.role]} · {user?.department}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost w-full justify-start text-red-500 hover:bg-red-50 text-xs">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

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
  EMPLOYEE:        'Employee',
  DEPARTMENT_HEAD: 'Dept Head',
  ASSET_MANAGER:   'Asset Manager',
  ADMIN:           'Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuth();

  const visible = NAV_ITEMS.filter(item => canAccess(item.routeKey, user?.role));

  return (
    <aside className="sidebar-graphic w-64 h-screen bg-white border-r border-[#d4d4d8] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#f4f4f5] relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#18181b] flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-[#111111]">AssetFlow</span>
            <p className="text-[10px] text-[#a1a1aa] -mt-0.5">Enterprise ERM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto relative z-10">
        {visible.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-[#f4f4f5] relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-[#f4f4f5] rounded-full flex items-center justify-center text-[#18181b] font-semibold text-sm">
            {user?.name?.[0] ?? 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-[#18181b] truncate">{user?.name}</p>
            <p className="text-[10px] text-[#a1a1aa]">{ROLE_LABELS[user?.role] ?? user?.role} · {user?.department}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost w-full justify-start text-[#b91c1c] hover:bg-[#fef2f2] text-xs">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

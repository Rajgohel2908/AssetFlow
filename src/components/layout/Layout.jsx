import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const ROUTE_TITLES = {
  '/dashboard':     'Dashboard',
  '/assets':        'Asset Directory',
  '/allocation':    'Asset Allocation & Transfer',
  '/my-allocations':'My Allocations',
  '/booking':       'Resource Booking',
  '/maintenance':   'Maintenance Management',
  '/audit':         'Asset Audit',
  '/reports':       'Reports & Analytics',
  '/logs':          'Activity Logs',
  '/org-setup':     'Organization Setup',
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = ROUTE_TITLES[pathname] ?? 'AssetFlow';

  return (
    <div className="app-canvas flex h-screen overflow-hidden text-[#111111]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="soft-grid flex-1 overflow-y-auto p-5 sm:p-6">
          <div key={pathname} className="route-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

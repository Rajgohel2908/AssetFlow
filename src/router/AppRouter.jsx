import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import RoleGuard from '../components/common/RoleGuard';
import Login          from '../pages/Login';
import Dashboard      from '../pages/Dashboard';
import OrgSetup       from '../pages/OrgSetup';
import AssetDirectory from '../pages/AssetDirectory';
import AssetAllocation from '../pages/AssetAllocation';
import ResourceBooking from '../pages/ResourceBooking';
import Maintenance    from '../pages/Maintenance';
import AssetAudit     from '../pages/AssetAudit';
import Reports        from '../pages/Reports';
import ActivityLogs   from '../pages/ActivityLogs';
import MyAllocations  from '../pages/MyAllocations';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard"     element={<RoleGuard routeKey="dashboard"><Dashboard /></RoleGuard>} />
          <Route path="my-allocations" element={<RoleGuard routeKey="allocations"><MyAllocations /></RoleGuard>} />
          <Route path="assets"        element={<RoleGuard routeKey="assets"><AssetDirectory /></RoleGuard>} />
          <Route path="allocation"    element={<RoleGuard routeKey="allocation_mgmt"><AssetAllocation /></RoleGuard>} />
          <Route path="booking"       element={<RoleGuard routeKey="booking"><ResourceBooking /></RoleGuard>} />
          <Route path="maintenance"   element={<RoleGuard routeKey="maintenance"><Maintenance /></RoleGuard>} />
          <Route path="audit"         element={<RoleGuard routeKey="audit"><AssetAudit /></RoleGuard>} />
          <Route path="reports"       element={<RoleGuard routeKey="reports"><Reports /></RoleGuard>} />
          <Route path="logs"          element={<RoleGuard routeKey="logs"><ActivityLogs /></RoleGuard>} />
          <Route path="org-setup"     element={<RoleGuard routeKey="org_setup"><OrgSetup /></RoleGuard>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

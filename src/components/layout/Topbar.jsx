import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { notifications } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

const ROLE_LABELS = {
  EMPLOYEE:        'Employee',
  DEPARTMENT_HEAD: 'Dept Head',
  ASSET_MANAGER:   'Asset Manager',
  ADMIN:           'Admin',
};

export default function Topbar({ title }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(notifications);

  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(n => n.map(item => ({ ...item, read: true })));

  const typeColor = {
    info:    'bg-blue-100 text-blue-600',
    warning: 'bg-amber-100 text-amber-600',
    error:   'bg-red-100 text-red-600',
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Role + dept context */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full font-medium">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <span className="text-gray-400">·</span>
            <span>{user.department}</span>
          </div>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            id="notif-btn"
            onClick={() => setOpen(o => !o)}
            className="btn-ghost relative"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifs.map(n => (
                    <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                      <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${typeColor[n.type]}`}>
                        {n.type === 'error' ? '!' : n.type === 'warning' ? '⚠' : 'i'}
                      </span>
                      <div>
                        <p className="text-xs text-gray-700">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

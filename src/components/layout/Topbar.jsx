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
    info:    'bg-[#f4f4f5] text-[#18181b]',
    warning: 'bg-[#fafafa] text-[#52525b]',
    error:   'bg-[#fef2f2] text-[#991b1b]',
  };

  return (
    <header className="h-16 bg-[#ffffff] border-b border-[#d4d4d8] px-5 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-medium text-[#111111] tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Role + dept context */}
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#71717a]">
            <span className="px-2.5 py-1 bg-[#f4f4f5] text-[#18181b] rounded-full font-medium border border-[#e4e4e7]">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <span className="text-[#d4d4d8]">·</span>
            <span>{user.department}</span>
          </div>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            id="notif-btn"
            onClick={() => setOpen(o => !o)}
            className="btn-ghost relative border border-[#e4e4e7] bg-white"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#18181b] text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                {unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e4e4e7] rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#f4f4f5]">
                  <span className="text-sm font-medium text-[#111111]">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#52525b] hover:text-[#18181b]">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} className="text-[#a1a1aa] hover:text-[#18181b]">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#f4f4f5]">
                  {notifs.map(n => (
                    <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.read ? 'opacity-60' : 'bg-[#fafafa]'}`}>
                      <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${typeColor[n.type]}`}>
                        {n.type === 'error' ? '!' : n.type === 'warning' ? '!' : 'i'}
                      </span>
                      <div>
                        <p className="text-xs text-[#3f3f46]">{n.message}</p>
                        <p className="text-[10px] text-[#a1a1aa] mt-0.5">{n.time}</p>
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

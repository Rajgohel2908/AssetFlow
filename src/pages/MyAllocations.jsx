import { useState } from 'react';
import { Layers } from 'lucide-react';
import { allocations } from '../data/mockData';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function MyAllocations() {
  const { user } = useAuth();

  // In a real app, filter by user. For demo, show all.
  const myAllocs = allocations;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-title">My Allocations</h2>
        <p className="page-subtitle">Assets currently allocated to you, {user?.name}</p>
      </div>

      {myAllocs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <Layers size={32} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No assets currently allocated to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {myAllocs.map(a => (
            <div key={a.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{a.assetName}</p>
                  <p className="text-xs text-gray-400">{a.assetId} · {a.id}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="space-y-1.5">
                {[
                  ['Department',   a.department],
                  ['Allocated On', a.allocatedOn],
                  ['Due Return',   a.dueReturn ?? 'Indefinite'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="text-gray-700 font-medium">{val}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary text-xs flex-1">Request Return</button>
                <button className="btn-ghost text-xs text-primary-600">Transfer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

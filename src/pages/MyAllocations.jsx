import { useState } from 'react';
import { Layers, AlertTriangle, ArrowRightLeft, X } from 'lucide-react';
import { allocations } from '../data/mockData';
import StatusBadge from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function MyAllocations() {
  const { user } = useAuth();

  // In a real app, filter by user. For demo, show all.
  const [myAllocs, setMyAllocs] = useState(allocations);
  const [returnAsset, setReturnAsset] = useState(null);
  const [transferAsset, setTransferAsset] = useState(null);
  const [transferToName, setTransferToName] = useState('');

  const handleReturn = (id) => {
    setReturnAsset(myAllocs.find(a => a.id === id));
  };

  const handleTransfer = (id) => {
    setTransferAsset(myAllocs.find(a => a.id === id));
    setTransferToName('');
  };

  const confirmReturn = () => {
    if (returnAsset) {
      setMyAllocs(prev => prev.map(a => a.id === returnAsset.id ? { ...a, status: 'Pending Return' } : a));
      setReturnAsset(null);
    }
  };

  const confirmTransfer = () => {
    if (transferAsset && transferToName.trim()) {
      setMyAllocs(prev => prev.map(a => a.id === transferAsset.id ? { ...a, status: 'Transfer Requested' } : a));
      setTransferAsset(null);
      setTransferToName('');
    }
  };

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
                <button 
                  className="btn-secondary text-xs flex-1"
                  onClick={() => handleReturn(a.id)}
                  disabled={a.status !== 'Active'}
                >
                  Request Return
                </button>
                <button 
                  className="btn-ghost text-xs text-primary-600"
                  onClick={() => handleTransfer(a.id)}
                  disabled={a.status !== 'Active'}
                >
                  Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Return Modal */}
      {returnAsset && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReturnAsset(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-[400px] flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Request Asset Return</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to request a return for <span className="font-semibold text-gray-800">{returnAsset.assetName}</span>? This will notify the IT department to process your return.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="btn-secondary" 
                onClick={() => setReturnAsset(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary !bg-amber-500 hover:!bg-amber-600 border-transparent shadow-sm" 
                onClick={confirmReturn}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferAsset && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTransferAsset(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-[400px] flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mb-2">
                  <ArrowRightLeft className="text-primary-600" size={20} />
                </div>
                <button onClick={() => setTransferAsset(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Transfer Asset</h3>
              <p className="text-sm text-gray-600 mb-2">
                Transfer <span className="font-semibold text-gray-800">{transferAsset.assetName}</span> to another employee. This request will require manager approval.
              </p>
              <div>
                <label className="form-label text-xs font-semibold text-gray-700">Recipient Name</label>
                <input 
                  className="form-input mt-1 w-full" 
                  placeholder="e.g. Rahul Verma" 
                  value={transferToName}
                  onChange={(e) => setTransferToName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="btn-secondary" 
                onClick={() => setTransferAsset(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary shadow-sm" 
                onClick={confirmTransfer}
                disabled={!transferToName.trim()}
              >
                Request Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

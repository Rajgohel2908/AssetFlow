import { X, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ConflictModal({ isOpen, onClose, title, message, conflictDetail, alternativeLabel, onAlternative }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={20} />
            <h2 className="text-base font-semibold text-gray-900">{title || 'Action Blocked'}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          {conflictDetail && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              {conflictDetail}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          {alternativeLabel && (
            <button className="btn-primary" onClick={onAlternative}>
              {alternativeLabel}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

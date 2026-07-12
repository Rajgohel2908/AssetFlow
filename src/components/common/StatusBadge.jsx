const STATUS_MAP = {
  // Asset statuses
  'Available':         'bg-emerald-100 text-emerald-800',
  'Allocated':         'bg-blue-100 text-blue-800',
  'Under Maintenance': 'bg-amber-100 text-amber-800',
  'Lost':              'bg-red-100 text-red-800',
  'Retired':           'bg-purple-100 text-purple-800',
  'Disposed':          'bg-gray-100 text-gray-600',
  // Booking statuses
  'Confirmed':         'bg-emerald-100 text-emerald-800',
  'Rejected':          'bg-red-100 text-red-800',
  // Transfer / maintenance statuses
  'Pending':           'bg-amber-100 text-amber-800',
  'Approved':          'bg-blue-100 text-blue-800',
  'In Progress':       'bg-indigo-100 text-indigo-800',
  'Resolved':          'bg-emerald-100 text-emerald-800',
  // Audit statuses
  'Verified':          'bg-emerald-100 text-emerald-800',
  'Missing':           'bg-red-100 text-red-800',
  'Damaged':           'bg-orange-100 text-orange-800',
  // Misc
  'Active':            'bg-emerald-100 text-emerald-800',
  'Inactive':          'bg-gray-100 text-gray-600',
  'Completed':         'bg-emerald-100 text-emerald-800',
  'Cancelled':         'bg-gray-100 text-gray-500',
  'High':              'bg-red-100 text-red-800',
  'Medium':            'bg-amber-100 text-amber-800',
  'Low':               'bg-blue-100 text-blue-800',
  // Role labels
  'Employee':          'bg-gray-100 text-gray-700',
  'Dept Head':         'bg-cyan-100 text-cyan-800',
  'Asset Manager':     'bg-violet-100 text-violet-800',
  'Admin':             'bg-rose-100 text-rose-800',
};

export default function StatusBadge({ status, className = '' }) {
  const classes = STATUS_MAP[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${classes} ${className}`}>
      {status}
    </span>
  );
}

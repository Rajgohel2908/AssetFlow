const STATUS_MAP = {
  // Asset statuses
  'Available':         'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Allocated':         'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Under Maintenance': 'bg-[#fafafa] text-[#52525b] border border-[#e4e4e7]',
  'Lost':              'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
  'Retired':           'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Disposed':          'bg-[#f4f4f5] text-[#71717a] border border-[#e4e4e7]',
  // Booking statuses
  'Confirmed':         'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Rejected':          'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
  // Transfer / maintenance statuses
  'Pending':           'bg-[#fafafa] text-[#52525b] border border-[#e4e4e7]',
  'Approved':          'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'In Progress':       'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Resolved':          'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  // Audit statuses
  'Verified':          'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Missing':           'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
  'Damaged':           'bg-[#fafafa] text-[#52525b] border border-[#e4e4e7]',
  // Misc
  'Active':            'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Inactive':          'bg-[#f4f4f5] text-[#71717a] border border-[#e4e4e7]',
  'Completed':         'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Cancelled':         'bg-[#f4f4f5] text-[#71717a] border border-[#e4e4e7]',
  'High':              'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
  'Medium':            'bg-[#fafafa] text-[#52525b] border border-[#e4e4e7]',
  'Low':               'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  // Role labels
  'Employee':          'bg-[#f4f4f5] text-[#52525b] border border-[#e4e4e7]',
  'Dept Head':         'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Asset Manager':     'bg-[#f4f4f5] text-[#18181b] border border-[#e4e4e7]',
  'Admin':             'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]',
};

export default function StatusBadge({ status, className = '' }) {
  const classes = STATUS_MAP[status] ?? 'bg-[#f4f4f5] text-[#71717a] border border-[#e4e4e7]';
  return (
    <span className={`badge ${classes} ${className}`}>
      {status}
    </span>
  );
}

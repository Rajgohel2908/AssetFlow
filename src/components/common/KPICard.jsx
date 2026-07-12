import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({ label, value, change, trend, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-[#f4f4f5] text-[#18181b]',
    emerald: 'bg-[#f4f4f5] text-[#18181b]',
    amber:   'bg-[#fafafa] text-[#18181b]',
    red:     'bg-[#fef2f2] text-[#991b1b]',
    purple:  'bg-[#f4f4f5] text-[#18181b]',
    blue:    'bg-[#f4f4f5] text-[#18181b]',
  };

  const trendColor = trend === 'up' ? 'text-[#18181b]' : trend === 'down' ? 'text-[#991b1b]' : 'text-[#a1a1aa]';
  const TrendIcon  = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="card p-5 flex items-start justify-between hover:shadow-[0_10px_24px_rgba(0,0,0,0.05)] transition-shadow duration-200">
      <div>
        <p className="text-[11px] font-medium text-[#71717a] uppercase tracking-[0.14em] mb-1">{label}</p>
        <p className="text-2xl font-semibold text-[#111111] tracking-tight">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={13} />
            {change} this month
          </div>
        )}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}

import { Check } from 'lucide-react';

const STEPS = ['Pending', 'Approved', 'In Progress', 'Resolved'];

export default function ApprovalWorkflowStepper({ currentStatus }) {
  const currentIdx = STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isCurrent   = i === currentIdx;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors
                ${isCompleted ? 'bg-[#18181b] border-[#18181b] text-white'
                  : isCurrent ? 'bg-white border-[#18181b] text-[#18181b]'
                  : 'bg-white border-[#d4d4d8] text-[#a1a1aa]'}`}>
                {isCompleted ? <Check size={14} /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium whitespace-nowrap
                ${isCompleted || isCurrent ? 'text-[#18181b]' : 'text-[#a1a1aa]'}`}>
                {step}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${i < currentIdx ? 'bg-[#18181b]' : 'bg-[#e4e4e7]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

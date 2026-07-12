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
                ${isCompleted ? 'bg-primary-600 border-primary-600 text-white'
                  : isCurrent ? 'bg-white border-primary-600 text-primary-600'
                  : 'bg-white border-gray-300 text-gray-400'}`}>
                {isCompleted ? <Check size={14} /> : i + 1}
              </div>
              <span className={`mt-1 text-xs font-medium whitespace-nowrap
                ${isCompleted || isCurrent ? 'text-primary-700' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${i < currentIdx ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

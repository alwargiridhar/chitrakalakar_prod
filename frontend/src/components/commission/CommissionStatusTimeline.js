import React from 'react';
import { CheckCircle2, Circle, Image } from 'lucide-react';
import { COMMISSION_STATUSES } from './pricing';

export default function CommissionStatusTimeline({ status, updates = [] }) {
  const currentIndex = COMMISSION_STATUSES.indexOf(status);

  const statusDateMap = updates.reduce((acc, update) => {
    if (update.new_status) acc[update.new_status] = update.created_at;
    return acc;
  }, {});

  return (
    <div className="space-y-3" data-testid="commission-status-timeline">
      {COMMISSION_STATUSES.map((step, index) => {
        const done = currentIndex >= index;
        const stepUpdate = updates.find((u) => u.new_status === step && u.image_url);

        return (
          <div key={step} className="flex gap-3" data-testid={`commission-status-step-${step.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="pt-0.5">
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1 pb-2 border-b border-gray-100 last:border-b-0">
              <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`} data-testid={`commission-status-step-label-${index}`}>
                {step}
              </p>
              {statusDateMap[step] && (
                <p className="text-xs text-gray-500" data-testid={`commission-status-step-date-${index}`}>
                  {new Date(statusDateMap[step]).toLocaleString('en-IN')}
                </p>
              )}
              {stepUpdate?.image_url && (
                <a
                  href={stepUpdate.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-[#1A1A1A] hover:text-black"
                  data-testid={`commission-status-step-image-link-${index}`}
                >
                  <Image className="w-3.5 h-3.5" /> View WIP image
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

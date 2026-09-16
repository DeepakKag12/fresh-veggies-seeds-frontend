import React from 'react';
import { SEGMENTED_ORDER_TABS } from '../../../config/adminOrderConfig';

export const OrderFilterTabs = ({ statusFilter, setStatusFilter, setPage, stats }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
      {SEGMENTED_ORDER_TABS.map((tab) => {
        const isActive = statusFilter === tab.id;
        const badgeCount = stats?.[tab.badgeKey];

        return (
          <button
            key={tab.id}
            onClick={() => { setStatusFilter(tab.id); setPage(1); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 min-h-[44px] ${
              isActive
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                : 'bg-white dark:bg-gray-800 text-fv-muted hover:text-fv-heading border border-fv-border hover:border-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            {badgeCount !== undefined && badgeCount !== null && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                  isActive
                    ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                    : tab.highlight && badgeCount > 0
                    ? 'bg-red-500 text-white'
                    : 'bg-fv-surface text-fv-muted'
                }`}
              >
                {badgeCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default OrderFilterTabs;

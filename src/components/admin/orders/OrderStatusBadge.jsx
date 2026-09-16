import React from 'react';
import { getStatusColor, getStatusIconComponent } from '../../../config/adminOrderConfig';

export const OrderStatusBadge = ({ status, className = '' }) => {
  const Icon = getStatusIconComponent(status);
  const colorClass = getStatusColor(status);

  return (
    <span
      className={`px-2.5 py-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full border ${colorClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{status}</span>
    </span>
  );
};

export default OrderStatusBadge;

import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  PackageCheck,
  Package,
  AlertTriangle,
  CheckCircle2,
  Boxes,
} from 'lucide-react';

/** All valid order statuses that admin can manually change to */
export const ALL_STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

/** Primary next workflow action mappings */
export const NEXT_PRIMARY_ACTION = {
  Pending:   { target: 'Confirmed', label: 'Confirm Order', icon: CheckCircle2, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  Confirmed: { target: 'Packed',    label: 'Mark as Packed', icon: Boxes,        color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  Packed:    { target: 'Shipped',   label: 'Ship Order',    icon: Truck,        color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  Shipped:   { target: 'Delivered', label: 'Mark Delivered', icon: PackageCheck, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
};

/** Segmented workflow tabs configuration */
export const SEGMENTED_ORDER_TABS = [
  { id: 'All',                   label: 'All Orders',          badgeKey: 'all' },
  { id: 'action_required',       label: '⚡ Action Required',   badgeKey: 'actionRequired', highlight: true },
  { id: 'Pending',               label: 'Pending',             badgeKey: 'pending' },
  { id: 'Confirmed',             label: 'Confirmed',           badgeKey: 'confirmed' },
  { id: 'Packed',                label: 'Packed / Processing', badgeKey: 'packed' },
  { id: 'Shipped',               label: 'Shipped',             badgeKey: 'shipped' },
  { id: 'Delivered',             label: 'Delivered',           badgeKey: 'delivered' },
  { id: 'Cancelled',             label: 'Cancelled / Returns', badgeKey: 'cancelled' },
  { id: 'CancellationRequested', label: 'Cancel Requests',     badgeKey: 'cancellationRequests' },
];

/** Helper to get background and border styling for status badges */
export const getStatusColor = (status) => {
  const colors = {
    Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800',
    Confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    Packed: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    Cancelled: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    CancellationRequested: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
  };
  return colors[status] || 'bg-fv-surface text-fv-heading border-fv-border';
};

/** Helper to get icon component for status */
export const getStatusIconComponent = (status) => {
  const icons = {
    Pending: Clock,
    Confirmed: CheckCircle,
    Packed: Package,
    Shipped: Truck,
    Delivered: PackageCheck,
    Cancelled: XCircle,
    CancellationRequested: AlertTriangle,
  };
  return icons[status] || Package;
};

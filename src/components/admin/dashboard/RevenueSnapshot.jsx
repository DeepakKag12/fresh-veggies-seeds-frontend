import React from 'react';
import { Calendar } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('en-IN');

export const RevenueSnapshot = ({ stats }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-800 p-4 md:p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Today's Revenue Breakdown</h3>
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
          Real-time
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5">
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Paid Revenue Today</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">₹{fmt(stats.todayRevenue)}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Delivered & verified</p>
        </div>
        <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3.5">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Online Payments</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">₹{fmt(stats.todayOnlineRevenue)}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Razorpay / UPI</p>
        </div>
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3.5">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Cash on Delivery</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">₹{fmt(stats.todayCODRevenue)}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Collected upon delivery</p>
        </div>
        <div className="bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl p-3.5">
          <p className="text-xs font-medium text-purple-800 dark:text-purple-300">Total Month Revenue</p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">₹{fmt(stats.monthRevenue)}</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Current billing cycle</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueSnapshot;

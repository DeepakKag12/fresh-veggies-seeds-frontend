import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Users
} from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('en-IN');

export const ExecutiveKpiCards = ({ stats = {}, revenueData = {} }) => {
  const totalRevenue = stats.totalRevenue ?? revenueData?.kpis?.grossRevenue ?? 0;
  const monthRevenue = stats.monthRevenue || 0;
  const lastMonthRevenue = stats.lastMonthRevenue || 0;
  
  // Calculate month-over-month trend % from real database records
  let revenueTrend = 0;
  if (stats.revenueMoMTrend !== undefined && stats.revenueMoMTrend !== null) {
    revenueTrend = stats.revenueMoMTrend;
  } else if (lastMonthRevenue > 0) {
    revenueTrend = Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
  } else if (monthRevenue > 0) {
    revenueTrend = 0;
  }

  const totalOrders = stats.totalOrders || 0;
  const paidOrders = revenueData?.kpis?.paidOrdersCount || totalOrders;
  const aov = stats.avgOrderValue ?? (revenueData?.kpis?.avgOrderValue || (totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0));
  const totalCustomers = stats.totalUsers || 0;
  const todayCustomers = stats.todayUsers || 0;

  // Real MoM / DoD order trends from database
  let ordersTrendStr = '0%';
  let isOrdersPositive = true;
  if (stats.ordersMoMTrend !== undefined && stats.ordersMoMTrend !== null) {
    ordersTrendStr = `${stats.ordersMoMTrend >= 0 ? '+' : ''}${stats.ordersMoMTrend}%`;
    isOrdersPositive = stats.ordersMoMTrend >= 0;
  } else if (stats.todayOrders > 0) {
    ordersTrendStr = `+${stats.todayOrders} today`;
    isOrdersPositive = true;
  } else {
    ordersTrendStr = '0 today';
    isOrdersPositive = true;
  }

  // Real AOV trend from database
  let aovTrendStr = '0%';
  let isAovPositive = true;
  if (stats.aovMoMTrend !== undefined && stats.aovMoMTrend !== null) {
    aovTrendStr = `${stats.aovMoMTrend >= 0 ? '+' : ''}${stats.aovMoMTrend}%`;
    isAovPositive = stats.aovMoMTrend >= 0;
  }

  // Real Customer growth trend from database
  let customersTrendStr = '0%';
  let isCustomersPositive = true;
  if (stats.usersMoMTrend !== undefined && stats.usersMoMTrend !== null) {
    customersTrendStr = `${stats.usersMoMTrend >= 0 ? '+' : ''}${stats.usersMoMTrend}%`;
    isCustomersPositive = stats.usersMoMTrend >= 0;
  } else if (todayCustomers > 0) {
    customersTrendStr = `+${todayCustomers} new`;
    isCustomersPositive = true;
  } else {
    customersTrendStr = '0 new';
    isCustomersPositive = true;
  }

  const cards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: `₹${fmt(totalRevenue)}`,
      subtitle: `₹${fmt(monthRevenue)} this month`,
      trend: `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}%`,
      isPositive: revenueTrend >= 0,
      icon: DollarSign,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      badgeLabel: 'vs last month'
    },
    {
      id: 'orders',
      title: 'Total Orders',
      value: fmt(totalOrders),
      subtitle: `${stats.todayOrders || 0} placed today`,
      trend: ordersTrendStr,
      isPositive: isOrdersPositive,
      icon: ShoppingBag,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      badgeLabel: 'fulfillment active'
    },
    {
      id: 'aov',
      title: 'Average Order Value',
      value: `₹${fmt(aov)}`,
      subtitle: `${paidOrders} paid basket(s)`,
      trend: aovTrendStr,
      isPositive: isAovPositive,
      icon: CreditCard,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      badgeLabel: 'vs last month'
    },
    {
      id: 'customers',
      title: 'Active Customers',
      value: fmt(totalCustomers),
      subtitle: `${todayCustomers} joined today`,
      trend: customersTrendStr,
      isPositive: isCustomersPositive,
      icon: Users,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      badgeLabel: 'vs last month'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = card.isPositive ? TrendingUp : TrendingDown;
        return (
          <div
            key={card.id}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 border border-gray-200/90 dark:border-gray-800 shadow-2xs hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {card.value}
              </h3>
              <div
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  card.isPositive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                <TrendIcon className="w-3 h-3" />
                <span>{card.trend}</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="font-medium truncate">{card.subtitle}</span>
              <span className="text-gray-400 dark:text-gray-500 shrink-0">{card.badgeLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExecutiveKpiCards;

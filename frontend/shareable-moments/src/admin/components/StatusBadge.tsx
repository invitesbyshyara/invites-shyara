import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'active' | 'suspended' | 'published' | 'draft' | 'expired' | 'taken-down' | 'success' | 'failed' | 'refunded' | 'disabled' | 'free' | 'premium' | 'admin' | 'support' | 'visible' | 'hidden';

const statusStyles: Record<StatusType, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  visible: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  free: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  support: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  hidden: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  disabled: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'taken-down': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  premium: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const style = statusStyles[status as StatusType] || 'bg-muted text-muted-foreground';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', style, className)}>
      {status.replace('-', ' ')}
    </span>
  );
};

export default StatusBadge;

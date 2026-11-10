import React from 'react';
import { BAR_TABS, BarTabId } from '../../data/Bar.data';
import AuthService from '../../services/authService';
import { filterTabsByRole } from '../../utils/permissions';

interface Props {
  activeTab: BarTabId;
  onTabChange: (id: BarTabId) => void;
  compact?: boolean;
}

export const BarTabs: React.FC<Props> = ({ activeTab, onTabChange, compact = false }) => {
  const currentUser = AuthService.getCurrentUser();
  const visibleTabs = filterTabsByRole([...BAR_TABS], currentUser?.role)
    .filter((tab) => tab.id !== 'equipement' || currentUser?.role?.toLowerCase() === 'admin');

  return (
    <div className={`flex gap-1 overflow-x-auto border border-base bg-surface scrollbar-hide ${compact ? 'rounded-xl p-0.5' : 'rounded-2xl p-1'}`}>
      {visibleTabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as BarTabId)}
          className={`rounded-xl px-3 font-medium transition-all whitespace-nowrap flex-shrink-0 ${compact ? 'py-1.5 text-[11px] sm:px-4' : 'sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm'} ${
            activeTab === tab.id
              ? 'bg-accent-4 text-accent'
              : 'text-muted hover:text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

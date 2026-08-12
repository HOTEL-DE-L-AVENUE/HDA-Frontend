import React from 'react';
import { BAR_TABS, BarTabId } from '../../data/Bar.data';

interface Props {
  activeTab: BarTabId;
  onTabChange: (id: BarTabId) => void;
}

export const BarTabs: React.FC<Props> = ({ activeTab, onTabChange }) => (
  <div className="flex gap-1 bg-surface border border-base rounded-2xl p-1 overflow-x-auto scrollbar-hide">
    {BAR_TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
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
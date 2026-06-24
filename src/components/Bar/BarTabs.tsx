import React from 'react';
import { BAR_TABS, BarTabId } from '../../data/Bar.data';

interface Props {
  activeTab: BarTabId;
  onTabChange: (id: BarTabId) => void;
}

export const BarTabs: React.FC<Props> = ({ activeTab, onTabChange }) => (
  <div className="flex gap-1 bg-surface border border-base rounded-2xl p-1 w-fit">
    {BAR_TABS.map(tab => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
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
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Select, Button } from '../../components/UI';

interface Props {
  searchQuery: string;
  filterStatus: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
}

export const HebergementFilters: React.FC<Props> = ({
  searchQuery, filterStatus, onSearchChange, onFilterChange,
}) => (
  <div className="flex flex-col sm:flex-row gap-3 w-full">
    {/* Barre de recherche */}
    <div className="relative flex-1">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="text"
        placeholder="Rechercher..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full h-10 pl-9 pr-4 rounded-xl text-primary placeholder-subtle text-sm transition-all"
        style={{
          backgroundColor: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          outline: 'none',
        }}
      />
    </div>

    {/* Filtre statut */}
    <Select
      value={filterStatus}
      onChange={(e) => onFilterChange(e.target.value)}
      options={[
        { value: '',             label: 'Tous les statuts' },
        { value: 'LIBRE',        label: 'Libre'            },
        { value: 'OCCUPEE',      label: 'Occupée'          },
        { value: 'RESERVEE',     label: 'Réservée'         },
        { value: 'MAINTENANCE',  label: 'Maintenance'      },
      ]}
      className="w-full sm:w-48"
    />

    <Button variant="secondary" icon={<Filter size={16} />} className="flex-shrink-0">
      Filtrer
    </Button>
  </div>
);
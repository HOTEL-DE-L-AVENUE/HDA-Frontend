import React from 'react';
import { Calendar, Clock, DoorOpen, BedDouble } from 'lucide-react';

interface StatsData {
  totalReservations: number;
  enCours: number;
  chambresOccupees: number;
  chambresLibres: number;
}

interface Props {
  stats: StatsData;
}

export const HebergementStats: React.FC<Props> = ({ stats }) => {
  const items = [
    { label: 'Total Réservations',   value: stats.totalReservations, icon: <Calendar  size={20} className="text-black" /> },
    { label: 'En Cours',             value: stats.enCours,           icon: <Clock     size={20} className="text-black" /> },
    { label: 'Chambres Occupées',    value: stats.chambresOccupees,  icon: <DoorOpen  size={20} className="text-black" /> },
    { label: 'Chambres Disponibles', value: stats.chambresLibres,    icon: <BedDouble size={20} className="text-black" /> },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {items.map(s => (
        <div
          key={s.label}
          className="rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4 min-w-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-accent)' }}
          >
            {s.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted text-[10px] md:text-xs truncate">{s.label}</p>
            <p className="text-primary font-bold text-base md:text-lg truncate">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
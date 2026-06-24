import React from 'react';
import { formatCurrency } from '../../../utils/data';
import { ChevronRight, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CasinoRoom } from '../types';

interface OverviewTabProps {
  rooms: CasinoRoom[];
  barData: any[];
  roomsActives: CasinoRoom[];
  cashiersActifs: any[];
  joueursActifs: any[];
  onSelectRoom: (room: CasinoRoom) => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-3">
            <span className="text-muted">{p.name === 'entrees' ? 'Entrées' : p.name === 'sorties' ? 'Sorties' : 'Solde'}:</span>
            <span className="text-primary font-semibold">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ 
  rooms, 
  barData, 
  roomsActives, 
  cashiersActifs, 
  joueursActifs,
  onSelectRoom 
}) => {
  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-primary font-semibold mb-6">Performance par Salle</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#aaaaaa', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#aaaaaa', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k€`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="entrees" name="entrees" radius={[4, 4, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.actif ? '#4ade80' : '#2a2a2a'} fillOpacity={0.8} />
              ))}
            </Bar>
            <Bar dataKey="sorties" name="sorties" radius={[4, 4, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.actif ? '#f87171' : '#2a2a2a'} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rooms Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <div 
            key={room.id} 
            className="rounded-2xl p-5 cursor-pointer hover:border-accent hover:shadow-accent transition-all group"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onClick={() => onSelectRoom(room)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--color-accent-4)' }}>
                🎰
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                room.statut === 'OUVERTE' 
                  ? 'bg-success-bg text-success border border-success/30' 
                  : room.statut === 'EN_TRAVAUX'
                  ? 'bg-warning-bg text-warning border border-warning/30'
                  : 'bg-surface-2 text-muted border border-base'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${room.statut === 'OUVERTE' ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                {room.statut === 'OUVERTE' ? 'Ouverte' : room.statut === 'EN_TRAVAUX' ? 'En travaux' : 'Fermée'}
              </div>
            </div>
            <h4 className="text-primary font-semibold mb-1 text-sm">{room.nom}</h4>
            <p className="text-muted text-xs mb-3">{room.type_salle}</p>
            <div className="flex items-center text-subtle text-xs mt-2 group-hover:text-primary transition-colors">
              <span>Voir détails</span>
              <ChevronRight size={12} className="ml-1" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--color-success-bg)', border: '1px solid var(--color-success)' }}>
        <Zap size={14} className="text-success" />
        <span className="text-success text-sm font-medium">
          {roomsActives.length} salles ouvertes • {cashiersActifs.length} caisses actives • {joueursActifs.length} joueurs
        </span>
      </div>
    </div>
  );
};
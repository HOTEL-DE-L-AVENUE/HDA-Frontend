import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/data';
import { Button, Badge } from '../../UI';
import { Plus, CreditCard, Gift } from 'lucide-react';
import type { CasinoCard, CasinoCredit, Client } from '../types';

interface CardsTabProps {
  cards: CasinoCard[];
  credits: CasinoCredit[];
  clients: Client[];
  onNewCard: () => void;
  onNewCredit: () => void;
  onNewChipTransaction: () => void;
}

export const CardsTab: React.FC<CardsTabProps> = ({
  cards,
  credits,
  clients,
  onNewCard,
  onNewCredit,
  onNewChipTransaction
}) => {
  const niveauColors: Record<string, string> = {
    'BRONZE': 'text-amber-600 bg-amber-100',
    'ARGENT': 'text-gray-400 bg-gray-200',
    'OR': 'text-yellow-600 bg-yellow-100',
    'PLATINE': 'text-blue-400 bg-blue-100',
    'DIAMANT': 'text-cyan-400 bg-cyan-100',
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button icon={<Plus size={16} />} onClick={onNewCard} className="text-sm">
          Nouvelle carte
        </Button>
        <Button icon={<Plus size={16} />} variant="secondary" onClick={onNewCredit} className="text-sm">
          Accorder crédit
        </Button>
        <Button icon={<Plus size={16} />} variant="secondary" onClick={onNewChipTransaction} className="text-sm">
          Transaction jetons
        </Button>
      </div>

      {/* Cards */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-primary font-semibold flex items-center gap-2">
            <CreditCard size={16} className="text-accent" />
            Cartes de Fidélité
          </h3>
        </div>
        <div className="divide-y divide-base">
          {cards.length === 0 ? (
            <div className="p-6 text-center text-muted">Aucune carte</div>
          ) : (
            cards.map(card => {
              const client = clients.find(c => c.id === card.client_id);
              return (
                <div key={card.id} className="flex items-center justify-between px-6 py-3 hover:bg-surface-2">
                  <div>
                    <p className="text-primary text-sm font-medium">{client?.prenom} {client?.nom}</p>
                    <p className="text-muted text-xs">{card.numero_carte} • {card.points} points</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${niveauColors[card.niveau] || ''}`}>
                      {card.niveau}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Credits */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-primary font-semibold flex items-center gap-2">
            <Gift size={16} className="text-accent" />
            Crédits Accordés
          </h3>
        </div>
        <div className="divide-y divide-base">
          {credits.length === 0 ? (
            <div className="p-6 text-center text-muted">Aucun crédit</div>
          ) : (
            credits.map(credit => {
              const client = clients.find(c => c.id === credit.client_id);
              return (
                <div key={credit.id} className="flex items-center justify-between px-6 py-3 hover:bg-surface-2">
                  <div>
                    <p className="text-primary text-sm font-medium">{client?.prenom} {client?.nom}</p>
                    <p className="text-muted text-xs">Échéance: {formatDate(credit.echeance)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-accent font-bold">{formatCurrency(credit.montant_accorde)}</p>
                      <p className="text-muted text-xs">En cours: {formatCurrency(credit.encours)}</p>
                    </div>
                    <Badge variant={credit.statut === 'ACTIF' ? 'success' : 'danger'}>
                      {credit.statut}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
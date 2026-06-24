import React from 'react';
import { formatCurrency } from '../../../utils/data';
import { Badge } from '../../UI';
import { Users, Phone } from 'lucide-react';
import type { Client, CasinoCard, CasinoCredit, CasinoTransaction } from '../types';

interface ClientsTabProps {
  clients: Client[];
  cards: CasinoCard[];
  credits: CasinoCredit[];
  transactions: CasinoTransaction[];
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  cards,
  credits,
  transactions
}) => {
  const joueurs = clients.filter(c => c.is_casino_player);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-primary font-semibold flex items-center gap-2">
          <Users size={16} className="text-accent" />
          Joueurs du Casino
        </h3>
      </div>
      <div className="divide-y divide-base max-h-96 overflow-y-auto">
        {joueurs.length === 0 ? (
          <div className="p-6 text-center text-muted">Aucun joueur</div>
        ) : (
          joueurs.map(client => {
            const clientCards = cards.filter(c => c.client_id === client.id);
            const clientCredits = credits.filter(c => c.client_id === client.id);
            const clientTransactions = transactions.filter(t => t.client_id === client.id);
            const totalGains = clientTransactions.filter(t => t.type_transaction === 'GAIN').reduce((sum, t) => sum + t.montant, 0);
            
            return (
              <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-4 flex items-center justify-center text-lg">
                    {client.prenom?.[0]}{client.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-primary font-medium">{client.prenom} {client.nom}</p>
                    <p className="text-muted text-xs flex items-center gap-2">
                      <Phone size={10} /> {client.telephone}
                      <span className="w-1 h-1 rounded-full bg-muted" />
                      {clientCards.length} carte{clientCards.length > 1 ? 's' : ''}
                      <span className="w-1 h-1 rounded-full bg-muted" />
                      {clientCredits.length} crédit{clientCredits.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-accent font-bold">{formatCurrency(totalGains)}</p>
                    <p className="text-muted text-xs">Total gains</p>
                  </div>
                  <Badge variant={client.statut === 'ACTIF' ? 'success' : 'danger'}>
                    {client.statut}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
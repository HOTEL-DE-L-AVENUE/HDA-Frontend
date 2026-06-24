// components/ClientSearch.tsx
import React, { useState } from 'react';

import { Search, User, Phone, Mail } from 'lucide-react';
import { Client } from '../../types/hebergement.type';

interface ClientSearchProps {
  onSelect: (client: Client) => void;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients] = useState<Client[]>([]); // À remplacer par les vrais clients

  const filteredClients = clients.filter(client => 
    client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone?.includes(searchTerm) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un client..."
          className="input-field w-full pl-10"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <p className="text-muted text-center py-8">Aucun client trouvé</p>
        ) : (
          filteredClients.map(client => (
            <button
              key={client.id}
              onClick={() => onSelect(client)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-2 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-accent-4 flex items-center justify-center text-accent font-semibold">
                {client.prenom?.[0]}{client.nom[0]}
              </div>
              <div className="flex-1">
                <p className="text-primary font-medium">
                  {client.prenom} {client.nom}
                </p>
                <div className="flex gap-3 text-xs text-muted">
                  {client.telephone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {client.telephone}
                    </span>
                  )}
                  {client.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {client.email}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-xs font-medium ${
                client.is_casino_player ? 'text-accent' : 'text-muted'
              }`}>
                {client.is_casino_player ? '🎰 Joueur' : 'Client'}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { searchClients } from '../../../services/casino.service';
import type { Client } from '../types';
import { FormField, TextInput } from './ModalShell';

interface ClientPickerProps {
  clientId: number | null;
  clientLibre: string;
  onSelectClient: (client: Client | null) => void;
  onChangeLibre: (value: string) => void;
  allowFreeText?: boolean;
}

// Sélection d'un client existant (recherche /clients/search) ou saisie libre
// (client_libre) — les deux champs sont mutuellement exclusifs côté API.
export const ClientPicker: React.FC<ClientPickerProps> = ({
  clientId,
  clientLibre,
  onSelectClient,
  onChangeLibre,
  allowFreeText = true,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchClients(query.trim()).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (selected || clientId) {
    return (
      <FormField label="Client">
        <div
          className="flex items-center justify-between h-10 px-3 rounded-xl text-sm"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-primary truncate">
            {selected ? `${selected.nom} ${selected.prenom || ''}`.trim() : `Client #${clientId}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              onSelectClient(null);
            }}
            className="text-muted hover:text-primary flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      </FormField>
    );
  }

  return (
    <>
      <FormField label="Rechercher un client (nom, téléphone, code)">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <TextInput
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rakoto Jean…"
          />
        </div>
        {results.length > 0 && (
          <div
            className="mt-1 rounded-xl overflow-hidden max-h-40 overflow-y-auto"
            style={{ border: '1px solid var(--color-border)' }}
          >
            {results.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setSelected(c);
                  setQuery('');
                  setResults([]);
                  onSelectClient(c);
                }}
                className="w-full text-left px-3 py-2 text-sm text-primary hover:opacity-80"
                style={{ backgroundColor: 'var(--color-surface-2)' }}
              >
                {c.nom} {c.prenom || ''} {c.telephone ? `— ${c.telephone}` : ''}
              </button>
            ))}
          </div>
        )}
      </FormField>
      {allowFreeText && (
        <FormField label="Ou nom libre (client non enregistré)">
          <TextInput
            value={clientLibre}
            onChange={(e) => onChangeLibre(e.target.value)}
            placeholder="Nom du client de passage"
          />
        </FormField>
      )}
    </>
  );
};

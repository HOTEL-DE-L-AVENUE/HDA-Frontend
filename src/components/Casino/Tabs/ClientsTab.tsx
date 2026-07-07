import React, { useState } from 'react';
import { Plus, AlertOctagon, ShieldAlert } from 'lucide-react';
import type { CasinoSharedProps } from '../shared-props';
import {
  searchClients,
  fetchClientProfileBundle,
  fetchClientHistory,
  fetchClientConsumption,
  fetchClientIncidents,
} from '../../../services/casino.service';
import type { Client, ClientProfileBundle, ClientHistory, ClientConsumption, CasinoIncident } from '../types';
import { formatCurrency } from '../../../utils/data';

const statutSpecialColor = (statut?: string) => {
  if (statut === 'VIP') return '#a855f7';
  if (statut === 'A_SURVEILLER') return '#f59e0b';
  if (statut === 'EXCLU' || statut === 'AUTO_EXCLU') return 'var(--color-danger)';
  return 'var(--color-accent)';
};

export const ClientsTab: React.FC<CasinoSharedProps> = ({ searchQuery, setSearchQuery, onNewClient, onNewIncident, onSetClientStatus }) => {
  const [results, setResults] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [bundle, setBundle] = useState<ClientProfileBundle | null>(null);
  const [history, setHistory] = useState<ClientHistory | null>(null);
  const [consumption, setConsumption] = useState<ClientConsumption | null>(null);
  const [incidents, setIncidents] = useState<CasinoIncident[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const runSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setResults(await searchClients(q.trim()));
    } catch {
      setResults([]);
    }
  };

  const openClient = async (client: Client) => {
    setSelected(client);
    setLoadingDetail(true);
    try {
      const [b, h, c, inc] = await Promise.all([
        fetchClientProfileBundle(client.id),
        fetchClientHistory(client.id),
        fetchClientConsumption(client.id),
        fetchClientIncidents(client.id),
      ]);
      setBundle(b);
      setHistory(h);
      setConsumption(c);
      setIncidents(inc);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Colonne recherche */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-primary font-semibold text-sm">Joueurs</h4>
          <button onClick={onNewClient} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-black" style={{ backgroundColor: 'var(--color-accent)' }}>
            <Plus size={14} /> Ajouter
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Rechercher un joueur (nom, téléphone, code)…"
          className="w-full h-10 px-3 rounded-xl text-primary text-sm outline-none"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        />
        <div className="space-y-1 max-h-[420px] overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => openClient(c)}
              className={`w-full text-left rounded-xl p-3 text-sm transition-all ${selected?.id === c.id ? 'text-black' : 'text-primary'}`}
              style={{
                backgroundColor: selected?.id === c.id ? 'var(--color-accent)' : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p className="font-medium">{c.nom} {c.prenom || ''}</p>
              <p className={`text-xs ${selected?.id === c.id ? '' : 'text-muted'}`}>{c.telephone || 'Sans téléphone'} · {c.code_client || '—'}</p>
            </button>
          ))}
          {results.length === 0 && searchQuery.trim().length >= 2 && (
            <p className="text-muted text-xs text-center py-6">Aucun joueur trouvé.</p>
          )}
        </div>
      </div>

      {/* Colonne détail */}
      <div className="lg:col-span-3">
        {!selected ? (
          <div className="rounded-2xl p-8 text-center h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-muted text-sm">Sélectionnez un joueur pour voir son profil.</p>
          </div>
        ) : loadingDetail ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-muted text-sm">Chargement du profil…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-primary font-semibold">{selected.nom} {selected.prenom || ''}</p>
                  <p className="text-muted text-xs">{selected.telephone || 'Sans téléphone'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {bundle?.profile?.statut_special && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: statutSpecialColor(bundle.profile.statut_special), color: '#000' }}
                    >
                      {bundle.profile.statut_special}
                    </span>
                  )}
                  <button
                    onClick={() => onSetClientStatus(selected)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-primary"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <ShieldAlert size={13} /> Statut
                  </button>
                  <button
                    onClick={onNewIncident}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-primary"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <AlertOctagon size={13} /> Incident
                  </button>
                </div>
              </div>

              {bundle?.dernier_score && (
                <p className="text-xs text-muted mt-2">
                  Dernier score : <span className="text-primary font-semibold">{bundle.dernier_score.score}</span> ({bundle.dernier_score.categorie})
                </p>
              )}
              {bundle?.card && (
                <p className="text-xs text-muted mt-1">Carte {bundle.card.niveau} · plafond {formatCurrency(bundle.card.plafond_credit)}</p>
              )}
            </div>

            {consumption && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-primary font-semibold text-sm mb-2">Consommation F&B / Bar</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-muted">Commandes</p><p className="text-primary">{consumption.nb_commandes}</p></div>
                  <div><p className="text-muted">Panier moyen</p><p className="text-primary">{formatCurrency(consumption.panier_moyen)}</p></div>
                </div>
              </div>
            )}

            {history && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-primary font-semibold text-sm mb-2">Salles fréquentées</p>
                <div className="space-y-1">
                  {history.salles_frequentees.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-primary">{s.nom}</span>
                      <span className="text-muted">{s.nb_visites} visite(s)</span>
                    </div>
                  ))}
                  {history.salles_frequentees.length === 0 && <p className="text-muted text-xs">Aucune visite enregistrée.</p>}
                </div>
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <p className="text-primary font-semibold text-sm mb-2">Incidents / litiges</p>
              <div className="space-y-1">
                {incidents.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between text-xs">
                    <span className="text-primary">{inc.type} · {inc.description}</span>
                    <span className="text-muted">{inc.gravite} · {inc.statut}</span>
                  </div>
                ))}
                {incidents.length === 0 && <p className="text-muted text-xs">Aucun incident enregistré.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import type { CasinoSharedProps } from '../shared-props';
import { computeScore } from '../../../services/casino.service';
import type { CasinoScore } from '../types';
import { formatCurrency } from '../../../utils/data';

const niveauColor = (niveau: string) => {
  if (niveau === 'VIP') return '#a855f7';
  if (niveau === 'GOLD') return '#eab308';
  if (niveau === 'SILVER') return '#94a3b8';
  return 'var(--color-accent)';
};

export const CardsTab: React.FC<CasinoSharedProps> = ({ cards, credits, onNewCard, onNewCredit, onCreditAction }) => {
  const [scores, setScores] = useState<Record<number, CasinoScore>>({});
  const [computing, setComputing] = useState<number | null>(null);

  const handleCompute = async (clientId: number) => {
    setComputing(clientId);
    try {
      const score = await computeScore(clientId);
      setScores((prev) => ({ ...prev, [clientId]: score }));
    } catch {
      // silencieux : l'erreur reste visible via le score manquant
    } finally {
      setComputing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cartes de fidélité */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-primary font-semibold text-sm">Cartes de fidélité</h4>
          <button onClick={onNewCard} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-black" style={{ backgroundColor: 'var(--color-accent)' }}>
            <Plus size={14} /> Carte
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((card) => (
            <div key={card.id} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-primary font-semibold text-sm">{card.numero_carte}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: niveauColor(card.niveau), color: '#000' }}>
                  {card.niveau}
                </span>
              </div>
              <p className="text-muted text-xs mb-1">Client #{card.client_id}</p>
              <p className="text-muted text-xs mb-2">Plafond crédit : <span className="text-primary">{formatCurrency(card.plafond_credit)}</span></p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted">{card.statut}</span>
                <button
                  onClick={() => handleCompute(card.client_id)}
                  className="flex items-center gap-1 text-[10px] text-muted hover:text-primary"
                  disabled={computing === card.client_id}
                >
                  <Sparkles size={12} /> {computing === card.client_id ? 'Calcul…' : 'Calculer le score'}
                </button>
              </div>
              {scores[card.client_id] && (
                <div className="mt-2 pt-2 text-xs" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <span className="text-primary font-semibold">Score : {scores[card.client_id].score}</span>
                  <span className="text-muted"> ({scores[card.client_id].categorie})</span>
                </div>
              )}
            </div>
          ))}
          {cards.length === 0 && <p className="text-muted text-xs col-span-full text-center py-6">Aucune carte créée.</p>}
        </div>
      </div>

      {/* Crédits joueur */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-primary font-semibold text-sm">Crédits joueur</h4>
          <button onClick={onNewCredit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-black" style={{ backgroundColor: 'var(--color-accent)' }}>
            <Plus size={14} /> Accorder un crédit
          </button>
        </div>
        <div className="space-y-2">
          {credits.map((credit) => (
            <div key={credit.id} className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div>
                <p className="text-primary font-semibold text-sm">Crédit #{credit.id} — Client #{credit.client_id}</p>
                <p className="text-muted text-xs">Échéance {credit.echeance} · {credit.statut}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-muted text-xs">Encours</p>
                  <p className="text-primary font-semibold text-sm">{formatCurrency(credit.encours)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onCreditAction(credit, 'draw')} className="text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Tirage</button>
                  <button onClick={() => onCreditAction(credit, 'repay')} className="text-xs px-2.5 py-1.5 rounded-lg text-muted hover:text-primary" style={{ border: '1px solid var(--color-border)' }}>Rembourser</button>
                </div>
              </div>
            </div>
          ))}
          {credits.length === 0 && <p className="text-muted text-xs text-center py-6">Aucun crédit en cours.</p>}
        </div>
      </div>
    </div>
  );
};

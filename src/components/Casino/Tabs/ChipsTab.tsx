import React, { useMemo } from 'react';
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Coins } from 'lucide-react';
import { formatCurrency } from '../../../utils/data';
import type { ChipType, ChipMovement } from '../types';
import type { ChipOperation } from '../Modals/ChipModal';

interface ChipsTabProps {
  chipTypes: ChipType[];
  chips: ChipMovement[];
  searchQuery: string;
  onNewChipType: () => void;
  onEditChipType: (chipType: ChipType) => void;
  onDeleteChipType: (chipType: ChipType) => void;
  onNewChipOperation: (op: ChipOperation) => void;
}

const statusBadgeStyle = (statut: ChipType['statut']): React.CSSProperties =>
  statut === 'ACTIF'
    ? { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success)' }
    : { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' };

export const ChipsTab: React.FC<ChipsTabProps> = ({
  chipTypes,
  chips,
  searchQuery,
  onNewChipType,
  onEditChipType,
  onDeleteChipType,
  onNewChipOperation,
}) => {
  const filteredChipTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chipTypes;
    return chipTypes.filter(
      (ct) => ct.nom.toLowerCase().includes(q) || ct.code.toLowerCase().includes(q)
    );
  }, [chipTypes, searchQuery]);

  const chipTypeById = useMemo(() => {
    const map = new Map<number, ChipType>();
    chipTypes.forEach((ct) => map.set(ct.id, ct));
    return map;
  }, [chipTypes]);

  // NB: ChipMovement n'a pas de champ "type" explicite (achat/reprise) dans les types actuels.
  // On déduit le sens du mouvement du signe de `quantite` (positive = achat, négative = reprise).
  // À adapter si le backend expose un champ dédié (ex: type_mouvement).
  const sortedMovements = useMemo(
    () =>
      [...chips].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      ),
    [chips]
  );

  const handleDelete = (chipType: ChipType) => {
    if (window.confirm(`Supprimer le type de jeton "${chipType.nom}" ?`)) {
      onDeleteChipType(chipType);
    }
  };

  return (
    <div className="space-y-6">
      {/* ===== Types de jetons ===== */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-secondary" />
            <h3 className="text-base font-semibold text-primary">Types de jetons</h3>
          </div>
          <button
            onClick={onNewChipType}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium text-black"
            style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}
          >
            <Plus size={16} />
            Nouveau type
          </button>
        </div>

        {filteredChipTypes.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">Aucun type de jeton trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="py-2 pr-4 font-medium">Code</th>
                  <th className="py-2 pr-4 font-medium">Nom</th>
                  <th className="py-2 pr-4 font-medium">Valeur nominale</th>
                  <th className="py-2 pr-4 font-medium">Couleur</th>
                  <th className="py-2 pr-4 font-medium">Statut</th>
                  <th className="py-2 pr-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChipTypes.map((ct) => (
                  <tr key={ct.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-2.5 pr-4 text-primary font-medium">{ct.code}</td>
                    <td className="py-2.5 pr-4 text-primary">{ct.nom}</td>
                    <td className="py-2.5 pr-4 text-secondary">{formatCurrency(ct.valeur_nominale)}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-4 h-4 rounded-full"
                          style={{ backgroundColor: ct.couleur, border: '1px solid var(--color-border)' }}
                        />
                        <span className="text-secondary text-xs">{ct.couleur}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={statusBadgeStyle(ct.statut)}>
                        {ct.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditChipType(ct)}
                          className="p-1.5 rounded-lg text-muted hover:text-secondary"
                          style={{ border: '1px solid var(--color-border)' }}
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ct)}
                          className="p-1.5 rounded-lg"
                          style={{ border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Mouvements de jetons ===== */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-primary">Mouvements de jetons</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNewChipOperation('buy')}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium text-black"
              style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}
            >
              <ArrowDownCircle size={16} />
              Achat
            </button>
            <button
              onClick={() => onNewChipOperation('sell')}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-medium text-secondary"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <ArrowUpCircle size={16} />
              Reprise
            </button>
          </div>
        </div>

        {sortedMovements.length === 0 ? (
          <p className="text-sm text-muted py-6 text-center">Aucun mouvement de jeton enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Type de jeton</th>
                  <th className="py-2 pr-4 font-medium">Opération</th>
                  <th className="py-2 pr-4 font-medium">Quantité</th>
                  <th className="py-2 pr-4 font-medium">Montant</th>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Moyen de paiement</th>
                </tr>
              </thead>
              <tbody>
                {sortedMovements.map((mv) => {
                  const ct = chipTypeById.get(mv.chip_type_id);
                  const isAchat = mv.quantite >= 0;
                  return (
                    <tr key={mv.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                      <td className="py-2.5 pr-4 text-secondary">
                        {mv.created_at ? new Date(mv.created_at).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-primary">{ct ? `${ct.nom} (${ct.code})` : `#${mv.chip_type_id}`}</td>
                      <td className="py-2.5 pr-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={
                            isAchat
                              ? { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }
                              : { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }
                          }
                        >
                          {isAchat ? 'Achat' : 'Reprise'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-secondary">{Math.abs(mv.quantite)}</td>
                      <td className="py-2.5 pr-4 text-secondary">{formatCurrency(Math.abs(mv.montant_total))}</td>
                      <td className="py-2.5 pr-4 text-secondary">
                        {mv.client_libre || (mv.client_id ? `Client #${mv.client_id}` : '—')}
                      </td>
                      <td className="py-2.5 pr-4 text-secondary">{mv.moyen_paiement}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
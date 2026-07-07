import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ChipType, StatutChipType } from '../types';

interface ChipTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chipType?: ChipType | null; // si présent -> mode édition
  onSubmit: (
    data: Pick<ChipType, 'code' | 'nom' | 'valeur_nominale' | 'couleur' | 'statut'>
  ) => Promise<void> | void;
}

const emptyForm = {
  code: '',
  nom: '',
  valeur_nominale: 0,
  couleur: '#D97757',
  statut: 'ACTIF' as StatutChipType,
};

export const ChipTypeModal: React.FC<ChipTypeModalProps> = ({ isOpen, onClose, chipType, onSubmit }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setForm(
        chipType
          ? {
              code: chipType.code,
              nom: chipType.nom,
              valeur_nominale: chipType.valeur_nominale,
              couleur: chipType.couleur,
              statut: chipType.statut,
            }
          : emptyForm
      );
    }
  }, [isOpen, chipType]);

  if (!isOpen) return null;

  const isEdit = !!chipType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.nom.trim()) {
      setError('Le code et le nom sont obligatoires.');
      return;
    }
    if (form.valeur_nominale <= 0) {
      setError('La valeur nominale doit être supérieure à 0.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement du type de jeton.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    outline: 'none',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">
            {isEdit ? 'Modifier le type de jeton' : 'Nouveau type de jeton'}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-secondary">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            className="rounded-xl px-3 py-2 text-sm mb-4"
            style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Code</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl text-primary text-sm"
                style={inputStyle}
                placeholder="JT-100"
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value as StatutChipType }))}
                className="w-full h-10 px-3 rounded-xl text-primary text-sm"
                style={inputStyle}
              >
                <option value="ACTIF">Actif</option>
                <option value="INACTIF">Inactif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Nom</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl text-primary text-sm"
              style={inputStyle}
              placeholder="Jeton 100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Valeur nominale</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.valeur_nominale}
                onChange={(e) => setForm((f) => ({ ...f, valeur_nominale: Number(e.target.value) }))}
                className="w-full h-10 px-3 rounded-xl text-primary text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Couleur</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#([0-9a-f]{3}){1,2}$/i.test(form.couleur) ? form.couleur : '#D97757'}
                  onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))}
                  className="h-10 w-12 rounded-lg cursor-pointer"
                  style={{ border: '1px solid var(--color-border)', backgroundColor: 'transparent' }}
                />
                <input
                  type="text"
                  value={form.couleur}
                  onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl text-primary text-sm"
                  style={inputStyle}
                  placeholder="#D97757"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl text-sm font-medium text-secondary"
              style={{ border: '1px solid var(--color-border)' }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 h-10 rounded-xl text-sm font-medium text-black disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-accent)', boxShadow: 'var(--shadow-accent)' }}
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
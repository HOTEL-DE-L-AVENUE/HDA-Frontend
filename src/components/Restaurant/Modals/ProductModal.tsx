import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import type { Category, Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: Category[];
  editingProduct?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingProduct
}) => {
  const [form, setForm] = useState({
    nom: '',
    category_id: 0,
    prix_vente: 0,
    unite: 'PIECE',
    type_produit: 'PRODUIT_FINI' as const,
    actif: true,
    couleur: ''
  });

  useEffect(() => {
    if (editingProduct) {
      // Récupère la couleur stockée localement pour ce produit
      const savedColors = JSON.parse(localStorage.getItem('hda_product_colors') || '{}');
      const localColor = savedColors[editingProduct.id] || savedColors[editingProduct.nom] || '';

      setForm({
        nom: editingProduct.nom,
        category_id: editingProduct.category_id,
        prix_vente: editingProduct.prix_vente,
        unite: editingProduct.unite,
        type_produit: (editingProduct.type_produit || 'PRODUIT_FINI') as any,
        actif: editingProduct.actif,
        couleur: localColor
      });
    } else {
      setForm({
        nom: '',
        category_id: 0,
        prix_vente: 0,
        unite: 'PIECE',
        type_produit: 'PRODUIT_FINI',
        actif: true,
        couleur: ''
      });
    }
  }, [editingProduct]);

  const handleSubmit = () => {
    if (!form.nom || !form.category_id) return;

    // Sauvegarde la couleur dans le localStorage du navigateur
    if (form.nom) {
      const savedColors = JSON.parse(localStorage.getItem('hda_product_colors') || '{}');
      if (editingProduct?.id) {
        savedColors[editingProduct.id] = form.couleur;
      }
      savedColors[nomKey(form.nom)] = form.couleur;
      localStorage.setItem('hda_product_colors', JSON.stringify(savedColors));
    }

    onSubmit({
      nom: form.nom,
      category_id: form.category_id,
      prix_vente: form.prix_vente,
      unite: form.unite,
      type_produit: form.type_produit,
      actif: form.actif
    });

    onClose();
  };

  const nomKey = (name: string) => name.trim().toLowerCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? "Modifier le plat" : "Ajouter un plat"} size="lg">
      <div className="space-y-4">
        <Input
          label="Nom du plat"
          value={form.nom}
          onChange={(e) => setForm({ ...form, nom: e.target.value })}
          placeholder="Ex: Burger Deluxe"
        />

        <Select
          label="Catégorie"
          value={form.category_id.toString()}
          onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
          options={[
            { value: '0', label: 'Sélectionner une catégorie' },
            ...categories.map(c => ({ value: c.id.toString(), label: c.nom }))
          ]}
        />

        <Input
          label="Prix de vente (MGA)"
          type="number"
          value={form.prix_vente}
          onChange={(e) => setForm({ ...form, prix_vente: Number(e.target.value) })}
          placeholder="0.00"
          min={0}
          step={0.01}
        />

        <Select
          label="Unité"
          value={form.unite}
          onChange={(e) => setForm({ ...form, unite: e.target.value })}
          options={[
            { value: 'PIECE', label: 'Pièce' },
            { value: 'KG', label: 'Kilogramme' },
            { value: 'G', label: 'Gramme' },
            { value: 'L', label: 'Litre' },
            { value: 'ML', label: 'Millilitre' },
            { value: 'PORTION', label: 'Portion' },
          ]}
        />

        {/* SÉLECTEUR DE COULEUR PERSONNALISABLE LIBRE */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary block">
            Couleur de fond personnalisée
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.couleur || '#3b82f6'}
              onChange={(e) => setForm({ ...form, couleur: e.target.value })}
              className="w-12 h-11 rounded-xl cursor-pointer bg-transparent border p-1"
              style={{ borderColor: 'var(--color-border)' }}
              title="Choisir une couleur"
            />
            <input
              type="text"
              value={form.couleur}
              onChange={(e) => setForm({ ...form, couleur: e.target.value })}
              placeholder="Ex: #3b82f6 ou vide pour défaut"
              className="flex-1 h-11 px-4 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
                outline: 'none',
              }}
            />
            {form.couleur && (
              <button
                type="button"
                onClick={() => setForm({ ...form, couleur: '' })}
                className="text-xs text-amber-500 hover:underline px-2 py-1 font-medium whitespace-nowrap"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm({ ...form, actif: e.target.checked })}
            className="w-4 h-4 rounded border-base bg-surface-2 text-accent focus:ring-accent/20"
          />
          <label className="text-secondary text-sm">Produit actif (disponible à la vente)</label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.nom || !form.category_id}>
            {editingProduct ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
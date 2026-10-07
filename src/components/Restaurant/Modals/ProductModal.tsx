// src/components/Restaurant/Modals/ProductModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import { useToast } from '../../../context/ToastContext';
import type { Category, Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  categories: Category[];
  products: Product[];
  editingProduct?: Product | null;
}

const normalizeProductName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const isSimilarProductName = (first: string, second: string) => {
  const firstName = normalizeProductName(first);
  const secondName = normalizeProductName(second);
  return Boolean(firstName && secondName && firstName === secondName);
};

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  products,
  editingProduct
}) => {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    nom: '',
    code: '',
    category_id: 0,
    prix_vente: 0,
    prix_achat: 0,
    unite: 'PIECE',
    type_produit: 'PRODUIT_FINI' as const,
    actif: true,
    couleur: ''
  });

  useEffect(() => {
    setSubmissionError(null);
    if (editingProduct) {
      setForm({
        nom: editingProduct.nom || '',
        code: editingProduct.code || '',
        category_id: editingProduct.category_id || 0,
        prix_vente: editingProduct.prix_vente || 0,
        prix_achat: editingProduct.prix_achat || 0,
        unite: editingProduct.unite || 'PIECE',
        type_produit: (editingProduct.type_produit || 'PRODUIT_FINI') as any,
        actif: editingProduct.actif ?? true,
        couleur: editingProduct.couleur || '' // Récupère la couleur depuis la BDD
      });
    } else {
      setForm({
        nom: '',
        code: '',
        category_id: categories[0]?.id || 0,
        prix_vente: 0,
        prix_achat: 0,
        unite: 'PIECE',
        type_produit: 'PRODUIT_FINI',
        actif: true,
        couleur: ''
      });
    }
  }, [editingProduct, categories]);

  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.nom || !form.category_id) return;

    if (!editingProduct) {
      const matches = products.filter((product) =>
        isSimilarProductName(product.nom, form.nom)
      );
      if (matches.length > 0) {
        showToast(`Le produit « ${form.nom.trim()} » est déjà enregistré et ne peut pas être ajouté une deuxième fois.`, 'error');
        return;
      }
    }
    setSubmissionError(null);

    // Prépare l'objet à envoyer en incluant l'ID si on est en mode édition
    const payload: any = {
      nom: form.nom,
      code: form.code,
      category_id: form.category_id,
      prix_vente: form.prix_vente,
      prix_achat: form.prix_achat,
      unite: form.unite,
      type_produit: form.type_produit,
      actif: form.actif,
      couleur: form.couleur // Transmet la couleur choisie
    };

    if (editingProduct) {
      payload.id = editingProduct.id; // Indispensable pour la modification !
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const apiError = error as { response?: { status?: number; data?: { message?: string } } };
      if (apiError.response?.status === 409) {
        showToast(apiError.response.data?.message || `Le produit « ${form.nom.trim()} » est déjà enregistré et ne peut pas être ajouté une deuxième fois.`, 'error');
        return;
      }
      setSubmissionError(error instanceof Error ? error.message : 'Impossible d’ajouter ce produit. Veuillez réessayer.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? "Modifier le plat" : "Ajouter un plat"} size="lg">
        <div className="space-y-4">
        <Input
          label="Nom du plat"
          value={form.nom}
          onChange={(e) => {
            setForm({ ...form, nom: e.target.value });
            setSubmissionError(null);
          }}
          placeholder="Ex: Burger Deluxe"
        />
        {submissionError && (
          <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {submissionError}
          </p>
        )}

        <Input
          label="Code du plat (optionnel)"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Ex: PLT001"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Prix d'achat (MGA)"
            type="number"
            value={form.prix_achat}
            onChange={(e) => setForm({ ...form, prix_achat: Number(e.target.value) })}
            placeholder="0"
            min={0}
            step={1000}
          />
          <Input
            label="Prix de vente (MGA)"
            type="number"
            value={form.prix_vente}
            onChange={(e) => setForm({ ...form, prix_vente: Number(e.target.value) })}
            placeholder="0"
            min={0}
            step={1000}
          />
        </div>

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

        {/* SÉLECTEUR DE COULEUR PERSONNALISABLE */}
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
    </>
  );
};
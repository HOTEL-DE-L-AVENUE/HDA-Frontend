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
    actif: true
  });

  useEffect(() => {
    if (editingProduct) {
      setForm({
        nom: editingProduct.nom,
        category_id: editingProduct.category_id,
        prix_vente: editingProduct.prix_vente,
        unite: editingProduct.unite,
        type_produit: editingProduct.type_produit,
        actif: editingProduct.actif
      });
    } else {
      setForm({ nom: '', category_id: 0, prix_vente: 0, unite: 'PIECE', type_produit: 'PRODUIT_FINI', actif: true });
    }
  }, [editingProduct]);

  const handleSubmit = () => {
    if (!form.nom || !form.category_id) return;
    onSubmit(form);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? "Modifier le plat" : "Ajouter un plat"} size="lg">
      <div className="space-y-4">
        <Input 
          label="Nom du plat" 
          value={form.nom} 
          onChange={(e) => setForm({...form, nom: e.target.value})} 
          placeholder="Ex: Burger Deluxe" 
        />
        <Select 
          label="Catégorie" 
          value={form.category_id.toString()} 
          onChange={(e) => setForm({...form, category_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner une catégorie' },
            ...categories.map(c => ({ value: c.id.toString(), label: c.nom }))
          ]}
        />
        <Input 
          label="Prix de vente (€)" 
          type="number" 
          value={form.prix_vente} 
          onChange={(e) => setForm({...form, prix_vente: Number(e.target.value)})} 
          placeholder="0.00"
          min={0}
          step={0.01}
        />
        <Select 
          label="Unité" 
          value={form.unite} 
          onChange={(e) => setForm({...form, unite: e.target.value})}
          options={[
            { value: 'PIECE', label: 'Pièce' },
            { value: 'KG', label: 'Kilogramme' },
            { value: 'G', label: 'Gramme' },
            { value: 'L', label: 'Litre' },
            { value: 'ML', label: 'Millilitre' },
            { value: 'PORTION', label: 'Portion' },
          ]}
        />
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.actif}
            onChange={(e) => setForm({...form, actif: e.target.checked})}
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
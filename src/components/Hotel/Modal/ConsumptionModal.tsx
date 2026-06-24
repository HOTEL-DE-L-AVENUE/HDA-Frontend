// hotel/modals/ConsumptionModal.tsx
import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../../../utils/data';
import { Room } from '../../../types/hotel.types';
import { Modal } from '../../Modal';
import { Product } from '../../../types/product.types'; // Assure-toi d'importer le bon type

interface ConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  products: Product[]; // Changé de CSSMathProduct[] à Product[]
  onConsume: (productId: number, quantity: number) => void;
}

export const ConsumptionModal: React.FC<ConsumptionModalProps> = ({
  isOpen,
  onClose,
  room,
  products,
  onConsume,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);

  // Filtrer les produits disponibles pour le mini-bar
  const availableProducts = products.filter(p => p.type_produit === 'PRODUIT_FINI' || p.type_produit === 'CONSOMMABLE');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      onConsume(Number(selectedProduct), quantity);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-primary font-bold text-xl">
            Consommation Mini-bar
            {room && <span className="text-sm font-normal text-muted ml-2">Chambre {room.numero}</span>}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <X size={20} className="text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              Produit *
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(Number(e.target.value))}
              className="input-field w-full"
              required
            >
              <option value="">Sélectionner un produit</option>
              {availableProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.nom} - {formatCurrency(product.prix_vente || 0)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">
              Quantité
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="input-field w-20 text-center"
                min="1"
              />
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-base text-primary font-medium hover:bg-surface-2 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl btn-primary font-medium"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
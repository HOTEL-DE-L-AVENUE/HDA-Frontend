import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../UI';
import { formatCurrency } from '../../../utils/data';
import { Plus, XCircle } from 'lucide-react';
import type { TableRestaurant, Product, Client } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableRestaurant[];
  products: Product[];
  clients: Client[];
  onSubmit: (data: any) => void;
  onNewClient: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  tables,
  products,
  clients,
  onSubmit,
  onNewClient
}) => {
  const [form, setForm] = useState({
    table_id: 0,
    client_id: 0,
    items: [] as { product_id: number; quantite: number; prix_unitaire: number }[],
    montant_total: 0
  });

  const handleAddItem = (product: Product) => {
    const existingItem = form.items.find(i => i.product_id === product.id);
    if (existingItem) {
      setForm({
        ...form,
        items: form.items.map(i => 
          i.product_id === product.id ? { ...i, quantite: i.quantite + 1 } : i
        )
      });
    } else {
      setForm({
        ...form,
        items: [...form.items, { product_id: product.id, quantite: 1, prix_unitaire: product.prix_vente }]
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = () => {
    if (!form.table_id || form.items.length === 0) return;
    const total = form.items.reduce((sum, i) => sum + i.prix_unitaire * i.quantite, 0);
    onSubmit({ ...form, montant_total: total });
    setForm({ table_id: 0, client_id: 0, items: [], montant_total: 0 });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Commande" size="lg">
      <div className="space-y-4">
        <Select 
          label="Table" 
          value={form.table_id.toString()} 
          onChange={(e) => setForm({...form, table_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Sélectionner une table' },
            ...tables.filter(t => t.statut === 'LIBRE').map(t => ({ 
              value: t.id.toString(), 
              label: `Table ${t.numero} (${t.capacite} pers.)` 
            }))
          ]}
        />
        
        <Select 
          label="Client (optionnel)" 
          value={form.client_id.toString()} 
          onChange={(e) => setForm({...form, client_id: Number(e.target.value)})}
          options={[
            { value: '0', label: 'Client anonyme' },
            ...clients.map(c => ({ 
              value: c.id.toString(), 
              label: `${c.prenom} ${c.nom} - ${c.telephone}` 
            }))
          ]}
        />
        
        <Button variant="secondary" onClick={onNewClient} className="w-full">
          <Plus size={14} className="mr-2" /> Nouveau client
        </Button>

        <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
          <p className="text-secondary text-sm font-medium mb-2">Articles</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {products.filter(p => p.type_produit === 'PRODUIT_FINI' && p.actif).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 hover:bg-surface-3 rounded-lg">
                <span className="text-secondary text-sm">{product.nom}</span>
                <div className="flex items-center gap-2">
                  <span className="text-accent text-sm">{formatCurrency(product.prix_vente)}</span>
                  <Button size="sm" variant="secondary" onClick={() => handleAddItem(product)}>
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {form.items.length > 0 && (
          <div className="rounded-xl p-4 border" style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            <p className="text-secondary text-sm font-medium mb-2">Résumé</p>
            {form.items.map((item, index) => {
              const product = products.find(p => p.id === item.product_id);
              return (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-secondary text-sm">{product?.nom} x{item.quantite}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-accent text-sm">{formatCurrency(item.prix_unitaire * item.quantite)}</span>
                    <button onClick={() => handleRemoveItem(index)} className="text-danger hover:text-danger/80">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="border-t mt-2 pt-2 flex justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <span className="text-secondary font-medium">Total</span>
              <span className="text-accent font-bold">
                {formatCurrency(form.items.reduce((sum, i) => sum + i.prix_unitaire * i.quantite, 0))}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!form.table_id || form.items.length === 0}>
            <Plus size={16} className="inline mr-2" />
            Créer la commande
          </Button>
        </div>
      </div>
    </Modal>
  );
};
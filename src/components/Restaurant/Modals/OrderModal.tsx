import React, { useState, useEffect } from 'react';
import { Modal, Select, Button } from '../../UI';
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
  orderToEdit?: any;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  tables,
  products,
  clients,
  onSubmit,
  onNewClient,
  orderToEdit
}) => {
  const [form, setForm] = useState({
    table_id: '' as string | number,
    client_id: '' as string | number,
    items: [] as { product_id: number; quantite: number; prix_unitaire: number }[],
    montant_total: 0
  });

  useEffect(() => {
    if (orderToEdit) {
      setForm({
        table_id: orderToEdit.table_id || orderToEdit.table?.id || '',
        client_id: orderToEdit.client_id || orderToEdit.client?.id || '',
        items: orderToEdit.items || [],
        montant_total: orderToEdit.montant_total || 0
      });
    } else {
      setForm({
        table_id: '',
        client_id: '',
        items: [],
        montant_total: 0
      });
    }
  }, [orderToEdit, isOpen]);

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
    if (!form.table_id || form.table_id === '' || form.items.length === 0) return;
    const total = form.items.reduce((sum, i) => sum + i.prix_unitaire * i.quantite, 0);
    
    onSubmit({ 
      ...(orderToEdit ? { id: orderToEdit.id } : {}),
      ...form, 
      table_id: Number(form.table_id),
      client_id: form.client_id !== '' ? Number(form.client_id) : 0,
      montant_total: total 
    });
    
    setForm({ table_id: '', client_id: '', items: [], montant_total: 0 });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg"
      title={orderToEdit ? "Modifier la commande" : "Nouvelle Commande"}
    >
      <div className="flex flex-col max-h-[85vh] bg-background rounded-2xl overflow-hidden">
        {/* Corps du formulaire avec défilement */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <Select 
            label="Table" 
            value={form.table_id.toString()} 
            onChange={(e_or_value) => {
              const val = e_or_value && typeof e_or_value === 'object' && 'target' in e_or_value 
                ? e_or_value.target.value 
                : e_or_value;
              setForm(prev => ({ ...prev, table_id: val }));
            }}
            options={[
              { value: '', label: 'Sélectionner une table' },
              ...tables.map(t => ({ 
                value: t.id.toString(), 
                label: `Table ${t.numero} (${t.capacite} pers.)` 
              }))
            ]}
          />
          
          <Select 
            label="Client (optionnel)" 
            value={form.client_id.toString()} 
            onChange={(e_or_value) => {
              const val = e_or_value && typeof e_or_value === 'object' && 'target' in e_or_value 
                ? e_or_value.target.value 
                : e_or_value;
              setForm(prev => ({ ...prev, client_id: val }));
            }}
            options={[
              { value: '', label: 'Client anonyme' },
              ...clients.map(c => ({ 
                value: c.id.toString(), 
                label: `${c.prenom} ${c.nom} - ${c.telephone}` 
              }))
            ]}
          />
          
          <Button type="button" variant="secondary" onClick={onNewClient} className="w-full">
            <Plus size={14} className="mr-2" /> Nouveau client
          </Button>

          <div className="rounded-xl p-4 border border-border" style={{ backgroundColor: 'var(--color-surface-2)' }}>
            <p className="text-secondary text-sm font-medium mb-2">Articles</p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {products.filter(p => p.type_produit === 'PRODUIT_FINI' && p.actif).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 hover:bg-surface-3 rounded-lg gap-2">
                  <span className="text-secondary text-sm min-w-0 flex-1 truncate">{product.nom}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-accent text-sm whitespace-nowrap">{formatCurrency(product.prix_vente)}</span>
                    <Button type="button" size="sm" variant="secondary" onClick={() => handleAddItem(product)}>
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {form.items.length > 0 && (
            <div className="rounded-xl p-4 border border-border" style={{ backgroundColor: 'var(--color-surface-2)' }}>
              <p className="text-secondary text-sm font-medium mb-2">Résumé</p>
              {form.items.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                return (
                  <div key={index} className="flex items-center justify-between py-1 gap-2">
                    <span className="text-secondary text-sm min-w-0 flex-1 truncate">{product?.nom} x{item.quantite}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-accent text-sm whitespace-nowrap">{formatCurrency(item.prix_unitaire * item.quantite)}</span>
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-danger hover:text-danger/80">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-border mt-2 pt-2 flex justify-between">
                <span className="text-secondary font-medium">Total</span>
                <span className="text-accent font-bold">
                  {formatCurrency(form.items.reduce((sum, i) => sum + i.prix_unitaire * i.quantite, 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-border bg-background">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:flex-1">Annuler</Button>
          <Button 
            type="button"
            onClick={handleSubmit} 
            className="w-full sm:flex-1" 
            disabled={!form.table_id || form.table_id === '' || form.items.length === 0}
          >
            {orderToEdit ? "Enregistrer les modifications" : "Créer la commande"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
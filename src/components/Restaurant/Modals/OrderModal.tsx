import React, { useState, useEffect } from 'react';
import { Modal, Select, Button } from '../../UI';
import { formatCurrency } from '../../../utils/data';
import { Plus, Search, XCircle } from 'lucide-react';
import type { TableRestaurant, Product, Client, Category } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: TableRestaurant[];
  products: Product[];
  categories: Category[];
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
  categories,
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
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDecreaseItem = (productId: number) => {
    const existingItem = form.items.find(i => i.product_id === productId);
    if (!existingItem) return;

    if (existingItem.quantite > 1) {
      setForm({
        ...form,
        items: form.items.map(i => 
          i.product_id === productId ? { ...i, quantite: i.quantite - 1 } : i
        )
      });
    } else {
      // Si la quantité passe à 0, on retire l'article de la liste
      setForm({
        ...form,
        items: form.items.filter(i => i.product_id !== productId)
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
      size="xl"
      title={orderToEdit ? "Modifier la commande" : "Nouvelle commande · Restaurant"}
    >
      <div className="flex flex-col bg-background rounded-xl overflow-hidden">
        {/* Corps du formulaire avec défilement */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
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

          <div className="overflow-hidden rounded-xl border border-border bg-[#101415]">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Menu du restaurant</p>
              <div className="relative w-40"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Rechercher" className="h-8 w-full rounded-lg border border-border bg-surface-2 pl-8 pr-2 text-xs text-primary" /></div>
            </div>
            <div className="grid grid-cols-[100px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)_210px]">
              <nav className="space-y-1 border-r border-border bg-[#171b1c] p-2">
                {['Toutes', ...categories.map(category => category.nom)].map(category => <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`w-full rounded-md px-2 py-3 text-left text-[11px] font-semibold ${selectedCategory === category ? 'bg-red-500 text-white' : 'text-secondary hover:bg-surface-3'}`}>{category}</button>)}
              </nav>
              <div className="min-w-0 p-2 sm:p-3">
                <div className="grid max-h-[330px] grid-cols-2 gap-2 overflow-y-auto xl:grid-cols-3">
              {products.filter(p => p.type_produit === 'PRODUIT_FINI' && p.actif && (selectedCategory === 'Toutes' || categories.find(category => category.id === p.category_id)?.nom === selectedCategory) && (!searchTerm.trim() || p.nom.toLowerCase().includes(searchTerm.trim().toLowerCase()))).map((product) => {
                const existingItem = form.items.find(i => i.product_id === product.id);
                const currentQty = existingItem ? existingItem.quantite : 0;

                return (
                  <div key={product.id} className="flex min-h-[82px] flex-col items-center justify-center rounded-md border border-emerald-950 bg-emerald-500 p-2 text-center">
                    <span className="text-xs font-bold leading-tight text-white">{product.nom}</span>
                    <span className="mt-1 text-[10px] font-semibold text-emerald-950">{formatCurrency(product.prix_vente)}</span>
                    <div className="mt-1 flex items-center gap-2">
                      
                      {/* Affichage du bouton - et de la quantité seulement si elle est > 0 */}
                      {currentQty > 0 && (
                        <>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => handleDecreaseItem(product.id)}
                          >
                            -
                          </Button>
                          <span className="text-secondary text-sm font-semibold w-6 text-center">
                            {currentQty}
                          </span>
                        </>
                      )}

                      <Button type="button" size="sm" variant="secondary" onClick={() => handleAddItem(product)}>
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
              <aside className="col-span-2 border-t border-border bg-[#171b1c] p-3 sm:col-span-1 sm:border-l sm:border-t-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Ticket</p>
                {form.items.length === 0 ? <p className="py-8 text-center text-xs text-muted">Sélectionnez un article</p> : form.items.map((item, index) => { const product = products.find(p => p.id === item.product_id); return <div key={`${item.product_id}-${index}`} className="flex items-center justify-between gap-2 border-b border-border py-2 text-xs"><span className="min-w-0 truncate text-secondary">{item.quantite} × {product?.nom}</span><span className="shrink-0 text-accent">{formatCurrency(item.prix_unitaire * item.quantite)}</span></div>; })}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-bold"><span>Total</span><span className="text-accent">{formatCurrency(form.items.reduce((sum, item) => sum + item.prix_unitaire * item.quantite, 0))}</span></div>
              </aside>
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
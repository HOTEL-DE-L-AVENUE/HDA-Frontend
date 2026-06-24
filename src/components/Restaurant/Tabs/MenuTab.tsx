import React from 'react';
import { Badge, Button, DataTable } from '../../UI';
import { formatCurrency } from '../../../utils/data';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Product, Category } from '../types';

interface MenuTabProps {
  products: Product[];
  categories: Category[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
}

export const MenuTab: React.FC<MenuTabProps> = ({
  products,
  categories,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}) => {
  const menuProducts = products.filter(p => p.type_produit === 'PRODUIT_FINI');

  const columns = [
    { key: 'nom', label: 'Nom', render: (p: Product) => (
      <div>
        <p className="text-primary font-medium">{p.nom}</p>
        <p className="text-muted text-xs">{p.code}</p>
      </div>
    )},
    { key: 'categorie', label: 'Catégorie', render: (p: Product) => (
      <span className="text-secondary">{categories.find(c => c.id === p.category_id)?.nom || '-'}</span>
    )},
    { key: 'prix', label: 'Prix', render: (p: Product) => (
      <span className="text-accent font-bold">{formatCurrency(p.prix_vente)}</span>
    )},
    { key: 'statut', label: 'Statut', render: (p: Product) => (
      <Badge variant={p.actif ? 'success' : 'danger'}>{p.actif ? 'Actif' : 'Inactif'}</Badge>
    )},
    { key: 'actions', label: '', render: (p: Product) => (
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => onEditProduct(p)}>
          <Edit size={14} />
        </Button>
        {p.actif && (
          <Button size="sm" variant="danger" onClick={() => onDeleteProduct(p.id)}>
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    )},
  ];

  const data = menuProducts.map(p => ({ ...p, id: String(p.id) }));

  return (
    <div className="rounded-2xl overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-primary font-semibold text-sm sm:text-base flex items-center gap-2">
          Carte du Restaurant
        </h3>
        <Button icon={<Plus size={16} />} onClick={onAddProduct} className="w-full sm:w-auto text-sm">
          Ajouter un plat
        </Button>
      </div>
      <div className="overflow-x-auto">
        <DataTable data={data} columns={columns as any} />
      </div>
    </div>
  );
};
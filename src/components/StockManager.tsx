// src/components/StockManager.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertCircle, Package, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { DataTable, Modal, Input, Select, Button, Badge } from './UI';
import { formatCurrency } from '../utils/data';
import AuthService from '../services/authService';
import { isAdmin } from '../utils/permissions';

interface StockItem {
  id: number;
  product_id: number;
  nom: string;
  categorie: string;
  quantite: number;
  unite: string;
  prix: number;
  seuil_minimum: number;
}

interface StockManagerProps {
  module: 'hotel' | 'bar' | 'restaurant';
  categories: string[];
  refreshTrigger?: number;
}

export const StockManager: React.FC<StockManagerProps> = ({ module, categories, refreshTrigger }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  const isHotel = module === 'hotel';
  const isBar = module === 'bar';
  const isRestaurant = module === 'restaurant';

  // Form state
  const [form, setForm] = useState({
    product_name: '',
    categorie: categories[0],
    prix: 0,
    quantite: 0,
    unite: 'unités',
    seuil_minimum: 5,
  });

  const uniteOptions = [
    { value: 'unités', label: 'Unités' },
    { value: 'bouteilles', label: 'Bouteilles' },
    { value: 'litres', label: 'Litres' },
    { value: 'cl', label: 'Cl' },
    { value: 'ml', label: 'Ml' },
    { value: 'pièces', label: 'Pièces' },
  ];

  const locationId = isHotel ? 5 : isBar ? 2 : 3;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/stock/stocks/with-products', {
        params: { location_id: locationId }
      });
      const payload = response.data?.data ?? response.data;
      const mappedItems = (Array.isArray(payload) ? payload : []).map((p: any) => ({
        id: p.id,
        product_id: p.product_id,
        nom: p.product_nom || p.nom,
        categorie: p.category_id ? `Catégorie ${p.category_id}` : 'Stock',
        quantite: p.quantite || 0,
        unite: p.product_unite || p.unite || 'unités',
        prix: p.prix_vente || 0,
        seuil_minimum: 5,
      }));
      setStockItems(mappedItems);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [module, refreshTrigger]);

  const handleSubmit = async () => {
    const productName = form.product_name.trim();
    const quantite = Number(form.quantite);
    const prix = Number(form.prix);
    const seuilMinimum = Number(form.seuil_minimum);

    if (!productName) {
      setError('Le nom du produit est requis.');
      return;
    }
    if (quantite < 0 || prix < 0 || seuilMinimum < 0) {
      setError('La quantité, le prix et le seuil doivent être des nombres positifs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editItem) {
        // Update stock quantity
        await api.put(`/api/stock/stocks/${editItem.id}`, {
          quantite: quantite,
          seuil_minimum: seuilMinimum,
        });
      } else {
        // Create new product
        const productResponse = await api.post('/api/stock/products', {
          nom: productName,
          category_id: 1, // Default category
          code: `${module.toUpperCase()}-${Date.now()}`,
          unite: form.unite,
          prix_vente: prix,
          actif: true,
          type_produit: 'CONSOMMABLE',
        });
        
        const productId = productResponse.data?.id || productResponse.data?.data?.id;
        
        if (productId) {
          // Try to create stock row - if it fails due to duplicate, update instead
          try {
            await api.post('/api/stock/stocks', {
              product_id: productId,
              location_id: locationId,
              quantite: quantite,
              seuil_minimum: seuilMinimum,
            });
          } catch (err: any) {
            // If duplicate, find existing stock and update it
            if (err.response?.status === 409) {
              const stocksResponse = await api.get('/api/stock/stocks/with-products', {
                params: { location_id: locationId }
              });
              const existingStock = stocksResponse.data?.data?.find((s: any) => s.product_id === productId);
              if (existingStock) {
                await api.put(`/api/stock/stocks/${existingStock.id}`, {
                  quantite: quantite,
                  seuil_minimum: seuilMinimum,
                });
              }
            } else {
              throw err;
            }
          }
        }
      }

      await fetchData();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError('Erreur lors de la sauvegarde du stock');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: StockItem) => {
    const productName = item.nom || `l'article #${item.product_id}`;
    if (!confirm(`Voulez-vous vraiment supprimer ${productName} du stock ?`)) return;
    
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/stock/stocks/${item.id}`);
      await fetchData();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      product_name: '',
      categorie: categories[0],
      prix: 0,
      quantite: 0,
      unite: 'unités',
      seuil_minimum: 5,
    });
    setEditItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: StockItem) => {
    setEditItem(item);
    setForm({
      product_name: item.nom,
      categorie: item.categorie,
      prix: item.prix,
      quantite: item.quantite,
      unite: item.unite,
      seuil_minimum: item.seuil_minimum,
    });
    setShowModal(true);
  };

  // Calcul du statut
  const getStatus = (item: StockItem) => {
    const quantite = item.quantite || 0;
    const seuil = item.seuil_minimum || 5;
    if (quantite === 0) return 'epuise';
    if (quantite <= seuil) return 'faible';
    return 'disponible';
  };

  // Filtrer les articles
  const filteredItems = stockItems.filter(item => {
    const matchSearch = (item.nom || '').toLowerCase().includes(search.toLowerCase());
    const status = getStatus(item);
    const matchStatus = filterStatus === 'all' || status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Statistiques
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantite || 0) * (item.prix || 0), 0);
  const alerts = stockItems.filter(item => getStatus(item) !== 'disponible').length;
  const outOfStock = stockItems.filter(item => (item.quantite || 0) === 0).length;

  // Colonnes pour le DataTable
  const columns = [
    {
      key: 'product',
      label: 'Produit',
      render: (item: any) => (
        <div>
          <p className="text-white font-medium">{item.nom}</p>
          <p className="text-slate-500 text-xs">{item.categorie}</p>
        </div>
      )
    },
    {
      key: 'quantite',
      label: 'Stock',
      render: (item: StockItem) => (
        <div>
          <p className="text-white font-semibold">{item.quantite || 0} {item.unite || 'unités'}</p>
          <p className="text-slate-600 text-xs">Min: {item.seuil_minimum || 5}</p>
        </div>
      )
    },
    {
      key: 'prix',
      label: 'Prix Unit.',
      render: (item: any) => (
        <span className="text-white">{formatCurrency(item.prix || 0)}</span>
      )
    },
    {
      key: 'valeur',
      label: 'Valeur',
      render: (item: any) => (
        <span className="text-amber-400 font-semibold">
          {formatCurrency((item.quantite || 0) * (item.prix || 0))}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: StockItem) => {
        const status = getStatus(item);
        return (
          <Badge variant={status}>
            {status === 'disponible' ? 'Disponible' : status === 'faible' ? 'Faible' : 'Épuisé'}
          </Badge>
        );
      }
    },
    ...(userIsAdmin ? [{
      key: 'actions',
      label: '',
      render: (item: StockItem) => (
        <div className="flex gap-2">
          <button 
            onClick={() => openEditModal(item)} 
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            title="Modifier la quantité"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={() => handleDelete(item)} 
            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all"
            title="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }] : [])
  ];

  if (loading && stockItems.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-400 mr-2" size={20} />
        <span className="text-slate-400 text-sm">Chargement du stock...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: stockItems.length, color: 'text-white', sub: 'articles total' },
          { label: 'Valeur Totale', value: formatCurrency(totalValue), color: 'text-amber-400', sub: 'en stock' },
          { label: 'Alertes', value: alerts, color: alerts > 0 ? 'text-amber-400' : 'text-emerald-400', sub: 'à surveiller' },
          { label: 'Épuisés', value: outOfStock, color: 'text-red-400', sub: 'rupture de stock' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-4">
            <p className="text-slate-500 text-xs font-medium mb-1">{stat.label}</p>
            <p className={`${stat.color} font-bold text-xl`}>{stat.value}</p>
            <p className="text-slate-600 text-xs">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Tableau du stock */}
      <div className="bg-slate-900 border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-800/50">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Package size={18} className="text-amber-400" />
            Inventaire {isHotel ? 'Hôtel' : isBar ? 'Bar & Lounge' : 'Restaurant'}
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Rechercher..." 
                className="w-full sm:w-48 h-9 pl-9 pr-3 bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50" 
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="h-9 px-3 bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 text-sm focus:outline-none"
            >
              <option value="all">Tous</option>
              <option value="disponible">Disponible</option>
              <option value="faible">Faible</option>
              <option value="epuise">Épuisé</option>
            </select>
            {userIsAdmin && (
              <Button icon={<Plus size={16} />} onClick={openCreateModal}>
                Ajouter
              </Button>
            )}
          </div>
        </div>
        <DataTable data={filteredItems} columns={columns} />
      </div>

      {/* Modal de création/modification */}
      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); resetForm(); }} 
        title={editItem ? 'Modifier la quantité' : 'Ajouter un produit au stock'}
      >
        <div className="space-y-4">
          {!editItem && (
            <>
              <Input 
                label="Nom du produit" 
                value={form.product_name} 
                onChange={e => setForm({...form, product_name: e.target.value})} 
                placeholder="Ex: Serviette, Savon, Produit..." 
              />
              <Select 
                label="Catégorie" 
                value={form.categorie} 
                onChange={e => setForm({...form, categorie: e.target.value})} 
                options={categories.map(c => ({ value: c, label: c }))} 
              />
              <Input 
                label="Prix unitaire (MGA)" 
                type="number" 
                value={form.prix} 
                onChange={e => setForm({...form, prix: Number(e.target.value)})} 
                placeholder="0" 
              />
            </>
          )}

          {editItem && (
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
              <p className="text-white font-medium">{form.product_name}</p>
              <p className="text-slate-400 text-sm">Catégorie: {form.categorie}</p>
              <p className="text-slate-400 text-sm">Prix unitaire: {formatCurrency(form.prix)}</p>
              <p className="text-slate-400 text-sm">Quantité actuelle: {editItem.quantite} {editItem.unite || 'unités'}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantité" 
              type="number" 
              value={form.quantite} 
              onChange={e => setForm({...form, quantite: Number(e.target.value)})} 
              placeholder="0" 
            />
            <Select 
              label="Unité" 
              value={form.unite} 
              onChange={e => setForm({...form, unite: e.target.value})} 
              options={uniteOptions} 
            />
          </div>

          <Input 
            label="Seuil minimum d'alerte" 
            type="number" 
            value={form.seuil_minimum} 
            onChange={e => setForm({...form, seuil_minimum: Number(e.target.value)})} 
            placeholder="5" 
          />

          {editItem && (
            <p className="text-xs text-amber-400">
              * Modification de la quantité uniquement. Pour modifier le prix ou la catégorie, veuillez supprimer et recréer l'article.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? 'Enregistrement...' : (editItem ? 'Mettre à jour' : 'Ajouter')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// CaisseManager component (cash register for hotel)
export const CaisseManager: React.FC<StockManagerProps> = ({ module, categories }) => {
  return (
    <div className="text-center py-12 text-slate-400">
      <p>Module caisse non implémenté pour le moment</p>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Package, Plus, History, X, Truck, BookOpen,
  ChevronRight, AlertTriangle, RefreshCw, Trash2,
} from 'lucide-react';
import * as restaurantService from '../../../services/restaurantService';
import { Button } from '../../UI';
import { useHDA } from '../../../context/HDAContext';
import AuthService from '../../../services/authService';
import { isAdmin } from '../../../utils/permissions';

// ==================== TYPES ====================

interface StockItem {
  id: number;
  product_id: number;
  location_id: number;
  quantite: number;
  product_nom: string;
  unite: string;
  code: string;
  location_nom: string;
  type_produit: string;
}

interface StockLocation { id: number; nom: string; }
interface Unit { id: number; code: string; nom: string; }
interface Supplier { id: number; nom: string; telephone?: string; email?: string; }
interface Category { id: number; nom: string; }

interface Product {
  id: number; nom: string; unite: string;
  type_produit: string; code: string;
  prix_achat: number; prix_vente: number;
  actif: boolean; category_id: number | null;
  category_nom?: string;
}

interface Purchase {
  id: number; supplier_nom: string; montant_total: number; statut: string;
}

type InnerTab = 'stock' | 'achats';

// ==================== HELPERS ====================

const inputClass = "w-full h-9 px-3 rounded-xl text-primary text-sm";
const inputStyle = { backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' };

const ModalShell: React.FC<{
  title: string; onClose: () => void; wide?: boolean; children: React.ReactNode;
}> = ({ title, onClose, wide, children }) =>
    createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div
          className={`rounded-xl p-6 w-full ${wide ? 'max-w-2xl' : 'max-w-sm'} max-h-[90vh] overflow-y-auto`}
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-primary font-semibold">{title}</h4>
            <button onClick={onClose} className="text-muted hover:text-primary"><X size={18} /></button>
          </div>
          {children}
        </div>
      </div>,
      document.body
    );

// ==================== TAB BAR ====================

const TabBar: React.FC<{ active: InnerTab; onChange: (t: InnerTab) => void }> = ({ active, onChange }) => (
  <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--color-surface-2)' }}>
      {([
      { key: 'stock' as const, label: 'Stock', icon: <Package size={14} /> },
      { key: 'achats' as const, label: 'Achats', icon: <Truck size={14} /> },
    ]).map(t => (
      <button
        key={t.key}
        onClick={() => onChange(t.key)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
        style={{
          backgroundColor: active === t.key ? 'var(--color-accent)' : 'transparent',
          color: active === t.key ? '#fff' : 'var(--color-text-secondary)',
        }}
      >
        {t.icon}{t.label}
      </button>
    ))}
  </div>
);

// ==================== STOCK TAB ====================

export const StockTab: React.FC = () => {
  const [inner, setInner] = useState<InnerTab>('stock');
  return (
    <div className="rounded-2xl w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <div className="p-4">
        <h3 className="text-primary font-semibold flex items-center gap-2 mb-4">
          <Package size={18} className="text-accent" /> Gestion des Stocks — Restaurant
        </h3>
        <TabBar active={inner} onChange={setInner} />
        {inner === 'stock' && <StockPanel />}
        {inner === 'achats' && <AchatsPanel />}
      </div>
    </div>
  );
};

// ==================== PANEL STOCK ====================

const StockPanel: React.FC = () => {
  const { addNotification } = useHDA();
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [selectedLoc, setSelectedLoc] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [histLoading, setHistLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<StockItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Ajout produit
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nom, setNom] = useState('');
  const [unite, setUnite] = useState('');
  const [uniteCustom, setUniteCustom] = useState('');
  const [prixAchat, setPrixAchat] = useState(0);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [initQty, setInitQty] = useState(0);
  const [addErr, setAddErr] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Ajustement
  const [adjType, setAdjType] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [adjQty, setAdjQty] = useState(0);
  const [adjErr, setAdjErr] = useState('');
  const [adjLoading, setAdjLoading] = useState(false);

  const [productTypes, setProductTypes] = useState<{ id: number; nom: string; actif: boolean }[]>([]);

  useEffect(() => {
    Promise.all([
      restaurantService.getStockLocations(),
      restaurantService.getUnits(),
      restaurantService.getCategories().catch(() => ({ success: false, data: [] })),
    ]).then(([loc, un, cat]) => {
if (loc.success) {
        setLocations(loc.data);
        const restaurantLocation = loc.data.find((location: StockLocation) => location.nom.toLowerCase().includes('restaurant'));
        if (restaurantLocation) setSelectedLoc(restaurantLocation.id);
        else if (loc.data.length > 0) setSelectedLoc(loc.data[0].id);
      }
      if (un.success) {
        setUnits(un.data);
        if (un.data.length > 0) setUnite(un.data[0].code);
      }
      if (cat.success) setCategories(cat.data);
    });
  }, []);

  useEffect(() => {
    // Charger les types de produits
    restaurantService.getProductTypes()
      .then(res => {
        if (res.success) setProductTypes(res.data);
      })
      .catch(console.error);
  }, []);

  const loadStocks = useCallback(() => {
    if (!selectedLoc) return;
    setLoading(true);
    const params: Record<string, any> = { location_id: selectedLoc };
    if (typeFilter) params.type_produit = typeFilter;
    restaurantService.getStocks(params)
      .then(res => { if (res.success) setStocks(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedLoc, typeFilter]);

  useEffect(() => { loadStocks(); }, [loadStocks]);

  const loadHistory = () => {
    if (!selectedLoc) return;
    setHistLoading(true);
    restaurantService.getStockMovements({ location_id: selectedLoc })
      .then(res => { if (res.success) { setMovements(res.data); setShowHistory(true); } })
      .catch(console.error)
      .finally(() => setHistLoading(false));
  };

  const quickAdjust = async (productId: number, delta: number) => {
    if (!selectedLoc) return;
    try {
      const res = await restaurantService.adjustStock({
        product_id: productId,
        location_id: selectedLoc,
        type_mouvement: delta > 0 ? 'ENTREE' : 'SORTIE',
        quantite: Math.abs(delta),
        source_module: 'MANUEL',
      });
      if (res.success) {
        setStocks(prev => {
          const updated = prev.map(s =>
            s.product_id === productId ? { ...s, quantite: res.data.newQty } : s
          );
          
          // Check if stock is now low and add notification
          const updatedItem = updated.find(s => s.product_id === productId);
          if (updatedItem && updatedItem.quantite <= 5) {
            addNotification(
              updatedItem.quantite <= 3 ? 'error' : 'warning',
              `Stock faible: ${updatedItem.product_nom} (${updatedItem.quantite} ${updatedItem.unite})`,
              'Restaurant',
              '/restaurant?tab=stock'
            );
          }
          
          return updated;
        });
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleAdjust = async () => {
    if (!adjustTarget || !selectedLoc || adjQty <= 0) { setAdjErr('Quantité invalide.'); return; }
    setAdjLoading(true); setAdjErr('');
    try {
      const res = await restaurantService.adjustStock({
        product_id: adjustTarget.product_id,
        location_id: selectedLoc,
        type_mouvement: adjType,
        quantite: adjQty,
        source_module: 'MANUEL',
      });
      if (res.success) {
        setStocks(prev => prev.map(s =>
          s.product_id === adjustTarget.product_id ? { ...s, quantite: res.data.newQty } : s
        ));
        setShowAdjustModal(false);
      }
    } catch (e: any) { setAdjErr(e.message); }
    finally { setAdjLoading(false); }
  };

  const handleAddProduct = async () => {
    if (!selectedLoc) return;
    const finalUnite = unite === 'AUTRE' ? uniteCustom.trim() : unite;
    if (!nom.trim()) { setAddErr('Nom requis.'); return; }
    if (!finalUnite) { setAddErr('Unité requise.'); return; }
    if (initQty <= 0) { setAddErr('Quantité initiale > 0.'); return; }
    setAddLoading(true); setAddErr('');
    try {
      const prodRes = await restaurantService.createProduct({
        nom: nom.trim(),
        unite: finalUnite,
        type_produit: selectedType,
        prix_achat: prixAchat,
        prix_vente: prixVente,
        category_id: categoryId ? Number(categoryId) : undefined,
      });
      if (!prodRes.data) throw new Error(prodRes.message || 'Erreur');
      await restaurantService.adjustStock({
        product_id: prodRes.data.id,
        location_id: selectedLoc,
        type_mouvement: 'ENTREE',
        quantite: initQty,
        source_module: 'INVENTAIRE',
      });
      await loadStocks();
      setShowAddModal(false);
      setNom(''); setPrixAchat(0); setInitQty(0); setCategoryId('');
    } catch (e: any) { setAddErr(e.message); }
    finally { setAddLoading(false); }
  };

  const handleDeleteStock = async () => {
    if (!deleteTarget || deleteLoading) return;
    setDeleteLoading(true);
    try {
      // Use product_id + location_id to reliably identify the stock row
      console.log('Deleting stock item with ID:', deleteTarget.id);
      const res = await restaurantService.deleteStockItem({ product_id: deleteTarget.product_id, location_id: deleteTarget.location_id });
      if (res.success) {
        setStocks(prev => prev.filter(s => !(s.product_id === deleteTarget.product_id && s.location_id === deleteTarget.location_id)));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        addNotification('success', 'Produit supprimé du stock', 'Restaurant');
      }
    } catch (e: any) {
      console.error('Delete error:', e);
      addNotification('error', e.message || 'Erreur lors de la suppression', 'Restaurant');
    } finally {
      setDeleteLoading(false);
    }
  };

  const stockBas = stocks.filter(s => Number(s.quantite) < 5);

  const [selectedType, setSelectedType] = useState('MATIERE_PREMIERE');

  const [prixVente, setPrixVente] = useState(0);

  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  return (
    <>
      {/* Alertes stock bas */}
      {stockBas.length > 0 && (
        <div className="mb-4 p-3 rounded-xl flex items-start gap-2" style={{ backgroundColor: 'var(--color-warning-bg, #fff7ed)', border: '1px solid var(--color-warning, #f97316)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-warning, #f97316)' }} className="mt-0.5 shrink-0" />
          <p className="text-xs" style={{ color: 'var(--color-warning, #f97316)' }}>
            <span className="font-semibold">Stock bas :</span>{' '}
            {stockBas.map(s => `${s.product_nom} (${Number(s.quantite).toFixed(2)} ${s.unite})`).join(' • ')}
          </p>
        </div>
      )}

      {/* Contrôles */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={selectedLoc || ''}
          onChange={e => setSelectedLoc(Number(e.target.value))}
          className="h-9 px-3 rounded-xl text-primary text-sm"
          style={inputStyle}
        >
          {locations.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
        </select>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-xl text-primary text-sm"
          style={inputStyle}
        >
          <option value="">Tous types</option>
          {productTypes.map(type => (
            <option key={type.id} value={type.nom}>{type.nom}</option>
          ))}
        </select>

        <button
          onClick={loadStocks}
          className="h-9 px-3 rounded-xl text-sm flex items-center gap-1"
          style={{ ...inputStyle, color: 'var(--color-text-secondary)' }}
        >
          <RefreshCw size={14} />
        </button>

        <div className="flex-1" />

        <button 
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
          onClick={loadHistory} 
          disabled={histLoading}
        >
          <History size={14} className="mr-1" /> Historique
        </button>
        {userIsAdmin && (
          <button 
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}
            onClick={() => { setAddErr(''); setShowAddModal(true); }}
          >
            <Plus size={14} className="mr-1" /> Nouveau produit
          </button>
        )}
      </div>

      {/* Grille */}
      {loading ? (
        <p className="text-sm text-muted py-8 text-center">Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {stocks.map(stock => {
            const qty = Number(stock.quantite);
            const isLow = qty < 5;
            return (
              <div
                key={`${stock.product_id}-${stock.location_id}`}
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderColor: isLow ? 'var(--color-warning, #f97316)' : 'var(--color-border)',
                }}
              >
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-secondary text-sm font-medium leading-snug">{stock.product_nom}</p>
                  <span className="text-xs text-muted ml-1 shrink-0">{stock.unite}</span>
                </div>
                <p className="text-xs text-muted mb-3">{stock.location_nom}</p>
                <div className="flex items-center justify-between gap-2">
                  {userIsAdmin ? (
                    <button
                      onClick={() => { setAdjustTarget(stock); setAdjType('ENTREE'); setAdjQty(0); setAdjErr(''); setShowAdjustModal(true); }}
                      className={`font-bold text-sm hover:underline ${isLow ? 'text-warning' : 'text-accent'}`}
                      title="Cliquer pour ajustement précis"
                      style={{ color: isLow ? 'var(--color-warning, #f97316)' : undefined }}
                    >
                      {qty.toFixed(2)}
                    </button>
                  ) : (
                    <span
                      className={`font-bold text-sm ${isLow ? 'text-warning' : 'text-accent'}`}
                      style={{ color: isLow ? 'var(--color-warning, #f97316)' : undefined }}
                    >
                      {qty.toFixed(2)}
                    </span>
                  )}
                  {userIsAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => quickAdjust(stock.product_id, -1)}
                        className="w-7 h-7 rounded-lg bg-danger-bg text-danger flex items-center justify-center font-bold"
                        title="Diminuer stock"
                      >−</button>
                      <button
                        onClick={() => quickAdjust(stock.product_id, +1)}
                        className="w-7 h-7 rounded-lg bg-success-bg text-success flex items-center justify-center font-bold"
                        title="Augmenter stock"
                      >+</button>
                      {stock.id && (
                        <button
                          onClick={() => { setDeleteTarget(stock); setShowDeleteModal(true); }}
                          className="w-7 h-7 rounded-lg bg-danger-bg text-danger flex items-center justify-center"
                          title="Supprimer du stock"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {stocks.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted text-sm">
              Aucun produit en stock pour cet emplacement
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {showHistory && (
        <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-primary">Mouvements récents</h4>
            <button onClick={() => setShowHistory(false)} className="text-xs text-muted hover:text-primary">Fermer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted">
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Produit</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-right p-2">Qté</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-2 text-secondary">{new Date(m.created_at).toLocaleString('fr-FR')}</td>
                    <td className="p-2 text-primary">{m.product_nom}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.type_mouvement === 'ENTREE' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                        {m.type_mouvement}
                      </span>
                    </td>
                    <td className="p-2 text-muted">{m.source_module || '—'}</td>
                    <td className="p-2 text-right">{Number(m.quantite).toFixed(2)} {m.unite}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-muted">Aucun mouvement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL Nouveau produit */}
      {showAddModal && (
        <ModalShell title="Nouveau produit en stock" onClose={() => setShowAddModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-secondary mb-1">Nom <span className="text-danger">*</span></label>
              <input type="text" placeholder="Ex : Farine de blé" value={nom}
                onChange={e => setNom(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Catégorie</label>
              <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value) || '')}
                className={inputClass} style={inputStyle}>
                <option value="">Sans catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Type de produit <span className="text-danger">*</span></label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                {productTypes.map(type => (
                  <option key={type.id} value={type.nom}>{type.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Unité <span className="text-danger">*</span></label>
              <select value={unite} onChange={e => setUnite(e.target.value)} className={inputClass} style={inputStyle}>
                {units.map(u => <option key={u.id} value={u.code}>{u.nom} ({u.code})</option>)}
                <option value="AUTRE">Autre…</option>
              </select>
              {unite === 'AUTRE' && (
                <input type="text" placeholder="Saisir l'unité" value={uniteCustom}
                  onChange={e => setUniteCustom(e.target.value)}
                  className={`${inputClass} mt-2`} style={inputStyle} />
              )}
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Prix d'achat unitaire (Ar)</label>
              <input type="number" min="0" step="any" value={prixAchat}
                onChange={e => setPrixAchat(Number(e.target.value))} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Prix de vente unitaire (Ar)</label>
              <input type="number" min="0" step="any" value={prixVente}
                onChange={e => setPrixVente(Number(e.target.value))}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Quantité initiale (inventaire) <span className="text-danger">*</span></label>
              <input type="number" min="0" step="any" value={initQty}
                onChange={e => setInitQty(Number(e.target.value))} className={inputClass} style={inputStyle} />
            </div>
            {addErr && <p className="text-xs text-danger">{addErr}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                onClick={() => setShowAddModal(false)} 
                disabled={addLoading}
              >
                Annuler
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}
                onClick={handleAddProduct} 
                disabled={addLoading}
              >
                {addLoading ? 'Création…' : 'Créer & ajouter'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* MODAL Ajustement précis */}
      {showAdjustModal && adjustTarget && (
        <ModalShell title="Ajuster le stock" onClose={() => setShowAdjustModal(false)}>
          <p className="text-sm text-secondary mb-4">
            <span className="font-medium text-primary">{adjustTarget.product_nom}</span>
            {' '}— stock : <span className="text-accent font-bold">{Number(adjustTarget.quantite).toFixed(2)} {adjustTarget.unite}</span>
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['ENTREE', 'SORTIE'] as const).map(t => (
                <button key={t} onClick={() => setAdjType(t)} className="flex-1 h-9 rounded-xl text-sm font-medium border transition-all"
                  style={{
                    backgroundColor: adjType === t ? (t === 'ENTREE' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)') : 'var(--color-surface-2)',
                    color: adjType === t ? (t === 'ENTREE' ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-text-secondary)',
                    borderColor: adjType === t ? (t === 'ENTREE' ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-border)',
                  }}>
                  {t === 'ENTREE' ? '+ Entrée' : '− Sortie'}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">Quantité <span className="text-danger">*</span></label>
              <input type="number" min="0.01" step="any" placeholder="Ex : 5.5"
                value={adjQty || ''} onChange={e => setAdjQty(Number(e.target.value))}
                className={inputClass} style={inputStyle} />
            </div>
            {adjErr && <p className="text-xs text-danger">{adjErr}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                onClick={() => setShowAdjustModal(false)} 
                disabled={adjLoading}
              >
                Annuler
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}
                onClick={handleAdjust} 
                disabled={adjLoading}
              >
                {adjLoading ? 'En cours…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* MODAL Suppression */}
      {showDeleteModal && deleteTarget && (
        <ModalShell title="Supprimer du stock" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-secondary mb-4">
            Êtes-vous sûr de vouloir supprimer <span className="font-medium text-primary">{deleteTarget.product_nom}</span> du stock ?
          </p>
          <p className="text-xs text-muted mb-4">
            Cette action est irréversible. Le produit sera retiré de l'emplacement <span className="font-medium">{deleteTarget.location_nom}</span>.
          </p>
          <div className="flex gap-2 justify-end pt-1">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
              onClick={() => setShowDeleteModal(false)}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ backgroundColor: deleteLoading ? 'var(--color-surface-2)' : 'var(--color-danger)', color: deleteLoading ? 'var(--color-text-secondary)' : 'white' }}
              onClick={handleDeleteStock}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </ModalShell>
      )}
    </>
  );
};

// ==================== PANEL ACHATS ====================

const AchatsPanel: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Nouvel achat
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [lines, setLines] = useState([{ product_id: '' as number | '', location_id: '' as number | '', quantite: 0, prix_unitaire: 0 }]);
  const [purchaseErr, setPurchaseErr] = useState('');
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Nouveau fournisseur
  const [supNom, setSupNom] = useState('');
  const [supTel, setSupTel] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supErr, setSupErr] = useState('');
  const [supLoading, setSupLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      restaurantService.getSuppliers(),
      restaurantService.getProducts({ actif: true }),
      restaurantService.getStockLocations(),
      restaurantService.getPurchases(),
    ]).then(([sup, prod, loc, pur]: any[]) => {
      setSuppliers(sup?.data || sup || []);
      setProducts(prod?.data || prod || []);
      setLocations(loc?.data || loc || []);
      setPurchases(pur?.data || pur || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLine = (i: number, field: string, val: any) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const total = lines.reduce((s, l) => s + (l.quantite * l.prix_unitaire), 0);

  const handlePurchase = async () => {
    if (!supplierId) { setPurchaseErr('Fournisseur requis.'); return; }
    for (const l of lines) {
      if (!l.product_id || !l.location_id || l.quantite <= 0 || l.prix_unitaire <= 0) {
        setPurchaseErr('Toutes les lignes doivent être complètes et > 0.'); return;
      }
    }
    setPurchaseLoading(true); setPurchaseErr('');
    try {
      const res = await restaurantService.createPurchase({
        supplier_id: Number(supplierId),
        items: lines.map(l => ({
          product_id: Number(l.product_id),
          location_id: Number(l.location_id),
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire,
        })),
      });
      if (res.success) {
        await load();
        setShowPurchaseModal(false);
        setSupplierId('');
        setLines([{ product_id: '', location_id: '', quantite: 0, prix_unitaire: 0 }]);
      }
    } catch (e: any) { setPurchaseErr(e.message); }
    finally { setPurchaseLoading(false); }
  };

  const handleSupplier = async () => {
    if (!supNom.trim()) { setSupErr('Nom requis.'); return; }
    setSupLoading(true); setSupErr('');
    try {
      const res = await restaurantService.createSupplier({ nom: supNom.trim(), telephone: supTel || undefined, email: supEmail || undefined });
      if (res.success) {
        setSuppliers(prev => [...prev, res.data]);
        setShowSupplierModal(false);
        setSupNom(''); setSupTel(''); setSupEmail('');
      }
    } catch (e: any) { setSupErr(e.message); }
    finally { setSupLoading(false); }
  };

  const openDetail = async (id: number) => {
    try {
      const res = await restaurantService.getPurchaseById(id);
      if (res.success) { setSelectedPurchase(res.data); setShowDetailModal(true); }
    } catch (e) { console.error(e); }
  };

  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <p className="text-sm text-secondary">{purchases.length} achat(s)</p>
        {userIsAdmin && (
          <div className="flex gap-2">
            <button 
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
              onClick={() => setShowSupplierModal(true)}
            >
              <Plus size={14} className="mr-1" /> Fournisseur
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}
              onClick={() => { setPurchaseErr(''); setShowPurchaseModal(true); }}
            >
              <Truck size={14} className="mr-1" /> Nouvel achat
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Chargement...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs">
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Fournisseur</th>
                <th className="text-left p-2">Statut</th>
                <th className="text-right p-2">Total</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-2 text-muted text-xs">#{p.id}</td>
                  <td className="p-2 text-primary">{p.supplier_nom || '—'}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-success-bg text-success">{p.statut}</span>
                  </td>
                  <td className="p-2 text-right font-medium text-primary">
                    {Number(p.montant_total).toLocaleString('fr-FR')} Ar
                  </td>
                  <td className="p-2">
                    <button onClick={() => openDetail(p.id)} className="text-accent hover:opacity-70">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted">Aucun achat enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL Nouvel achat */}
      {showPurchaseModal && (
        <ModalShell title="Nouvel achat fournisseur" onClose={() => setShowPurchaseModal(false)} wide>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-secondary mb-1">Fournisseur <span className="text-danger">*</span></label>
              <select value={supplierId} onChange={e => setSupplierId(Number(e.target.value))}
                className={inputClass} style={inputStyle}>
                <option value="">Sélectionner…</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>

            {/* Lignes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-secondary font-medium">Produits achetés</label>
                <button onClick={() => setLines(p => [...p, { product_id: '', location_id: '', quantite: 0, prix_unitaire: 0 }])}
                  className="text-xs text-accent hover:underline flex items-center gap-1">
                  <Plus size={12} /> Ajouter une ligne
                </button>
              </div>
              {/* Headers */}
              <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                {['Produit (matière)', 'Dépôt de stockage', 'Quantité', 'P.U. (Ar)', ''].map((h, i) => (
                  <div key={i} className={`text-xs text-muted ${[4, 3, 2, 2, 1][i] === 4 ? 'col-span-4' : [4, 3, 2, 2, 1][i] === 3 ? 'col-span-3' : [4, 3, 2, 2, 1][i] === 2 ? 'col-span-2' : 'col-span-1'}`}>
                    {h}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <select value={line.product_id} onChange={e => updateLine(i, 'product_id', Number(e.target.value))}
                        className="w-full h-9 px-2 rounded-xl text-primary text-xs" style={inputStyle}>
                        <option value="">Produit…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.unite})</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <select value={line.location_id} onChange={e => updateLine(i, 'location_id', Number(e.target.value))}
                        className="w-full h-9 px-2 rounded-xl text-primary text-xs" style={inputStyle}>
                        <option value="">Dépôt…</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" step="any" placeholder="Qté"
                        value={line.quantite || ''} onChange={e => updateLine(i, 'quantite', Number(e.target.value))}
                        className="w-full h-9 px-2 rounded-xl text-primary text-xs" style={inputStyle} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" step="any" placeholder="Prix"
                        value={line.prix_unitaire || ''} onChange={e => updateLine(i, 'prix_unitaire', Number(e.target.value))}
                        className="w-full h-9 px-2 rounded-xl text-primary text-xs" style={inputStyle} />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      {lines.length > 1 && (
                        <button onClick={() => setLines(p => p.filter((_, idx) => idx !== i))} className="text-danger">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-2">
                <p className="text-sm font-semibold text-primary">
                  Total : <span className="text-accent">{total.toLocaleString('fr-FR')} Ar</span>
                </p>
              </div>
            </div>

            {purchaseErr && <p className="text-xs text-danger">{purchaseErr}</p>}
            <div className="flex gap-2 justify-end">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                onClick={() => setShowPurchaseModal(false)} 
                disabled={purchaseLoading}
              >
                Annuler
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}
                onClick={handlePurchase} 
                disabled={purchaseLoading}
              >
                {purchaseLoading ? 'Enregistrement…' : 'Valider l\'achat'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* MODAL Nouveau fournisseur */}
      {showSupplierModal && (
        <ModalShell title="Nouveau fournisseur" onClose={() => setShowSupplierModal(false)}>
          <div className="space-y-3">
            {[
              { label: 'Nom', val: supNom, set: setSupNom, req: true, placeholder: 'Nom du fournisseur', type: 'text' },
              { label: 'Téléphone', val: supTel, set: setSupTel, req: false, placeholder: '+261 34…', type: 'text' },
              { label: 'Email', val: supEmail, set: setSupEmail, req: false, placeholder: 'contact@…', type: 'email' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-sm text-secondary mb-1">
                  {f.label} {f.req && <span className="text-danger">*</span>}
                </label>
                <input type={f.type} placeholder={f.placeholder} value={f.val}
                  onChange={e => f.set(e.target.value)} className={inputClass} style={inputStyle} />
              </div>
            ))}
            {supErr && <p className="text-xs text-danger">{supErr}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                onClick={() => setShowSupplierModal(false)} 
                disabled={supLoading}
              >
                Annuler
              </button>
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--color-accent)', color: 'black' }}
                onClick={handleSupplier} 
                disabled={supLoading}
              >
                {supLoading ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* MODAL Détail achat */}
      {showDetailModal && selectedPurchase && (
        <ModalShell title={`Achat #${selectedPurchase.id} — ${selectedPurchase.supplier_nom}`} onClose={() => setShowDetailModal(false)} wide>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-muted text-xs">
                <th className="text-left p-2">Produit</th>
                <th className="text-right p-2">Quantité</th>
                <th className="text-right p-2">P.U. (Ar)</th>
                <th className="text-right p-2">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {(selectedPurchase.items || []).map((item: any) => (
                <tr key={item.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-2 text-primary">{item.product_nom}</td>
                  <td className="p-2 text-right">{item.quantite} {item.unite}</td>
                  <td className="p-2 text-right">{Number(item.prix_unitaire).toLocaleString('fr-FR')}</td>
                  <td className="p-2 text-right font-medium">{(item.quantite * item.prix_unitaire).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
            <p className="font-semibold text-primary">
              Total : <span className="text-accent">{Number(selectedPurchase.montant_total).toLocaleString('fr-FR')} Ar</span>
            </p>
          </div>
        </ModalShell>
      )}
    </>
  );
};

// Recettes UI removed

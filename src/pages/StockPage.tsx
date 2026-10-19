// src/pages/StockPage.tsx
// Vue consolidée du stock : tous les articles du bar, du restaurant et de l'hôtel
// avec leur quantité restante. Les entrées / sorties se font dans chaque module.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, RefreshCw, Package, AlertTriangle, XCircle, CheckCircle, Loader, AlertCircle, X, Printer, Eye, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { stockService, StockOverviewItem, StockItemDetails } from '../services/stock.service';
import { escapeHtml, printThermal, thermalHeader } from '../utils/thermalPrint';
import { Modal } from '../components/Modal';

type StockStatus = 'ok' | 'faible' | 'rupture';

const MODULE_LABELS: Record<string, string> = {
  BAR: 'Bar & Lounge',
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  HEBERGEMENT: 'Hébergement',
  CASINO: 'Casino',
};

const PAGE_SIZE = 50;

const moduleLabel = (item: StockOverviewItem) => MODULE_LABELS[item.module] || item.emplacement;

const statusOf = (item: StockOverviewItem): StockStatus => {
  if (item.quantite <= 0) return 'rupture';
  if (item.quantite <= item.seuil_minimum) return 'faible';
  return 'ok';
};

const STATUS_CONFIG: Record<StockStatus, { label: string; className: string; icon: React.ReactNode }> = {
  ok: { label: 'En stock', className: 'bg-success/10 text-success border-success/20', icon: <CheckCircle size={12} /> },
  faible: { label: 'Faible', className: 'bg-warning/10 text-warning border-warning/20', icon: <AlertTriangle size={12} /> },
  rupture: { label: 'Rupture', className: 'bg-danger/10 text-danger border-danger/20', icon: <XCircle size={12} /> },
};

const formatQty = (value: number) => Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const formatMoney = (value: number | null) => value == null ? '—' : `${Number(value).toLocaleString('fr-FR')} MGA`;
const formatDateTime = (value: string | null) => value ? new Date(value.replace(' ', 'T')).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const apiError = (err: any, fallback: string) => err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

// Le bar et l'hôtel comptent en unités entières ; le restaurant accepte les décimales (kg, L…).
const wholeUnitsOnly = (item: StockOverviewItem) => item.module === 'BAR' || item.module === 'HOTEL';

const inputClass = 'w-full px-4 py-2.5 bg-surface-2 border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition';

/* ─── Détail d'un article et derniers mouvements ─── */
const StockDetailsModal: React.FC<{ item: StockOverviewItem | null; onClose: () => void; onEdit: (item: StockOverviewItem) => void }> = ({ item, onClose, onEdit }) => {
  const [details, setDetails] = useState<StockItemDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setDetails(null);
    setError(null);
    stockService.getOverviewItem(item.cle)
      .then(setDetails)
      .catch(err => setError(apiError(err, 'Impossible de charger le détail')));
  }, [item]);

  if (!item) return null;
  const info = details?.item;
  const status = statusOf(item);
  const fields: Array<[string, React.ReactNode]> = [
    ['Module', moduleLabel(item)],
    ['Catégorie', item.categorie || '—'],
    ['Quantité restante', <span className="font-bold">{formatQty(item.quantite)} {item.unite || ''}</span>],
    ['Seuil minimum', `${formatQty(item.seuil_minimum)} ${item.unite || ''}`],
    ['Prix d’achat', formatMoney(info?.prix_achat ?? null)],
  ];

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Détail du stock</p>
            <h3 className="text-primary text-xl font-bold">{item.nom}</h3>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${STATUS_CONFIG[status].className}`}>
              {STATUS_CONFIG[status].icon}{STATUS_CONFIG[status].label}
            </span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fields.map(([label, value]) => (
            <div key={label} className="bg-surface-2 border border-base rounded-xl p-3">
              <p className="text-muted text-xs mb-1">{label}</p>
              <p className="text-primary text-sm">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-primary font-semibold mb-2">
            {item.module === 'BAR' ? 'Dernières ventes' : 'Derniers mouvements de stock'}
          </h4>
          {error ? (
            <p className="text-danger text-sm">{error}</p>
          ) : !details ? (
            <div className="flex items-center gap-2 text-muted text-sm py-6 justify-center"><Loader size={18} className="animate-spin" />Chargement...</div>
          ) : details.history.length === 0 ? (
            <p className="text-muted text-sm py-4 text-center">Aucun mouvement enregistré pour cet article.</p>
          ) : (
            <div className="border border-base rounded-xl overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-surface-2 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-muted font-medium">Date</th>
                    <th className="text-left p-3 text-muted font-medium">Mouvement</th>
                    <th className="text-right p-3 text-muted font-medium">Quantité</th>
                    <th className="text-right p-3 text-muted font-medium hidden sm:table-cell">Stock après</th>
                    <th className="text-left p-3 text-muted font-medium">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {details.history.map(h => {
                    const out = h.type_mouvement === 'SORTIE';
                    return (
                      <tr key={h.id} className="border-t border-base">
                        <td className="p-3 text-secondary whitespace-nowrap">{formatDateTime(h.created_at)}</td>
                        <td className={`p-3 font-medium ${out ? 'text-danger' : 'text-success'}`}>{out ? 'Sortie' : h.type_mouvement === 'ENTREE' ? 'Entrée' : 'Ajustement'}</td>
                        <td className={`p-3 text-right font-bold ${out ? 'text-danger' : 'text-success'}`}>{out ? '−' : '+'}{formatQty(h.quantite)}</td>
                        <td className="p-3 text-right text-secondary hidden sm:table-cell">{h.stock_after == null ? '—' : formatQty(h.stock_after)}</td>
                        <td className="p-3 text-muted">{h.motif || '—'}{h.user_nom ? <span className="block text-xs">par {h.user_nom}</span> : null}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-base">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm">Fermer</button>
          <button onClick={() => onEdit(item)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 text-sm font-medium">
            <Pencil size={16} />Modifier
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Modification d’un article de stock ou d’un ingrédient ─── */
const StockEditModal: React.FC<{ item: StockOverviewItem | null; onClose: () => void; onSaved: () => void }> = ({ item, onClose, onSaved }) => {
  const [nom, setNom] = useState('');
  const [quantite, setQuantite] = useState('');
  const [seuil, setSeuil] = useState('');
  const [unite, setUnite] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setNom(item.nom);
    setQuantite(String(item.quantite));
    setSeuil(String(item.seuil_minimum));
    setUnite(item.unite || 'unités');
    setPrixAchat(String(item.prix_achat ?? 0));
  }, [item]);

  if (!item) return null;
  const ingredient = item.item_type === 'INGREDIENT';
  const whole = wholeUnitsOnly(item);
  const qty = Number(quantite);
  const threshold = Number(seuil);
  const purchasePrice = Number(prixAchat);
  const invalid = quantite === '' || !Number.isFinite(qty) || qty < 0
    || (ingredient && (!nom.trim() || !unite.trim() || prixAchat === '' || !Number.isFinite(purchasePrice) || purchasePrice < 0))
    || (item.module === 'BAR' && (prixAchat === '' || !Number.isFinite(purchasePrice) || purchasePrice < 0))
    || (!ingredient && (seuil === '' || !Number.isFinite(threshold) || threshold < 0))
    || (whole && (!Number.isInteger(qty) || !Number.isInteger(threshold)));
  const difference = Number.isFinite(qty) ? qty - item.quantite : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    try {
      await stockService.updateOverviewItem(item.cle, {
        quantite: qty,
        ...(ingredient
          ? { nom: nom.trim(), unite: unite.trim(), prix_achat: purchasePrice }
          : {
            seuil_minimum: threshold,
            ...(item.module === 'BAR' ? { prix_achat: purchasePrice } : {}),
            ...(item.module === 'BAR' ? { unite: unite.trim() || 'unités' } : {}),
          }),
      });
      toast.success(ingredient ? `Ingrédient « ${nom.trim()} » mis à jour` : `Stock de « ${item.nom} » mis à jour`);
      onSaved();
    } catch (err) {
      toast.error(apiError(err, 'Erreur lors de la modification'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <form onSubmit={save} className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">{ingredient ? 'Modifier l’ingrédient' : `Modifier le stock · ${moduleLabel(item)}`}</p>
            <h3 className="text-primary text-lg font-bold">{item.nom}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        {ingredient && (
          <label className="block">
            <span className="block text-sm text-secondary mb-1.5">Nom de l’ingrédient</span>
            <input value={nom} onChange={e => setNom(e.target.value)} className={inputClass} autoFocus />
          </label>
        )}

        <label className="block">
          <span className="block text-sm text-secondary mb-1.5">Quantité restante ({item.unite || 'unités'})</span>
          <input type="number" min="0" step={whole ? 1 : 0.01} value={quantite} onChange={e => setQuantite(e.target.value)} className={inputClass} autoFocus={!ingredient} />
          {difference !== 0 && Number.isFinite(difference) && (
            <span className={`block text-xs mt-1 ${difference > 0 ? 'text-success' : 'text-danger'}`}>
              {difference > 0 ? 'Entrée' : 'Sortie'} de {formatQty(Math.abs(difference))} {item.unite || ''} par rapport au stock actuel ({formatQty(item.quantite)})
            </span>
          )}
        </label>

        {(ingredient || item.module === 'BAR') && (
          <label className="block">
            <span className="block text-sm text-secondary mb-1.5">Prix d’achat (MGA)</span>
            <input type="number" min="0" step="any" value={prixAchat} onChange={e => setPrixAchat(e.target.value)} className={inputClass} />
          </label>
        )}

        {ingredient && (
          <>
            <label className="block">
              <span className="block text-sm text-secondary mb-1.5">Unité</span>
              <input value={unite} onChange={e => setUnite(e.target.value)} className={inputClass} />
            </label>
          </>
        )}

        {!ingredient && (
          <label className="block">
          <span className="block text-sm text-secondary mb-1.5">Seuil minimum (alerte « stock faible »)</span>
          <input type="number" min="0" step={whole ? 1 : 0.01} value={seuil} onChange={e => setSeuil(e.target.value)} className={inputClass} />
          </label>
        )}

        {!ingredient && item.module === 'BAR' && (
          <label className="block">
            <span className="block text-sm text-secondary mb-1.5">Unité</span>
            <input value={unite} onChange={e => setUnite(e.target.value)} placeholder="bouteilles, canettes…" className={inputClass} />
          </label>
        )}

        {whole && <p className="text-muted text-xs">Les quantités {item.module === 'BAR' ? 'du bar' : 'de l’hôtel'} s’expriment en nombres entiers.</p>}

        <div className="flex gap-3 pt-3 border-t border-base">
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm">Annuler</button>
          <button type="submit" disabled={saving || invalid} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 text-sm font-medium disabled:opacity-50">
            {saving ? <><Loader size={16} className="animate-spin" />Enregistrement...</> : 'Enregistrer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ─── Confirmation de suppression ─── */
const StockDeleteModal: React.FC<{ item: StockOverviewItem | null; onClose: () => void; onDeleted: () => void }> = ({ item, onClose, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  if (!item) return null;

  const remove = async () => {
    setDeleting(true);
    try {
      await stockService.deleteOverviewItem(item.cle);
      toast.success(`« ${item.nom} » supprimé du stock`);
      onDeleted();
    } catch (err) {
      toast.error(apiError(err, 'Erreur lors de la suppression'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center"><Trash2 size={20} /></span>
          <h3 className="text-primary text-lg font-bold">Supprimer cet article ?</h3>
        </div>
        <p className="text-secondary text-sm">
          <strong className="text-primary">{item.nom}</strong> ({moduleLabel(item)}) — {formatQty(item.quantite)} {item.unite || ''} en stock.
        </p>
        <p className="text-muted text-sm">
          {item.item_type === 'INGREDIENT'
            ? 'L’ingrédient sera désactivé et retiré des recettes. Son stock restant sera enregistré comme une sortie.'
            : item.module === 'BAR'
            ? 'Le produit sera retiré de la carte du bar. Un produit déjà vendu ne peut pas être supprimé : mettez plutôt sa quantité à 0.'
            : 'La ligne de stock sera supprimée et la quantité restante enregistrée comme sortie. Le produit reste dans le catalogue.'}
        </p>
        <div className="flex gap-3 pt-3 border-t border-base">
          <button onClick={onClose} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm">Annuler</button>
          <button onClick={remove} disabled={deleting} style={{ backgroundColor: 'var(--color-danger)', color: '#fff' }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl hover:opacity-90 text-sm font-medium disabled:opacity-50">
            {deleting ? <><Loader size={16} className="animate-spin" />Suppression...</> : 'Supprimer'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const StockPage: React.FC = () => {
  const [items, setItems] = useState<StockOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('tous');
  const [categoryFilter, setCategoryFilter] = useState('toutes');
  const [statusFilter, setStatusFilter] = useState<'tous' | StockStatus>('tous');
  const [sort, setSort] = useState<'nom' | 'qte-asc' | 'qte-desc'>('nom');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<StockOverviewItem | null>(null);
  const [editing, setEditing] = useState<StockOverviewItem | null>(null);
  const [deleting, setDeleting] = useState<StockOverviewItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await stockService.getOverview());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Impossible de charger le stock');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const modules = useMemo(
    () => Array.from(new Set(items.map(i => i.module))).sort((a, b) => (MODULE_LABELS[a] || a).localeCompare(MODULE_LABELS[b] || b)),
    [items]
  );

  const categories = useMemo(() => {
    const scoped = moduleFilter === 'tous' ? items : items.filter(i => i.module === moduleFilter);
    return Array.from(new Set(scoped.map(i => i.categorie || 'Sans catégorie'))).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [items, moduleFilter]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = items.filter(i =>
      (moduleFilter === 'tous' || i.module === moduleFilter)
      && (categoryFilter === 'toutes' || (i.categorie || 'Sans catégorie') === categoryFilter)
      && (statusFilter === 'tous' || statusOf(i) === statusFilter)
      && (!term || i.nom.toLowerCase().includes(term) || (i.code || '').toLowerCase().includes(term) || (i.categorie || '').toLowerCase().includes(term))
    );
    return rows.sort((a, b) => {
      if (sort === 'qte-asc') return a.quantite - b.quantite;
      if (sort === 'qte-desc') return b.quantite - a.quantite;
      return a.nom.localeCompare(b.nom, 'fr');
    });
  }, [items, search, moduleFilter, categoryFilter, statusFilter, sort]);

  // Revenir à la première page à chaque changement de filtre
  useEffect(() => { setPage(1); }, [search, moduleFilter, categoryFilter, statusFilter, sort]);

  const scopedForStats = moduleFilter === 'tous' ? items : items.filter(i => i.module === moduleFilter);
  const stats = {
    total: scopedForStats.length,
    ok: scopedForStats.filter(i => statusOf(i) === 'ok').length,
    faible: scopedForStats.filter(i => statusOf(i) === 'faible').length,
    rupture: scopedForStats.filter(i => statusOf(i) === 'rupture').length,
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || moduleFilter !== 'tous' || categoryFilter !== 'toutes' || statusFilter !== 'tous';

  const resetFilters = () => {
    setSearch('');
    setModuleFilter('tous');
    setCategoryFilter('toutes');
    setStatusFilter('tous');
  };

  // État du stock filtré imprimé sur le rouleau 80 mm (inventaire, réapprovisionnement)
  const printList = () => {
    const scope = [
      moduleFilter === 'tous' ? 'Tous les modules' : (MODULE_LABELS[moduleFilter] || moduleFilter),
      categoryFilter !== 'toutes' ? categoryFilter : '',
      statusFilter !== 'tous' ? STATUS_CONFIG[statusFilter].label : '',
    ].filter(Boolean).join(' · ');
    const rows = filtered.map(i => `
      <tr>
        <td>${escapeHtml(i.nom)}${moduleFilter === 'tous' ? `<div class="sub">${escapeHtml(moduleLabel(i))}</div>` : ''}</td>
        <td class="number">${escapeHtml(formatQty(i.quantite))}</td>
      </tr>`).join('');
    printThermal('État du stock', `
      ${thermalHeader('ÉTAT DU STOCK', [scope, `${filtered.length} article(s)`])}
      <table>
        <colgroup><col style="width:74%"><col style="width:26%"></colgroup>
        <thead><tr><th>Article</th><th class="number">Reste</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`);
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={40} className="animate-spin text-accent" />
        <span className="ml-3 text-muted">Chargement du stock...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-danger text-center">
        <AlertCircle size={40} className="mx-auto mb-3" />
        <p className="text-lg font-medium">{error}</p>
        <button onClick={load} className="mt-3 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/90 transition">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Stock
          </h2>
          <p className="text-muted text-sm mt-1">Tous les articles et leur quantité restante, par module</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={printList}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 transition-all font-medium shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            <Printer size={18} />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Modules */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['tous', ...modules].map(m => {
          const active = moduleFilter === m;
          const count = m === 'tous' ? items.length : items.filter(i => i.module === m).length;
          return (
            <button
              key={m}
              onClick={() => { setModuleFilter(m); setCategoryFilter('toutes'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition-all ${active ? 'bg-accent text-black border-accent font-semibold' : 'bg-surface border-base text-muted hover:text-primary'}`}
            >
              {m === 'tous' ? 'Tous les modules' : (MODULE_LABELS[m] || m)}
              <span className={`text-xs px-1.5 rounded-md ${active ? 'bg-black/15' : 'bg-surface-2'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Indicateurs (cliquables pour filtrer par statut) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          ['tous', 'Articles', stats.total, 'bg-surface border-base', 'text-primary', <Package size={16} key="i" />],
          ['ok', 'En stock', stats.ok, 'bg-success/5 border-success/20', 'text-success', <CheckCircle size={16} key="i" />],
          ['faible', 'Stock faible', stats.faible, 'bg-warning/5 border-warning/20', 'text-warning', <AlertTriangle size={16} key="i" />],
          ['rupture', 'Rupture', stats.rupture, 'bg-danger/5 border-danger/20', 'text-danger', <XCircle size={16} key="i" />],
        ] as const).map(([key, label, value, box, text, icon]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`${box} border rounded-xl p-4 text-left transition-all ${statusFilter === key ? 'ring-2 ring-accent/60' : 'hover:brightness-110'}`}
          >
            <p className={`text-xs mb-1 flex items-center gap-1.5 text-muted`}><span className={text}>{icon}</span>{label}</p>
            <p className={`${text} font-bold text-2xl`}>{value}</p>
          </button>
        ))}
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Rechercher un article, un code ou une catégorie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-base rounded-xl text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition max-w-[240px]"
          >
            <option value="toutes">Toutes les catégories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2.5 bg-surface border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
          >
            <option value="tous">Tous les statuts</option>
            <option value="ok">En stock</option>
            <option value="faible">Stock faible</option>
            <option value="rupture">Rupture</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
            className="px-4 py-2.5 bg-surface border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
          >
            <option value="nom">Trier : nom (A → Z)</option>
            <option value="qte-asc">Trier : quantité croissante</option>
            <option value="qte-desc">Trier : quantité décroissante</option>
          </select>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 bg-surface border border-base rounded-xl text-muted hover:text-primary transition flex items-center gap-2"
            >
              <X size={18} />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="bg-surface border border-base rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-base flex items-center justify-between">
          <h3 className="text-primary font-semibold">Liste des articles</h3>
          <span className="text-muted text-sm">{filtered.length} article(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base bg-surface-2">
                <th className="text-left p-4 text-muted font-medium text-sm">Article</th>
                <th className="text-left p-4 text-muted font-medium text-sm hidden sm:table-cell">Module</th>
                <th className="text-left p-4 text-muted font-medium text-sm hidden md:table-cell">Catégorie</th>
                <th className="text-right p-4 text-muted font-medium text-sm">Quantité restante</th>
                <th className="text-right p-4 text-muted font-medium text-sm hidden lg:table-cell">Seuil min.</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Statut</th>
                <th className="text-right p-4 text-muted font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={48} className="text-muted/30" />
                      <p className="text-muted">Aucun article ne correspond aux filtres.</p>
                    </div>
                  </td>
                </tr>
              ) : visible.map(item => {
                const status = statusOf(item);
                const cfg = STATUS_CONFIG[status];
                const qtyColor = status === 'rupture' ? 'text-danger' : status === 'faible' ? 'text-warning' : 'text-primary';
                return (
                  <tr key={item.cle} className="border-b border-base last:border-0 hover:bg-surface-2/50 transition">
                    <td className="p-4">
                      <p className="text-primary font-medium text-sm">{item.nom}</p>
                      <p className="text-muted text-xs sm:hidden">{moduleLabel(item)}</p>
                      {item.code && <p className="text-muted text-xs hidden sm:block">{item.code}</p>}
                    </td>
                    <td className="p-4 text-secondary text-sm hidden sm:table-cell whitespace-nowrap">{moduleLabel(item)}</td>
                    <td className="p-4 text-muted text-sm hidden md:table-cell">{item.categorie || '—'}</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <span className={`font-bold ${qtyColor}`}>{formatQty(item.quantite)}</span>
                      <span className="text-muted text-xs ml-1">{item.unite || ''}</span>
                    </td>
                    <td className="p-4 text-right text-muted text-sm hidden lg:table-cell">{formatQty(item.seuil_minimum)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.className}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setViewing(item)} title="Voir le détail" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-base text-muted hover:text-primary text-xs transition">
                          <Eye size={14} /><span className="hidden xl:inline">Voir</span>
                        </button>
                        <button onClick={() => setEditing(item)} title="Modifier" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 border border-base text-muted hover:text-primary text-xs transition">
                          <Pencil size={14} /><span className="hidden xl:inline">Modifier</span>
                        </button>
                        <button onClick={() => setDeleting(item)} title="Supprimer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 text-xs transition">
                          <Trash2 size={14} /><span className="hidden xl:inline">Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-base">
            <span className="text-muted text-sm">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-surface-2 border border-base text-sm text-muted hover:text-primary disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="text-sm text-primary">{page} / {pageCount}</span>
              <button
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="px-3 py-1.5 rounded-lg bg-surface-2 border border-base text-sm text-muted hover:text-primary disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <StockDetailsModal
        item={viewing}
        onClose={() => setViewing(null)}
        onEdit={(item) => { setViewing(null); setEditing(item); }}
      />
      <StockEditModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
      <StockDeleteModal
        item={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => { setDeleting(null); load(); }}
      />
    </div>
  );
};

export default StockPage;

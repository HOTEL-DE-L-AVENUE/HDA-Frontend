// src/pages/StockPage.tsx
// Vue consolidée du stock : tous les articles du bar, du restaurant et de l'hôtel
// avec leur quantité restante, les mouvements du mois, les inventaires et l'historique.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, RefreshCw, Package, AlertTriangle, XCircle, CheckCircle, Loader, AlertCircle, X,
  Printer, Eye, Pencil, Trash2, Plus, Minus, ClipboardList, History, ArrowUpCircle, ArrowDownCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  stockService, StockOverviewItem, StockItemDetails, StockStatus, StockHistoryEntry,
  StockInventory, StockModule, StockMovement,
} from '../services/stock.service';
import { escapeHtml, printThermal, thermalHeader } from '../utils/thermalPrint';
import { Modal } from '../components/Modal';
import { madagascarDate } from '../lib/timezone';

const MODULE_LABELS: Record<string, string> = {
  BAR: 'Bar & Lounge',
  RESTAURANT: 'Restaurant',
  HOTEL: 'Hôtel',
  HEBERGEMENT: 'Hébergement',
  CASINO: 'Casino',
  STOCK: 'Stock général',
};

const PAGE_SIZE = 50;
const HISTORY_PAGE_SIZE = 50;

const moduleLabel = (item: StockOverviewItem) => MODULE_LABELS[item.module] || item.emplacement || item.module;

// Le statut vient du backend ; ce calcul ne sert que de repli pour les anciennes réponses.
const statusOf = (item: StockOverviewItem): StockStatus => {
  if (item.statut) return item.statut;
  if (item.quantite <= 0) return 'rupture';
  if (Number(item.seuil_minimum) > 0 && item.quantite <= item.seuil_minimum) return 'faible';
  if (Number(item.seuil_maximum) > 0 && item.quantite > Number(item.seuil_maximum)) return 'eleve';
  return 'ok';
};

const STATUS_CONFIG: Record<StockStatus, { label: string; className: string; icon: React.ReactNode }> = {
  ok: { label: 'En stock', className: 'bg-success/10 text-success border-success/20', icon: <CheckCircle size={12} /> },
  faible: { label: 'Faible', className: 'bg-warning/10 text-warning border-warning/20', icon: <AlertTriangle size={12} /> },
  eleve: { label: 'Élevé', className: 'bg-accent/10 text-accent border-accent/20', icon: <ArrowUpCircle size={12} /> },
  rupture: { label: 'Rupture', className: 'bg-danger/10 text-danger border-danger/20', icon: <XCircle size={12} /> },
};

const formatQty = (value: number) => Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const formatMoney = (value: number | null | undefined) => value == null ? '—' : `${Number(value).toLocaleString('fr-FR')} MGA`;
const formatDate = (value: string | null | undefined) => value ? new Date(String(value).replace(' ', 'T')).toLocaleDateString('fr-FR') : '—';
const formatDateTime = (value: string | null | undefined) => value ? new Date(String(value).replace(' ', 'T')).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const apiError = (err: any, fallback: string) =>
  err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback;

const currentMonth = () => madagascarDate().slice(0, 7);
const monthLabel = (month: string) => {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};

// Le bar et l'hôtel comptent en unités entières ; le restaurant accepte les décimales (kg, L…).
const wholeUnitsOnly = (item: StockOverviewItem) => item.module === 'BAR' || item.module === 'HOTEL';

const inputClass = 'w-full px-4 py-2.5 bg-surface-2 border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition';
const labelClass = 'block text-sm text-secondary mb-1.5';

const MovementBadge: React.FC<{ movement: StockMovement }> = ({ movement }) => {
  if (movement.est_vente) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">Vente</span>;
  }
  if (movement.type_mouvement === 'SORTIE') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger border border-danger/20"><ArrowDownCircle size={11} />Sortie</span>;
  }
  if (movement.type_mouvement === 'ENTREE') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20"><ArrowUpCircle size={11} />Entrée</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-muted border border-base">Ajustement</span>;
};

/* ─── Détail d'un article et derniers mouvements ─── */
const StockDetailsModal: React.FC<{
  item: StockOverviewItem | null;
  month: string;
  onClose: () => void;
  onEdit: (item: StockOverviewItem) => void;
  onMovement: (item: StockOverviewItem, type: 'ENTREE' | 'SORTIE') => void;
  onInventory: (item: StockOverviewItem) => void;
}> = ({ item, month, onClose, onEdit, onMovement, onInventory }) => {
  const [details, setDetails] = useState<StockItemDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setDetails(null);
    setError(null);
    stockService.getOverviewItem(item.cle, month)
      .then(setDetails)
      .catch(err => setError(apiError(err, 'Impossible de charger le détail')));
  }, [item, month]);

  if (!item) return null;
  const info = details?.item;
  const status = statusOf(item);
  const fields: Array<[string, React.ReactNode]> = [
    ['Module', moduleLabel(item)],
    ['Catégorie', item.categorie || '—'],
    ['Quantité restante', <span className="font-bold">{formatQty(item.quantite)} {item.unite || ''}</span>],
    ['Seuil minimum', `${formatQty(item.seuil_minimum)} ${item.unite || ''}`],
    ['Seuil maximum', Number(item.seuil_maximum) > 0 ? `${formatQty(Number(item.seuil_maximum))} ${item.unite || ''}` : '—'],
    ['Stock au 1er du mois', item.stock_debut_mois != null ? `${formatQty(item.stock_debut_mois)} ${item.unite || ''}` : '—'],
    ['Entrées du mois', item.entree_mensuel ? <span className="text-success">+{formatQty(item.entree_mensuel)} {item.unite || ''}</span> : '—'],
    ['Sorties du mois', item.sortie_mensuel ? <span className="text-danger">−{formatQty(item.sortie_mensuel)} {item.unite || ''}</span> : '—'],
    ['Ventes du mois', item.vente_mensuel ? `${formatQty(item.vente_mensuel)} ${item.unite || ''}` : '—'],
    ['Stock réel (inventaire)', item.stock_reel != null ? `${formatQty(item.stock_reel)} ${item.unite || ''}` : '—'],
    ['Écart inventaire', item.ecart != null && item.ecart !== 0
      ? <span className={item.ecart > 0 ? 'text-success' : 'text-danger'}>{item.ecart > 0 ? '+' : ''}{formatQty(item.ecart)} {item.unite || ''}</span>
      : '—'],
    ['Prix d’achat', formatMoney(info?.prix_achat ?? item.prix_achat)],
  ];

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Détail du stock · {monthLabel(month)}</p>
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
          <h4 className="text-primary font-semibold mb-2">Derniers mouvements</h4>
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
                      <tr key={`${h.source || 'M'}-${h.id}`} className="border-t border-base">
                        <td className="p-3 text-secondary whitespace-nowrap">{formatDateTime(h.date_operation || h.created_at)}</td>
                        <td className="p-3"><MovementBadge movement={h} /></td>
                        <td className={`p-3 text-right font-bold ${out ? 'text-danger' : 'text-success'}`}>{out ? '−' : '+'}{formatQty(h.quantite)}</td>
                        <td className="p-3 text-right text-secondary hidden sm:table-cell">{h.stock_after == null ? '—' : formatQty(h.stock_after)}</td>
                        <td className="p-3 text-muted">
                          {h.motif || '—'}
                          {h.reference_externe ? <span className="block text-xs">Réf. {h.reference_externe}</span> : null}
                          {h.commentaire ? <span className="block text-xs">{h.commentaire}</span> : null}
                          {h.user_nom ? <span className="block text-xs">par {h.user_nom}</span> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-base">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm">Fermer</button>
          <button onClick={() => onMovement(item, 'ENTREE')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20 text-success hover:bg-success/20 text-sm font-medium">
            <Plus size={16} />Entrée
          </button>
          <button onClick={() => onMovement(item, 'SORTIE')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 text-sm font-medium">
            <Minus size={16} />Sortie
          </button>
          <button onClick={() => onInventory(item)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-primary hover:bg-surface-2/70 text-sm font-medium">
            <ClipboardList size={16} />Inventaire
          </button>
          <button onClick={() => onEdit(item)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 text-sm font-medium">
            <Pencil size={16} />Modifier
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Entrée / sortie manuelle ─── */
const StockMovementModal: React.FC<{
  item: StockOverviewItem | null;
  defaultType: 'ENTREE' | 'SORTIE';
  onClose: () => void;
  onSaved: () => void;
}> = ({ item, defaultType, onClose, onSaved }) => {
  const [type, setType] = useState<'ENTREE' | 'SORTIE'>(defaultType);
  const [quantite, setQuantite] = useState('');
  const [motif, setMotif] = useState('');
  const [date, setDate] = useState(madagascarDate());
  const [reference, setReference] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setType(defaultType);
    setQuantite('');
    setMotif('');
    setDate(madagascarDate());
    setReference('');
    setCommentaire('');
  }, [item, defaultType]);

  if (!item) return null;
  const whole = wholeUnitsOnly(item);
  const qty = Number(quantite);
  const maxOut = Number(item.quantite);
  const overStock = type === 'SORTIE' && qty > maxOut;
  const invalid = quantite === '' || !Number.isFinite(qty) || qty <= 0
    || (whole && !Number.isInteger(qty)) || overStock;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || saving) return;
    setSaving(true);
    try {
      await stockService.recordItemMovement(item.cle, {
        type,
        quantite: qty,
        motif: motif.trim() || undefined,
        date_operation: date || undefined,
        reference_externe: reference.trim() || undefined,
        commentaire: commentaire.trim() || undefined,
      });
      toast.success(`${type === 'ENTREE' ? 'Entrée' : 'Sortie'} de ${formatQty(qty)} ${item.unite || ''} enregistrée`);
      onSaved();
    } catch (err) {
      toast.error(apiError(err, 'Erreur lors de l’enregistrement du mouvement'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <form onSubmit={save} className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Mouvement de stock</p>
            <h3 className="text-primary text-lg font-bold">{item.nom}</h3>
            <p className="text-muted text-xs mt-1">Stock actuel : {formatQty(item.quantite)} {item.unite || ''}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(['ENTREE', 'SORTIE'] as const).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${type === value
                ? value === 'ENTREE' ? 'bg-success/15 border-success/40 text-success' : 'bg-danger/15 border-danger/40 text-danger'
                : 'bg-surface-2 border-base text-muted hover:text-primary'}`}
            >
              {value === 'ENTREE' ? <Plus size={16} /> : <Minus size={16} />}
              {value === 'ENTREE' ? 'Entrée' : 'Sortie'}
            </button>
          ))}
        </div>

        <label className="block">
          <span className={labelClass}>Quantité ({item.unite || 'unités'}) *</span>
          <input
            type="number" min="0" step={whole ? 1 : 0.01} value={quantite}
            onChange={e => setQuantite(e.target.value)} className={inputClass} autoFocus
          />
          {whole && <span className="block text-xs text-muted mt-1">Nombres entiers uniquement.</span>}
          {overStock && <span className="block text-xs text-danger mt-1">Sortie supérieure au stock disponible ({formatQty(maxOut)}).</span>}
        </label>

        <label className="block">
          <span className={labelClass}>Date de l’opération</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Motif</span>
          <input value={motif} onChange={e => setMotif(e.target.value)} placeholder={type === 'ENTREE' ? 'Achat, réception…' : 'Perte, casse, consommation…'} className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Référence externe</span>
          <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Bon de livraison, facture…" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Commentaire</span>
          <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2} className={inputClass} />
        </label>

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

/* ─── Inventaire physique ─── */
const StockInventoryModal: React.FC<{
  item: StockOverviewItem | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ item, onClose, onSaved }) => {
  const [stockReel, setStockReel] = useState('');
  const [date, setDate] = useState(madagascarDate());
  const [regularise, setRegularise] = useState(false);
  const [motif, setMotif] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setStockReel(String(item.stock_reel ?? item.quantite));
    setDate(madagascarDate());
    setRegularise(false);
    setMotif('');
    setCommentaire('');
  }, [item]);

  if (!item) return null;
  const whole = wholeUnitsOnly(item);
  const reel = Number(stockReel);
  const difference = Number.isFinite(reel) ? reel - Number(item.quantite) : 0;
  const invalid = stockReel === '' || !Number.isFinite(reel) || reel < 0 || (whole && !Number.isInteger(reel));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || saving) return;
    setSaving(true);
    try {
      const result = await stockService.createInventory(item.cle, {
        stock_reel: reel,
        regularise,
        inventory_date: date || undefined,
        motif: motif.trim() || undefined,
        commentaire: commentaire.trim() || undefined,
      });
      const gap = Number(result?.difference ?? difference);
      toast.success(
        gap === 0
          ? 'Inventaire enregistré : aucun écart constaté'
          : `Inventaire enregistré : écart de ${gap > 0 ? '+' : ''}${formatQty(gap)}${regularise ? ' (stock régularisé)' : ' (stock inchangé)'}`
      );
      onSaved();
    } catch (err) {
      toast.error(apiError(err, 'Erreur lors de l’inventaire'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="sm">
      <form onSubmit={save} className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Inventaire physique</p>
            <h3 className="text-primary text-lg font-bold">{item.nom}</h3>
            <p className="text-muted text-xs mt-1">Stock théorique : <strong className="text-primary">{formatQty(item.quantite)} {item.unite || ''}</strong></p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        <label className="block">
          <span className={labelClass}>Stock réel compté ({item.unite || 'unités'}) *</span>
          <input type="number" min="0" step={whole ? 1 : 0.01} value={stockReel} onChange={e => setStockReel(e.target.value)} className={inputClass} autoFocus />
        </label>

        <div className={`rounded-xl border p-3 text-sm ${difference === 0 ? 'bg-surface-2 border-base text-muted' : difference > 0 ? 'bg-success/10 border-success/20 text-success' : 'bg-danger/10 border-danger/20 text-danger'}`}>
          Écart : <strong>{difference > 0 ? '+' : ''}{formatQty(difference)} {item.unite || ''}</strong>
          {difference !== 0 && <span className="block text-xs mt-0.5">Le stock réel est {difference > 0 ? 'supérieur' : 'inférieur'} au stock théorique.</span>}
        </div>

        <label className="block">
          <span className={labelClass}>Date de l’inventaire</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </label>

        <label className="flex items-start gap-3 bg-surface-2 border border-base rounded-xl p-3 cursor-pointer">
          <input type="checkbox" checked={regularise} onChange={e => setRegularise(e.target.checked)} className="mt-1 accent-[var(--color-accent)]" />
          <span className="text-sm">
            <span className="text-primary font-medium block">Régulariser le stock</span>
            <span className="text-muted text-xs">Crée un mouvement d’ajustement pour aligner le stock sur la quantité comptée.</span>
          </span>
        </label>

        <label className="block">
          <span className={labelClass}>Motif</span>
          <input value={motif} onChange={e => setMotif(e.target.value)} placeholder="Inventaire mensuel…" className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Commentaire</span>
          <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2} className={inputClass} />
        </label>

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

/* ─── Modification d’un article de stock ou d’un ingrédient ─── */
const StockEditModal: React.FC<{ item: StockOverviewItem | null; onClose: () => void; onSaved: () => void }> = ({ item, onClose, onSaved }) => {
  const [nom, setNom] = useState('');
  const [quantite, setQuantite] = useState('');
  const [seuil, setSeuil] = useState('');
  const [seuilMax, setSeuilMax] = useState('');
  const [unite, setUnite] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setNom(item.nom);
    setQuantite(String(item.quantite));
    setSeuil(String(item.seuil_minimum));
    setSeuilMax(item.seuil_maximum == null ? '' : String(item.seuil_maximum));
    setUnite(item.unite || 'unités');
    setPrixAchat(String(item.prix_achat ?? 0));
  }, [item]);

  if (!item) return null;
  const ingredient = item.item_type === 'INGREDIENT';
  const whole = wholeUnitsOnly(item);
  const qty = Number(quantite);
  const threshold = Number(seuil);
  const maximum = seuilMax === '' ? null : Number(seuilMax);
  const purchasePrice = Number(prixAchat);
  const maximumValid = maximum === null || (Number.isFinite(maximum) && maximum >= 0 && (!whole || Number.isInteger(maximum)));
  const invalid = quantite === '' || !Number.isFinite(qty) || qty < 0
    || (ingredient && (!nom.trim() || !unite.trim() || prixAchat === '' || !Number.isFinite(purchasePrice) || purchasePrice < 0))
    || (item.module === 'BAR' && (prixAchat === '' || !Number.isFinite(purchasePrice) || purchasePrice < 0))
    || seuil === '' || !Number.isFinite(threshold) || threshold < 0
    || (whole && (!Number.isInteger(qty) || !Number.isInteger(threshold)))
    || !maximumValid
    || (maximum !== null && Number.isFinite(threshold) && maximum > 0 && maximum < threshold);
  const difference = Number.isFinite(qty) ? qty - item.quantite : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    setSaving(true);
    try {
      await stockService.updateOverviewItem(item.cle, {
        quantite: qty,
        seuil_minimum: threshold,
        seuil_maximum: maximum,
        ...(ingredient
          ? { nom: nom.trim(), unite: unite.trim(), prix_achat: purchasePrice }
          : {
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
            <span className={labelClass}>Nom de l’ingrédient</span>
            <input value={nom} onChange={e => setNom(e.target.value)} className={inputClass} autoFocus />
          </label>
        )}

        <label className="block">
          <span className={labelClass}>Quantité restante ({item.unite || 'unités'})</span>
          <input type="number" min="0" step={whole ? 1 : 0.01} value={quantite} onChange={e => setQuantite(e.target.value)} className={inputClass} autoFocus={!ingredient} />
          {difference !== 0 && Number.isFinite(difference) && (
            <span className={`block text-xs mt-1 ${difference > 0 ? 'text-success' : 'text-danger'}`}>
              {difference > 0 ? 'Entrée' : 'Sortie'} de {formatQty(Math.abs(difference))} {item.unite || ''} par rapport au stock actuel ({formatQty(item.quantite)})
            </span>
          )}
        </label>

        {(ingredient || item.module === 'BAR') && (
          <label className="block">
            <span className={labelClass}>Prix d’achat (MGA)</span>
            <input type="number" min="0" step="any" value={prixAchat} onChange={e => setPrixAchat(e.target.value)} className={inputClass} />
          </label>
        )}

        {ingredient && (
          <label className="block">
            <span className={labelClass}>Unité</span>
            <input value={unite} onChange={e => setUnite(e.target.value)} className={inputClass} />
          </label>
        )}

        <label className="block">
          <span className={labelClass}>Seuil minimum (alerte « stock faible »)</span>
          <input type="number" min="0" step={whole ? 1 : 0.01} value={seuil} onChange={e => setSeuil(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className={labelClass}>Seuil maximum (alerte « stock élevé »)</span>
          <input type="number" min="0" step={whole ? 1 : 0.01} value={seuilMax} onChange={e => setSeuilMax(e.target.value)} placeholder="Vide = aucune limite" className={inputClass} />
          {maximum !== null && Number.isFinite(threshold) && maximum > 0 && maximum < threshold && (
            <span className="block text-xs text-danger mt-1">Le seuil maximum doit être supérieur ou égal au seuil minimum.</span>
          )}
        </label>

        {!ingredient && item.module === 'BAR' && (
          <label className="block">
            <span className={labelClass}>Unité</span>
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

/* ─── Création d'un nouvel article ─── */
const StockArticleModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [module, setModule] = useState<StockModule>('BAR');
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('');
  const [unite, setUnite] = useState('unités');
  const [quantite, setQuantite] = useState('0');
  const [seuil, setSeuil] = useState('0');
  const [seuilMax, setSeuilMax] = useState('');
  const [prixAchat, setPrixAchat] = useState('0');
  const [prixVente, setPrixVente] = useState('0');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const whole = module === 'BAR' || module === 'HOTEL';
  const qty = Number(quantite);
  const min = Number(seuil);
  const max = seuilMax === '' ? null : Number(seuilMax);
  const purchase = Number(prixAchat);
  const sale = Number(prixVente);
  const invalid = !nom.trim() || quantite === '' || !Number.isFinite(qty) || qty < 0
    || seuil === '' || !Number.isFinite(min) || min < 0
    || !Number.isFinite(purchase) || purchase < 0
    || !Number.isFinite(sale) || sale < 0
    || (whole && (!Number.isInteger(qty) || !Number.isInteger(min)))
    || (max !== null && (!Number.isFinite(max) || max < 0 || (whole && !Number.isInteger(max))))
    || (max !== null && max > 0 && max < min);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || saving) return;
    setSaving(true);
    try {
      await stockService.createArticle({
        module,
        nom: nom.trim(),
        categorie: categorie.trim() || undefined,
        unite: unite.trim() || undefined,
        quantite: qty,
        seuil_minimum: min,
        seuil_maximum: max,
        prix_achat: purchase,
        prix_vente: sale,
        description: description.trim() || undefined,
      });
      toast.success(`Article « ${nom.trim()} » créé`);
      onCreated();
    } catch (err) {
      toast.error(apiError(err, 'Erreur lors de la création de l’article'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md">
      <form onSubmit={save} className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Nouvel article</p>
            <h3 className="text-primary text-lg font-bold">Ajouter au stock</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>Module *</span>
            <select
              value={module}
              onChange={e => {
                const value = e.target.value as StockModule;
                setModule(value);
                if (value === 'RESTAURANT') setUnite('kg');
                else setUnite('unités');
              }}
              className={inputClass}
            >
              <option value="BAR">Bar & Lounge</option>
              <option value="RESTAURANT">Restaurant (ingrédient)</option>
              <option value="HOTEL">Hôtel</option>
              <option value="HEBERGEMENT">Hébergement</option>
              <option value="CASINO">Casino</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Nom de l’article *</span>
            <input value={nom} onChange={e => setNom(e.target.value)} className={inputClass} autoFocus />
          </label>

          {module !== 'RESTAURANT' && (
            <label className="block">
              <span className={labelClass}>Catégorie</span>
              <input value={categorie} onChange={e => setCategorie(e.target.value)} placeholder="Boissons, entretien…" className={inputClass} />
            </label>
          )}

          <label className="block">
            <span className={labelClass}>Unité</span>
            <input value={unite} onChange={e => setUnite(e.target.value)} placeholder="unités, kg, L…" className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Quantité initiale</span>
            <input type="number" min="0" step={whole ? 1 : 0.01} value={quantite} onChange={e => setQuantite(e.target.value)} className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Seuil minimum</span>
            <input type="number" min="0" step={whole ? 1 : 0.01} value={seuil} onChange={e => setSeuil(e.target.value)} className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Seuil maximum</span>
            <input type="number" min="0" step={whole ? 1 : 0.01} value={seuilMax} onChange={e => setSeuilMax(e.target.value)} placeholder="Vide = aucune limite" className={inputClass} />
          </label>

          <label className="block">
            <span className={labelClass}>Prix d’achat (MGA)</span>
            <input type="number" min="0" step="any" value={prixAchat} onChange={e => setPrixAchat(e.target.value)} className={inputClass} />
          </label>

          {module !== 'RESTAURANT' && (
            <label className="block">
              <span className={labelClass}>Prix de vente (MGA)</span>
              <input type="number" min="0" step="any" value={prixVente} onChange={e => setPrixVente(e.target.value)} className={inputClass} />
            </label>
          )}
        </div>

        <label className="block">
          <span className={labelClass}>Description</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputClass} />
        </label>

        {whole && <p className="text-muted text-xs">Les quantités {module === 'BAR' ? 'du bar' : 'de l’hôtel'} s’expriment en nombres entiers.</p>}
        {module === 'RESTAURANT' && <p className="text-muted text-xs">L’article sera créé comme ingrédient de cuisine, avec un stock à l’emplacement Restaurant.</p>}

        <div className="flex gap-3 pt-3 border-t border-base">
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm">Annuler</button>
          <button type="submit" disabled={saving || invalid} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 text-sm font-medium disabled:opacity-50">
            {saving ? <><Loader size={16} className="animate-spin" />Création...</> : 'Créer l’article'}
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

/* ─── Historique consolidé ─── */
const StockHistoryModal: React.FC<{ month: string; onClose: () => void }> = ({ month, onClose }) => {
  const [rows, setRows] = useState<StockHistoryEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState('tous');
  const [typeFilter, setTypeFilter] = useState('tous');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await stockService.getHistory({
        month,
        module: moduleFilter === 'tous' ? undefined : moduleFilter,
        type: typeFilter === 'tous' ? undefined : typeFilter as 'ENTREE' | 'SORTIE' | 'AJUSTEMENT',
        limit: HISTORY_PAGE_SIZE,
        offset: page * HISTORY_PAGE_SIZE,
      }));
    } catch (err) {
      setError(apiError(err, 'Impossible de charger l’historique'));
    } finally {
      setLoading(false);
    }
  }, [month, moduleFilter, typeFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [moduleFilter, typeFilter]);

  const typeLabel = (row: StockHistoryEntry) => {
    if (row.est_vente) return 'Vente';
    if (row.type_mouvement === 'ENTREE') return 'Entrée';
    if (row.type_mouvement === 'SORTIE') return 'Sortie';
    return 'Ajustement';
  };

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Historique des mouvements · {monthLabel(month)}</p>
            <h3 className="text-primary text-lg font-bold">Journal du stock</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="px-3 py-2 bg-surface-2 border border-base rounded-xl text-primary text-sm">
            <option value="tous">Tous les modules</option>
            <option value="BAR">Bar & Lounge</option>
            <option value="RESTAURANT">Restaurant</option>
            <option value="HOTEL">Hôtel</option>
            <option value="HEBERGEMENT">Hébergement</option>
            <option value="CASINO">Casino</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 bg-surface-2 border border-base rounded-xl text-primary text-sm">
            <option value="tous">Tous les types</option>
            <option value="ENTREE">Entrées</option>
            <option value="SORTIE">Sorties</option>
            <option value="AJUSTEMENT">Ajustements</option>
          </select>
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-base rounded-xl text-muted hover:text-primary text-sm disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Actualiser
          </button>
        </div>

        {error ? (
          <p className="text-danger text-sm">{error}</p>
        ) : loading && rows.length === 0 ? (
          <div className="flex items-center gap-2 text-muted text-sm py-12 justify-center"><Loader size={18} className="animate-spin" />Chargement de l’historique...</div>
        ) : rows.length === 0 ? (
          <p className="text-muted text-sm py-12 text-center">Aucun mouvement sur cette période.</p>
        ) : (
          <div className="border border-base rounded-xl overflow-x-auto max-h-[55vh]">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 text-muted font-medium">Date</th>
                  <th className="text-left p-3 text-muted font-medium">Article</th>
                  <th className="text-left p-3 text-muted font-medium hidden sm:table-cell">Module</th>
                  <th className="text-left p-3 text-muted font-medium">Type</th>
                  <th className="text-right p-3 text-muted font-medium">Quantité</th>
                  <th className="text-right p-3 text-muted font-medium hidden md:table-cell">Stock après</th>
                  <th className="text-left p-3 text-muted font-medium hidden lg:table-cell">Motif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const out = row.type_mouvement === 'SORTIE';
                  return (
                    <tr key={`${row.source}-${row.id}`} className="border-t border-base">
                      <td className="p-3 text-secondary whitespace-nowrap text-xs">{formatDateTime(row.date_operation || row.created_at)}</td>
                      <td className="p-3">
                        <p className="text-primary font-medium text-xs">{row.article_nom}</p>
                        <p className="text-muted text-xs">{row.unite || ''}</p>
                      </td>
                      <td className="p-3 text-muted text-xs hidden sm:table-cell">{MODULE_LABELS[row.module] || row.module}</td>
                      <td className="p-3 text-xs">
                        <span className={`inline-flex px-2 py-0.5 rounded-full border font-medium ${row.est_vente
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : out ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'}`}>
                          {typeLabel(row)}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-bold text-xs ${out ? 'text-danger' : 'text-success'}`}>{out ? '−' : '+'}{formatQty(row.quantite)}</td>
                      <td className="p-3 text-right text-secondary text-xs hidden md:table-cell">{row.stock_after == null ? '—' : formatQty(row.stock_after)}</td>
                      <td className="p-3 text-muted text-xs hidden lg:table-cell">
                        {row.motif || '—'}
                        {row.user_nom ? <span className="block">par {row.user_nom}</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-base">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="px-3 py-1.5 rounded-lg bg-surface-2 border border-base text-sm text-muted hover:text-primary disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-sm text-muted">Page {page + 1}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={rows.length < HISTORY_PAGE_SIZE || loading}
            className="px-3 py-1.5 rounded-lg bg-surface-2 border border-base text-sm text-muted hover:text-primary disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Inventaires du mois ─── */
const StockInventoriesModal: React.FC<{ month: string; onClose: () => void }> = ({ month, onClose }) => {
  const [rows, setRows] = useState<StockInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    stockService.getInventories({ month, limit: 200 })
      .then(data => { if (!cancelled) setRows(data); })
      .catch(err => { if (!cancelled) setError(apiError(err, 'Impossible de charger les inventaires')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [month]);

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted text-xs uppercase tracking-wide">Inventaires · {monthLabel(month)}</p>
            <h3 className="text-primary text-lg font-bold">Comptages enregistrés</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary"><X size={20} /></button>
        </div>

        {error ? (
          <p className="text-danger text-sm">{error}</p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-muted text-sm py-12 justify-center"><Loader size={18} className="animate-spin" />Chargement...</div>
        ) : rows.length === 0 ? (
          <p className="text-muted text-sm py-12 text-center">Aucun inventaire enregistré pour ce mois.</p>
        ) : (
          <div className="border border-base rounded-xl overflow-x-auto max-h-[55vh]">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 text-muted font-medium">Date</th>
                  <th className="text-left p-3 text-muted font-medium">Article</th>
                  <th className="text-right p-3 text-muted font-medium">Théorique</th>
                  <th className="text-right p-3 text-muted font-medium">Réel</th>
                  <th className="text-right p-3 text-muted font-medium">Écart</th>
                  <th className="text-left p-3 text-muted font-medium">Régularisé</th>
                  <th className="text-left p-3 text-muted font-medium hidden md:table-cell">Motif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-t border-base">
                    <td className="p-3 text-secondary whitespace-nowrap text-xs">{formatDate(row.inventory_date)}</td>
                    <td className="p-3 text-primary text-xs">{row.article_nom}</td>
                    <td className="p-3 text-right text-secondary text-xs">{formatQty(row.stock_theorique)}</td>
                    <td className="p-3 text-right text-primary text-xs">{formatQty(row.stock_reel)}</td>
                    <td className={`p-3 text-right font-bold text-xs ${row.ecart > 0 ? 'text-success' : row.ecart < 0 ? 'text-danger' : 'text-muted'}`}>
                      {row.ecart > 0 ? '+' : ''}{formatQty(row.ecart)}
                    </td>
                    <td className="p-3 text-xs">
                      <span className={`inline-flex px-2 py-0.5 rounded-full border font-medium ${row.regularise ? 'bg-success/10 text-success border-success/20' : 'bg-surface-2 text-muted border-base'}`}>
                        {row.regularise ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="p-3 text-muted text-xs hidden md:table-cell">{row.motif || '—'}{row.user_nom ? <span className="block">par {row.user_nom}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};

const StockPage: React.FC = () => {
  const [month, setMonth] = useState(currentMonth());
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
  const [movement, setMovement] = useState<{ item: StockOverviewItem; type: 'ENTREE' | 'SORTIE' } | null>(null);
  const [inventory, setInventory] = useState<StockOverviewItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inventoriesOpen, setInventoriesOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await stockService.getOverview(month));
    } catch (err: any) {
      setError(apiError(err, 'Impossible de charger le stock'));
    } finally {
      setLoading(false);
    }
  }, [month]);

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
    eleve: scopedForStats.filter(i => statusOf(i) === 'eleve').length,
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

  const afterAction = () => {
    setMovement(null);
    setInventory(null);
    setEditing(null);
    setDeleting(null);
    setViewing(null);
    setCreating(false);
    load();
  };

  // État du stock filtré imprimé sur le rouleau 80 mm (inventaire, réapprovisionnement)
  const printList = () => {
    const scope = [
      monthLabel(month),
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
      <div className="space-y-4">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Stock
          </h2>
          <p className="text-muted text-sm mt-1">Tous les articles et leur quantité restante, par module</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          <label className="flex min-w-0 items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-surface-2 border border-base">
            <span className="text-muted text-sm hidden sm:inline">Mois</span>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="min-w-0 w-full bg-transparent text-primary text-sm focus:outline-none"
            />
          </label>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 transition-all font-medium"
          >
            <Plus size={18} />
            <span>Ajouter</span>
          </button>
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all"
          >
            <History size={16} />
            <span className="hidden sm:inline">Historique</span>
          </button>
          <button
            onClick={() => setInventoriesOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all"
          >
            <ClipboardList size={16} />
            <span className="hidden sm:inline">Inventaires</span>
          </button>
          <button
            onClick={load}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={printList}
            disabled={filtered.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary transition-all disabled:opacity-50"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Imprimer</span>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          ['tous', 'Articles', stats.total, 'bg-surface border-base', 'text-primary', <Package size={16} key="i" />],
          ['ok', 'En stock', stats.ok, 'bg-success/5 border-success/20', 'text-success', <CheckCircle size={16} key="i" />],
          ['faible', 'Stock faible', stats.faible, 'bg-warning/5 border-warning/20', 'text-warning', <AlertTriangle size={16} key="i" />],
          ['eleve', 'Stock élevé', stats.eleve, 'bg-accent/5 border-accent/20', 'text-accent', <ArrowUpCircle size={16} key="i" />],
          ['rupture', 'Rupture', stats.rupture, 'bg-danger/5 border-danger/20', 'text-danger', <XCircle size={16} key="i" />],
        ] as const).map(([key, label, value, box, text, icon]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`${box} border rounded-xl p-4 text-left transition-all ${statusFilter === key ? 'ring-2 ring-accent/60' : 'hover:brightness-110'}`}
          >
            <p className="text-xs mb-1 flex items-center gap-1.5 text-muted"><span className={text}>{icon}</span>{label}</p>
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
            <option value="eleve">Stock élevé</option>
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
          <h3 className="text-primary font-semibold">Liste des articles · {monthLabel(month)}</h3>
          <span className="text-muted text-sm">{filtered.length} article(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base bg-surface-2">
                <th className="text-left p-3 text-muted font-medium text-xs">ARTICLES</th>
                <th className="text-right p-3 text-muted font-medium text-xs">STOCK MINIMUM</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden md:table-cell">STOCK MAXIMUM</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden lg:table-cell">STOCK AU 1er</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden xl:table-cell">ENTRÉE MENSUEL</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden xl:table-cell">SORTIE MENSUEL</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden xl:table-cell">VENTE MENSUEL</th>
                <th className="text-right p-3 text-muted font-medium text-xs">STOCK RESTANT</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden lg:table-cell">STOCK RÉEL</th>
                <th className="text-right p-3 text-muted font-medium text-xs hidden md:table-cell">ÉCART</th>
                <th className="text-left p-3 text-muted font-medium text-xs">STATUT</th>
                <th className="text-right p-3 text-muted font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Package size={48} className="text-muted/30" />
                      <p className="text-muted">Aucun article ne correspond aux filtres.</p>
                    </div>
                  </td>
                </tr>
              ) : visible.map(item => {
                const status = statusOf(item);
                const cfg = STATUS_CONFIG[status];
                const qtyColor = status === 'rupture' ? 'text-danger' : status === 'faible' ? 'text-warning' : status === 'eleve' ? 'text-accent' : 'text-primary';
                const ecart = item.ecart;
                const ecartColor = ecart != null && ecart > 0 ? 'text-success' : ecart != null && ecart < 0 ? 'text-danger' : 'text-muted';
                return (
                  <tr key={item.cle} className="border-b border-base last:border-0 hover:bg-surface-2/50 transition">
                    <td className="p-3">
                      <p className="text-primary font-medium text-xs">{item.nom}</p>
                      <p className="text-muted text-xs">{item.categorie || '—'}</p>
                      {item.code && <p className="text-muted text-xs">{item.code}</p>}
                    </td>
                    <td className="p-3 text-right text-secondary text-xs">{formatQty(item.seuil_minimum)}</td>
                    <td className="p-3 text-right text-secondary text-xs hidden md:table-cell">{Number(item.seuil_maximum) > 0 ? formatQty(Number(item.seuil_maximum)) : '—'}</td>
                    <td className="p-3 text-right text-secondary text-xs hidden lg:table-cell">{item.stock_debut_mois != null ? formatQty(item.stock_debut_mois) : '—'}</td>
                    <td className="p-3 text-right text-success text-xs hidden xl:table-cell">{item.entree_mensuel ? `+${formatQty(item.entree_mensuel)}` : '—'}</td>
                    <td className="p-3 text-right text-danger text-xs hidden xl:table-cell">{item.sortie_mensuel ? `-${formatQty(item.sortie_mensuel)}` : '—'}</td>
                    <td className="p-3 text-right text-warning text-xs hidden xl:table-cell">{item.vente_mensuel ? formatQty(item.vente_mensuel) : '—'}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <span className={`font-bold text-xs ${qtyColor}`}>{formatQty(item.quantite)}</span>
                      <span className="text-muted text-xs ml-1">{item.unite || ''}</span>
                    </td>
                    <td className="p-3 text-right text-secondary text-xs hidden lg:table-cell">{item.stock_reel != null ? formatQty(item.stock_reel) : '—'}</td>
                    <td className={`p-3 text-right text-xs hidden md:table-cell ${ecartColor}`}>{ecart ? (ecart > 0 ? `+${formatQty(ecart)}` : formatQty(ecart)) : '—'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${cfg.className}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setMovement({ item, type: 'ENTREE' })} title="Entrée de stock" className="flex items-center justify-center w-7 h-7 rounded-lg bg-success/10 border border-success/20 text-success hover:bg-success/20 transition">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => setMovement({ item, type: 'SORTIE' })} title="Sortie de stock" className="flex items-center justify-center w-7 h-7 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition">
                          <Minus size={12} />
                        </button>
                        <button onClick={() => setInventory(item)} title="Inventaire" className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-2 border border-base text-muted hover:text-primary transition">
                          <ClipboardList size={12} />
                        </button>
                        <button onClick={() => setViewing(item)} title="Voir le détail" className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-2 border border-base text-muted hover:text-primary transition">
                          <Eye size={12} />
                        </button>
                        <button onClick={() => setEditing(item)} title="Modifier" className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-2 border border-base text-muted hover:text-primary transition">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setDeleting(item)} title="Supprimer" className="flex items-center justify-center w-7 h-7 rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 transition">
                          <Trash2 size={12} />
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
        month={month}
        onClose={() => setViewing(null)}
        onEdit={(item) => { setViewing(null); setEditing(item); }}
        onMovement={(item, type) => { setViewing(null); setMovement({ item, type }); }}
        onInventory={(item) => { setViewing(null); setInventory(item); }}
      />
      <StockMovementModal
        item={movement?.item ?? null}
        defaultType={movement?.type ?? 'ENTREE'}
        onClose={() => setMovement(null)}
        onSaved={afterAction}
      />
      <StockInventoryModal
        item={inventory}
        onClose={() => setInventory(null)}
        onSaved={afterAction}
      />
      <StockEditModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={afterAction}
      />
      <StockDeleteModal
        item={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={afterAction}
      />
      {creating && (
        <StockArticleModal
          onClose={() => setCreating(false)}
          onCreated={afterAction}
        />
      )}
      {historyOpen && <StockHistoryModal month={month} onClose={() => setHistoryOpen(false)} />}
      {inventoriesOpen && <StockInventoriesModal month={month} onClose={() => setInventoriesOpen(false)} />}
    </div>
  );
};

export default StockPage;

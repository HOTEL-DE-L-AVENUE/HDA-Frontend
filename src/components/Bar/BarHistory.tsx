import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, History, Search, WalletCards } from 'lucide-react';
import { getBarHistory } from '../../services/bar.service';
import { getPafHistory, type PafClosure } from '../../services/paf.service';
import { formatCurrency } from '../../utils/data';

type HistoryTab = 'paf' | 'caisse';
type CashHistoryOrder = {
  id: number;
  client: string;
  table: number;
  total: number;
  observation?: string;
  moyen_paiement?: string;
  created_at?: string;
  cloture_at?: string;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const dateSearchValue = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR') : '';

const cashLocation = (order: CashHistoryOrder) => {
  const kind = order.observation?.trim().toUpperCase();
  if (kind === 'CHAMBRE') return 'Chambre';
  if (kind === 'POKER' || kind === 'POCKER' || kind === 'POKER GRATUIT' || kind === 'POCKER GRATUIT') return 'Table Poker';
  if (kind === 'GRATUIT' || (order.table === 0 && order.moyen_paiement === 'GRATUIT')) return 'Table Gratuit';
  return `Table ${order.table}`;
};

export const BarHistory: React.FC = () => {
  const [tab, setTab] = useState<HistoryTab>('paf');
  const [query, setQuery] = useState('');
  const [pafClosures, setPafClosures] = useState<PafClosure[]>([]);
  const [cashOrders, setCashOrders] = useState<CashHistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [paf, caisse] = await Promise.all([getPafHistory(), getBarHistory()]);
        setPafClosures(paf);
        setCashOrders(caisse as CashHistoryOrder[]);
      } catch (loadError) {
        console.error('Erreur chargement historique Bar:', loadError);
        setError("L'historique n'a pas pu être chargé.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase('fr-FR');
  const filteredPaf = useMemo(() => pafClosures.filter((closure) => {
    const haystack = [closure.reference, closure.date, formatDate(closure.dateCloture), dateSearchValue(closure.dateCloture)].join(' ').toLocaleLowerCase('fr-FR');
    return haystack.includes(normalizedQuery);
  }), [pafClosures, normalizedQuery]);
  const filteredCash = useMemo(() => cashOrders.filter((order) => {
    const haystack = [cashLocation(order), order.client, formatDate(order.cloture_at || order.created_at), dateSearchValue(order.cloture_at || order.created_at), order.moyen_paiement].join(' ').toLocaleLowerCase('fr-FR');
    return haystack.includes(normalizedQuery);
  }), [cashOrders, normalizedQuery]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-accent/30 bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><History size={22} /></div>
            <div><h2 className="font-semibold text-primary">Historique</h2><p className="mt-1 text-sm text-muted">Archives conservées après la clôture des PAF et de la caisse.</p></div>
          </div>
          <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Rechercher par date, client ou table" className="w-full rounded-xl border border-base bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-primary outline-none focus:border-accent" /></div>
        </div>
        <div className="mt-5 flex w-fit rounded-xl border border-base bg-surface-2 p-1">
          <button type="button" onClick={() => setTab('paf')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'paf' ? 'bg-accent text-black' : 'text-muted hover:text-primary'}`}>Historique PAF</button>
          <button type="button" onClick={() => setTab('caisse')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'caisse' ? 'bg-accent text-black' : 'text-muted hover:text-primary'}`}>Historique Caisse</button>
        </div>
      </div>

      {loading && <div className="rounded-xl border border-base bg-surface p-6 text-sm text-muted">Chargement de l'historique…</div>}
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}

      {!loading && !error && tab === 'paf' && (
        <div className="space-y-3">
          {filteredPaf.length === 0 ? <EmptyHistory label="Aucune clôture PAF ne correspond à cette recherche." /> : filteredPaf.map((closure) => (
            <article key={closure.id} className="rounded-xl border border-base bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-primary">{closure.reference}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarDays size={13} /> Session du {closure.date} · clôturée le {formatDate(closure.dateCloture)}</p></div><strong className="text-lg text-accent">{formatCurrency(closure.summary.totalAmount)}</strong></div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><Stat label="Tickets" value={closure.summary.totalTickets} /><Stat label="Hommes" value={closure.summary.homme} /><Stat label="Femmes" value={closure.summary.femme} /></div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && tab === 'caisse' && (
        <div className="space-y-3">
          {filteredCash.length === 0 ? <EmptyHistory label="Aucune commande de caisse clôturée ne correspond à cette recherche." /> : filteredCash.map((order) => (
            <article key={order.id} className="rounded-xl border border-base bg-surface p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-accent/15 px-2 text-accent"><WalletCards size={18} /></div><div><p className="font-semibold text-primary">{cashLocation(order)}</p><p className="mt-0.5 text-sm text-secondary">{order.client || 'Client non renseigné'}</p><p className="mt-1 text-xs text-muted">Clôturée le {formatDate(order.cloture_at || order.created_at)} · {order.moyen_paiement || 'ESPECES'}</p></div></div><strong className="text-lg text-accent">{formatCurrency(order.total)}</strong></div></article>
          ))}
          <div className="rounded-xl border border-dashed border-base bg-surface/50 p-4 text-sm text-muted"><span className="font-medium text-secondary">Chambres</span> — historique statique pour le moment, en attente du raccordement du module Hébergement.</div>
        </div>
      )}
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => <div className="rounded-lg bg-surface-2 p-2"><p className="text-muted">{label}</p><p className="mt-1 font-semibold text-primary">{value}</p></div>;
const EmptyHistory = ({ label }: { label: string }) => <div className="rounded-xl border border-base bg-surface p-6 text-center text-sm text-muted">{label}</div>;

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../UI';
import { Copy, Check, Printer, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/data';

const pafOptions = [
  { value: 20000, label: 'Paf 20 000 Ar' },
  { value: 10000, label: 'Paf 10 000 Ar' },
  { value: 5000, label: 'Paf 5 000 Ar' },
  { value: 0, label: 'Paf 0 Ar' },
] as const;

const STORAGE_KEY = 'hda-bar-paf-history';

type PaymentMethod = 'ESPECES' | 'CREDIT' | 'TPE' | 'ORANGE_MONEY' | 'MVOLA' | 'GRATUIT';
type PafGender = 'Homme' | 'Femme' | 'Mixte';

type PafTicketDetail = {
  price: number;
  gender: 'Homme' | 'Femme';
  qty: number;
};

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CREDIT', label: 'Crédit' },
  { value: 'TPE', label: 'TPE' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MVOLA', label: 'MVola' },
  { value: 'GRATUIT', label: 'Gratuit' },
];

type PafHistoryEntry = {
  id: number;
  date: string;
  gender: PafGender;
  price: number;
  paymentMethod?: PaymentMethod;
  details: PafTicketDetail[];
};

type PafTicketLine = {
  id: number;
  price: number;
  gender: 'Homme' | 'Femme';
  qty: number;
};

const normalizeHistory = (entries: PafHistoryEntry[]) =>
  entries.map((entry) => {
    const details = Array.isArray(entry.details) && entry.details.length > 0
      ? entry.details.map((detail) => ({
          price: Number(detail.price || 0),
          gender: detail.gender === 'Femme' ? 'Femme' : 'Homme',
          qty: Number(detail.qty || 0) || 1,
        }))
      : [{
          price: Number(entry.price || 0),
          gender: entry.gender === 'Femme' ? 'Femme' : 'Homme',
          qty: 1,
        }];

    const totalPrice = details.reduce((sum, detail) => sum + detail.price * detail.qty, 0);
    const gender = details.some((detail) => detail.gender === 'Homme') && details.some((detail) => detail.gender === 'Femme')
      ? 'Mixte'
      : details[0]?.gender ?? 'Homme';

    return {
      ...entry,
      gender,
      price: totalPrice || Number(entry.price || 0),
      details,
    } as PafHistoryEntry;
  });

const getEntryDetailsText = (item: PafHistoryEntry) =>
  item.details.length > 0
    ? item.details.map((detail) => `${detail.gender} x${detail.qty} • ${formatCurrency(detail.price * detail.qty)}`).join(' | ')
    : `${item.gender} • ${formatCurrency(item.price)}`;

const getPaymentLabel = (paymentMethod?: PaymentMethod) =>
  paymentOptions.find((option) => option.value === paymentMethod)?.label || 'Espèces';

const getPafReportText = (history: PafHistoryEntry[], totalAmount: number) => {
  const separator = '========================================';
  const reportDate = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const transactionBlocks = history.slice(0, 50).map((item, index) => [
    `TRANSACTION ${String(index + 1).padStart(2, '0')}`,
    `Details  : ${getEntryDetailsText(item)}`,
    `Paiement : ${getPaymentLabel(item.paymentMethod)}`,
    `Montant  : ${formatCurrency(item.price)}`,
  ].join('\n'));

  return [
    'PAF HDA',
    `Date : ${reportDate}`,
    separator,
    `TRANSACTIONS : ${history.length}`,
    `TOTAL        : ${formatCurrency(totalAmount)}`,
    separator,
    ...(transactionBlocks.length > 0 ? transactionBlocks : ['Aucune transaction']),
    separator,
    `TOTAL DES TRANSACTIONS : ${formatCurrency(totalAmount)}`,
  ].join('\n');
};

export const PafSection: React.FC = () => {
  const [history, setHistory] = useState<PafHistoryEntry[]>([]);
  const [copiedHistory, setCopiedHistory] = useState(false);
  const [ticketLines, setTicketLines] = useState<PafTicketLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PafHistoryEntry[];
      if (Array.isArray(parsed)) {
        setHistory(normalizeHistory(parsed));
      }
    } catch (error) {
      console.error('Erreur lecture historique Paf:', error);
    }
  }, []);

  useEffect(() => {
    try {
      if (history.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Erreur sauvegarde historique Paf:', error);
    }
  }, [history]);

  const summary = useMemo(() => {
    const totalTickets = history.length;
    const totalAmount = history.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const homme = history.reduce((sum, item) => sum + item.details.filter((detail) => detail.gender === 'Homme').reduce((inner, detail) => inner + detail.qty, 0), 0);
    const femme = history.reduce((sum, item) => sum + item.details.filter((detail) => detail.gender === 'Femme').reduce((inner, detail) => inner + detail.qty, 0), 0);
    const byPrice = pafOptions.map((option) => {
      const price = Number(option.value);
      const count = history.reduce((sum, item) => sum + item.details.filter((detail) => Number(detail.price) === price).reduce((inner, detail) => inner + detail.qty, 0), 0);
      return { price, count, amount: count * price };
    });

    return { totalTickets, totalAmount, homme, femme, byPrice };
  }, [history]);

  const ticketTotal = ticketLines.reduce((sum, line) => sum + line.price * line.qty, 0);

  const groupTicketLines = (lines: PafTicketLine[]) =>
    lines.reduce<PafTicketDetail[]>((acc, line) => {
      const match = acc.find((detail) => detail.price === line.price && detail.gender === line.gender);
      if (match) {
        match.qty += line.qty;
        return acc;
      }

      acc.push({ price: line.price, gender: line.gender, qty: line.qty });
      return acc;
    }, []);

  const handleAddPafLine = (price: number) => {
    setTicketLines((prev) => {
      const existing = prev.find((line) => line.price === price && line.gender === 'Homme');

      if (existing) {
        return prev.map((line) =>
          line.id === existing.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }

      return [...prev, { id: Date.now() + Math.random(), price, gender: 'Homme', qty: 1 }];
    });
  };

  const handleUpdateTicketLineGender = (id: number, gender: 'Homme' | 'Femme') => {
    setTicketLines((prev) => prev.map((line) => (line.id === id ? { ...line, gender } : line)));
  };

  const handleRemoveTicketLine = (id: number) => {
    setTicketLines((prev) => prev.filter((line) => line.id !== id));
  };

  const handleClearTicket = () => {
    setTicketLines([]);
  };

  const handlePrintPafTicket = () => {
    if (ticketLines.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=420,height=620');
    if (!printWindow) {
      return;
    }

    const logoSrc = '/logo_s.png';
    const rowsHtml = groupTicketLines(ticketLines).map((line) => `
      <tr>
        <td>${line.gender} x${line.qty}</td>
        <td class="number">${formatCurrency(line.price * line.qty)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Ticket Paf</title><style>
      @page { size: 80mm auto; margin: 4mm; } body { width: 80mm; margin: 0; font-family: monospace; color: #111; font-size: 11px; line-height: 1.4; } .header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; } .header img { width: 36px; height: 36px; object-fit: contain; } h1 { margin: 0; text-align: center; font-size: 18px; } p { margin: 4px 0; } .box { border: 1px dashed #444; padding: 8px; border-radius: 6px; } table { width: 100%; border-collapse: collapse; margin-top: 10px; } th, td { padding: 4px 2px; border-bottom: 1px dashed #999; text-align: left; } .number { text-align: right; } .total { margin-top: 12px; padding-top: 8px; border-top: 1px solid #111; font-size: 16px; font-weight: bold; text-align: right; } .muted { color: #555; font-size: 9px; } @media print { body { width: 80mm; } }
    </style></head><body><div class="header"><img src="${logoSrc}" alt="HDA" /><h1>Ticket Paf</h1></div><div class="box"><p class="muted">Imprimé le ${new Date().toLocaleString('fr-FR')}</p><table><thead><tr><th>Sexe</th><th class="number">Montant</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="total">Total : ${formatCurrency(ticketTotal)}</p></div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleEncaissementPaf = () => {
    if (ticketLines.length === 0) return;

    const details = groupTicketLines(ticketLines);
    const newEntry: PafHistoryEntry = {
      id: Date.now() + Math.random(),
      date: new Date().toISOString(),
      gender: details.some((detail) => detail.gender === 'Homme') && details.some((detail) => detail.gender === 'Femme') ? 'Mixte' : details[0]?.gender ?? 'Homme',
      price: ticketTotal,
      paymentMethod,
      details,
    };

    setHistory((prev) => [newEntry, ...prev].slice(0, 100));
    setTicketLines([]);
  };

  const handleCopyHistory = async () => {
    if (history.length === 0) return;

    const text = getPafReportText(history, summary.totalAmount);

    try {
      await navigator.clipboard.writeText(text);
      setCopiedHistory(true);
      window.setTimeout(() => setCopiedHistory(false), 1200);
    } catch (error) {
      console.error('Erreur copie historique Paf complet:', error);
    }
  };

  const handleDeletePafEntry = (id: number) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-base bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-primary font-semibold">Paf</h3>
            <p className="text-sm text-slate-500">Cliquez sur le montant voulu, puis choisissez le sexe de chaque ligne. Plusieurs choix peuvent être ajoutés dans un même ticket.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {pafOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleAddPafLine(Number(option.value))}
                className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-4 text-left transition hover:border-accent hover:bg-accent/15"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Paf</div>
                <div className="mt-2 text-lg font-bold text-primary">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-base bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-primary">Ticket courant</h3>
          {ticketLines.length > 0 && (
            <button
              type="button"
              onClick={handleClearTicket}
              className="text-xs text-slate-400 transition hover:text-white"
            >
              Vider
            </button>
          )}
        </div>

        {ticketLines.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun choix ajouté pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {ticketLines.map((line) => (
              <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-base bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-semibold text-accent">
                  <span>{formatCurrency(line.price)}</span>
                  {line.qty > 1 && <span className="text-xs text-slate-400">x{line.qty}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketLineGender(line.id, 'Homme')}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${line.gender === 'Homme' ? 'bg-red-500 text-white' : 'border border-base bg-surface text-slate-300'}`}
                  >
                    Homme
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTicketLineGender(line.id, 'Femme')}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition ${line.gender === 'Femme' ? 'bg-pink-500 text-white' : 'border border-base bg-surface text-slate-300'}`}
                  >
                    Femme
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveTicketLine(line.id)}
                    className="inline-flex items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 p-1.5 text-red-300 transition hover:border-red-400 hover:text-red-200"
                    aria-label="Supprimer la ligne du ticket"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {ticketLines.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
            <span className="text-sm text-slate-300">Total du ticket</span>
            <span className="text-lg font-bold text-accent">{formatCurrency(ticketTotal)}</span>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mode d’encaissement</label>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="w-full rounded-xl border border-base bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus:border-accent"
            >
              {paymentOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <Button type="button" onClick={handlePrintPafTicket} disabled={ticketLines.length === 0} className="w-full sm:w-auto">
            <Printer size={16} />
            Imprimer le ticket
          </Button>

          <Button type="button" onClick={handleEncaissementPaf} disabled={ticketLines.length === 0} className="w-full sm:w-auto">
            Encaisser
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-base bg-surface p-4">
          <p className="text-xs text-muted">Tickets Paf</p>
          <p className="mt-2 text-2xl font-bold text-primary">{summary.totalTickets}</p>
        </div>
        <div className="rounded-xl border border-base bg-surface p-4">
          <p className="text-xs text-muted">Montant total</p>
          <p className="mt-2 text-2xl font-bold text-accent">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-base bg-surface p-4">
          <p className="text-xs text-muted">Homme / Femme</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">{summary.homme} / {summary.femme}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-base bg-surface p-4">
          <h3 className="mb-3 font-semibold text-primary">Répartition par prix</h3>
          <div className="space-y-2">
            {summary.byPrice.map((item) => (
              <div key={item.price} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
                <span className="text-secondary">{formatCurrency(item.price)}</span>
                <strong className="text-accent">{item.count} ticket{item.count > 1 ? 's' : ''}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-base bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-primary">Rapport PAF HDA</h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => void handleCopyHistory()}
                className="inline-flex items-center gap-2 rounded-lg border border-base bg-surface px-2.5 py-1.5 text-xs text-slate-300 transition hover:text-white"
              >
                {copiedHistory ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedHistory ? 'Copié' : 'Copier le rapport'}
              </button>
            )}
          </div>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2">
            <span className="text-sm text-slate-300">Somme des transactions</span>
            <strong className="text-lg text-accent">{formatCurrency(summary.totalAmount)}</strong>
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun ticket Paf imprimé pour le moment.</p>
            ) : (
              history.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{item.gender}</span>
                      <span className="text-accent">{formatCurrency(item.price)}</span>
                    </div>
                    {item.details.length > 0 && (
                      <div className="mt-1 text-[10px] text-slate-400">{item.details.map((detail) => `${detail.gender} x${detail.qty} • ${formatCurrency(detail.price * detail.qty)}`).join(' | ')}</div>
                    )}
                    <div className="mt-1 text-[11px] text-slate-500">{new Date(item.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="mt-1 text-[10px] text-slate-400">Paiement : {paymentOptions.find((option) => option.value === item.paymentMethod)?.label || 'Espèces'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePafEntry(item.id)}
                    className="inline-flex items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 p-1.5 text-red-300 transition hover:border-red-400 hover:text-red-200"
                    aria-label={`Supprimer le ticket Paf de ${item.gender}`}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

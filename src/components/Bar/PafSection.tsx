import { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '../UI';
import { AlertTriangle, Check, Copy, Edit3, LockKeyhole, Printer, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../../utils/data';
import AuthService from '../../services/authService';
import { isAdmin } from '../../utils/permissions';
import {
  closePafDay,
  createPafOperation,
  deletePafOperation,
  getPafClosure,
  getPafClosures,
  getPafCurrent,
  type PafClosure,
  type PafOperation,
  type PafSummary,
  type PaymentMethod,
  type PafTicketDetail,
  updatePafOperation,
} from '../../services/paf.service';

const pafOptions = [
  { value: 20000, label: 'Paf 20 000 Ar' },
  { value: 10000, label: 'Paf 10 000 Ar' },
  { value: 5000, label: 'Paf 5 000 Ar' },
  { value: 0, label: 'Paf 0 Ar' },
] as const;

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'CREDIT', label: 'Crédit' },
  { value: 'TPE', label: 'TPE' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MVOLA', label: 'MVola' },
  { value: 'GRATUIT', label: 'Gratuit' },
];

type PafTicketLine = PafTicketDetail & { id: number };

const EMPTY_SUMMARY: PafSummary = {
  totalTickets: 0,
  totalAmount: 0,
  homme: 0,
  femme: 0,
  byPrice: pafOptions.map(({ value: price }) => ({ price, count: 0, amount: 0 })),
  byPayment: {
    ESPECES: 0,
    CREDIT: 0,
    TPE: 0,
    ORANGE_MONEY: 0,
    MVOLA: 0,
    GRATUIT: 0,
  },
};

const getEntryDetailsText = (item: PafOperation) =>
  item.details.length > 0
    ? item.details.map((detail) => `${detail.gender} x${detail.qty} • ${formatCurrency(detail.price * detail.qty)}`).join(' | ')
    : `${item.gender} • ${formatCurrency(item.price)}`;

const getPaymentLabel = (paymentMethod?: PaymentMethod) =>
  paymentOptions.find((option) => option.value === paymentMethod)?.label || 'Espèces';

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDate = (value: string) => new Date(value).toLocaleString('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

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

type PrintFormat = 'receipt' | 'a4';

const printHtml = (title: string, content: string, format: PrintFormat) => {
  const printWindow = window.open('', '_blank', 'width=760,height=760');
  if (!printWindow) return;
  const isReceipt = format === 'receipt';
  const pageStyle = isReceipt ? '@page { size: 80mm auto; margin: 4mm; }' : '@page { size: A4 portrait; margin: 14mm; }';
  const bodyStyle = isReceipt
    ? 'body.receipt { width: 72mm; max-width: 72mm; margin: 0; font-family: monospace; color: #111827; font-size: 10px; line-height: 1.3; overflow-wrap: anywhere; }'
    : 'body.a4 { width: auto; margin: 0; font-family: Arial, sans-serif; color: #111827; font-size: 12px; }';
  printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    ${pageStyle} ${bodyStyle} h1 { margin: 0 0 4px; font-size: ${isReceipt ? '17px' : '22px'}; } h2 { margin: 24px 0 8px; font-size: 15px; } .muted { color: #6b7280; } .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 2px solid #111827; padding-bottom: 12px; } .box { margin-top: 18px; border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; } .totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; } .total { border: 1px solid #e5e7eb; padding: 8px; } .total strong { display: block; margin-top: 4px; font-size: 15px; } table { width: 100%; border-collapse: collapse; margin-top: 8px; } th, td { padding: 7px 5px; border-bottom: 1px solid #e5e7eb; text-align: left; } th:last-child, td:last-child { text-align: right; } .grand-total { text-align: right; font-size: 17px; font-weight: 700; margin-top: 12px; } .receipt .header { display: block; text-align: center; border-bottom: 1px dashed #111827; padding-bottom: 8px; } .receipt .header > strong { display: block; margin-top: 5px; } .receipt .box { margin-top: 10px; border: 0; border-radius: 0; padding: 0; } .receipt .totals { display: block; } .receipt .total { display: flex; justify-content: space-between; border: 0; border-bottom: 1px dotted #9ca3af; padding: 3px 0; } .receipt .total strong { margin: 0; font-size: inherit; } .receipt h2 { text-align: center; margin: 12px 0 5px; font-size: 12px; } .receipt table { font-size: 10px; } .receipt th, .receipt td { padding: 4px 2px; } .receipt .grand-total { border-top: 1px solid #111827; padding-top: 7px; font-size: 14px; } @media print { .no-print { display: none; } }
  </style></head><body class="${isReceipt ? 'receipt' : 'a4'}">${content}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const summaryMarkup = (summary: PafSummary) => `
  <div class="totals">
    <div class="total">Tickets<strong>${summary.totalTickets}</strong></div>
    <div class="total">Montant<strong>${escapeHtml(formatCurrency(summary.totalAmount))}</strong></div>
    <div class="total">Homme<strong>${summary.homme}</strong></div>
    <div class="total">Femme<strong>${summary.femme}</strong></div>
  </div>
`;

const operationsMarkup = (operations: PafOperation[]) => `
  <table><thead><tr><th>Date</th><th>Détails</th><th>Paiement</th><th>Montant</th></tr></thead><tbody>
    ${operations.length > 0 ? operations.map((operation) => `<tr><td>${escapeHtml(formatDate(operation.date))}</td><td>${escapeHtml(getEntryDetailsText(operation))}</td><td>${escapeHtml(getPaymentLabel(operation.paymentMethod))}</td><td>${escapeHtml(formatCurrency(operation.price))}</td></tr>`).join('') : '<tr><td colspan="4">Aucune opération</td></tr>'}
  </tbody></table>
`;

const receiptOperationsMarkup = (operations: PafOperation[]) => operations.length > 0
  ? operations.map((operation) => `<div style="border-bottom:1px dotted #9ca3af;padding:5px 0"><div style="display:flex;justify-content:space-between;gap:6px"><strong>${escapeHtml(getEntryDetailsText(operation))}</strong><strong>${escapeHtml(formatCurrency(operation.price))}</strong></div><div class="muted">${escapeHtml(formatDate(operation.date))} · ${escapeHtml(getPaymentLabel(operation.paymentMethod))}</div></div>`).join('')
  : '<p>Aucune opération.</p>';

const receiptSummaryMarkup = (summary: PafSummary) => `
  <div class="totals">
    <div class="total"><span>Tickets</span><strong>${summary.totalTickets}</strong></div>
    <div class="total"><span>Homme</span><strong>${summary.homme}</strong></div>
    <div class="total"><span>Femme</span><strong>${summary.femme}</strong></div>
    <div class="total"><span>Total</span><strong>${escapeHtml(formatCurrency(summary.totalAmount))}</strong></div>
  </div>
`;

export const PafSection: React.FC = () => {
  const userIsAdmin = isAdmin(AuthService.getCurrentUser());
  const [history, setHistory] = useState<PafOperation[]>([]);
  const [summary, setSummary] = useState<PafSummary>(EMPTY_SUMMARY);
  const [closures, setClosures] = useState<PafClosure[]>([]);
  const [selectedClosure, setSelectedClosure] = useState<PafClosure | null>(null);
  const [copiedHistory, setCopiedHistory] = useState(false);
  const [ticketLines, setTicketLines] = useState<PafTicketLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECES');
  const [editingOperationId, setEditingOperationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [current, closureRows] = await Promise.all([getPafCurrent(), userIsAdmin ? getPafClosures() : Promise.resolve([])]);
      setHistory(current.operations);
      setSummary(current.summary);
      setClosures(closureRows);
    } catch (loadError) {
      console.error('Erreur chargement PAF:', loadError);
      setError('Les données PAF n’ont pas pu être chargées.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const ticketTotal = useMemo(
    () => ticketLines.reduce((sum, line) => sum + line.price * line.qty, 0),
    [ticketLines],
  );

  const handleAddPafLine = (price: number) => {
    setTicketLines((previous) => {
      const existing = previous.find((line) => line.price === price && line.gender === 'Homme');
      if (existing) {
        return previous.map((line) => line.id === existing.id ? { ...line, qty: line.qty + 1 } : line);
      }
      return [...previous, { id: Date.now() + Math.random(), price, gender: 'Homme', qty: 1 }];
    });
  };

  const handleEditPafEntry = (operation: PafOperation) => {
    setEditingOperationId(operation.id);
    setPaymentMethod(operation.paymentMethod);
    setTicketLines(operation.details.map((detail, index) => ({ ...detail, id: operation.id * 100 + index })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearTicket = () => {
    setTicketLines([]);
    setEditingOperationId(null);
    setPaymentMethod('ESPECES');
  };

  const handlePrintPafTicket = () => {
    if (ticketLines.length === 0) return;
    const rows = groupTicketLines(ticketLines).map((line) => `<tr><td>${escapeHtml(line.gender)} x${line.qty}</td><td>${escapeHtml(formatCurrency(line.price * line.qty))}</td></tr>`).join('');
    printHtml('Ticket PAF', `<div class="header"><div><h1>Ticket PAF HDA</h1><div class="muted">${escapeHtml(new Date().toLocaleString('fr-FR'))}</div></div><strong>${escapeHtml(getPaymentLabel(paymentMethod))}</strong></div><div class="box"><table><thead><tr><th>Détails</th><th>Montant</th></tr></thead><tbody>${rows}</tbody></table><div class="grand-total">Total : ${escapeHtml(formatCurrency(ticketTotal))}</div></div>`, 'receipt');
  };

  const handlePrintCurrent = () => {
    printHtml('Compte du jour PAF', `<div class="header"><div><h1>Compte du jour PAF</h1><div class="muted">Imprimé le ${escapeHtml(new Date().toLocaleString('fr-FR'))}</div></div><strong>Session ouverte</strong></div><div class="box">${receiptSummaryMarkup(summary)}<h2>Opérations ouvertes</h2>${receiptOperationsMarkup(history)}</div>`, 'receipt');
  };

  const handlePrintClosure = async (closure: PafClosure) => {
    try {
      const detail = closure.operations ? closure : await getPafClosure(closure.id);
      setSelectedClosure(detail);
      printHtml(`Clôture PAF ${detail.reference}`, `<div class="header"><h1>Clôture PAF HDA</h1><div class="muted">Référence : ${escapeHtml(detail.reference)}<br>Journée : ${escapeHtml(detail.date)}<br>Clôturée le : ${escapeHtml(formatDate(detail.dateCloture))}</div></div><div class="box"><h2>Total général de la clôture</h2><div class="grand-total">${escapeHtml(formatCurrency(detail.summary.totalFinal ?? detail.summary.totalAmount))}</div><div class="totals"><div class="total"><span>Tickets</span><strong>${detail.summary.totalTickets}</strong></div><div class="total"><span>Homme</span><strong>${detail.summary.homme}</strong></div><div class="total"><span>Femme</span><strong>${detail.summary.femme}</strong></div></div></div>`, 'receipt');
    } catch (printError) {
      console.error('Erreur chargement clôture PAF:', printError);
      setError('Le récapitulatif de clôture n’a pas pu être chargé.');
    }
  };

  const handleEncaissementPaf = async () => {
    if (ticketLines.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { details: groupTicketLines(ticketLines), paymentMethod };
      if (editingOperationId) {
        await updatePafOperation(editingOperationId, payload);
      } else {
        await createPafOperation(payload);
      }
      handleClearTicket();
      await loadData();
    } catch (saveError) {
      console.error('Erreur enregistrement PAF:', saveError);
      setError('L’opération PAF n’a pas pu être enregistrée.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePafEntry = async (id: number) => {
    if (!window.confirm('Supprimer cette opération PAF ?')) return;
    try {
      await deletePafOperation(id);
      await loadData();
    } catch (deleteError) {
      console.error('Erreur suppression PAF:', deleteError);
      setError('L’opération PAF n’a pas pu être supprimée.');
    }
  };

  const handleClosePafDay = async () => {
    setShowCloseConfirmation(false);
    setSaving(true);
    setError(null);
    try {
      const result = await closePafDay();
      handleClearTicket();
      setSelectedClosure(result.closure);
      await handlePrintClosure(result.closure);
      await loadData();
    } catch (closeError) {
      console.error('Erreur clôture PAF:', closeError);
      setError('La clôture PAF n’a pas pu être effectuée.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyHistory = async () => {
    if (history.length === 0) return;
    const text = [
      'PAF HDA',
      `Date : ${new Date().toLocaleString('fr-FR')}`,
      `Opérations : ${summary.totalTickets}`,
      `Total : ${formatCurrency(summary.totalAmount)}`,
      '',
      ...history.map((item, index) => `${index + 1}. ${getEntryDetailsText(item)} — ${getPaymentLabel(item.paymentMethod)} — ${formatCurrency(item.price)}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHistory(true);
      window.setTimeout(() => setCopiedHistory(false), 1200);
    } catch (copyError) {
      console.error('Erreur copie historique PAF:', copyError);
    }
  };

  if (loading) {
    return <div className="rounded-xl border border-base bg-surface p-6 text-sm text-slate-400">Chargement du PAF...</div>;
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="rounded-2xl border border-base bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-primary font-semibold">Paf</h3>
            <p className="text-sm text-slate-500">Cliquez sur le montant voulu, puis choisissez le sexe de chaque ligne. Plusieurs choix peuvent être ajoutés dans un même ticket.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {pafOptions.map((option) => (
              <button key={option.value} type="button" onClick={() => handleAddPafLine(Number(option.value))} className="rounded-xl border border-accent/35 bg-accent/10 px-3 py-4 text-left transition hover:border-accent hover:bg-accent/15">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Paf</div>
                <div className="mt-2 text-lg font-bold text-primary">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-base bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold text-primary">{editingOperationId ? 'Modifier l’opération' : 'Ticket courant'}</h3>
          {ticketLines.length > 0 && <button type="button" onClick={handleClearTicket} className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-white"><X size={14} /> Vider</button>}
        </div>
        {ticketLines.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun choix ajouté pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {ticketLines.map((line) => (
              <div key={line.id} className="flex flex-col gap-2 rounded-lg border border-base bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-semibold text-accent"><span>{formatCurrency(line.price)}</span>{line.qty > 1 && <span className="text-xs text-slate-400">x{line.qty}</span>}</div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setTicketLines((previous) => previous.map((item) => item.id === line.id ? { ...item, gender: 'Homme' } : item))} className={`rounded-md px-2 py-1 text-xs font-medium transition ${line.gender === 'Homme' ? 'bg-red-500 text-white' : 'border border-base bg-surface text-slate-300'}`}>Homme</button>
                  <button type="button" onClick={() => setTicketLines((previous) => previous.map((item) => item.id === line.id ? { ...item, gender: 'Femme' } : item))} className={`rounded-md px-2 py-1 text-xs font-medium transition ${line.gender === 'Femme' ? 'bg-pink-500 text-white' : 'border border-base bg-surface text-slate-300'}`}>Femme</button>
                  <button type="button" onClick={() => setTicketLines((previous) => previous.filter((item) => item.id !== line.id))} className="inline-flex items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 p-1.5 text-red-300 transition hover:border-red-400 hover:text-red-200" aria-label="Supprimer la ligne du ticket" title="Supprimer"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {ticketLines.length > 0 && <div className="mt-4 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2"><span className="text-sm text-slate-300">Total du ticket</span><span className="text-lg font-bold text-accent">{formatCurrency(ticketTotal)}</span></div>}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[180px] flex-1"><label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Mode d’encaissement</label><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} className="w-full rounded-xl border border-base bg-surface-2 px-3 py-2 text-sm text-primary outline-none focus:border-accent">{paymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <Button type="button" onClick={handlePrintPafTicket} disabled={ticketLines.length === 0} className="w-full sm:w-auto"><Printer size={16} /> Imprimer le ticket</Button>
          <Button type="button" onClick={() => void handleEncaissementPaf()} disabled={ticketLines.length === 0 || saving} className="w-full sm:w-auto">{editingOperationId ? <Edit3 size={16} /> : null}{saving ? 'Enregistrement...' : editingOperationId ? 'Modifier' : 'Encaisser'}</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section className="rounded-2xl border border-base bg-surface p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-primary">Compte du jour</h3>
              <p className="mt-1 text-xs text-muted">Synthèse des opérations PAF actuellement ouvertes</p>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">{summary.totalTickets}</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-base bg-surface-2 p-4"><p className="text-xs text-muted">Tickets Paf</p><p className="mt-2 text-2xl font-bold text-primary">{summary.totalTickets}</p></div>
            <div className="rounded-xl border border-base bg-surface-2 p-4"><p className="text-xs text-muted">Montant total</p><p className="mt-2 text-2xl font-bold text-accent">{formatCurrency(summary.totalAmount)}</p></div>
            <div className="rounded-xl border border-base bg-surface-2 p-4"><p className="text-xs text-muted">Homme / Femme</p><p className="mt-2 text-xl font-bold text-emerald-400">{summary.homme} / {summary.femme}</p></div>
          </div>
        </section>

        <section className="rounded-2xl border border-accent/30 bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-primary">Opérations de la caisse PAF</h3>
              <p className="mt-1 text-xs text-muted">Impression et clôture globales</p>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">{history.length}</span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Button size="sm" variant="secondary" icon={<Printer size={14} />} onClick={handlePrintCurrent} disabled={history.length === 0} className="justify-center">
              Imprimer le compte
            </Button>
            <Button size="sm" icon={<LockKeyhole size={14} />} onClick={() => setShowCloseConfirmation(true)} disabled={saving || history.length === 0} className="justify-center">
              {saving ? 'Clôture...' : 'Clôturer toutes'}
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-base pt-4 text-center">
            <div>
              <p className="text-lg font-semibold text-primary">{ticketLines.length > 0 ? 1 : 0}</p>
              <p className="text-[11px] text-muted">À encaisser</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-400">{history.length}</p>
              <p className="text-[11px] text-muted">Encaissées</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-base bg-surface p-4"><h3 className="mb-3 font-semibold text-primary">Répartition par prix</h3><div className="space-y-2">{summary.byPrice.map((item) => <div key={item.price} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm"><span className="text-secondary">{formatCurrency(item.price)}</span><strong className="text-accent">{item.count} ticket{item.count > 1 ? 's' : ''}</strong></div>)}</div></div>
        <div className="rounded-xl border border-base bg-surface p-4"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-primary">Rapport du jour</h3>{history.length > 0 && <div className="flex gap-2"><button type="button" onClick={() => void handleCopyHistory()} className="inline-flex items-center gap-2 rounded-lg border border-base bg-surface px-2.5 py-1.5 text-xs text-slate-300 transition hover:text-white">{copiedHistory ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}{copiedHistory ? 'Copié' : 'Copier'}</button><button type="button" onClick={handlePrintCurrent} className="inline-flex items-center gap-1 rounded-lg border border-base bg-surface px-2.5 py-1.5 text-xs text-slate-300 transition hover:text-white"><Printer size={14} /> Imprimer</button></div>}</div><div className="mb-3 flex items-center justify-between rounded-lg border border-accent/30 bg-accent/10 px-3 py-2"><span className="text-sm text-slate-300">Somme des transactions</span><strong className="text-lg text-accent">{formatCurrency(summary.totalAmount)}</strong></div><div className="space-y-2">{history.length === 0 ? <p className="text-sm text-slate-500">Aucune opération Paf pour le jour courant.</p> : history.slice(0, 8).map((item) => <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm"><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-semibold text-primary">{item.gender}</span><span className="text-accent">{formatCurrency(item.price)}</span></div><div className="mt-1 text-[10px] text-slate-400">{getEntryDetailsText(item)}</div><div className="mt-1 text-[11px] text-slate-500">{formatDate(item.date)}</div><div className="mt-1 text-[10px] text-slate-400">Paiement : {getPaymentLabel(item.paymentMethod)}</div></div><div className="flex gap-1"><button type="button" onClick={() => handleEditPafEntry(item)} className="inline-flex items-center justify-center rounded-md border border-accent/40 bg-accent/10 p-1.5 text-accent transition hover:border-accent" aria-label="Modifier le ticket Paf" title="Modifier"><Edit3 size={14} /></button><button type="button" onClick={() => void handleDeletePafEntry(item.id)} className="inline-flex items-center justify-center rounded-md border border-red-500/40 bg-red-500/10 p-1.5 text-red-300 transition hover:border-red-400 hover:text-red-200" aria-label="Supprimer le ticket Paf" title="Supprimer"><Trash2 size={14} /></button></div></div>)}</div></div>
      </div>

      {userIsAdmin && <div className="rounded-xl border border-base bg-surface p-4"><div className="mb-3 flex items-center justify-between"><div><h3 className="font-semibold text-primary">Historique des clôtures</h3><p className="text-sm text-slate-500">Les journées clôturées restent conservées et consultables.</p></div><span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-slate-400">{closures.length} clôture{closures.length > 1 ? 's' : ''}</span></div>{closures.length === 0 ? <p className="text-sm text-slate-500">Aucune clôture PAF enregistrée.</p> : <div className="space-y-2">{closures.map((closure) => <div key={closure.id} className="flex flex-col gap-3 rounded-lg bg-surface-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-primary">{closure.date} <span className="ml-2 text-xs font-normal text-slate-500">{closure.reference}</span></div><div className="mt-1 text-xs text-slate-400">Clôturée le {formatDate(closure.dateCloture)} · {closure.summary.totalTickets} opération{closure.summary.totalTickets > 1 ? 's' : ''} · {formatCurrency(closure.summary.totalAmount)}</div></div><div className="flex gap-2"><button type="button" onClick={() => void handlePrintClosure(closure)} className="inline-flex items-center gap-1 rounded-lg border border-base px-2.5 py-1.5 text-xs text-slate-300 transition hover:text-white"><Printer size={14} /> Imprimer</button><button type="button" onClick={() => void getPafClosure(closure.id).then(setSelectedClosure).catch(() => setError('La clôture n’a pas pu être chargée.'))} className="rounded-lg border border-base px-2.5 py-1.5 text-xs text-slate-300 transition hover:text-white">Consulter</button></div></div>)}</div>}</div>}

      {selectedClosure && <div className="rounded-xl border border-accent/30 bg-surface p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold text-primary">Clôture {selectedClosure.reference}</h3><p className="text-sm text-slate-500">Journée {selectedClosure.date} · {formatDate(selectedClosure.dateCloture)}</p></div><button type="button" onClick={() => setSelectedClosure(null)} className="text-slate-400 hover:text-white" aria-label="Fermer le détail"><X size={18} /></button></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-surface-2 p-3 text-sm"><span className="text-slate-400">Opérations</span><strong className="mt-1 block text-primary">{selectedClosure.summary.totalTickets}</strong></div><div className="rounded-lg bg-surface-2 p-3 text-sm"><span className="text-slate-400">Total</span><strong className="mt-1 block text-accent">{formatCurrency(selectedClosure.summary.totalAmount)}</strong></div><div className="rounded-lg bg-surface-2 p-3 text-sm"><span className="text-slate-400">Homme / Femme</span><strong className="mt-1 block text-emerald-400">{selectedClosure.summary.homme} / {selectedClosure.summary.femme}</strong></div></div><div className="mt-3 space-y-2">{(selectedClosure.operations || []).map((operation) => <div key={operation.id} className="rounded-lg bg-surface-2 px-3 py-2 text-sm"><div className="flex justify-between gap-2"><span className="text-primary">{getEntryDetailsText(operation)}</span><span className="text-accent">{formatCurrency(operation.price)}</span></div><div className="mt-1 text-xs text-slate-500">{formatDate(operation.date)} · {getPaymentLabel(operation.paymentMethod)}</div></div>)}</div></div>}

      <Modal isOpen={showCloseConfirmation} onClose={() => { if (!saving) setShowCloseConfirmation(false); }} title="Confirmer la clôture du PAF" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300"><AlertTriangle size={18} /></div>
            <div><p className="font-semibold text-primary">Clôturer le compte du jour ?</p><p className="mt-1 text-sm leading-5 text-slate-400">Les opérations ouvertes seront enregistrées dans l’historique et un nouveau compte du jour sera ouvert.</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-base bg-surface-2 p-3 text-center">
            <div><p className="text-xs text-muted">Opérations</p><p className="mt-1 text-lg font-semibold text-primary">{summary.totalTickets}</p></div>
            <div><p className="text-xs text-muted">Total à clôturer</p><p className="mt-1 text-lg font-semibold text-accent">{formatCurrency(summary.totalAmount)}</p></div>
          </div>
          <p className="text-xs leading-5 text-slate-500">Cette action remettra les compteurs du jour à zéro. Les données clôturées ne seront pas supprimées.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowCloseConfirmation(false)} disabled={saving} className="justify-center">Annuler</Button>
            <Button type="button" onClick={() => void handleClosePafDay()} disabled={saving} icon={<LockKeyhole size={15} />} className="justify-center">{saving ? 'Clôture...' : 'Confirmer la clôture'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { Button, Select } from '../UI';
import { Copy, Check, Printer, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/data';

const pafOptions = [
  { value: '20000', label: '20 000 Ar' },
  { value: '10000', label: '10 000 Ar' },
  { value: '5000', label: '5 000 Ar' },
  { value: '0', label: '0 Ar' },
] as const;

const STORAGE_KEY = 'hda-bar-paf-history';

type PafHistoryEntry = {
  id: number;
  date: string;
  gender: 'Homme' | 'Femme';
  price: number;
};

export const PafSection: React.FC = () => {
  const [pafPrice, setPafPrice] = useState<number>(20000);
  const [pafGender, setPafGender] = useState<'Homme' | 'Femme'>('Homme');
  const [history, setHistory] = useState<PafHistoryEntry[]>([]);
  const [copiedHistory, setCopiedHistory] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PafHistoryEntry[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
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
    const homme = history.filter((item) => item.gender === 'Homme').length;
    const femme = history.filter((item) => item.gender === 'Femme').length;
    const byPrice = Array.from(new Map(
      pafOptions.map((option) => [Number(option.value), 0])
    )).map(([price, _]) => {
      const count = history.filter((item) => Number(item.price) === price).length;
      return { price, count, amount: count * price };
    });

    return { totalTickets, totalAmount, homme, femme, byPrice };
  }, [history]);

  const handlePrintPafTicket = () => {
    const printWindow = window.open('', '_blank', 'width=420,height=620');
    if (!printWindow) {
      return;
    }

    const priceLabel = formatCurrency(pafPrice);
    const genderLabel = pafGender === 'Homme' ? 'Homme' : 'Femme';
    const logoSrc = '/logo_s.png';

    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Ticket Paf</title><style>
      @page { size: 80mm auto; margin: 4mm; } body { width: 80mm; margin: 0; font-family: monospace; color: #111; font-size: 11px; line-height: 1.4; } .header { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; } .header img { width: 36px; height: 36px; object-fit: contain; } h1 { margin: 0; text-align: center; font-size: 18px; } p { margin: 4px 0; } .box { border: 1px dashed #444; padding: 8px; border-radius: 6px; } .total { margin-top: 12px; padding-top: 8px; border-top: 1px solid #111; font-size: 16px; font-weight: bold; text-align: right; } .muted { color: #555; font-size: 9px; } @media print { body { width: 80mm; } }
    </style></head><body><div class="header"><img src="${logoSrc}" alt="HDA" /><h1>Ticket Paf</h1></div><div class="box"><p><strong>Sexe :</strong> ${genderLabel}</p><p><strong>Prix d'entrée :</strong> ${priceLabel}</p><p class="muted">Imprime le ${new Date().toLocaleString('fr-FR')}</p></div><p class="total">Total : ${priceLabel}</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    setHistory((prev) => [{ id: Date.now(), date: new Date().toISOString(), gender: pafGender, price: pafPrice }, ...prev].slice(0, 100));
  };

  const handleCopyHistory = async () => {
    if (history.length === 0) return;

    const text = history
      .slice(0, 50)
      .map((item) => `${item.gender} - ${formatCurrency(item.price)} - ${new Date(item.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`)
      .join('\n');

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-primary font-semibold">Paf</h3>
            <p className="text-sm text-slate-500">Choisissez le prix d’entrée puis le sexe pour imprimer le ticket.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Select
            label="Prix d'entrée"
            value={String(pafPrice)}
            onChange={(event) => setPafPrice(Number(event.target.value) || 0)}
            options={pafOptions.map((option) => ({ value: option.value, label: option.label }))}
          />

          <div className="rounded-xl border border-base bg-surface-2 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sexe</p>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                <input
                  type="radio"
                  name="paf-gender"
                  checked={pafGender === 'Homme'}
                  onChange={() => setPafGender('Homme')}
                  className="h-4 w-4 accent-accent"
                />
                Homme
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
                <input
                  type="radio"
                  name="paf-gender"
                  checked={pafGender === 'Femme'}
                  onChange={() => setPafGender('Femme')}
                  className="h-4 w-4 accent-accent"
                />
                Femme
              </label>
            </div>
          </div>

          <Button type="button" onClick={handlePrintPafTicket} className="self-end">
            <Printer size={16} />
            Imprimer ticket
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
            <h3 className="font-semibold text-primary">Historique récent</h3>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => void handleCopyHistory()}
                className="inline-flex items-center gap-2 rounded-lg border border-base bg-surface px-2.5 py-1.5 text-xs text-slate-300 transition hover:text-white"
              >
                {copiedHistory ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copiedHistory ? 'Copié' : 'Copier tout'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun ticket Paf imprimé pour le moment.</p>
            ) : (
              history.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <div>
                    <span className="text-primary">{item.gender}</span>
                    <div className="text-[11px] text-slate-500">{new Date(item.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-accent">{formatCurrency(item.price)}</strong>
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

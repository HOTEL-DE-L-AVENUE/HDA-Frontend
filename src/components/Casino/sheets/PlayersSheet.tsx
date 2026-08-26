import React, { useState } from 'react';
import { PlayerLine, casinoBorder, casinoCurrency, parseCasinoAmount } from './types';

interface PlayersSheetProps {
  date: string;
  players: PlayerLine[];
  total: number;
  totalCashing: number;
  restaurantPayments: { especes: boolean; tpe: boolean };
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onUpdate: (id: number, key: keyof PlayerLine, value: string) => void;
  onDateChange: (value: string) => void;
  onPaymentChange: (payment: 'especes' | 'tpe', checked: boolean) => void;
  onSave: () => void;
  onAdd: (ficheId?: number) => number;
  onRemove: (id: number) => void;
}

const paperInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-gray-400';
const darkInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-gray-400';
const paymentMethods = ['Orange Money', 'MVola', 'Euro', 'Dollar', 'TPE', 'Chèque', 'Offert', 'Virement', 'Crédit'];

export const PlayersSheet: React.FC<PlayersSheetProps> = ({ date, players, total, totalCashing, restaurantPayments, saveState = 'idle', onUpdate, onDateChange, onPaymentChange, onSave, onAdd }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id ?? 0);
  const [printingPlayerId, setPrintingPlayerId] = useState<number | null>(null);
  const selectedPlayer = players.find((player) => (player.ficheId ?? player.id) === selectedPlayerId);
  const selectedPlayerLines = players.filter((player) => (player.ficheId ?? player.id) === selectedPlayerId);

  const totalsByLineId: Record<number, number> = {};
  const accumulatedByLineId = selectedPlayerLines.reduce<Record<number, string>>((accumulated, line, index) => {
    const previousTotal = index > 0 ? Number(accumulated[selectedPlayerLines[index - 1].id]) || 0 : 0;
    const currentTotal = (Number(line.caves) || 0) * (Number(line.amount) || 0);
    totalsByLineId[line.id] = currentTotal;
    accumulated[line.id] = String(previousTotal + currentTotal);
    return accumulated;
  }, {});

  const printPlayerSheet = () => {
    if (!selectedPlayer) return;
    setPrintingPlayerId(selectedPlayer.id);
    window.setTimeout(() => {
      window.onafterprint = () => {
        setPrintingPlayerId(null);
        window.onafterprint = null;
      };
      window.print();
    }, 0);
  };

  const addPlayer = () => {
    const newPlayerId = onAdd();
    setSelectedPlayerId(newPlayerId);
  };

  const addPlayerLine = () => {
    if (!selectedPlayer) return;
    const newLineId = onAdd(selectedPlayer.ficheId ?? selectedPlayer.id);
    onUpdate(newLineId, 'name', selectedPlayer.name);
    setSelectedPlayerId(selectedPlayer.ficheId ?? selectedPlayer.id);
  };

  return (
  <div className="player-sheet-print p-2 text-xs text-white" style={{ backgroundColor: 'var(--color-surface)' }}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
      <div className="flex items-center gap-2">
        <label htmlFor="player-to-print" className="font-semibold">Fiche joueur :</label>
        <select id="player-to-print" value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(Number(event.target.value))} className="rounded border bg-transparent px-2 py-1 text-white" style={{ ...casinoBorder, color: '#fff', backgroundColor: 'var(--color-surface)' }} disabled={!players.length}>
          {players.filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index).map((player) => <option key={player.ficheId ?? player.id} value={player.ficheId ?? player.id} className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>{player.name || `Joueur ${player.ficheId ?? player.id}`}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" className="action secondary" onClick={addPlayer}>Ajouter un joueur</button>
        <button type="button" className="action secondary" onClick={addPlayerLine} disabled={!selectedPlayer}>Ajouter une ligne</button>
        <button type="button" className="action secondary" onClick={printPlayerSheet} disabled={!selectedPlayer}>Imprimer la fiche</button>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1180px] table-fixed border-collapse border" style={casinoBorder}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-bg)' }}>
            <th className="border p-2 text-left font-semibold" style={casinoBorder} colSpan={2}>DATE : <input type="date" value={date} onChange={(event) => onDateChange(event.target.value)} className="ml-1 bg-transparent font-normal outline-none" /></th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder} colSpan={3}>JOUEUR :</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>N° D’ADHÉRANT</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>HEURE D’ARRIVÉE</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder} colSpan={3}>RÉSULTATS</th>
          </tr>
          <tr style={{ backgroundColor: 'var(--color-bg)' }}>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>JOUEUR :</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>HEURE :</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>NB CAVES</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>Montant Caves</th>
            <th className="bo rder p-2 text-left font-semibold" style={casinoBorder}>Total Caves +</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>Caves accumulées +</th>
            <th className="border p-2 text-center font-semibold" style={casinoBorder}>Paye</th>
            <th className="border p-2 text-center font-semibold" style={casinoBorder}>non Paye</th>
            <th className="border p-2 text-left font-semibold" style={casinoBorder}>MODE DE PAIEMENT</th>
            <th className="border p-2 text-center font-semibold" style={casinoBorder}>Signature</th>
          </tr>
        </thead>
        <tbody>
          {selectedPlayerLines.map((line) => (
            <tr key={line.id} className="h-9">
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.name} onChange={(event) => onUpdate(line.id, 'name', event.target.value)} placeholder="Nom du joueur" /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.time} onChange={(event) => onUpdate(line.id, 'time', event.target.value)} placeholder="h" /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.caves} onChange={(event) => onUpdate(line.id, 'caves', event.target.value)} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.amount} onChange={(event) => onUpdate(line.id, 'amount', event.target.value)} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={totalsByLineId[line.id] ? String(totalsByLineId[line.id]) : '0'} readOnly /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={accumulatedByLineId[line.id] || '0'} readOnly /></td>
              <td className="border text-center" style={casinoBorder}><input type="radio" name={`payment-${line.id}`} checked={line.payment === 'Payé'} onChange={() => onUpdate(line.id, 'payment', 'Payé')} /></td>
              <td className="border text-center" style={casinoBorder}><input type="radio" name={`payment-${line.id}`} checked={line.payment === 'Non payé'} onChange={() => onUpdate(line.id, 'payment', 'Non payé')} /></td>
              <td className="border" style={casinoBorder}><select className={paperInput} value={line.paymentMethod || ''} onChange={(event) => onUpdate(line.id, 'paymentMethod', event.target.value)} style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}><option value="" className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>Sélectionner</option>{paymentMethods.map((method) => <option key={method} value={method} className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>{method}</option>)}</select></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.signature} onChange={(event) => onUpdate(line.id, 'signature', event.target.value)} /></td>
            </tr>
          ))}
          <tr className="h-12">
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={2}>HEURE DE DEPART : <input className={`${paperInput} inline-block w-28`} value={selectedPlayer?.departure || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'departure', event.target.value)} /></td>
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={3}>Cashing : <input type="text" inputMode="decimal" className={`${paperInput} inline-block w-32`} value={selectedPlayer?.cashing || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'cashing', event.target.value)} placeholder="0" /></td>
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={4}>Signature : <input className={`${paperInput} inline-block w-40`} value={selectedPlayer?.signature || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'signature', event.target.value)} /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="grid md:grid-cols-[1.15fr_1fr_1.15fr] mt-4 border text-white" style={{ ...casinoBorder, backgroundColor: 'var(--color-surface)' }}>
      <div className="border-r" style={casinoBorder}>
        <SheetBottomRow label="TOTAL CAVEES :" value={casinoCurrency.format(total)} />
            <SheetBottomRow label="TOTAL CASHING EN JETONS" value={casinoCurrency.format(totalCashing)} />
      </div>
      <div className="border-r" style={casinoBorder}>
        <div className="min-h-12 border-b" style={casinoBorder} />
        <div className="min-h-12 border-b" style={casinoBorder} />
      </div>
      <div>
        <p className="p-2 border-b font-semibold" style={casinoBorder}>RESTAURANT</p>
        <SheetBottomRow label="TOTAL OFFERT" />
        <SheetBottomRow label="TOTAL BON RESTAURANT" />
        <SheetBottomRow label="MONTANT PAYE" />
        <div className="flex items-center gap-4 p-2 border-b" style={casinoBorder}>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" aria-label="Paiement en especes" checked={restaurantPayments.especes} onChange={(event) => onPaymentChange('especes', event.target.checked)} />
            ESPECES
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" aria-label="Paiement par TPE" checked={restaurantPayments.tpe} onChange={(event) => onPaymentChange('tpe', event.target.checked)} />
            TPE
          </label>
        </div>
        <SheetBottomRow label="RESTE A PAYER" />
      </div>
    </div>
    <div className="mt-4 flex items-center justify-end gap-3 print:hidden">
      {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
      {saveState === 'error' && <span className="text-xs text-red-700">Erreur d’enregistrement</span>}
      <button type="button" className="action" onClick={onSave} disabled={saveState === 'saving'}>
        {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer la fiche'}
      </button>
    </div>
  </div>
  );
};

const SheetBottomRow: React.FC<{ label: string; value?: string }> = ({ label, value = '' }) => (
  <label className="grid grid-cols-[1.45fr_1fr] min-h-12 border-b last:border-b-0" style={casinoBorder}>
    <span className="p-2 flex items-center font-semibold text-[10px] leading-tight border-r" style={casinoBorder}>{label}</span>
    <input className={darkInput} value={value} readOnly={!!value} />
  </label>
);

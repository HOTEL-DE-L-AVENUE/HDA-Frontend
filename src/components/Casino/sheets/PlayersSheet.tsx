import React, { useEffect, useRef, useState } from 'react';
import { PlayerLine, casinoBorder, casinoCurrency, parseCasinoAmount, IDENTITY_VERIFICATION_THRESHOLD, IdentityVerificationData } from './types';
import { IdentityVerificationModal } from './IdentityVerificationModal';
import { identityVerificationApi } from '../../../services/casinoTablesJeu.service';

interface PlayersSheetProps {
  date: string;
  players: PlayerLine[];
  cashingPaymentMethod?: string;
  restaurantPayments: { especes: boolean; tpe: boolean };
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onUpdate: (id: number, key: keyof PlayerLine, value: string) => void;
  onDateChange: (value: string) => void;
  onPaymentChange: (payment: 'especes' | 'tpe', checked: boolean) => void;
  onCashingPaymentMethodChange?: (value: string) => void;
  onSave: () => void;
  onAdd: (ficheId?: number) => number;
  onRemove: (id: number) => void;
  onIdentityVerified?: (playerId: number, data: IdentityVerificationData, verificationId?: number) => void;
  showIdentityVerifications?: boolean;
  identityVerifications?: Record<number, { id?: number; full_name: string; id_type: string; id_number: string; issue_date: string; transaction_type: string; amount: number; verified_at: string }>;
}

const paperInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-gray-400';
const darkInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-gray-400';
const paymentMethods = ['Orange Money', 'MVola', 'Euro', 'Dollar', 'TPE', 'Chèque', 'Offert', 'Virement', 'Crédit'];

const bonusCategories = ['7 et 2', 'Carré', 'Quinte flush', 'Quinte flush royal', 'Fetish'];
const positiveResultOptions = ['Dépôt', 'Crédit payé', 'Espèce', 'MVola', 'Orange Money'];
const negativeResultOptions = ['Dépôt payé', 'Crédit', 'TPE', 'MVola', 'Orange Money', 'Espèce'];
const ROULETTE_PRIZES = [10000, 5000, 100000, 20000, 10000, 0, 50000, 10000, 10000, 20000, 100000, 10000, 5000, 50000, 20000, 5000, 40000, 5000, 50000, 5000, 0, 100000, 10000, 20000];

const parseBonuses = (value?: string): string[] => {
  try {
    const bonuses = JSON.parse(value || '[]');
    return Array.isArray(bonuses) ? bonuses.filter((bonus): bonus is string => typeof bonus === 'string') : [];
  } catch {
    return [];
  }
};

const parseIdentityVerification = (value?: string) => {
  try {
    const data = JSON.parse(value || 'null');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
};

const parseBonusResults = (value?: string): Record<string, number> => {
  try {
    const results = JSON.parse(value || '{}');
    return results && typeof results === 'object' && !Array.isArray(results)
      ? Object.entries(results).reduce<Record<string, number>>((amounts, [bonus, amount]) => {
        if (typeof amount === 'number') amounts[bonus] = amount;
        return amounts;
      }, {})
      : {};
  } catch {
    return {};
  }
};


const signaturesAreCompatible = (firstSignature: string, secondSignature: string): Promise<boolean> => new Promise((resolve) => {
  if (!firstSignature || !secondSignature) {
    resolve(false);
    return;
  }
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    resolve(false);
    return;
  }
  const firstImage = new Image();
  const secondImage = new Image();
  let loaded = 0;
  const compare = () => {
    loaded += 1;
    if (loaded < 2) return;
    const render = (image: HTMLImageElement) => {
      context.clearRect(0, 0, size, size);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, size, size);
      context.drawImage(image, 0, 0, size, size);
      return context.getImageData(0, 0, size, size).data;
    };
    const firstPixels = render(firstImage);
    const secondPixels = render(secondImage);
    let firstInk = 0;
    let secondInk = 0;
    let matchingInk = 0;
    for (let index = 0; index < firstPixels.length; index += 4) {
      const firstIsInk = firstPixels[index] < 220 || firstPixels[index + 1] < 220 || firstPixels[index + 2] < 220;
      const secondIsInk = secondPixels[index] < 220 || secondPixels[index + 1] < 220 || secondPixels[index + 2] < 220;
      if (firstIsInk) firstInk += 1;
      if (secondIsInk) secondInk += 1;
      if (firstIsInk && secondIsInk) matchingInk += 1;
    }
    const union = firstInk + secondInk - matchingInk;
    resolve(firstInk > 0 && secondInk > 0 && matchingInk / union >= 0.10);
  };
  firstImage.onload = compare;
  secondImage.onload = compare;
  firstImage.onerror = () => resolve(false);
  secondImage.onerror = () => resolve(false);
  firstImage.src = firstSignature;
  secondImage.src = secondSignature;
});
export const PlayersSheet: React.FC<PlayersSheetProps> = ({ date, players, restaurantPayments, saveState = 'idle', onUpdate, onDateChange, onPaymentChange, onSave, onAdd, onIdentityVerified, showIdentityVerifications = true, identityVerifications = {} }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(() => {
    const firstPlayer = players[0];
    return firstPlayer ? (firstPlayer.ficheId ?? firstPlayer.id) : 0;
  });
  const [printingPlayerId, setPrintingPlayerId] = useState<number | null>(null);
  const [pendingBonus, setPendingBonus] = useState<string | null>(null);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [rouletteNumber, setRouletteNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [identityModal, setIdentityModal] = useState<{ open: boolean; amount: number }>({ open: false, amount: 0 });
  const [identityTransactionType, setIdentityTransactionType] = useState<'achat' | 'apport' | 'echange'>('achat');
  const [repeatedSignature, setRepeatedSignature] = useState('');
  const [signatureError, setSignatureError] = useState('');
  const selectedPlayer = players.find((player) => (player.ficheId ?? player.id) === selectedPlayerId);
  const selectedPlayerLines = players.filter((player) => (player.ficheId ?? player.id) === selectedPlayerId);
  const selectedPlayerTotal = selectedPlayerLines.reduce(
    (sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount),
    0,
  );
  const selectedPlayerCashing = parseCasinoAmount(selectedPlayer?.cashing);
  const selectedPlayerResult = selectedPlayerCashing - selectedPlayerTotal;
  const selectedBonuses = parseBonuses(selectedPlayer?.bonuses);
  const selectedBonusResults = parseBonusResults(selectedPlayer?.bonusResults);
  const selectedResultPaymentOptions = parseBonuses(selectedPlayer?.resultPaymentOptions);
  const selectedIdentityVerification = identityVerifications[selectedPlayerId];
  const resultOptions = selectedPlayerResult > 0 ? positiveResultOptions : selectedPlayerResult < 0 ? negativeResultOptions : [];

  useEffect(() => {
    setRepeatedSignature('');
    setSignatureError('');
  }, [selectedPlayerId]);

  const saveWithSignatureCheck = async () => {
    if (!selectedPlayer?.signature) {
      setSignatureError('Veuillez saisir la signature du joueur.');
      return;
    }
    if (!repeatedSignature) {
      setSignatureError('Veuillez répéter la signature avant d’enregistrer.');
      return;
    }
    if (!(await signaturesAreCompatible(selectedPlayer.signature, repeatedSignature))) {
      setSignatureError('Les signatures ne correspondent pas suffisamment. Veuillez répéter la signature.');
      return;
    }
    setSignatureError('');
    onSave();
  };

  // Chaque fiche possède son propre cumul : une recave ne doit jamais
  // s'ajouter au total d'un autre joueur.
  const totalsByLineId: Record<number, number> = {};
  const accumulatedByLineId: Record<number, string> = {};
  const accumulatedByPlayerId: Record<number, number> = {};

  players.forEach((line) => {
    const playerId = line.ficheId ?? line.id;
    const lineTotal = parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount);

    totalsByLineId[line.id] = lineTotal;
    accumulatedByPlayerId[playerId] = (accumulatedByPlayerId[playerId] || 0) + lineTotal;
    accumulatedByLineId[line.id] = String(accumulatedByPlayerId[playerId]);
  });

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

  const toggleBonus = (bonus: string, checked: boolean) => {
    if (!selectedPlayer) return;
    if (checked) {
      setPendingBonus(bonus);
      setRouletteResult(null);
      setRouletteNumber(null);
      return;
    }
    const nextBonuses = selectedBonuses.filter((selectedBonus) => selectedBonus !== bonus);
    const nextResults = { ...selectedBonusResults };
    delete nextResults[bonus];
    onUpdate(selectedPlayer.id, 'bonuses', JSON.stringify(nextBonuses));
    onUpdate(selectedPlayer.id, 'bonusResults', JSON.stringify(nextResults));
  };

  const spinRoulette = () => {
    if (isSpinning) return;
    const winningIndex = Math.floor(Math.random() * ROULETTE_PRIZES.length);
    setIsSpinning(true);
    setRouletteResult(null);
    setRouletteNumber(null);
    // Le numéro gagnant doit finir sous la flèche placée en haut de la roue,
    // même si la roue a déjà été tournée auparavant.
    setRouletteRotation((current) => {
      const currentAngle = ((current % 360) + 360) % 360;
      const targetAngle = (360 - winningIndex * (360 / ROULETTE_PRIZES.length)) % 360;
      const extraAngle = (targetAngle - currentAngle + 360) % 360;
      return current + 1800 + extraAngle;
    });
    window.setTimeout(() => {
      setRouletteResult(ROULETTE_PRIZES[winningIndex]);
      setRouletteNumber(winningIndex + 1);
      setIsSpinning(false);
    }, 10000);
  };

  const confirmBonusResult = () => {
    if (!selectedPlayer || !pendingBonus || rouletteResult === null) return;
    onUpdate(selectedPlayer.id, 'bonuses', JSON.stringify([...new Set([...selectedBonuses, pendingBonus])]));
    onUpdate(selectedPlayer.id, 'bonusResults', JSON.stringify({ ...selectedBonusResults, [pendingBonus]: rouletteResult }));
    setPendingBonus(null);
  };

  const toggleResultPaymentOption = (option: string, checked: boolean) => {
    if (!selectedPlayer) return;
    const nextOptions = checked ? [option] : [];
    onUpdate(selectedPlayer.id, 'resultPaymentOptions', JSON.stringify(nextOptions));
  };

  useEffect(() => {
    const cashingAmount = parseCasinoAmount(selectedPlayer?.cashing);
    const verificationAmount = Math.max(selectedPlayerTotal, cashingAmount);
    if (selectedPlayer && verificationAmount > IDENTITY_VERIFICATION_THRESHOLD && !selectedPlayer.identityVerification && !identityVerifications[selectedPlayer.ficheId ?? selectedPlayer.id]) {
      setIdentityTransactionType(cashingAmount >= selectedPlayerTotal ? 'echange' : 'achat');
      setIdentityModal({ open: true, amount: verificationAmount });
    }
  }, [selectedPlayer?.id, selectedPlayer?.identityVerification, selectedPlayer?.cashing, selectedPlayerTotal, identityVerifications]);

  const handleIdentityConfirm = async (data: IdentityVerificationData) => {
    if (!selectedPlayer) return;
    try {
      // Call API to save verification to database
      const savedVerification = await identityVerificationApi.create({
        fiche_id: selectedPlayer.ficheId ?? selectedPlayer.id,
        full_name: data.fullName,
        id_type: data.idType,
        id_number: data.idNumber,
        issue_date: data.issueDate,
        transaction_type: data.transactionType.toUpperCase() as 'ACHAT' | 'APPORT' | 'ECHANGE',
        amount: data.amount,
      });
      
      // Update local state
      onUpdate(selectedPlayer.id, 'identityVerification', JSON.stringify(data));
      onIdentityVerified?.(selectedPlayer.ficheId ?? selectedPlayer.id, data, savedVerification.id);
      setIdentityModal({ open: false, amount: 0 });
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la vérification d\'identité:', err);
      const apiError = err as { response?: { status?: number; data?: { error?: { message?: string } | string } } };
      const responseError = apiError.response?.data?.error;
      const message = typeof responseError === 'string' ? responseError : responseError?.message;
      alert(message || `Erreur lors de l'enregistrement (${apiError.response?.status || 'réseau'})`);
    }
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
          {selectedPlayerLines.map((line) => {
            const isEmptyCaveLine = !line.caves.trim() && !line.amount.trim();

            return (
            <tr key={line.id} className="h-9">
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.name} onChange={(event) => onUpdate(line.id, 'name', event.target.value)} placeholder="Nom du joueur" /></td>
              <td className="border" style={casinoBorder}><input type="time" className={paperInput} value={line.time} onChange={(event) => onUpdate(line.id, 'time', event.target.value)} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.caves} onChange={(event) => onUpdate(line.id, 'caves', event.target.value)} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.amount} onChange={(event) => onUpdate(line.id, 'amount', event.target.value)} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={totalsByLineId[line.id] ? String(totalsByLineId[line.id]) : '0'} readOnly /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={isEmptyCaveLine ? '' : accumulatedByLineId[line.id] || '0'} readOnly /></td>
              <td className="border text-center" style={casinoBorder}><input type="radio" name={`payment-${line.id}`} checked={line.payment === 'Payé'} onChange={() => onUpdate(line.id, 'payment', 'Payé')} /></td>
              <td className="border text-center" style={casinoBorder}><input type="radio" name={`payment-${line.id}`} checked={line.payment === 'Non payé'} onChange={() => onUpdate(line.id, 'payment', 'Non payé')} /></td>
              <td className="border" style={casinoBorder}><select className={paperInput} value={line.paymentMethod || ''} onChange={(event) => onUpdate(line.id, 'paymentMethod', event.target.value)} style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}><option value="" className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>Sélectionner</option>{paymentMethods.map((method) => <option key={method} value={method} className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>{method}</option>)}</select></td>
              <td className="border p-1" style={casinoBorder}><SignaturePad value={line.signature} onChange={(value) => onUpdate(line.id, 'signature', value)} compact /></td>
            </tr>
            );
          })}
          <tr className="h-12">
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={2}>HEURE DE DEPART : <input type="time" className={`${paperInput} inline-block w-28`} value={selectedPlayer?.departure || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'departure', event.target.value)} /></td>
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={3}>Cashing : <input type="text" inputMode="decimal" className={`${paperInput} inline-block w-32`} value={selectedPlayer?.cashing || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'cashing', event.target.value)} placeholder="0" /></td>
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={4}>
              <div className="flex items-center gap-2">Répéter la signature : {selectedPlayer && <SignaturePad value={repeatedSignature} onChange={(value) => { setRepeatedSignature(value); setSignatureError(''); }} />}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div className="grid md:grid-cols-[1.15fr_1fr_1.15fr] mt-4 border text-white" style={{ ...casinoBorder, backgroundColor: 'var(--color-surface)' }}>
      <div className="border-r" style={casinoBorder}>
        <SheetBottomRow label="TOTAL CAVEES :" value={casinoCurrency.format(selectedPlayerTotal)} />
        <SheetBottomRow label="TOTAL CASHING EN JETONS" value={casinoCurrency.format(selectedPlayerCashing)} />
        <SheetBottomRow label="RESULTAT :" value={casinoCurrency.format(selectedPlayerResult)} />
        {resultOptions.length > 0 && (
          <div className="border-b p-3" style={casinoBorder}>
            <p className="mb-2 text-[10px] font-semibold">{selectedPlayerResult > 0 ? 'RÈGLEMENT DU DÉPÔT' : 'RÈGLEMENT DU CRÉDIT'}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
              {resultOptions.map((option) => (
                <label key={option} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={selectedResultPaymentOptions[0] === option} onChange={(event) => toggleResultPaymentOption(option, event.target.checked)} />
                  {option}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-r" style={casinoBorder}>
        <p className="p-2 border-b font-semibold" style={casinoBorder}>BONUS</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[11px]">
          {bonusCategories.map((bonus) => (
            <label key={bonus} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={selectedBonuses.includes(bonus)} onChange={(event) => toggleBonus(bonus, event.target.checked)} />
              {bonus}
            </label>
          ))}
        </div>
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
    {showIdentityVerifications && selectedIdentityVerification && (
      <div className="mt-4 rounded-xl border p-3 text-[11px]" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}>
        <p className="mb-2 font-bold text-yellow-300">VÉRIFICATION D'IDENTITÉ</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted">Nom :</span>
          <span className="font-semibold">{selectedIdentityVerification.full_name}</span>
          <span className="text-muted">Pièce :</span>
          <span className="font-semibold">{selectedIdentityVerification.id_type} n° {selectedIdentityVerification.id_number}</span>
          <span className="text-muted">Date d'émission :</span>
          <span className="font-semibold">{selectedIdentityVerification.issue_date}</span>
          <span className="text-muted">Type :</span>
          <span className="font-semibold">{selectedIdentityVerification.transaction_type.toUpperCase()}</span>
          <span className="text-muted">Montant :</span>
          <span className="font-semibold text-yellow-300">{casinoCurrency.format(selectedIdentityVerification.amount)} Ar</span>
          <span className="text-muted">Vérifié le :</span>
          <span className="font-semibold">{new Date(selectedIdentityVerification.verified_at).toLocaleString('fr-FR')}</span>
        </div>
      </div>
    )}
    <div className="mt-4 flex items-center justify-end gap-3 print:hidden">
      {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
      {(saveState === 'error' || signatureError) && <span className="text-xs text-red-400">{signatureError || 'Erreur d’enregistrement'}</span>}
      <button type="button" className="action" onClick={saveWithSignatureCheck} disabled={saveState === 'saving'}>
        {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer la fiche'}
      </button>
    </div>
    {pendingBonus && <BonusRouletteModal bonus={pendingBonus} rotation={rouletteRotation} result={rouletteResult} number={rouletteNumber} isSpinning={isSpinning} onSpin={spinRoulette} onConfirm={confirmBonusResult} onClose={() => !isSpinning && setPendingBonus(null)} />}
    <IdentityVerificationModal
      open={identityModal.open}
      amount={identityModal.amount}
      transactionType={identityTransactionType}
      onClose={() => setIdentityModal({ open: false, amount: 0 })}
      onConfirm={handleIdentityConfirm}
    />
  </div>
  );
};

const SheetBottomRow: React.FC<{ label: string; value?: string }> = ({ label, value = '' }) => (
  <label className="grid grid-cols-[1.45fr_1fr] min-h-12 border-b last:border-b-0" style={casinoBorder}>
    <span className="p-2 flex items-center font-semibold text-[10px] leading-tight border-r" style={casinoBorder}>{label}</span>
    <input className={darkInput} value={value} readOnly={!!value} />
  </label>
);

const BonusRouletteModal: React.FC<{ bonus: string; rotation: number; result: number | null; number: number | null; isSpinning: boolean; onSpin: () => void; onConfirm: () => void; onClose: () => void }> = ({ bonus, rotation, result, number, isSpinning, onSpin, onConfirm, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden" role="dialog" aria-modal="true" aria-label={`Roue bonus ${bonus}`}>
    <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border p-4 text-white shadow-2xl sm:p-5" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-lg font-bold">Roue bonus</p><p className="text-sm text-muted">Bonus : {bonus}</p></div><button type="button" className="text-xl leading-none" onClick={onClose} disabled={isSpinning} aria-label="Fermer">×</button></div>
      <div className="relative mx-auto mb-5 flex h-[min(90vw,25rem,55vh)] w-[min(90vw,25rem,55vh)] max-w-full items-center justify-center">
        <span className="absolute -top-3 z-10 text-3xl text-yellow-300">▼</span>
        <div className="relative h-full w-full rounded-full border-4 border-yellow-500 transition-transform duration-[10000ms] ease-out" style={{ background: 'repeating-conic-gradient(#b91c1c 0deg 15deg, #1f2937 15deg 30deg)', transform: `rotate(${rotation}deg)` }}>
          {ROULETTE_PRIZES.map((_, index) => (
            <span key={index} className="absolute left-1/2 top-1/2 -ml-3 -mt-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[9px] font-bold text-white" style={{ transform: `rotate(${index * 15}deg) translateY(calc(-1 * (min(90vw, 25rem, 55vh) / 2 - 14px))) rotate(${-index * 15}deg)` }}>{index + 1}</span>
          ))}
        </div>
        <div className="absolute flex h-32 w-32 items-center justify-center rounded-full border-4 border-yellow-500 bg-yellow-700 text-center text-sm font-bold">BONUS</div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded border p-2 text-[10px] sm:grid-cols-3 sm:text-[11px]" style={casinoBorder}>
        {ROULETTE_PRIZES.map((prize, index) => <span key={index} className={prize === 0 ? 'text-red-400' : prize === 100000 ? 'text-lime-300' : ''}>{index + 1}. {casinoCurrency.format(prize)} Ar</span>)}
      </div>
      {result !== null && <p className="mb-4 rounded-lg bg-yellow-500/15 p-3 text-center font-bold text-yellow-300">Numéro {number} : {casinoCurrency.format(result)} Ar</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" className="action secondary" onClick={onClose} disabled={isSpinning}>Annuler</button>{result === null ? <button type="button" className="action" onClick={onSpin} disabled={isSpinning}>{isSpinning ? 'La roue tourne...' : 'Tourner la roue'}</button> : <button type="button" className="action" onClick={onConfirm}>Valider le gain</button>}</div>
    </div>
  </div>
);

const SignaturePad: React.FC<{ value: string; onChange: (value: string) => void; compact?: boolean }> = ({ value, onChange, compact = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const width = compact ? 150 : 210;
  const height = compact ? 38 : 56;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(Boolean(value));
    if (!value.startsWith('data:image/')) return;

    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = value;
  }, [value]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const finishDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const signature = canvasRef.current?.toDataURL('image/png') || '';
    setHasSignature(Boolean(signature));
    onChange(signature);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <span className="inline-flex items-center gap-1">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label="Zone de signature tactile"
        className="rounded border bg-white touch-none"
        style={{ borderColor: 'var(--color-border)', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        onPointerLeave={finishDrawing}
      />
      {hasSignature && <button type="button" className="text-[10px] text-muted print:hidden" onClick={clear}>Effacer</button>}
    </span>
  );
};

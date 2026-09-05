import React, { useEffect, useRef, useState } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { PlayerLine, casinoBorder, casinoCurrency, parseCasinoAmount, IDENTITY_VERIFICATION_THRESHOLD, IdentityVerificationData } from './types';
import { IdentityVerificationModal } from './IdentityVerificationModal';
import { identityVerificationApi } from '../../../services/casinoTablesJeu.service';
import type { CasinoRegisteredPlayer } from '../../../services/casinoTablesJeu.service';

interface PlayersSheetProps {
  date: string;
  players: PlayerLine[];
  registeredPlayers?: CasinoRegisteredPlayer[];
  cashingPaymentMethod?: string;
  restaurantPayments: { especes: boolean; tpe: boolean };
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onUpdate: (id: number, key: keyof PlayerLine, value: string) => void;
  onDateChange: (value: string) => void;
  onPaymentChange: (payment: 'especes' | 'tpe', checked: boolean) => void;
  onCashingPaymentMethodChange?: (value: string) => void;
  onSave: () => void;
  onAdd: (ficheId?: number, name?: string) => number;
  onDuplicate: (line: PlayerLine) => void;
  onGoToRegisteredPlayers: () => void;
  onRemove: (id: number) => void;
  onIdentityVerified?: (playerId: number, data: IdentityVerificationData, verificationId?: number) => void;
  showIdentityVerifications?: boolean;
  identityVerifications?: Record<number, { id?: number; full_name: string; id_type: string; id_number: string; issue_date: string; transaction_type: string; amount: number; verified_at: string }>;
  isAdmin?: boolean;
  canDeletePlayerLine?: boolean;
}

const paperInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-gray-400';
const darkInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-gray-400';
const sheetActionPrimary = 'action inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-amber-500/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50';
const sheetActionSecondary = 'action secondary inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-xs font-bold transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/60 hover:bg-amber-300/10 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50';
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

type ResultPayment = { option: string; amount: number };

const parseResultPayments = (value?: string): ResultPayment[] => {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    const payments = parsed.flatMap((entry) => {
      if (typeof entry === 'string') return [{ option: entry, amount: 0 }];
      if (entry && typeof entry.option === 'string') return [{ option: entry.option, amount: Number(entry.amount) || 0 }];
      return [];
    });
    return [...new Map(payments.map((payment) => [payment.option, payment])).values()];
  } catch {
    return [];
  }
};

const getPaymentAmount = (payments: ResultPayment[], result: number, option: string): number => {
  const selected = payments.filter((payment) => payment.option === option);
  if (!selected.length) return 0;
  return payments.length === 1 && selected[0].amount <= 0 ? Math.abs(result) : selected.reduce((sum, payment) => sum + payment.amount, 0);
};

const getPositiveCreditPaidAmount = (payments: ResultPayment[], result: number, availableCredit: number): number => {
  const creditPayment = payments.find((payment) => payment.option === 'Crédit payé');
  if (!creditPayment) return 0;
  return payments.length === 1 && creditPayment.amount <= 0
    ? Math.min(Math.abs(result), availableCredit)
    : Math.min(Math.abs(result), Math.max(0, creditPayment.amount));
};

export const PlayersSheet: React.FC<PlayersSheetProps> = ({ date, players, registeredPlayers = [], restaurantPayments, saveState = 'idle', onUpdate, onDateChange, onPaymentChange, onSave, onAdd, onDuplicate, onGoToRegisteredPlayers, onRemove, onIdentityVerified, showIdentityVerifications = true, identityVerifications = {}, isAdmin = false, canDeletePlayerLine = isAdmin }) => {
  const activePlayers = players.filter((player, index, lines) => Boolean(player.casinoPlayerId) && lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index);
  const [selectedPlayerId, setSelectedPlayerId] = useState(() => activePlayers[0] ? (activePlayers[0].ficheId ?? activePlayers[0].id) : 0);
  const [printingPlayerId, setPrintingPlayerId] = useState<number | null>(null);
  const [pendingBonus, setPendingBonus] = useState<string | null>(null);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [rouletteNumber, setRouletteNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [identityModal, setIdentityModal] = useState<{ open: boolean; amount: number }>({ open: false, amount: 0 });
  const [identityTransactionType, setIdentityTransactionType] = useState<'achat' | 'apport' | 'echange'>('achat');
  const [signatureError, setSignatureError] = useState('');
  const [signatureConfirmationOpen, setSignatureConfirmationOpen] = useState(false);
  const [confirmedSignatures, setConfirmedSignatures] = useState<string[]>([]);
  const [lineSignatureModal, setLineSignatureModal] = useState<{ id: number; name: string; value: string; field: 'signature' | 'finalSignature' } | null>(null);
  const selectedPlayer = activePlayers.find((player) => (player.ficheId ?? player.id) === selectedPlayerId);
  const selectedPlayerLines = players.filter((player) => (player.ficheId ?? player.id) === selectedPlayerId);
  const selectedPlayerTotal = selectedPlayerLines.reduce((sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
  const selectedPlayerCaveToVerify = selectedPlayerTotal;
  const selectedPlayerCashing = parseCasinoAmount(selectedPlayer?.cashing);
  const selectedPlayerResult = selectedPlayerCashing - selectedPlayerTotal;
  const selectedBonuses = parseBonuses(selectedPlayer?.bonuses);
  const selectedBonusResults = parseBonusResults(selectedPlayer?.bonusResults);
  const selectedIdentityVerification = identityVerifications[selectedPlayerId];
  const resultOptions = selectedPlayerResult > 0 ? positiveResultOptions : selectedPlayerResult < 0 ? negativeResultOptions : [];
  const selectedResultPayments = parseResultPayments(selectedPlayer?.resultPaymentOptions)
    .filter((payment) => resultOptions.includes(payment.option));
  const caveLinesToSign = selectedPlayerLines.filter((line) => line.caves.trim() || line.amount.trim());
  const ficheIdsToSign = selectedPlayer ? [selectedPlayerId] : [];
  const signatureConfirmationItems = [
    ...caveLinesToSign.map((line) => ({ key: `cave-${line.id}`, label: `Cave ${line.caves || '—'} × ${line.amount || '—'} — ${line.name || `Joueur ${line.ficheId ?? line.id}`}` })),
    ...(selectedBonuses.length ? [{ key: `bonus-${selectedPlayerId}`, label: `Signature bonus — ${selectedPlayer?.name || `Joueur ${selectedPlayerId}`}` }] : []),
    ...ficheIdsToSign.map((ficheId) => {
      const player = players.find((line) => (line.ficheId ?? line.id) === ficheId);
      return { key: `final-${ficheId}`, label: `Signature finale — ${player?.name || `Joueur ${ficheId}`}` };
    }),
  ];

  useEffect(() => {
    if (activePlayers.some((player) => (player.ficheId ?? player.id) === selectedPlayerId)) return;
    setSelectedPlayerId(activePlayers[0] ? (activePlayers[0].ficheId ?? activePlayers[0].id) : 0);
  }, [activePlayers, selectedPlayerId]);

  const saveWithResultCheck = () => {
    if (!selectedPlayer || selectedPlayerResult === 0) {
      setSignatureError('');
    } else if (selectedResultPayments.length === 1) {
      const payment = selectedResultPayments[0];
      if (payment.amount <= 0) {
        onUpdate(selectedPlayer.id, 'resultPaymentOptions', JSON.stringify([{ ...payment, amount: Math.abs(selectedPlayerResult) }]));
      }
    } else if (selectedResultPayments.length > 1) {
      if (selectedResultPayments.some((payment) => payment.amount <= 0)) {
        setSignatureError('Veuillez saisir un montant pour chaque mode de règlement.');
        return;
      }
      const allocatedTotal = selectedResultPayments.reduce((sum, payment) => sum + payment.amount, 0);
      if (allocatedTotal !== Math.abs(selectedPlayerResult)) {
        setSignatureError(`La somme des règlements doit être égale à ${casinoCurrency.format(Math.abs(selectedPlayerResult))} Ar.`);
        return;
      }
    }
    const unsignedCave = caveLinesToSign.find((line) => !line.signature);
    if (unsignedCave) {
      const ficheId = unsignedCave.ficheId ?? unsignedCave.id;
      setSelectedPlayerId(ficheId);
      setSignatureError(`La signature est obligatoire pour la cave du joueur ${unsignedCave.name || ficheId}.`);
      return;
    }
    const unsignedFinalSignature = ficheIdsToSign.find((ficheId) => !players.find((line) => (line.ficheId ?? line.id) === ficheId)?.finalSignature);
    if (unsignedFinalSignature !== undefined) {
      setSelectedPlayerId(unsignedFinalSignature);
      const player = players.find((line) => (line.ficheId ?? line.id) === unsignedFinalSignature);
      setSignatureError(`La signature finale est obligatoire pour ${player?.name || `le joueur ${unsignedFinalSignature}`}.`);
      return;
    }
    if (selectedBonuses.length && !selectedPlayer?.bonusSignature) {
      setSignatureError(`La signature bonus est obligatoire pour ${selectedPlayer?.name || 'ce joueur'}.`);
      return;
    }
    setSignatureError('');
    setConfirmedSignatures([]);
    setSignatureConfirmationOpen(true);
  };

  const confirmSignaturesAndSave = () => {
    if (confirmedSignatures.length !== signatureConfirmationItems.length) return;
    setSignatureConfirmationOpen(false);
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

  const addPlayerLine = () => {
    if (!selectedPlayer) return;
    onAdd(selectedPlayer.ficheId ?? selectedPlayer.id, selectedPlayer.name);
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

  const updateResultBalances = (nextPayments: ResultPayment[]) => {
    if (!selectedPlayer) return;
    const previousCreditPayment = selectedResultPayments.find((payment) => payment.option === 'Crédit payé');
    const previousDepositPaidPayment = selectedResultPayments.find((payment) => payment.option === 'Dépôt payé');
    const currentCredit = parseCasinoAmount(selectedPlayer.initialCredit);
    const currentDeposit = parseCasinoAmount(selectedPlayer.initialDeposit);
    const previousCreditPaidAmount = previousCreditPayment
      ? previousCreditPayment.amount > 0 ? previousCreditPayment.amount : Math.min(Math.abs(selectedPlayerResult), currentCredit)
      : 0;
    const previousDepositPaidAmount = previousDepositPaidPayment
      ? previousDepositPaidPayment.amount > 0 ? previousDepositPaidPayment.amount : Math.abs(selectedPlayerResult)
      : 0;
    const creditBase = currentCredit + previousCreditPaidAmount;
    const previousDepositRemainder = selectedPlayerResult > 0 && previousCreditPaidAmount >= creditBase
      ? Math.max(0, selectedPlayerResult - previousCreditPaidAmount)
      : 0;
    const depositBase = Math.max(0, currentDeposit + previousDepositPaidAmount - previousDepositRemainder);
    const nextCreditPaidAmount = getPositiveCreditPaidAmount(nextPayments, selectedPlayerResult, creditBase);
    const normalizedPayments = nextPayments.length === 1
      ? [{ ...nextPayments[0], amount: nextPayments[0].option === 'Crédit payé' ? nextCreditPaidAmount : Math.abs(selectedPlayerResult) }]
      : nextPayments;
    const hasCreditPayment = nextPayments.some((payment) => payment.option === 'Crédit payé');
    const hasDepositPayment = nextPayments.some((payment) => payment.option === 'Dépôt');
    const hasDepositPaidPayment = nextPayments.some((payment) => payment.option === 'Dépôt payé');

    onUpdate(selectedPlayer.id, 'resultPaymentOptions', JSON.stringify(normalizedPayments));

    if (!hasCreditPayment && !hasDepositPaidPayment) return;

    if (selectedPlayerResult > 0 && hasCreditPayment) {
      const creditRemaining = Math.max(0, creditBase - nextCreditPaidAmount);
      const depositRemainder = nextCreditPaidAmount >= creditBase
        ? Math.max(0, selectedPlayerResult - nextCreditPaidAmount)
        : 0;
      onUpdate(selectedPlayer.id, 'initialCredit', String(creditRemaining));
      onUpdate(selectedPlayer.id, 'initialDeposit', String(depositBase + depositRemainder));
      return;
    }

    if (selectedPlayerResult < 0 && hasDepositPaidPayment) {
      const depositPaidAmount = getPaymentAmount(nextPayments, selectedPlayerResult, 'Dépôt payé');
      onUpdate(selectedPlayer.id, 'initialCredit', String(creditBase));
      onUpdate(selectedPlayer.id, 'initialDeposit', String(Math.max(0, depositBase - depositPaidAmount)));
      return;
    }

    const nextDepositPaidAmount = getPaymentAmount(nextPayments, selectedPlayerResult, 'Dépôt');
    onUpdate(selectedPlayer.id, 'initialCredit', String(creditBase));
    onUpdate(selectedPlayer.id, 'initialDeposit', String(hasDepositPayment ? nextDepositPaidAmount : depositBase));
  };

  const toggleResultPaymentOption = (option: string, checked: boolean) => {
    if (!selectedPlayer) return;
    const nextPayments = checked
      ? [...selectedResultPayments.filter((payment) => payment.option !== option), { option, amount: 0 }]
      : selectedResultPayments.filter((payment) => payment.option !== option);
    onUpdate(selectedPlayer.id, 'resultPaymentOptions', JSON.stringify(nextPayments));
    updateResultBalances(nextPayments);
  };

  const updateResultPaymentAmount = (option: string, amount: string) => {
    if (!selectedPlayer) return;
    const nextPayments = selectedResultPayments.map((payment) => payment.option === option ? { ...payment, amount: parseCasinoAmount(amount) } : payment);
    onUpdate(selectedPlayer.id, 'resultPaymentOptions', JSON.stringify(nextPayments));
    updateResultBalances(nextPayments);
  };

  useEffect(() => {
    const hasBalancePayment = selectedResultPayments.some((payment) => payment.option === 'Dépôt payé' || payment.option === 'Crédit payé');
    if (selectedPlayer && hasBalancePayment) {
      updateResultBalances(selectedResultPayments);
    }
  }, [selectedPlayer?.id, selectedPlayerResult]);

  useEffect(() => {
    const cashingAmount = parseCasinoAmount(selectedPlayer?.cashing);
    const caveAmount = selectedPlayerCaveToVerify >= IDENTITY_VERIFICATION_THRESHOLD ? selectedPlayerCaveToVerify : 0;
    const verificationAmount = Math.max(caveAmount, cashingAmount);
    if (selectedPlayer && verificationAmount >= IDENTITY_VERIFICATION_THRESHOLD && !selectedPlayer.identityVerification && !identityVerifications[selectedPlayer.ficheId ?? selectedPlayer.id]) {
      setIdentityTransactionType(cashingAmount > caveAmount ? 'echange' : 'achat');
      setIdentityModal({ open: true, amount: verificationAmount });
    }
  }, [selectedPlayer?.id, selectedPlayer?.identityVerification, selectedPlayer?.cashing, selectedPlayerCaveToVerify, identityVerifications]);

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
    <div className="mb-4 flex flex-col items-stretch justify-between gap-3 rounded-2xl border p-3 shadow-sm sm:flex-row sm:items-center print:hidden" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <label htmlFor="player-to-print" className="font-semibold">Fiche joueur :</label>
        {!activePlayers.length ? (
          <select id="player-to-print" value={0} className="w-full rounded border bg-transparent px-2 py-1 text-white sm:w-auto" style={{ ...casinoBorder, color: '#fff', backgroundColor: 'var(--color-surface)' }} disabled>
            <option value={0} aria-label="Aucun joueur en jeu" />
          </select>
        ) : <>
        <select id="player-to-print" value={selectedPlayerId} onChange={(event) => setSelectedPlayerId(Number(event.target.value))} className="w-full rounded border bg-transparent px-2 py-1 text-white sm:w-auto" style={{ ...casinoBorder, color: '#fff', backgroundColor: 'var(--color-surface)' }} disabled={!players.length}>
          {activePlayers.map((player, index) => <option key={player.ficheId ?? player.id} value={player.ficheId ?? player.id} className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>Fiche {index + 1} — {player.name}</option>)}
        </select>
        </>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        {isAdmin && <button type="button" className={sheetActionSecondary} onClick={onGoToRegisteredPlayers}>Ajouter un joueur</button>}
        {isAdmin && <button type="button" className={sheetActionSecondary} onClick={addPlayerLine} disabled={!selectedPlayer}>Ajouter une ligne</button>}
        <button type="button" className={sheetActionSecondary} onClick={printPlayerSheet} disabled={!selectedPlayer}>Imprimer la fiche</button>
      </div>
    </div>
    <div className="-mx-2 overflow-x-auto px-2 pb-2 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[980px] table-fixed border-collapse border sm:min-w-[1080px] xl:min-w-[1180px]" style={casinoBorder}>
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
            {isAdmin && <th className="border p-2 text-center font-semibold print:hidden" style={casinoBorder}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {selectedPlayerLines.map((line) => {
            const isEmptyCaveLine = !line.caves.trim() && !line.amount.trim();

            return (
            <tr key={line.id} className="h-9">
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.name} onChange={(event) => onUpdate(line.id, 'name', event.target.value)} placeholder="Nom du joueur" disabled={!isAdmin} /></td>
              <td className="border" style={casinoBorder}><input type="time" className={paperInput} value={line.time} onChange={(event) => onUpdate(line.id, 'time', event.target.value)} disabled={!isAdmin} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.caves} onChange={(event) => onUpdate(line.id, 'caves', event.target.value)} disabled={!isAdmin} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={line.amount} onChange={(event) => onUpdate(line.id, 'amount', event.target.value)} disabled={!isAdmin} /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={totalsByLineId[line.id] ? String(totalsByLineId[line.id]) : '0'} readOnly /></td>
              <td className="border" style={casinoBorder}><input className={paperInput} value={isEmptyCaveLine ? '' : accumulatedByLineId[line.id] || '0'} readOnly /></td>
              <td className="border text-center" style={casinoBorder}><input type="radio" name={`payment-${line.id}`} checked={line.payment === 'Payé'} onChange={() => onUpdate(line.id, 'payment', 'Payé')} disabled={!isAdmin} /></td>
              <td className="border text-center" style={casinoBorder}><input type="radio" name={`payment-${line.id}`} checked={line.payment === 'Non payé'} onChange={() => onUpdate(line.id, 'payment', 'Non payé')} disabled={!isAdmin} /></td>
              <td className="border" style={casinoBorder}><select className={paperInput} value={line.paymentMethod || ''} onChange={(event) => onUpdate(line.id, 'paymentMethod', event.target.value)} style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }} disabled={!isAdmin}><option value="" className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>Sélectionner</option>{paymentMethods.map((method) => <option key={method} value={method} className="text-white" style={{ color: '#fff', backgroundColor: 'var(--color-surface)' }}>{method}</option>)}</select></td>
              <td className="border p-1" style={casinoBorder}>
                <button type="button" className="flex min-h-14 w-full items-center justify-center rounded border border-dashed px-1 text-[10px] text-yellow-200 transition hover:border-yellow-300 hover:bg-yellow-300/10 disabled:cursor-not-allowed disabled:opacity-60" style={casinoBorder} onClick={() => setLineSignatureModal({ id: line.id, name: line.name || `Joueur ${line.ficheId ?? line.id}`, value: line.signature || '', field: 'signature' })} disabled={!isAdmin} aria-label={`Signer pour ${line.name || 'ce joueur'}`}>
                  {line.signature ? <img src={line.signature} alt="Signature du joueur" className="max-h-12 max-w-full object-contain" /> : 'Cliquer pour signer'}
                </button>
              </td>
              {isAdmin && <td className="border p-1 text-center print:hidden" style={casinoBorder}>
                <div className="flex justify-center gap-1">
                  <button type="button" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-500/10 p-2 text-amber-200 transition hover:bg-amber-500/20 hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => onDuplicate(line)} title="Copier cette ligne" aria-label={`Copier la ligne de ${line.name || 'ce joueur'}`} disabled={isEmptyCaveLine}><Copy size={16} /></button>
                  {canDeletePlayerLine && <button type="button" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 p-2 text-red-300 transition hover:bg-red-500/20 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-400" onClick={() => window.confirm(`Supprimer la ligne de ${line.name || 'ce joueur'} ?`) && onRemove(line.id)} title="Supprimer la ligne" aria-label={`Supprimer la ligne de ${line.name || 'ce joueur'}`}><Trash2 size={16} /></button>}
                </div>
              </td>}
            </tr>
            );
          })}
          <tr className="h-12">
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={2}>HEURE DE DEPART : <input type="time" className={`${paperInput} inline-block w-28`} value={selectedPlayer?.departure || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'departure', event.target.value)} /></td>
            <td className="border p-2 font-semibold" style={casinoBorder} colSpan={3}>Cashing : <input type="text" inputMode="decimal" className={`${paperInput} inline-block w-32`} value={selectedPlayer?.cashing || ''} onChange={(event) => selectedPlayer && onUpdate(selectedPlayer.id, 'cashing', event.target.value)} placeholder="0" /></td>
            <td className="border p-2" style={casinoBorder} colSpan={isAdmin ? 6 : 5} />
          </tr>
        </tbody>
      </table>
    </div>

    <div className="mt-4 grid md:grid-cols-[1.15fr_1fr_1.15fr] border text-white" style={{ ...casinoBorder, backgroundColor: 'var(--color-surface)' }}>
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
                  <input type="checkbox" checked={selectedResultPayments.some((payment) => payment.option === option)} onChange={(event) => toggleResultPaymentOption(option, event.target.checked)} />
                  {option}
                  {selectedResultPayments.length > 1 && selectedResultPayments.some((payment) => payment.option === option) && <input type="text" inputMode="decimal" className="w-24 rounded border bg-transparent px-2 py-1" value={selectedResultPayments.find((payment) => payment.option === option)?.amount || ''} onChange={(event) => updateResultPaymentAmount(option, event.target.value)} placeholder="Montant" />}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 border-b p-3" style={casinoBorder}>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-yellow-200">SIGNATURE FINALE</p>
          {selectedPlayer && <button type="button" className="flex min-h-16 w-full items-center justify-center rounded border border-dashed bg-white px-2 text-[10px] text-slate-600 transition hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60" style={casinoBorder} onClick={() => setLineSignatureModal({ id: selectedPlayer.id, name: selectedPlayer.name || `Joueur ${selectedPlayer.ficheId ?? selectedPlayer.id}`, value: selectedPlayer.finalSignature || '', field: 'finalSignature' })} disabled={!isAdmin} aria-label={`Signer la fiche finale de ${selectedPlayer.name || 'ce joueur'}`}>
            {selectedPlayer.finalSignature ? <img src={selectedPlayer.finalSignature} alt="Signature finale du joueur" className="max-h-14 max-w-full object-contain" /> : 'Cliquer pour signer'}
          </button>}
        </div>
      </div>
      <div className="border-r" style={casinoBorder}>
        <p className="border-b p-2 font-semibold" style={casinoBorder}>BONUS</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 text-[11px]">
          {bonusCategories.map((bonus) => (
            <label key={bonus} className="inline-flex items-center gap-2">
              <input type="checkbox" checked={selectedBonuses.includes(bonus)} onChange={(event) => toggleBonus(bonus, event.target.checked)} />
              {bonus}
            </label>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t p-3" style={casinoBorder}>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-yellow-200">SIGNATURE BONUS</p>
          {selectedPlayer && <SignaturePad value={selectedPlayer.bonusSignature || ''} onChange={(value) => onUpdate(selectedPlayer.id, 'bonusSignature', value)} disabled={!isAdmin} />}
        </div>
      </div>
      <div>
        <p className="border-b p-2 font-semibold" style={casinoBorder}>RESTAURANT</p>
        <SheetBottomRow label="TOTAL OFFERT" />
        <SheetBottomRow label="TOTAL BON RESTAURANT" />
        <SheetBottomRow label="MONTANT PAYE" />
        <div className="flex items-center gap-4 border-b p-2" style={casinoBorder}>
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
      <div className="mt-4 rounded-xl border p-3 text-[11px] print:hidden" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}>
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
    <div className="mt-5 flex flex-col items-stretch gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-end print:hidden" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}>
      {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
      {(saveState === 'error' || signatureError) && <span className="text-xs text-red-400">{signatureError || 'Erreur d’enregistrement'}</span>}
      <button type="button" className={sheetActionPrimary} onClick={saveWithResultCheck} disabled={saveState === 'saving'}>
        {saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer la fiche'}
      </button>
    </div>
    {pendingBonus && <BonusRouletteModal bonus={pendingBonus} rotation={rouletteRotation} result={rouletteResult} number={rouletteNumber} isSpinning={isSpinning} onSpin={spinRoulette} onConfirm={confirmBonusResult} onClose={() => !isSpinning && setPendingBonus(null)} />}
    {signatureConfirmationOpen && <SignatureConfirmationModal items={signatureConfirmationItems} confirmedKeys={confirmedSignatures} onToggle={(key, checked) => setConfirmedSignatures((current) => checked ? [...current, key] : current.filter((item) => item !== key))} onClose={() => setSignatureConfirmationOpen(false)} onConfirm={confirmSignaturesAndSave} />}
    {lineSignatureModal && <LineSignatureModal playerName={lineSignatureModal.name} value={lineSignatureModal.value} onClose={() => setLineSignatureModal(null)} onValidate={(value) => { onUpdate(lineSignatureModal.id, lineSignatureModal.field, value); setLineSignatureModal(null); }} />}
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

const SignatureConfirmationModal: React.FC<{
  items: { key: string; label: string }[];
  confirmedKeys: string[];
  onToggle: (key: string, checked: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ items, confirmedKeys, onToggle, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="signature-confirmation-title">
    <div className="w-full max-w-xl rounded-2xl border p-5 text-white shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
      <h2 id="signature-confirmation-title" className="text-lg font-bold">Confirmation des signatures</h2>
      <p className="mt-2 text-sm text-muted">Le joueur doit confirmer que chaque signature ci-dessous est bien la sienne avant l’enregistrement de la fiche.</p>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {items.map((item) => <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm" style={casinoBorder}>
          <input type="checkbox" className="mt-0.5" checked={confirmedKeys.includes(item.key)} onChange={(event) => onToggle(item.key, event.target.checked)} />
          <span>Je confirme : {item.label}</span>
        </label>)}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="action secondary" onClick={onClose}>Annuler</button>
        <button type="button" className="action" onClick={onConfirm} disabled={confirmedKeys.length !== items.length}>Confirmer et enregistrer</button>
      </div>
    </div>
  </div>
);

const LineSignatureModal: React.FC<{ playerName: string; value: string; onClose: () => void; onValidate: (value: string) => void }> = ({ playerName, value, onClose, onValidate }) => {
  const [draftSignature, setDraftSignature] = useState(value);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="line-signature-title">
      <div className="w-full max-w-3xl rounded-2xl border p-5 text-white shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
        <h2 id="line-signature-title" className="text-lg font-bold">Signature du joueur</h2>
        <p className="mt-1 text-sm text-muted">{playerName}</p>
        <div className="mt-4 rounded-xl border bg-white p-2" style={casinoBorder}>
          <SignaturePad value={draftSignature} onChange={setDraftSignature} large />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="action secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="action" onClick={() => onValidate(draftSignature)} disabled={!draftSignature}>Valider la signature</button>
        </div>
      </div>
    </div>
  );
};

const SheetBottomRow: React.FC<{ label: string; value?: string }> = ({ label, value = '' }) => (
  <label className="grid grid-cols-[1.45fr_1fr] min-h-12 border-b last:border-b-0" style={casinoBorder}>
    <span className="p-2 flex items-center font-semibold text-[10px] leading-tight border-r" style={casinoBorder}>{label}</span>
    <input className={darkInput} value={value} readOnly />
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

const SignaturePad: React.FC<{ value?: string; onChange: (value: string) => void; compact?: boolean; large?: boolean; disabled?: boolean }> = ({ value = '', onChange, compact = false, large = false, disabled = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));
  const width = large ? 760 : compact ? 180 : 210;
  const height = large ? 260 : compact ? 58 : 56;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const signatureValue = value || '';
    setHasSignature(Boolean(signatureValue));
    if (!signatureValue.startsWith('data:image/')) return;

    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.src = signatureValue;
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
    if (disabled) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawingRef.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const finishDrawing = () => {
    if (disabled || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    const signature = canvasRef.current?.toDataURL('image/png') || '';
    setHasSignature(Boolean(signature));
    onChange(signature);
  };

  const clear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <span className={`relative flex w-full ${large ? 'max-w-none' : 'max-w-[250px]'} rounded-xl border p-1.5 shadow-inner transition ${hasSignature ? 'border-emerald-400/50 bg-emerald-500/5' : 'border-white/20 bg-black/10 hover:border-amber-300/70'}`} style={{ borderColor: hasSignature ? undefined : 'var(--color-border)' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        aria-label="Zone de signature tactile"
        className="h-auto w-full rounded-lg bg-white touch-none"
        style={{ touchAction: 'none', cursor: disabled ? 'not-allowed' : 'crosshair', opacity: disabled ? 0.65 : 1 }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={finishDrawing}
        onPointerCancel={finishDrawing}
        onPointerLeave={finishDrawing}
      />
      {!hasSignature && <span className="pointer-events-none absolute inset-x-3 bottom-2 text-center text-[9px] font-semibold tracking-[0.14em] text-slate-500">SIGNER ICI</span>}
      {hasSignature && !disabled && <button type="button" className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-500/90 text-white shadow-lg transition hover:scale-105 hover:bg-red-500 print:hidden" onClick={clear} title="Effacer la signature" aria-label="Effacer la signature"><Trash2 size={13} /></button>}
    </span>
  );
};

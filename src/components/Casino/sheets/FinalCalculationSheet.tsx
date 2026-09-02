import React, { useEffect, useRef, useState } from 'react';
import { casinoBorder, casinoCurrency, parseCasinoAmount } from './types';
import type { PlayerLine } from './types';

interface FinalCalculationSheetProps {
  players: PlayerLine[];
  selectedPlayerId: number;
  values: Record<string, string>;
  withdrawnTotal: number;
  depositResults: string;
  creditResults: string;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onPlayerChange: (id: number) => void;
  onUpdate: (key: string, value: string) => void;
  onPlayerUpdate?: (id: number, key: keyof PlayerLine, value: string) => void;
  onSave: () => void;
  isFinished?: boolean;
  isFinishing?: boolean;
  canFinish?: boolean;
  onFinish: () => void;
  showIdentityVerifications?: boolean;
  identityVerifications?: Record<number, { id?: number; full_name: string; id_type: string; id_number: string; issue_date: string; transaction_type: string; amount: number; verified_at: string }>;
}

export const FinalCalculationSheet: React.FC<FinalCalculationSheetProps> = ({ players, selectedPlayerId, values, withdrawnTotal, depositResults, creditResults, saveState = 'idle', onPlayerChange, onUpdate, onPlayerUpdate, onSave, isFinished = false, isFinishing = false, canFinish = false, onFinish, showIdentityVerifications = true, identityVerifications = {} }) => {
  const [paymentConfirmationOpen, setPaymentConfirmationOpen] = useState(false);
  const activePlayers = players.filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index);
  const selectedPlayer = activePlayers.find((player) => (player.ficheId ?? player.id) === selectedPlayerId);
  const identity = identityVerifications[selectedPlayerId];
  const bonusEntries = players
    .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
    .flatMap((player) => {
      const bonuses = parseBonuses(player.bonuses);
      const bonusAmounts = parseBonusResults(player.bonusResults);
      const playerId = player.ficheId ?? player.id;
      const formattedBonuses = bonuses.map((bonus) => `${bonus} : ${casinoCurrency.format(bonusAmounts[bonus] || 0)} Ar`);
      const total = bonuses.reduce((sum, bonus) => sum + (bonusAmounts[bonus] || 0), 0);
      return formattedBonuses.length ? [{ text: `${player.name || `Joueur ${playerId}`} : ${formattedBonuses.join(', ')}`, total }] : [];
    });
  const bonusTotal = bonusEntries.reduce((total, entry) => total + entry.total, 0);
  const bonusResults = bonusEntries.length
    ? `${bonusEntries.map((entry) => entry.text).join(' - ')} — TOTAL : ${casinoCurrency.format(bonusTotal)} Ar`
    : '';
  const mobileReturnResults = players
    .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
    .flatMap((player) => {
      const playerId = player.ficheId ?? player.id;
      const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
      const totalCaves = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
      const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
      const result = cashing - totalCaves;
      const mobileMethods = parsePaymentOptions(player.resultPaymentOptions).filter((payment) => payment.option === 'MVola' || payment.option === 'Orange Money');
      return result > 0 && mobileMethods.length
        ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(mobileMethods.reduce((sum, payment) => sum + (payment.amount || result), 0))} (${mobileMethods.map((payment) => payment.option).join(' / ')})`]
        : [];
    })
    .join('\n');
  const creditPaidResults = players
    .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
    .flatMap((player) => {
      const playerId = player.ficheId ?? player.id;
      const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
      const totalCaves = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
      const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
      const result = cashing - totalCaves;
      const creditPayments = parsePaymentOptions(player.resultPaymentOptions).filter((payment) => payment.option === 'Crédit payé');
      return result > 0 && creditPayments.length
        ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(creditPayments.reduce((sum, payment) => sum + (payment.amount || result), 0))}`]
        : [];
    })
    .join(' - ');
  const depositPaymentResults = buildPositivePaymentResults(players, 'Dépôt');
  const depositPaymentTotal = getPositivePaymentTotal(players, 'Dépôt');
  const mobileReturnTotal = getPositivePaymentTotal(players, 'MVola', 'Orange Money');
  const creditPaidTotal = getPositivePaymentTotal(players, 'Crédit payé');
  const tpeResults = buildNegativePaymentResults(players, 'TPE');
  const mobilePaymentResults = buildNegativePaymentResults(players, 'MVola', 'Orange Money');
  const depositPaidResults = buildNegativePaymentResults(players, 'Dépôt payé');
  const tpePaymentsTotal = getNegativePaymentTotal(players, 'TPE');
  const mobilePaymentsTotal = getNegativePaymentTotal(players, 'MVola', 'Orange Money');
  const depositPaidTotal = getNegativePaymentTotal(players, 'Dépôt payé');
  const creditPaymentsTotal = getNegativePaymentTotal(players, 'Crédit');
  const paidCaveTpeResults = buildPaidCavePaymentResults(players, ['TPE']);
  const paidCaveMobileResults = buildPaidCavePaymentResults(players, ['MVola', 'Orange Money']);
  const paidCaveCreditResults = buildPaidCavePaymentResults(players, ['Crédit', 'Credit']);
  const paidCaveOffertResults = buildPaidCavePaymentResults(players, ['Offert']);
  const paidCaveOtherResults = buildPaidCavePaymentResults(players, ['Euro', 'Dollar', 'Chèque', 'Cheque', 'Virement']);
  const paidCaveTpeTotal = getPaidCavePaymentTotal(players, ['TPE']);
  const paidCaveMobileTotal = getPaidCavePaymentTotal(players, ['MVola', 'Orange Money']);
  const paidCaveCreditTotal = getPaidCavePaymentTotal(players, ['Crédit', 'Credit']);
  const paidCaveOffertTotal = getPaidCavePaymentTotal(players, ['Offert']);
  const paidCaveOtherTotal = getPaidCavePaymentTotal(players, ['Euro', 'Dollar', 'Chèque', 'Cheque', 'Virement']);
  const tpeDisplay = [tpeResults, paidCaveTpeResults].filter(Boolean).join('\n');
  const mobileDisplay = [mobilePaymentResults, paidCaveMobileResults].filter(Boolean).join('\n');
  const creditDisplay = [creditResults, paidCaveCreditResults].filter(Boolean).join('\n');
  const offertDisplay = paidCaveOffertResults || values.offert;
  const automaticTotal1 = withdrawnTotal
    + parseCasinoAmount(values.pourboires)
    + parseCasinoAmount(values.autres)
    + parseCasinoAmount(values.autre)
    + parseCasinoAmount(values.restaurant)
    + parseCasinoAmount(values.prolongation)
    + depositPaymentTotal
    + mobileReturnTotal
    + creditPaidTotal;
  const automaticTotal2 = (tpeResults ? tpePaymentsTotal : parseCasinoAmount(values.tpe))
    + paidCaveTpeTotal
    + (mobilePaymentResults ? mobilePaymentsTotal : parseCasinoAmount(values.mobiles))
    + paidCaveMobileTotal
    + (bonusEntries.length ? bonusTotal : parseCasinoAmount(values.bonus))
    + (creditResults ? creditPaymentsTotal : parseCasinoAmount(values.credit))
    + paidCaveCreditTotal
    + (depositPaidResults ? depositPaidTotal : parseCasinoAmount(values.depotPaye))
    + parseCasinoAmount(values.offert)
    + paidCaveOffertTotal
    + paidCaveOtherTotal;
  const total1 = automaticTotal1;
  const total2 = automaticTotal2;
  const difference = Math.abs(total2 - total1);
  const totalEspeces = parseCasinoAmount(values.especes);
  const resultatFinal = difference - totalEspeces;

  return (
    <div className="text-sm text-primary">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold tracking-[0.18em]">CALCUL FINAL</p>
        <label className="flex items-center gap-2 text-xs font-semibold">Fiche joueur
          {!activePlayers.length ? (
            <select value={0} className="rounded border bg-transparent px-2 py-1 text-primary" style={casinoBorder} disabled>
              <option value={0} aria-label="Aucun joueur en jeu" />
            </select>
          ) : <>
          <select value={selectedPlayerId} onChange={(event) => onPlayerChange(Number(event.target.value))} className="rounded border bg-transparent px-2 py-1 text-primary" style={casinoBorder}>
            {activePlayers.map((player, index) => <option key={player.ficheId ?? player.id} value={player.ficheId ?? player.id}>Fiche {index + 1} — {player.name}</option>)}
          </select>
          </>}
        </label>
      </div>


      <div className="overflow-x-auto">
        <div className="min-w-[760px] border" style={casinoBorder}>
          <div className="grid grid-cols-[1.25fr_.85fr_1.25fr_.85fr]">
            <CalculationCell label="TOTAL PRELEVEMENTS" />
            <CalculationInput value={String(withdrawnTotal)} readOnly />
            <CalculationCell label="TOTAL TPE" separated />
            {tpeDisplay ? <CalculationResult value={tpeDisplay} /> : <CalculationInput value={values.tpe} onChange={(value) => onUpdate('tpe', value)} />}

            <CalculationCell label="TOTAL POURBOIRES" />
            <CalculationInput value={values.pourboires} onChange={(value) => onUpdate('pourboires', value)} />
            <BlankCell separated />
            <BlankCell />

            <CalculationCell label="TOTAL PROLONGATION" />
            <CalculationInput value={values.prolongation} onChange={(value) => onUpdate('prolongation', value)} />
            <CalculationCell label="TOTAL MOBILES" separated />
            {mobileDisplay ? <CalculationResult value={mobileDisplay} /> : <CalculationInput value={values.mobiles} onChange={(value) => onUpdate('mobiles', value)} />}

            <CalculationCell label="TOTAL RETRAIT AUTRES DEPARTEMENT" />
            <CalculationInput value={values.autres} onChange={(value) => onUpdate('autres', value)} />
            <CalculationCell label="TOTAL BONUS" separated />
            {bonusResults ? <CalculationResult value={bonusResults} /> : <CalculationInput value={values.bonus} onChange={(value) => onUpdate('bonus', value)} />}

            <CalculationCell label="TOTAL RESTAURANT PAYE" />
            <CalculationInput value={values.restaurant} onChange={(value) => onUpdate('restaurant', value)} />
            <CalculationCell label="TOTAL OFFERT" separated />
            {paidCaveOffertResults ? <CalculationResult value={offertDisplay} /> : <CalculationInput value={values.offert} onChange={(value) => onUpdate('offert', value)} />}

            <CalculationCell label="AUTRE" />
            <CalculationInput value={values.autre} onChange={(value) => onUpdate('autre', value)} />
            <CalculationCell label="CREDIT" separated />
            {creditDisplay ? (
              <CalculationResult value={creditDisplay} />
            ) : (
              <CalculationInput value={values.credit} onChange={(value) => onUpdate('credit', value)} />
            )}

            <CalculationCell label="DEPOT" />
            <CalculationResult value={depositPaymentResults || depositResults} />
            <CalculationCell label="DEPOT PAYE" separated />
            {depositPaidResults ? <CalculationResult value={depositPaidResults} /> : <CalculationInput value={values.depotPaye} onChange={(value) => onUpdate('depotPaye', value)} />}

            <CalculationCell label="RETOUR MOBILE" />
            <CalculationResult value={mobileReturnResults} />
            <BlankCell separated />
            <BlankCell separated />

            <CalculationCell label="CREDIT PAYE" />
            {creditPaidResults ? <CalculationResult value={creditPaidResults} /> : <CalculationInput value={values.creditPaye} onChange={(value) => onUpdate('creditPaye', value)} />}
            <BlankCell />
            <BlankCell />

            <BlankCell />
            <BlankCell />
            <CalculationCell label="AUTRES PAIEMENTS CAVES" separated />
            <CalculationResult value={paidCaveOtherResults} />

            <TotalCell label="TOTAL 1" />
            <CalculationInput value={casinoCurrency.format(total1)} onChange={(value) => onUpdate('total1', value)} />
            <TotalCell label="TOTAL 2" separated />
            <CalculationInput value={casinoCurrency.format(total2)} onChange={(value) => onUpdate('total2', value)} />
          </div>

          <div className="grid grid-cols-[1.35fr_.85fr_1.2fr] border-t" style={casinoBorder}>
            <div className="border-r" style={casinoBorder}>
              <BottomRow label="TOTAL 2 - TOTAL 1" value={casinoCurrency.format(difference)} readOnly />
              <BottomRow label="TOTAL ESPECES CAISSE" value={values.especes} onChange={(value) => onUpdate('especes', value)} />
              <BottomRow label="RESULTAT FINAL" value={casinoCurrency.format(resultatFinal)} readOnly />
            </div>
            <div className="border-r" style={casinoBorder}>
              <BlankBottomRow />
              <BlankBottomRow />
              <BlankBottomRow />
            </div>
            <label className="p-3 min-h-36 flex flex-col gap-2 text-xs font-semibold">
              Signature Responsable
              <TouchSignature value={values.signature || ''} onChange={(value) => onUpdate('signature', value)} />
            </label>
          </div>
        </div>
      </div>
      {showIdentityVerifications && identity && (
        <div className="mt-4 rounded-xl border p-3 text-[11px]" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}>
          <p className="mb-2 font-bold text-yellow-300">VÉRIFICATION D'IDENTITÉ — {identity.transaction_type.toUpperCase()}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-muted">Joueur :</span>
            <span className="font-semibold">{identity.full_name}</span>
            <span className="text-muted">Pièce d'identité :</span>
            <span className="font-semibold">{identity.id_type} n° {identity.id_number}</span>
            <span className="text-muted">Date d'émission :</span>
            <span className="font-semibold">{identity.issue_date}</span>
            <span className="text-muted">Montant :</span>
            <span className="font-semibold text-yellow-300">{casinoCurrency.format(identity.amount)} Ar</span>
            <span className="text-muted">Vérifié le :</span>
            <span className="font-semibold">{new Date(identity.verified_at).toLocaleString('fr-FR')}</span>
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-end gap-3 print:hidden">
        {isFinished && <span className="text-xs text-green-700">Jeu terminé</span>}
        {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
        {saveState === 'error' && <span className="text-xs text-red-700">Erreur d’enregistrement</span>}
        <button type="button" className="action" onClick={() => onSave()} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer le calcul'}</button>
        <button type="button" className="action secondary" onClick={() => setPaymentConfirmationOpen(true)} disabled={saveState === 'saving' || activePlayers.length === 0}>Paiement dépôt / crédit</button>
        {canFinish && <button type="button" className="action secondary" onClick={onFinish} disabled={isFinished || isFinishing || saveState === 'saving'}>{isFinishing ? 'Clôture...' : isFinished ? 'Jeu terminé' : 'Fin de jeu'}</button>}
      </div>
      {paymentConfirmationOpen && (activePlayers.length > 0 ? (
        <PlayerPaymentConfirmationModal
          players={activePlayers}
          onClose={() => setPaymentConfirmationOpen(false)}
          onConfirm={(entries) => {
            entries.forEach((entry) => {
              const player = players.find((item) => (item.ficheId ?? item.id) === entry.id);
              if (!player) return;
              const playerId = player.ficheId ?? player.id;
              const playerLines = players.filter((item) => (item.ficheId ?? item.id) === playerId);
              const totalCaves = playerLines.reduce((sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
              const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
              const loss = totalCaves - cashing;
              const depositWasAlreadyPaid = parsePaymentOptions(player.resultPaymentOptions).some((payment) => payment.option === 'Dépôt payé');
              const payments: Array<{ option: string; amount: number }> = [];
              if (entry.depositStatus === 'Payé') {
                const amount = parseCasinoAmount(entry.lossAmount || entry.depositAmount || String(entry.deposit));
                if (amount > 0) payments.push({ option: 'Dépôt payé', amount });
              }
              if (entry.creditStatus === 'Payé') {
                const amount = parseCasinoAmount(entry.creditAmount || String(entry.credit));
                if (amount > 0) payments.push({ option: 'Crédit payé', amount });
              }
              if (payments.length) {
                onPlayerUpdate?.(player.id, 'resultPaymentOptions', JSON.stringify(payments));
              }
              if (entry.depositStatus === 'Payé' && !depositWasAlreadyPaid && loss > 0) {
                const nextDeposit = Math.max(0, parseCasinoAmount(player.initialDeposit) - loss);
                onPlayerUpdate?.(player.id, 'initialDeposit', String(nextDeposit));
              }
            });
            setPaymentConfirmationOpen(false);
            onSave();
          }}
        />
      ) : (
        <EmptyPaymentPlayersModal onClose={() => setPaymentConfirmationOpen(false)} />
      ))}
    </div>
  );
};

const CalculationCell: React.FC<{ label: string; separated?: boolean }> = ({ label, separated = false }) => (
  <div className={`min-h-20 border-r border-b p-3 flex items-center font-semibold text-[11px] leading-tight${separated ? ' border-l-4' : ''}`} style={casinoBorder}>{label}</div>
);

const CalculationInput: React.FC<{ value?: string; onChange?: (value: string) => void; readOnly?: boolean; inputMode?: 'decimal' | 'text' }> = ({ value = '', onChange, readOnly = false, inputMode = 'decimal' }) => (
  <input className="min-h-20 w-full min-w-0 border-r border-b bg-transparent px-3 text-base text-primary outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)]" style={casinoBorder} inputMode={inputMode} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} />
);

const CalculationResult: React.FC<{ value: string }> = ({ value }) => (
  <div className="min-h-20 border-r border-b px-3 py-2" style={casinoBorder}>
    <div className="whitespace-pre-wrap text-sm font-semibold text-primary">{value || '—'}</div>
  </div>
);

const EmptyPaymentPlayersModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="payment-confirmation-title">
    <div className="w-full max-w-md rounded-2xl border p-5 shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
      <h2 id="payment-confirmation-title" className="text-lg font-bold text-primary">Validation du paiement</h2>
      <p className="mt-3 text-sm text-muted">Aucun joueur n’est inscrit dans cette partie pour le moment.</p>
      <div className="mt-5 flex justify-end">
        <button type="button" className="action secondary" onClick={onClose}>Fermer</button>
      </div>
    </div>
  </div>
);

const PlayerPaymentConfirmationModal: React.FC<{
  players: PlayerLine[];
  onClose: () => void;
  onConfirm: (entries: Array<{
    id: number;
    name: string;
    deposit: number;
    credit: number;
    depositStatus: string;
    creditStatus: string;
    depositAmount: string;
    creditAmount: string;
    lossAmount: string;
    depositMethod: string;
    creditMethod: string;
  }>) => void;
}> = ({ players, onClose, onConfirm }) => {
  const [playerStates, setPlayerStates] = useState(() => players.map((player) => ({
    id: player.ficheId ?? player.id,
    name: player.name || `Joueur ${player.ficheId ?? player.id}`,
    deposit: parseCasinoAmount(player.initialDeposit),
    credit: parseCasinoAmount(player.initialCredit),
    depositStatus: '',
    creditStatus: '',
    depositAmount: '',
    creditAmount: '',
    lossAmount: '',
    depositMethod: 'Espèces',
    creditMethod: 'Crédit',
  })));

  useEffect(() => {
    setPlayerStates(players.map((player) => ({
      id: player.ficheId ?? player.id,
      name: player.name || `Joueur ${player.ficheId ?? player.id}`,
      deposit: parseCasinoAmount(player.initialDeposit),
      credit: parseCasinoAmount(player.initialCredit),
      depositStatus: '',
      creditStatus: '',
      depositAmount: '',
      creditAmount: '',
      lossAmount: '',
      depositMethod: 'Espèces',
      creditMethod: 'Crédit',
    })));
  }, [players]);

  const updateEntry = (playerId: number, field: 'depositStatus' | 'creditStatus' | 'depositAmount' | 'creditAmount' | 'lossAmount' | 'depositMethod' | 'creditMethod', value: string) => {
    setPlayerStates((current) => current.map((entry) => entry.id === playerId ? { ...entry, [field]: value } : entry));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:hidden" role="dialog" aria-modal="true" aria-labelledby="payment-confirmation-title">
      <div className="w-full max-w-5xl rounded-2xl border p-5 shadow-2xl" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="payment-confirmation-title" className="text-lg font-bold text-primary">Validation du paiement</h2>
            <p className="mt-1 text-sm text-muted">Liste des joueurs actifs pour le dépôt et le crédit.</p>
          </div>
          <button type="button" className="action secondary" onClick={onClose}>Fermer</button>
        </div>

        <div className="mt-5 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          {playerStates.map((entry) => (
            <div key={entry.id} className="rounded-xl border p-3" style={casinoBorder}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-primary">{entry.name}</p>
                <span className="rounded-full border border-yellow-400/40 bg-yellow-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-yellow-300">Joueur actif</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <PaymentStatusRow
                  label="Dépôt de la partie"
                  amount={entry.deposit}
                  status={entry.depositStatus}
                  amountValue={entry.depositAmount}
                  extraAmountValue={entry.lossAmount}
                  paymentMethod={entry.depositMethod}
                  showExtraAmount={entry.deposit > 0}
                  extraAmountLabel="Montant perdu"
                  onStatusChange={(status) => updateEntry(entry.id, 'depositStatus', status)}
                  onAmountChange={(value) => updateEntry(entry.id, 'depositAmount', value)}
                  onExtraAmountChange={(value) => updateEntry(entry.id, 'lossAmount', value)}
                  onMethodChange={(value) => updateEntry(entry.id, 'depositMethod', value)}
                />
                <PaymentStatusRow
                  label="Crédit de la partie"
                  amount={entry.credit}
                  status={entry.creditStatus}
                  amountValue={entry.creditAmount}
                  paymentMethod={entry.creditMethod}
                  onStatusChange={(status) => updateEntry(entry.id, 'creditStatus', status)}
                  onAmountChange={(value) => updateEntry(entry.id, 'creditAmount', value)}
                  onMethodChange={(value) => updateEntry(entry.id, 'creditMethod', value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="action secondary" onClick={onClose}>Annuler</button>
          <button type="button" className="action" onClick={() => onConfirm(playerStates)}>Enregistrer le calcul</button>
        </div>
      </div>
    </div>
  );
};

const PaymentStatusRow: React.FC<{
  label: string;
  amount: number;
  status: string;
  amountValue: string;
  extraAmountValue?: string;
  paymentMethod: string;
  showExtraAmount?: boolean;
  extraAmountLabel?: string;
  onStatusChange: (status: 'Payé' | 'Non payé') => void;
  onAmountChange: (amount: string) => void;
  onExtraAmountChange?: (amount: string) => void;
  onMethodChange: (method: string) => void;
}> = ({ label, amount, status, amountValue, extraAmountValue = '', paymentMethod, showExtraAmount = false, extraAmountLabel = 'Montant additionnel', onStatusChange, onAmountChange, onExtraAmountChange, onMethodChange }) => {
  const displayedAmount = Number.parseFloat(amountValue || '0') || amount;

  return (
    <div className="rounded-xl border p-3" style={casinoBorder}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-primary">{label}</p>
          <p className="mt-1 text-sm font-bold text-yellow-300">{casinoCurrency.format(amount)} Ar</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${status === 'Payé' ? 'border-green-400 bg-green-500/20 text-green-300' : 'text-primary'}`} style={casinoBorder} onClick={() => onStatusChange('Payé')}>Payé</button>
          <button type="button" className={`rounded-lg border px-3 py-2 text-xs font-semibold ${status === 'Non payé' ? 'border-red-400 bg-red-500/20 text-red-300' : 'text-primary'}`} style={casinoBorder} onClick={() => onStatusChange('Non payé')}>Non payé</button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Mode de paiement
          <select
            value={paymentMethod}
            onChange={(event) => onMethodChange(event.target.value)}
            className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm text-primary outline-none"
            style={casinoBorder}
          >
            <option value="Espèces">Espèces</option>
            <option value="TPE">TPE</option>
            <option value="Orange Money">Orange Money</option>
            <option value="MVola">MVola</option>
            <option value="Virement">Virement</option>
            <option value="Crédit">Crédit</option>
            <option value="Autre">Autre</option>
          </select>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Montant manuel
          <input
            type="text"
            inputMode="decimal"
            value={amountValue}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm text-primary outline-none placeholder:text-muted"
            style={casinoBorder}
          />
        </label>
      </div>

      {showExtraAmount && onExtraAmountChange && (
        <div className="mt-3">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            {extraAmountLabel}
            <input
              type="text"
              inputMode="decimal"
              value={extraAmountValue}
              onChange={(event) => onExtraAmountChange(event.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-sm text-primary outline-none placeholder:text-muted"
              style={casinoBorder}
            />
          </label>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-2 py-2 text-[11px] text-yellow-200">
        <span className="font-semibold">Montant + mode :</span> {casinoCurrency.format(displayedAmount)} Ar — {paymentMethod}
      </div>
    </div>
  );
};

const parseBonuses = (value?: string): string[] => {
  try {
    const bonuses = JSON.parse(value || '[]');
    return Array.isArray(bonuses) ? bonuses.filter((bonus): bonus is string => typeof bonus === 'string') : [];
  } catch {
    return [];
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

const parsePaymentOptions = (value?: string): Array<{ option: string; amount: number }> => {
  try {
    const options = JSON.parse(value || '[]');
    return Array.isArray(options) ? options.flatMap((option) => {
      if (typeof option === 'string') return [{ option, amount: 0 }];
      return option && typeof option.option === 'string' ? [{ option: option.option, amount: Number(option.amount) || 0 }] : [];
    }) : [];
  } catch {
    return [];
  }
};

const isPaidCave = (payment?: string) => {
  const normalized = String(payment || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  // Accepte aussi les anciennes fiches enregistrées avec « PayÃ© ».
  return normalized.startsWith('pay') && !normalized.includes('non');
};

const getPaidCavePaymentTotal = (players: PlayerLine[], methods?: string[]): number => players.reduce(
  (total, line) => isPaidCave(line.payment) && line.paymentMethod.trim() && (!methods || methods.includes(line.paymentMethod.trim()))
    ? total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount)
    : total,
  0,
);

const buildPaidCavePaymentResults = (players: PlayerLine[], methods?: string[]): string => {
  const payments: Array<{ name: string; amount: number; method: string }> = [];
  players.forEach((line) => {
    const amount = parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount);
    const method = line.paymentMethod.trim();
    if (!isPaidCave(line.payment) || !method || amount <= 0 || (methods && !methods.includes(method))) return;
    payments.push({ name: line.name || `Joueur ${line.ficheId ?? line.id}`, amount, method });
  });
  return payments
    .map(({ name, amount, method }) => `${name} : ${casinoCurrency.format(amount)} Ar (${method})`)
    .join('\n');
};

const buildNegativePaymentResults = (players: PlayerLine[], ...methods: string[]): string => players
  .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
  .flatMap((player) => {
    const playerId = player.ficheId ?? player.id;
    const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
    const totalCaves = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
    const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
    const result = cashing - totalCaves;
    const selectedMethods = parsePaymentOptions(player.resultPaymentOptions).filter((payment) => methods.includes(payment.option));
    const amount = selectedMethods.some((payment) => payment.amount > 0)
      ? selectedMethods.reduce((sum, payment) => sum + payment.amount, 0)
      : Math.abs(result);
    return result < 0 && selectedMethods.length
      ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(amount)} (${selectedMethods.map((payment) => payment.option).join(' / ')})`]
      : [];
  })
  .join('\n');

const getNegativePaymentTotal = (players: PlayerLine[], ...methods: string[]): number => players
  .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
  .reduce((total, player) => {
    const playerId = player.ficheId ?? player.id;
    const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
    const totalCaves = playerLines.reduce((sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
    const result = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing) - totalCaves;
    const payments = parsePaymentOptions(player.resultPaymentOptions).filter((payment) => methods.includes(payment.option));
    const hasAdvancedDepositLoss = methods.includes('Dépôt payé') && result < 0 && parseCasinoAmount(player.initialDeposit) > 0;
    const amount = payments.some((payment) => payment.amount > 0)
      ? payments.reduce((sum, payment) => sum + payment.amount, 0)
      : hasAdvancedDepositLoss
        ? Math.min(Math.abs(result), parseCasinoAmount(player.initialDeposit))
        : Math.abs(result);
    return result < 0 && (payments.length || hasAdvancedDepositLoss) ? total + amount : total;
  }, 0);

const getPositivePaymentTotal = (players: PlayerLine[], ...methods: string[]): number => players
  .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
  .reduce((total, player) => {
    const playerId = player.ficheId ?? player.id;
    const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
    const totalCaves = playerLines.reduce((sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
    const result = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing) - totalCaves;
    const payments = parsePaymentOptions(player.resultPaymentOptions).filter((payment) => methods.includes(payment.option));
    return result > 0 && payments.length ? total + payments.reduce((sum, payment) => sum + (payment.amount || result), 0) : total;
  }, 0);

const buildPositivePaymentResults = (players: PlayerLine[], ...methods: string[]): string => players
  .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
  .flatMap((player) => {
    const playerId = player.ficheId ?? player.id;
    const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
    const totalCaves = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
    const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
    const result = cashing - totalCaves;
    const payments = parsePaymentOptions(player.resultPaymentOptions).filter((payment) => methods.includes(payment.option));
    return result > 0 && payments.length
      ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(payments.reduce((sum, payment) => sum + (payment.amount || result), 0))} (${payments.map((payment) => payment.option).join(' / ')})`]
      : [];
  })
  .join(' - ');

const BlankCell: React.FC<{ separated?: boolean }> = ({ separated = false }) => <div className={`min-h-20 border-r border-b${separated ? ' border-l-4' : ''}`} style={casinoBorder} />;
const TotalCell: React.FC<{ label: string; separated?: boolean }> = ({ label, separated = false }) => <div className={`min-h-14 border-r p-2 flex items-center justify-center font-bold text-[11px]${separated ? ' border-l-4' : ''}`} style={casinoBorder}>{label}</div>;
const BottomRow: React.FC<{ label: string; value?: string; onChange?: (value: string) => void; readOnly?: boolean }> = ({ label, value = '', onChange, readOnly = false }) => <label className="grid grid-cols-[1fr_.85fr] min-h-12 border-b last:border-b-0" style={casinoBorder}><span className="px-2 py-2 font-semibold text-center border-r flex items-center justify-center text-[10px] leading-tight" style={casinoBorder}>{label}</span><input className="w-full min-w-0 bg-transparent px-2 text-sm text-primary outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)]" inputMode="decimal" value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} /></label>;
const BlankBottomRow: React.FC = () => <div className="min-h-12 border-b last:border-b-0" style={casinoBorder} />;

const TouchSignature: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(Boolean(value));

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

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * (event.currentTarget.width / bounds.width), y: (event.clientY - bounds.top) * (event.currentTarget.height / bounds.height) };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const point = getPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    drawingRef.current = true;
  };
  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };
  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const nextValue = canvasRef.current?.toDataURL('image/png') || '';
    setHasSignature(Boolean(nextValue));
    onChange(nextValue);
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return <div className="flex flex-1 items-start gap-2"><canvas ref={canvasRef} width={280} height={96} aria-label="Signature tactile responsable" className="min-h-20 flex-1 rounded border bg-white touch-none" style={{ borderColor: 'var(--color-border)', touchAction: 'none', cursor: 'crosshair' }} onPointerDown={start} onPointerMove={draw} onPointerUp={finish} onPointerCancel={finish} onPointerLeave={finish} />{hasSignature && <button type="button" className="text-[10px] text-muted print:hidden" onClick={clear}>Effacer</button>}</div>;
};

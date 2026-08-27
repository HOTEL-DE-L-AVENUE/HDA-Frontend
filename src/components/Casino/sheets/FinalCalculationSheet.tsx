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
  onSave: () => void;
  showIdentityVerifications?: boolean;
  identityVerifications?: Record<number, { id?: number; full_name: string; id_type: string; id_number: string; issue_date: string; transaction_type: string; amount: number; verified_at: string }>;
}

export const FinalCalculationSheet: React.FC<FinalCalculationSheetProps> = ({ players, selectedPlayerId, values, withdrawnTotal, depositResults, creditResults, saveState = 'idle', onPlayerChange, onUpdate, onSave, showIdentityVerifications = true, identityVerifications = {} }) => {
  const selectedPlayer = players.find((player) => (player.ficheId ?? player.id) === selectedPlayerId);
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
      const mobileMethods = parsePaymentOptions(player.resultPaymentOptions).filter((option) => option === 'MVola' || option === 'Orange Money');
      return result > 0 && mobileMethods.length
        ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(result)} (${mobileMethods.join(' / ')})`]
        : [];
    })
    .join(' - ');
  const creditPaidResults = players
    .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
    .flatMap((player) => {
      const playerId = player.ficheId ?? player.id;
      const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
      const totalCaves = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
      const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
      const result = cashing - totalCaves;
      return result > 0 && parsePaymentOptions(player.resultPaymentOptions).includes('Crédit payé')
        ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(result)}`]
        : [];
    })
    .join(' - ');
  const tpeResults = buildNegativePaymentResults(players, 'TPE');
  const mobilePaymentResults = buildNegativePaymentResults(players, 'MVola', 'Orange Money');
  const depositPaidResults = buildNegativePaymentResults(players, 'Dépôt payé');
  const tpePaymentsTotal = getNegativePaymentTotal(players, 'TPE');
  const mobilePaymentsTotal = getNegativePaymentTotal(players, 'MVola', 'Orange Money');
  const depositPaidTotal = getNegativePaymentTotal(players, 'Dépôt payé');
  const creditPaymentsTotal = getNegativePaymentTotal(players, 'Crédit');
  const playerPaymentsTotal = players
    .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
    .reduce((total, player) => {
      const playerId = player.ficheId ?? player.id;
      const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
      const totalCaves = playerLines.reduce((sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
      const result = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing) - totalCaves;
      const paymentOption = parsePaymentOptions(player.resultPaymentOptions)[0];
      return result > 0 && ['Dépôt', 'Crédit payé', 'MVola', 'Orange Money'].includes(paymentOption) ? total + result : total;
    }, 0);
  const total1 = withdrawnTotal
    + parseCasinoAmount(values.pourboires)
    + parseCasinoAmount(values.autres)
    + parseCasinoAmount(values.autre)
    + parseCasinoAmount(values.restaurant)
    + parseCasinoAmount(values.prolongation)
    + playerPaymentsTotal
    + (creditPaidResults ? 0 : parseCasinoAmount(values.creditPaye));
  const total2 = (tpeResults ? tpePaymentsTotal : parseCasinoAmount(values.tpe))
    + (mobilePaymentResults ? mobilePaymentsTotal : parseCasinoAmount(values.mobiles))
    + (bonusEntries.length ? bonusTotal : parseCasinoAmount(values.bonus))
    + (creditResults ? creditPaymentsTotal : parseCasinoAmount(values.credit))
    + (depositPaidResults ? depositPaidTotal : parseCasinoAmount(values.depotPaye))
    + parseCasinoAmount(values.offert);
  const difference = Math.abs(total2 - total1);
  const resultatFinal = difference - parseCasinoAmount(values.especes);

  return (
    <div className="text-sm text-primary">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold tracking-[0.18em]">CALCUL FINAL</p>
        <label className="flex items-center gap-2 text-xs font-semibold">Fiche joueur
          <select value={selectedPlayerId} onChange={(event) => onPlayerChange(Number(event.target.value))} className="rounded border bg-transparent px-2 py-1 text-primary" style={casinoBorder}>
            {players.filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index).map((player) => <option key={player.ficheId ?? player.id} value={player.ficheId ?? player.id}>{player.name || `Joueur ${player.ficheId ?? player.id}`}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px] border" style={casinoBorder}>
          <div className="grid grid-cols-[1.25fr_.85fr_1.25fr_.85fr]">
            <CalculationCell label="TOTAL PRELEVEMENTS" />
            <CalculationInput value={String(withdrawnTotal)} readOnly />
            <CalculationCell label="TOTAL TPE" separated />
            {tpeResults ? <CalculationResult value={tpeResults} /> : <CalculationInput value={values.tpe} onChange={(value) => onUpdate('tpe', value)} />}

            <CalculationCell label="TOTAL POURBOIRES" />
            <CalculationInput value={values.pourboires} onChange={(value) => onUpdate('pourboires', value)} />
            <BlankCell separated />
            <BlankCell />

            <CalculationCell label="TOTAL PROLONGATION" />
            <CalculationInput value={values.prolongation} onChange={(value) => onUpdate('prolongation', value)} />
            <CalculationCell label="TOTAL MOBILES" separated />
            {mobilePaymentResults ? <CalculationResult value={mobilePaymentResults} /> : <CalculationInput value={values.mobiles} onChange={(value) => onUpdate('mobiles', value)} />}

            <CalculationCell label="TOTAL RETRAIT AUTRES DEPARTEMENT" />
            <CalculationInput value={values.autres} onChange={(value) => onUpdate('autres', value)} />
            <CalculationCell label="TOTAL BONUS" separated />
            {bonusResults ? <CalculationResult value={bonusResults} /> : <CalculationInput value={values.bonus} onChange={(value) => onUpdate('bonus', value)} />}

            <CalculationCell label="TOTAL RESTAURANT PAYE" />
            <CalculationInput value={values.restaurant} onChange={(value) => onUpdate('restaurant', value)} />
            <CalculationCell label="TOTAL OFFERT" separated />
            <CalculationInput value={values.offert} onChange={(value) => onUpdate('offert', value)} />

            <CalculationCell label="AUTRE" />
            <CalculationInput value={values.autre} onChange={(value) => onUpdate('autre', value)} />
            <CalculationCell label="CREDIT" separated />
            {creditResults ? (
              <CalculationResult value={creditResults} />
            ) : (
              <CalculationInput value={values.credit} onChange={(value) => onUpdate('credit', value)} />
            )}

            <CalculationCell label="DEPOT" />
            <CalculationResult value={depositResults} />
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

            <TotalCell label="TOTAL 1" />
            <CalculationInput value={casinoCurrency.format(total1)} readOnly />
            <TotalCell label="TOTAL 2" separated />
            <CalculationInput value={casinoCurrency.format(total2)} readOnly />
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
        {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
        {saveState === 'error' && <span className="text-xs text-red-700">Erreur d’enregistrement</span>}
        <button type="button" className="action" onClick={onSave} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer le calcul'}</button>
      </div>
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
  <div className="min-h-20 border-r border-b flex items-center px-3 text-sm font-semibold whitespace-pre-wrap" style={casinoBorder}>{value}</div>
);

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

const parsePaymentOptions = (value?: string): string[] => {
  try {
    const options = JSON.parse(value || '[]');
    return Array.isArray(options) ? options.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

const buildNegativePaymentResults = (players: PlayerLine[], ...methods: string[]): string => players
  .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
  .flatMap((player) => {
    const playerId = player.ficheId ?? player.id;
    const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
    const totalCaves = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
    const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
    const result = cashing - totalCaves;
    const selectedMethods = parsePaymentOptions(player.resultPaymentOptions).filter((option) => methods.includes(option));
    return result < 0 && selectedMethods.length
      ? [`${player.name || `Joueur ${playerId}`} : ${casinoCurrency.format(Math.abs(result))} (${selectedMethods.join(' / ')})`]
      : [];
  })
  .join(' - ');

const getNegativePaymentTotal = (players: PlayerLine[], ...methods: string[]): number => players
  .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
  .reduce((total, player) => {
    const playerId = player.ficheId ?? player.id;
    const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
    const totalCaves = playerLines.reduce((sum, line) => sum + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
    const result = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing) - totalCaves;
    const paymentOption = parsePaymentOptions(player.resultPaymentOptions)[0];
    return result < 0 && methods.includes(paymentOption) ? total + Math.abs(result) : total;
  }, 0);

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

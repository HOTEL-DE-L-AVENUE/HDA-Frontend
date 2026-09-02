import React, { useState, useEffect } from 'react';
import { ChipLine, PlayerLine, RackCheck, casinoBorder, casinoCurrency, casinoInput, IDENTITY_VERIFICATION_THRESHOLD, IdentityVerificationData, parseCasinoAmount } from './types';
import { IdentityVerificationModal } from './IdentityVerificationModal';
import { identityVerificationApi } from '../../../services/casinoTablesJeu.service';

interface ChipsSheetProps {
  chips: ChipLine[];
  rackChecks: RackCheck[];
  players: PlayerLine[];
  endGameTime: string;
  openingTotal: number;
  closingTotal: number;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onUpdate: (value: number, key: keyof Omit<ChipLine, 'value'>, content: string) => void;
  onEndGameTimeChange: (value: string) => void;
  onSave: () => void;
  onRackChecksChange: (checks: RackCheck[]) => void;
}

export const ChipsSheet: React.FC<ChipsSheetProps> = ({ chips, players, rackChecks, endGameTime, openingTotal, closingTotal, saveState = 'idle', onUpdate, onEndGameTimeChange, onSave, onRackChecksChange }) => {
  const [identityModal, setIdentityModal] = useState<{ open: boolean; amount: number }>({ open: false, amount: 0 });
  const withdrawnTotal = chips.reduce((sum, line) => sum + line.value * parseCasinoAmount(line.withdrawn), 0);
  const playersWithStartTime = players.filter((player) => Boolean(player.name.trim() || player.caves.trim() || player.amount.trim()) && Boolean(player.time || player.arrival));
  const firstPlayer = getEarliestPlayer(playersWithStartTime) || getEarliestPlayer(players);
  const firstArrival = firstPlayer?.time || firstPlayer?.arrival || '';

  useEffect(() => {
    if (withdrawnTotal >= IDENTITY_VERIFICATION_THRESHOLD && firstPlayer) {
      setIdentityModal({ open: true, amount: withdrawnTotal });
    }
  }, [withdrawnTotal, firstPlayer]);

  const saveExchangeVerification = async (data: IdentityVerificationData) => {
    if (!firstPlayer) return;
    try {
      await identityVerificationApi.create({
        fiche_id: firstPlayer.ficheId ?? firstPlayer.id,
        full_name: data.fullName,
        id_type: data.idType,
        id_number: data.idNumber,
        issue_date: data.issueDate,
        transaction_type: data.transactionType.toUpperCase() as 'ACHAT' | 'APPORT' | 'ECHANGE',
        amount: data.amount,
      });
      setIdentityModal({ open: false, amount: 0 });
    } catch (error) {
      const apiError = error as { response?: { data?: { error?: { message?: string } | string } } };
      const responseError = apiError.response?.data?.error;
      alert(typeof responseError === 'string' ? responseError : responseError?.message || 'Erreur lors de l’enregistrement de la vérification.');
    }
  };

  return (
  <div className="flex flex-col gap-7">
    <section><SheetTitle title="Fiche Poker Night — jetons" subtitle="Comptage de départ et de fermeture." /><ChipTable chips={chips} onUpdate={onUpdate} fields={['previous', 'opening', 'closing']} headers={['Valeur des jetons', 'Total de la veille', 'Valeur départ', 'Total fermeture']} /><div className="grid gap-2 mt-3 sm:grid-cols-2"><Stat label="VALEUR DÉPART" value={openingTotal} />
    <Stat label="VALEUR FERMETURE" value={closingTotal} /></div></section>
    <section><SheetTitle title="Total des prélèvements" subtitle="Nombre de jetons prélevés pour chaque valeur." /><ChipTable chips={chips} onUpdate={onUpdate} fields={['withdrawn']} headers={['Valeur des jetons', 'Nombre de jetons', 'Valeur totale']} /></section>
    <RackCheckSection checks={rackChecks} onChange={onRackChecksChange} />
    <section>
      <SheetTitle title="Horaires de la session" subtitle="L'heure du premier joueur est automatique; l'heure de fin de jeu est à saisir." />
      <SessionTimeTable firstArrival={firstArrival} endGameTime={endGameTime} withdrawnTotal={withdrawnTotal} onEndGameTimeChange={onEndGameTimeChange} />
    </section>
    <div className="grid gap-2 sm:grid-cols-2">
      <Stat label="RESULTAT DES PRELEVEMENTS" value={withdrawnTotal} />
      <label className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}>
        <span className="block text-muted text-[11px]">JOUEURS</span>   
        <input className={casinoInput} value={players.filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index).map((player) => player.name.trim()).filter(Boolean).join(' - ')} readOnly placeholder="Nom - Nom" />
      </label>
    </div>
    <div className="flex items-center justify-end gap-3 print:hidden">
      {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
      {saveState === 'error' && <span className="text-xs text-red-700">Erreur d’enregistrement</span>}
      <button type="button" className="action" onClick={() => onSave()} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer les jetons'}</button>
    </div>
    <IdentityVerificationModal
      open={identityModal.open}
      amount={identityModal.amount}
      transactionType="echange"
      onClose={() => setIdentityModal({ open: false, amount: 0 })}
      onConfirm={saveExchangeVerification}
    />
  </div>
  );
};

const RackCheckSection: React.FC<{ checks: RackCheck[]; onChange: (checks: RackCheck[]) => void }> = ({ checks, onChange }) => {
  const addCheck = (type: RackCheck['type']) => onChange([...checks, { id: Date.now(), time: new Date().toTimeString().slice(0, 5), type, expected: 220000, actual: '', missing: '', verified: false }]);
  const updateCheck = (id: number, changes: Partial<RackCheck>) => onChange(checks.map((check) => {
    if (check.id !== id) return check;
    const next = { ...check, ...changes };
    const actual = parseCasinoAmount(next.actual);
    return { ...next, missing: next.actual.trim() ? String(Math.max(0, next.expected - actual)) : '' };
  }));
  return <section>
    <SheetTitle title="Rack check" subtitle="Le caissier confirme le rack du croupier : 220 000 Ar à l'entrée, puis environ toutes les 30 minutes et à la sortie." />
    <div className="mb-3 flex flex-wrap gap-2 print:hidden">
      <button type="button" className="action secondary" onClick={() => addCheck('Entrée')}>+ Contrôle entrée</button>
      <button type="button" className="action secondary" onClick={() => addCheck('Contrôle périodique')}>+ Contrôle 30 min</button>
      <button type="button" className="action secondary" onClick={() => addCheck('Sortie')}>+ Contrôle sortie</button>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-xs border" style={casinoBorder}><thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>{['Heure', 'Contrôle', 'Montant attendu', 'Montant constaté', 'Manque', 'Validation caissier'].map((header) => <th key={header} className="p-3 text-left border-r last:border-r-0" style={casinoBorder}>{header}</th>)}</tr></thead><tbody>
      {!checks.length && <tr><td colSpan={6} className="p-3 text-muted" style={casinoBorder}>Aucun rack check enregistré.</td></tr>}
      {checks.map((check) => <tr key={check.id}>
        <td className="border-r border-b" style={casinoBorder}><input type="time" className={casinoInput} value={check.time} onChange={(event) => updateCheck(check.id, { time: event.target.value })} /></td>
        <td className="border-r border-b p-2 font-semibold" style={casinoBorder}>{check.type}</td>
        <td className="border-r border-b p-2 text-right" style={casinoBorder}>{casinoCurrency.format(check.expected)} Ar</td>
        <td className="border-r border-b" style={casinoBorder}><input className={casinoInput} inputMode="numeric" placeholder="220000" value={check.actual} onChange={(event) => updateCheck(check.id, { actual: event.target.value })} /></td>
        <td className={`border-r border-b p-2 text-right font-bold ${parseCasinoAmount(check.missing) > 0 ? 'text-red-400' : 'text-green-400'}`} style={casinoBorder}>{check.missing ? `${casinoCurrency.format(parseCasinoAmount(check.missing))} Ar` : '—'}</td>
        <td className="border-b p-2 text-center" style={casinoBorder}><label className="inline-flex items-center gap-2"><input type="checkbox" checked={check.verified} onChange={(event) => updateCheck(check.id, { verified: event.target.checked })} /> Confirmé</label></td>
      </tr>)}
    </tbody></table></div>
  </section>;
};

const ChipTable: React.FC<{ chips: ChipLine[]; onUpdate: ChipsSheetProps['onUpdate']; fields: (keyof Omit<ChipLine, 'value'>)[]; headers: string[] }> = ({ chips, onUpdate, fields, headers }) => <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-xs border" style={casinoBorder}><thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>{headers.map((header) => <th key={header} className="p-3 text-left text-secondary border-r last:border-r-0" style={casinoBorder}>{header}</th>)}</tr></thead><tbody>{chips.map((line) => <tr key={line.value}><td className="p-2 font-semibold text-primary border-r border-b" style={casinoBorder}>{casinoCurrency.format(line.value)} Ar</td>{fields.map((field) => <td key={field} className="border-r border-b" style={casinoBorder}><input className={casinoInput} inputMode="numeric" value={line[field]} onChange={(event) => onUpdate(line.value, field, event.target.value)} /></td>)}{fields.length === 1 && <td className="p-2 text-primary border-b" style={casinoBorder}>{casinoCurrency.format(line.value * parseCasinoAmount(line.withdrawn))} Ar</td>}</tr>)}</tbody></table></div>;
const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}><p className="text-muted text-[11px]">{label}</p><p className="text-primary font-bold">{casinoCurrency.format(value)} Ar</p></div>;
const SheetTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => <div className="mb-4"><h2 className="text-primary text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2><p className="text-muted text-xs mt-1">{subtitle}</p></div>;

const getTimeMinutes = (value?: string): number | null => {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60 ? hours * 60 + minutes : null;
};

const getEarliestPlayer = (players: PlayerLine[]): PlayerLine | undefined => players
  .map((player) => ({ player, minutes: getTimeMinutes(player.time || player.arrival) }))
  .filter((entry): entry is { player: PlayerLine; minutes: number } => entry.minutes !== null)
  .sort((a, b) => a.minutes - b.minutes)[0]?.player;

const getPlayDurationMinutes = (arrival: string, departure: string): number | null => {
  if (!arrival || !departure) return null;
  const [arrivalHours, arrivalMinutes] = arrival.split(':').map(Number);
  const [departureHours, departureMinutes] = departure.split(':').map(Number);
  if ([arrivalHours, arrivalMinutes, departureHours, departureMinutes].some((value) => !Number.isFinite(value))) return null;
  let minutes = (departureHours * 60 + departureMinutes) - (arrivalHours * 60 + arrivalMinutes);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
};

const getPlayDuration = (arrival: string, departure: string): string => {
  const minutes = getPlayDurationMinutes(arrival, departure);
  if (minutes === null) return '—';
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
};

const getHourlyAverage = (arrival: string, departure: string, withdrawnTotal: number): string => {
  const minutes = getPlayDurationMinutes(arrival, departure);
  if (!minutes) return '—';
  return `${casinoCurrency.format(Math.round(withdrawnTotal / (minutes / 60)))} Ar/h`;
};

const SessionTimeTable: React.FC<{ firstArrival: string; endGameTime: string; withdrawnTotal: number; onEndGameTimeChange: (value: string) => void }> = ({ firstArrival, endGameTime, withdrawnTotal, onEndGameTimeChange }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[620px] text-xs border" style={casinoBorder}>
      <thead style={{ backgroundColor: 'var(--color-bg)' }}>
        <tr>
          {['Heure d’arrivée', 'Heure de fin de jeu', 'Durée de jeu', 'Moyenne / heure'].map((header) => <th key={header} className="p-3 text-left text-secondary border-r last:border-r-0" style={casinoBorder}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="p-3 font-semibold text-primary border-r border-b" style={casinoBorder}>{firstArrival || '—'}</td>
          <td className="p-3 font-semibold text-primary border-r border-b" style={casinoBorder}><input type="time" className={casinoInput} value={endGameTime} onChange={(event) => onEndGameTimeChange(event.target.value)} /></td>
          <td className="p-3 font-semibold text-primary border-r border-b" style={casinoBorder}>{getPlayDuration(firstArrival, endGameTime)}</td>
          <td className="p-3 font-semibold text-primary border-b" style={casinoBorder}>{getHourlyAverage(firstArrival, endGameTime, withdrawnTotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>
);

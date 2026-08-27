import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, ClipboardList, Coins, Download, Printer, Shield } from 'lucide-react';
import { PlayersSheet } from '../components/Casino/sheets/PlayersSheet';
import { ChipsSheet } from '../components/Casino/sheets/ChipsSheet';
import { FinalCalculationSheet } from '../components/Casino/sheets/FinalCalculationSheet';
import { IdentityVerificationsManagement } from '../components/Casino/sheets/IdentityVerificationsManagement';
import { CHIP_VALUES, CasinoView, ChipLine, PlayerLine, casinoBorder, casinoCurrency, createPlayerLine, parseCasinoAmount } from '../components/Casino/sheets/types';
import { playerSheetApi, identityVerificationApi } from '../services/casinoTablesJeu.service';

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const createInitialPlayers = () => {
  const players = Array.from({ length: 12 }, (_, index) => createPlayerLine(index + 1));
  players[0].time = getCurrentTime();
  players[0].departure = getCurrentTime();
  return players;
};

const setFirstPlayerTimeIfMissing = (players: PlayerLine[]) => {
  if (!players.length) return players;
  const firstPlayer = players[0];
  if (firstPlayer.time.trim() && firstPlayer.departure.trim()) return players;
  const currentTime = getCurrentTime();
  return players.map((player, index) => index === 0 ? {
    ...player,
    time: player.time.trim() || currentTime,
    departure: player.departure.trim() || currentTime,
  } : player);
};

export const CasinoPage: React.FC = () => {
  const [view, setView] = useState<CasinoView>('players');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [table, setTable] = useState('Table Poker Night');
  const [players, setPlayers] = useState<PlayerLine[]>(createInitialPlayers);
  const [restaurantPayments, setRestaurantPayments] = useState({ especes: false, tpe: false });
  const [cashingPaymentMethod, setCashingPaymentMethod] = useState('');
  const [endGameTime, setEndGameTime] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chips, setChips] = useState<ChipLine[]>(() => CHIP_VALUES.map((value) => ({ value, previous: '', opening: '', closing: '', withdrawn: '' })));
  const [finalsByPlayer, setFinalsByPlayer] = useState<Record<string, Record<string, string>>>({});
  const [selectedFinalPlayerId, setSelectedFinalPlayerId] = useState(players[0]?.ficheId ?? players[0]?.id ?? 0);
  const [showIdentityVerifications, setShowIdentityVerifications] = useState(true);
  const [identityVerifications, setIdentityVerifications] = useState<Record<number, { id?: number; full_name: string; id_type: string; id_number: string; issue_date: string; transaction_type: string; amount: number; verified_at: string }>>({});

  const openingTotal = useMemo(() => chips.reduce((total, line) => total + line.value * (Number(line.opening) || 0), 0), [chips]);
  const closingTotal = useMemo(() => chips.reduce((total, line) => total + line.value * (Number(line.closing) || 0), 0), [chips]);
  const withdrawnTotal = useMemo(() => chips.reduce((total, line) => total + line.value * parseCasinoAmount(line.withdrawn), 0), [chips]);
  const playerResults = useMemo(() => players
    .filter((player, index, lines) => lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index)
    .map((player) => {
      const playerId = player.ficheId ?? player.id;
      const playerLines = players.filter((line) => (line.ficheId ?? line.id) === playerId);
      const cavesTotal = playerLines.reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);
      const cashing = parseCasinoAmount(playerLines.find((line) => line.cashing.trim())?.cashing);
      return {
        name: player.name || `Joueur ${playerId}`,
        result: cashing - cavesTotal,
        paymentOptions: parseResultPaymentOptions(player.resultPaymentOptions),
      };
    }), [players]);
  const depositResults = useMemo(() => playerResults
    .filter(({ result, paymentOptions }) => result > 0 && paymentOptions.includes('Dépôt'))
    .map(({ name, result }) => `${name} : ${casinoCurrency.format(result)}`)
    .join(' - '), [playerResults]);
  const creditResults = useMemo(() => playerResults
    .filter(({ result, paymentOptions }) => result < 0 && paymentOptions.includes('Crédit'))
    .map(({ name, result }) => `${name} : ${casinoCurrency.format(Math.abs(result))}`)
    .join(' - '), [playerResults]);

  useEffect(() => {
    let active = true;
    setSaveState('idle');
    playerSheetApi.get(date, table).then((sheet) => {
      if (!active) return;
      if (sheet) {
        setPlayers(setFirstPlayerTimeIfMissing(sheet.players));
        setChips(sheet.chips || CHIP_VALUES.map((value) => ({ value, previous: '', opening: '', closing: '', withdrawn: '' })));
        setRestaurantPayments(sheet.restaurantPayments || { especes: false, tpe: false });
        setCashingPaymentMethod(sheet.cashingPaymentMethod || '');
        setEndGameTime(sheet.endGameTime || '');
        const loadedFinals = sheet.finals || {};
        // Compatibilité avec les signatures précédemment enregistrées dans une fiche joueur.
        const previousSignature = Object.values(loadedFinals).find((entry) => entry?.signature)?.signature;
        setFinalsByPlayer(previousSignature && !loadedFinals._global
          ? { ...loadedFinals, _global: { signature: previousSignature } }
          : loadedFinals);
      } else {
        setPlayers(createInitialPlayers());
        setChips(CHIP_VALUES.map((value) => ({ value, previous: '', opening: '', closing: '', withdrawn: '' })));
        setRestaurantPayments({ especes: false, tpe: false });
        setCashingPaymentMethod('');
        setEndGameTime('');
        setFinalsByPlayer({});
      }
    }).catch(() => {
      if (active) setSaveState('error');
    });
    return () => { active = false; };
  }, [date, table]);

  useEffect(() => {
    let active = true;
    identityVerificationApi.list({ date_from: date, date_to: date }).then((rows) => {
      if (!active) return;
      const map: Record<number, { id?: number; full_name: string; id_type: string; id_number: string; issue_date: string; transaction_type: string; amount: number; verified_at: string }> = {};
      for (const row of rows) {
        map[row.fiche_id] = {
          id: row.id,
          full_name: row.full_name,
          id_type: row.id_type,
          id_number: row.id_number,
          issue_date: row.issue_date,
          transaction_type: row.transaction_type,
          amount: Number(row.amount),
          verified_at: row.verified_at,
        };
      }
      setIdentityVerifications(map);
    }).catch(() => {});
    return () => { active = false; };
  }, [date, table]);

  const savePlayerSheet = async () => {
    setSaveState('saving');
    try {
      const accumulatedTotals: Record<string, number> = {};
      const playersWithAccumulatedCaves = players.map((player) => {
        const ficheId = String(player.ficheId ?? player.id);
        const lineTotal = parseCasinoAmount(player.caves) * parseCasinoAmount(player.amount);
        accumulatedTotals[ficheId] = (accumulatedTotals[ficheId] || 0) + lineTotal;
        return { ...player, total: String(lineTotal), accumulated: String(accumulatedTotals[ficheId]) };
      });
      const saved = await playerSheetApi.save({ date, table_name: table, players: playersWithAccumulatedCaves, chips, restaurantPayments, finals: finalsByPlayer, endGameTime, cashingPaymentMethod });
      // Sauvegarder les vérifications d'identité liées à cette fiche
      const sheetId = saved.id;
      if (sheetId) {
      const verificationsToSave = Object.entries(identityVerifications)
        .filter(([, v]) => v && (v.full_name || v.id_number))
        .map(([ficheId, v]) => ({
          id: v.id,
          player_sheet_id: sheetId,
          fiche_id: Number(ficheId),
          full_name: v.full_name,
          id_type: v.id_type,
          id_number: v.id_number,
          issue_date: v.issue_date,
          transaction_type: v.transaction_type,
          amount: v.amount,
        }));
      for (const v of verificationsToSave) {
        if (v.id) {
          await identityVerificationApi.update(v.id, { full_name: v.full_name, id_type: v.id_type, id_number: v.id_number, issue_date: v.issue_date, transaction_type: v.transaction_type as 'ACHAT' | 'APPORT' | 'ECHANGE', amount: v.amount });
        } else {
          await identityVerificationApi.create({ player_sheet_id: v.player_sheet_id, fiche_id: v.fiche_id, full_name: v.full_name, id_type: v.id_type, id_number: v.id_number, issue_date: v.issue_date, transaction_type: v.transaction_type as 'ACHAT' | 'APPORT' | 'ECHANGE', amount: v.amount });
        }
      }
      }
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const navigation: { id: CasinoView; label: string; help: string; icon: React.ReactNode }[] = [
    { id: 'players', label: '1. Joueurs & caves', help: 'Fiche du tournoi', icon: <ClipboardList size={18} /> },
    { id: 'chips', label: '2. Comptage jetons', help: 'Ouverture / fermeture', icon: <Coins size={18} /> },
    { id: 'final', label: '3. Calcul final', help: 'Clôture de caisse', icon: <Calculator size={18} /> },
    { id: 'management', label: '4. Vérifications', help: 'Gérer les identités', icon: <Shield size={18} /> },
  ];

  return <div className="flex flex-col gap-5 w-full">
    <header className="rounded-3xl p-5 md:p-7 print:hidden" style={{ background: 'linear-gradient(120deg, var(--color-surface) 0%, #201a10 100%)', ...casinoBorder }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5"><div><p className="text-accent text-xs font-bold uppercase tracking-[.18em]">Poker Night</p><h1 className="text-primary text-3xl font-bold mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>Gestion casino</h1><p className="text-muted text-sm mt-2">Nouvelle interface locale basée sur les trois fiches papier.</p></div><div className="flex gap-2"><button type="button" onClick={() => window.print()} className="action secondary"><Printer size={15} /> Imprimer</button><button type="button" className="action"><Download size={15} /> Exporter</button></div></div>
    </header>
    <nav className="grid md:grid-cols-4 gap-2 print:hidden">{navigation.map((item) => <button type="button" key={item.id} onClick={() => setView(item.id)} className="casino-nav-button flex gap-3 items-center rounded-2xl p-4 text-left" style={{ backgroundColor: view === item.id ? '#6b7280' : 'var(--color-surface)', color: view === item.id ? '#000' : undefined, ...casinoBorder }}>{item.icon}<span><b className="block text-sm">{item.label}</b><small className="opacity-70">{item.help}</small></span></button>)}</nav>
    <main className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
      <div className="p-4 md:p-5 flex flex-col sm:flex-row gap-3 justify-between print:hidden" style={{ borderBottom: '1px solid var(--color-border)' }}><div className="flex flex-col sm:flex-row gap-3"><label className="field">Table<input value={table} onChange={(event) => setTable(event.target.value)} /></label><label className="field">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs font-semibold cursor-pointer"><input type="checkbox" checked={showIdentityVerifications} onChange={(event) => setShowIdentityVerifications(event.target.checked)} /> Vérifications identité</label><p className="text-muted text-xs self-end">Fiche enregistrée dans la base de données.</p></div></div>
      <div className="p-4 md:p-5"><div className="hidden print:block text-center mb-5"><h1>{table}</h1><p>Date : {date}</p></div>
        {view === 'players' && <PlayersSheet date={date} players={players} cashingPaymentMethod={cashingPaymentMethod} restaurantPayments={restaurantPayments} saveState={saveState} onDateChange={(value) => { setSaveState('idle'); setDate(value); }} onUpdate={(id, key, value) => { setSaveState('idle'); setPlayers((lines) => lines.map((line) => line.id === id ? { ...line, [key]: value } : line)); }} onPaymentChange={(payment, checked) => { setSaveState('idle'); setRestaurantPayments((current) => ({ ...current, [payment]: checked })); }} onCashingPaymentMethodChange={(value) => { setSaveState('idle'); setCashingPaymentMethod(value); }} onSave={savePlayerSheet} onAdd={(ficheId, name = '') => { const firstId = Math.max(0, ...players.map((line) => line.id)) + 1; const newFicheId = ficheId ?? firstId; const newLines = ficheId ? [createPlayerLine(firstId, newFicheId)] : Array.from({ length: 5 }, (_, index) => createPlayerLine(firstId + index, newFicheId)); setPlayers((lines) => [...lines, ...newLines.map((line) => name ? { ...line, name } : line)]); return newFicheId; }} onRemove={(id) => setPlayers((lines) => lines.filter((line) => line.id !== id))} showIdentityVerifications={showIdentityVerifications} identityVerifications={identityVerifications} onIdentityVerified={(ficheId, data, verificationId) => { setIdentityVerifications((current) => ({ ...current, [ficheId]: { id: verificationId ?? current[ficheId]?.id, full_name: data.fullName, id_type: data.idType, id_number: data.idNumber, issue_date: data.issueDate, transaction_type: data.transactionType.toUpperCase(), amount: data.amount, verified_at: data.verifiedAt } })); }} />}
        {view === 'chips' && <ChipsSheet chips={chips} players={players} endGameTime={endGameTime} openingTotal={openingTotal} closingTotal={closingTotal} saveState={saveState} onUpdate={(value, key, content) => { setSaveState('idle'); setChips((lines) => lines.map((line) => line.value === value ? { ...line, [key]: content } : line)); }} onEndGameTimeChange={(value) => { setSaveState('idle'); setEndGameTime(value); }} onSave={savePlayerSheet} />}
        {view === 'final' && <FinalCalculationSheet players={players} selectedPlayerId={selectedFinalPlayerId} values={{ ...(finalsByPlayer[String(selectedFinalPlayerId)] || {}), signature: finalsByPlayer._global?.signature || finalsByPlayer[String(selectedFinalPlayerId)]?.signature || '' }} withdrawnTotal={withdrawnTotal} depositResults={depositResults} creditResults={creditResults} saveState={saveState} onPlayerChange={setSelectedFinalPlayerId} onUpdate={(key, value) => { setSaveState('idle'); setFinalsByPlayer((current) => key === 'signature' ? { ...current, _global: { ...(current._global || {}), signature: value } } : { ...current, [String(selectedFinalPlayerId)]: { ...(current[String(selectedFinalPlayerId)] || {}), [key]: value } }); }} onSave={savePlayerSheet} showIdentityVerifications={showIdentityVerifications} identityVerifications={identityVerifications} />}
        {view === 'management' && <IdentityVerificationsManagement verifications={Object.entries(identityVerifications).map(([ficheId, v]) => ({ ...v, fiche_id: Number(ficheId) }))} onUpdate={(updated) => { const map: Record<number, any> = {}; for (const v of updated) { map[v.fiche_id ?? 0] = v; } setIdentityVerifications(map); }} />}
      </div>
    </main>
    <style>{`.action{display:inline-flex;align-items:center;gap:.5rem;border-radius:.75rem;padding:.65rem .9rem;font-size:.75rem;font-weight:600;background:var(--color-accent);color:#000}.action.secondary{background:var(--color-bg);color:var(--text-primary);border:1px solid var(--color-border)}.casino-nav-button{transition:background-color .2s ease,color .2s ease}.casino-nav-button:hover{background-color:#6b7280!important;color:#000!important}.field{font-size:.75rem;color:var(--text-secondary);font-weight:600}.field input{display:block;margin-top:.25rem;padding:.5rem .65rem;border-radius:.7rem;background:var(--color-bg);border:1px solid var(--color-border);color:var(--text-primary);outline:none}@page{size:A4 landscape;margin:8mm}@media print{.print\\:hidden{display:none!important}body{background:#fff!important}.player-sheet-print{background:#fff!important;color:#000!important;width:100%!important;padding:0!important}.player-sheet-print table{min-width:0!important;width:100%!important;font-size:9px!important;table-layout:fixed!important}.player-sheet-print th,.player-sheet-print td,.player-sheet-print label,.player-sheet-print p,.player-sheet-print span{color:#000!important}.player-sheet-print input,.player-sheet-print select{color:#000!important;background:#fff!important}.player-sheet-print input::placeholder{color:#555!important}.player-sheet-print .text-white{color:#000!important}.player-sheet-print .overflow-x-auto{overflow:visible!important}.player-sheet-print th,.player-sheet-print td{padding:5px 4px!important;overflow-wrap:anywhere!important}.player-sheet-print canvas{max-width:100%!important;height:auto!important}}`}</style>
  </div>;
};

const parseResultPaymentOptions = (value?: string): string[] => {
  try {
    const options = JSON.parse(value || '[]');
    return Array.isArray(options) ? options.flatMap((option) => {
      if (typeof option === 'string') return [option];
      return option && typeof option.option === 'string' ? [option.option] : [];
    }) : [];
  } catch {
    return [];
  }
};

export default CasinoPage;

import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, ClipboardList, Coins, Download, Printer } from 'lucide-react';
import { PlayersSheet } from '../components/Casino/sheets/PlayersSheet';
import { ChipsSheet } from '../components/Casino/sheets/ChipsSheet';
import { FinalCalculationSheet } from '../components/Casino/sheets/FinalCalculationSheet';
import { CHIP_VALUES, CasinoView, ChipLine, PlayerLine, casinoBorder, createPlayerLine, parseCasinoAmount } from '../components/Casino/sheets/types';
import { playerSheetApi } from '../services/casinoTablesJeu.service';

export const CasinoPage: React.FC = () => {
  const [view, setView] = useState<CasinoView>('players');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [table, setTable] = useState('Table Poker Night');
  const [players, setPlayers] = useState<PlayerLine[]>(() => Array.from({ length: 12 }, (_, index) => createPlayerLine(index + 1)));
  const [restaurantPayments, setRestaurantPayments] = useState({ especes: false, tpe: false });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chips, setChips] = useState<ChipLine[]>(() => CHIP_VALUES.map((value) => ({ value, previous: '', opening: '', closing: '', withdrawn: '' })));
  const [finalsByPlayer, setFinalsByPlayer] = useState<Record<string, Record<string, string>>>({});
  const [selectedFinalPlayerId, setSelectedFinalPlayerId] = useState(players[0]?.ficheId ?? players[0]?.id ?? 0);

  const cavesTotal = useMemo(() => players.reduce((total, line) => total + ((Number(line.caves) || 0) * (Number(line.amount) || 0)), 0), [players]);
  const totalCashing = useMemo(() => {
    const cashingBySheet = new Map<number, number>();
    players.forEach((player) => {
      const sheetId = player.ficheId ?? player.id;
      if (!cashingBySheet.has(sheetId) || cashingBySheet.get(sheetId) === 0) {
        cashingBySheet.set(sheetId, parseCasinoAmount(player.cashing));
      }
    });
    return Array.from(cashingBySheet.values()).reduce((total, cashing) => total + cashing, 0);
  }, [players]);
  const openingTotal = useMemo(() => chips.reduce((total, line) => total + line.value * (Number(line.opening) || 0), 0), [chips]);
  const closingTotal = useMemo(() => chips.reduce((total, line) => total + line.value * (Number(line.closing) || 0), 0), [chips]);

  useEffect(() => {
    let active = true;
    setSaveState('idle');
    playerSheetApi.get(date, table).then((sheet) => {
      if (!active) return;
      if (sheet) {
        setPlayers(sheet.players);
        setChips(sheet.chips || CHIP_VALUES.map((value) => ({ value, previous: '', opening: '', closing: '', withdrawn: '' })));
        setRestaurantPayments(sheet.restaurantPayments || { especes: false, tpe: false });
        setFinalsByPlayer(sheet.finals || {});
      } else {
        setPlayers(Array.from({ length: 12 }, (_, index) => createPlayerLine(index + 1)));
        setChips(CHIP_VALUES.map((value) => ({ value, previous: '', opening: '', closing: '', withdrawn: '' })));
        setRestaurantPayments({ especes: false, tpe: false });
        setFinalsByPlayer({});
      }
    }).catch(() => {
      if (active) setSaveState('error');
    });
    return () => { active = false; };
  }, [date, table]);

  const savePlayerSheet = async () => {
    setSaveState('saving');
    try {
      const accumulatedTotals: Record<string, number> = {};
      const playersWithAccumulatedCaves = players.map((player) => {
        const ficheId = String(player.ficheId ?? player.id);
        const lineTotal = (Number(player.caves) || 0) * (Number(player.amount) || 0);
        accumulatedTotals[ficheId] = (accumulatedTotals[ficheId] || 0) + lineTotal;
        return { ...player, total: String(lineTotal), accumulated: String(accumulatedTotals[ficheId]) };
      });
      await playerSheetApi.save({ date, table_name: table, players: playersWithAccumulatedCaves, chips, restaurantPayments, finals: finalsByPlayer });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  };

  const navigation: { id: CasinoView; label: string; help: string; icon: React.ReactNode }[] = [
    { id: 'players', label: '1. Joueurs & caves', help: 'Fiche du tournoi', icon: <ClipboardList size={18} /> },
    { id: 'chips', label: '2. Comptage jetons', help: 'Ouverture / fermeture', icon: <Coins size={18} /> },
    { id: 'final', label: '3. Calcul final', help: 'Clôture de caisse', icon: <Calculator size={18} /> },
  ];

  return <div className="flex flex-col gap-5 w-full">
    <header className="rounded-3xl p-5 md:p-7 print:hidden" style={{ background: 'linear-gradient(120deg, var(--color-surface) 0%, #201a10 100%)', ...casinoBorder }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5"><div><p className="text-accent text-xs font-bold uppercase tracking-[.18em]">Poker Night</p><h1 className="text-primary text-3xl font-bold mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>Gestion casino</h1><p className="text-muted text-sm mt-2">Nouvelle interface locale basée sur les trois fiches papier.</p></div><div className="flex gap-2"><button type="button" onClick={() => window.print()} className="action secondary"><Printer size={15} /> Imprimer</button><button type="button" className="action"><Download size={15} /> Exporter</button></div></div>
    </header>
    <nav className="grid md:grid-cols-3 gap-2 print:hidden">{navigation.map((item) => <button type="button" key={item.id} onClick={() => setView(item.id)} className="flex gap-3 items-center rounded-2xl p-4 text-left" style={{ backgroundColor: view === item.id ? 'var(--color-accent)' : 'var(--color-surface)', color: view === item.id ? '#000' : undefined, ...casinoBorder }}>{item.icon}<span><b className="block text-sm">{item.label}</b><small className="opacity-70">{item.help}</small></span></button>)}</nav>
    <main className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', ...casinoBorder }}>
      <div className="p-4 md:p-5 flex flex-col sm:flex-row gap-3 justify-between print:hidden" style={{ borderBottom: '1px solid var(--color-border)' }}><div className="flex flex-col sm:flex-row gap-3"><label className="field">Table<input value={table} onChange={(event) => setTable(event.target.value)} /></label><label className="field">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label></div><p className="text-muted text-xs self-end">Fiche enregistrée dans la base de données.</p></div>
      <div className="p-4 md:p-5"><div className="hidden print:block text-center mb-5"><h1>{table}</h1><p>Date : {date}</p></div>
        {view === 'players' && <PlayersSheet date={date} players={players} total={cavesTotal} totalCashing={totalCashing} restaurantPayments={restaurantPayments} saveState={saveState} onDateChange={(value) => { setSaveState('idle'); setDate(value); }} onUpdate={(id, key, value) => { setSaveState('idle'); setPlayers((lines) => lines.map((line) => line.id === id ? { ...line, [key]: value } : line)); }} onPaymentChange={(payment, checked) => { setSaveState('idle'); setRestaurantPayments((current) => ({ ...current, [payment]: checked })); }} onSave={savePlayerSheet} onAdd={(ficheId) => { const firstId = Math.max(0, ...players.map((line) => line.id)) + 1; const newFicheId = ficheId ?? firstId; const newLines = ficheId ? [createPlayerLine(firstId, newFicheId)] : Array.from({ length: 5 }, (_, index) => createPlayerLine(firstId + index, newFicheId)); setPlayers((lines) => [...lines, ...newLines]); return newFicheId; }} onRemove={(id) => setPlayers((lines) => lines.filter((line) => line.id !== id))} />}
        {view === 'chips' && <ChipsSheet chips={chips} openingTotal={openingTotal} closingTotal={closingTotal} saveState={saveState} onUpdate={(value, key, content) => { setSaveState('idle'); setChips((lines) => lines.map((line) => line.value === value ? { ...line, [key]: content } : line)); }} onSave={savePlayerSheet} />}
        {view === 'final' && <FinalCalculationSheet players={players} selectedPlayerId={selectedFinalPlayerId} values={finalsByPlayer[String(selectedFinalPlayerId)] || {}} saveState={saveState} onPlayerChange={setSelectedFinalPlayerId} onUpdate={(key, value) => { setSaveState('idle'); setFinalsByPlayer((current) => ({ ...current, [String(selectedFinalPlayerId)]: { ...(current[String(selectedFinalPlayerId)] || {}), [key]: value } })); }} onSave={savePlayerSheet} />}
      </div>
    </main>
    <style>{`.action{display:inline-flex;align-items:center;gap:.5rem;border-radius:.75rem;padding:.65rem .9rem;font-size:.75rem;font-weight:600;background:var(--color-accent);color:#000}.action.secondary{background:var(--color-bg);color:var(--text-primary);border:1px solid var(--color-border)}.field{font-size:.75rem;color:var(--text-secondary);font-weight:600}.field input{display:block;margin-top:.25rem;padding:.5rem .65rem;border-radius:.7rem;background:var(--color-bg);border:1px solid var(--color-border);color:var(--text-primary);outline:none}@page{size:A4 portrait;margin:10mm}@media print{.print\\:hidden{display:none!important}body{background:#fff!important}.player-sheet-print{background:#fff!important;color:#000!important;width:100%!important;padding:0!important}.player-sheet-print table{min-width:0!important;width:100%!important;font-size:8px!important}.player-sheet-print th,.player-sheet-print td,.player-sheet-print label,.player-sheet-print p,.player-sheet-print span{color:#000!important}.player-sheet-print input,.player-sheet-print select{color:#000!important;background:#fff!important}.player-sheet-print input::placeholder{color:#555!important}.player-sheet-print .text-white{color:#000!important}.player-sheet-print .overflow-x-auto{overflow:visible!important}}`}</style>
  </div>;
};

export default CasinoPage;

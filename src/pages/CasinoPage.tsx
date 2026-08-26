import React, { useState } from 'react';
import { Building2, Coins, Dices, Plus, WalletCards } from 'lucide-react';
import { CasinoTabs } from '../components/Casino/CasinoTabs';
import { RoomFormModal } from '../components/Casino/modals/RoomCashierModal';
import { ErrorBanner } from '../components/Casino/common';
import { Button } from '../components/UI';

import { CasinoSetupTab } from '../components/Casino/tabs/CasinoSetupTab';
import { TokensTab } from '../components/Casino/tabs/TokensTab';
import { CaisseTab } from '../components/Casino/tabs/CaisseTab';
// Onglet Stock existant (module casino) — conservé tel quel, non réécrit ici.
// import { StockTab } from '../components/Casino/tabs/';

import AuthService from '../services/authService';
import { getDefaultTabForRole, isAdmin } from '../utils/permissions';

export const CasinoPage: React.FC = () => {
  const currentUser = AuthService.getCurrentUser();
  const userIsAdmin = isAdmin(currentUser);
  const [activeTab, setActiveTab] = useState(() => {
    const defaultTab = getDefaultTabForRole('setup', currentUser?.role);
    return defaultTab === 'stock' || defaultTab === 'rooms' || defaultTab === 'tables-jeu' || (!userIsAdmin && defaultTab === 'caisse') ? 'setup' : defaultTab;
  });
  const [error, setError] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  const steps = [
    ["01", "Configuration", Building2],
    ["02", "Jetons", Coins],
    ...(userIsAdmin ? [["03", "Caisse", WalletCards]] : []),
  ];

  return (
    <div className="flex flex-col gap-5 md:gap-6 w-full">
      <header className="relative overflow-hidden rounded-3xl p-5 md:p-7" style={{ background: 'linear-gradient(120deg, var(--color-surface) 0%, #201a10 100%)', border: '1px solid var(--color-border)' }}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-[0.18em]"><Dices size={15} /> Pilotage casino</div>
            <h1 className="text-primary text-2xl md:text-4xl font-bold mt-3" style={{ fontFamily: 'Playfair Display, serif' }}>Le casino, en trois étapes.</h1>
            <p className="text-muted text-sm mt-2 max-w-xl">Configurez les salles, affectez une caisse à chaque table, puis échangez ou reprenez les jetons.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<Plus size={15} />} onClick={() => setShowRoomForm(true)}>Nouvelle salle</Button>
            {userIsAdmin && (
              <Button variant="secondary" icon={<WalletCards size={15} />} onClick={() => setActiveTab('caisse')}>Ouvrir la caisse</Button>
            )}
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-2 mt-6">
          {steps.map(([number, label, Icon]: any) => (
            <div key={String(label)} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,.05)' }}><span className="text-accent text-xs font-bold">{number}</span><Icon size={14} className="text-muted" /><span className="text-primary text-xs">{label}</span></div>
          ))}
        </div>
      </header>

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

      {activeTab === 'setup' && <CasinoSetupTab />}
      {activeTab === 'tokens' && <TokensTab />}
      {userIsAdmin && activeTab === 'caisse' && <CaisseTab />}

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

import React from 'react';
import { casinoBorder } from './types';
import type { PlayerLine } from './types';

interface FinalCalculationSheetProps {
  players: PlayerLine[];
  selectedPlayerId: number;
  values: Record<string, string>;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onPlayerChange: (id: number) => void;
  onUpdate: (key: string, value: string) => void;
  onSave: () => void;
}

export const FinalCalculationSheet: React.FC<FinalCalculationSheetProps> = ({ players, selectedPlayerId, values, saveState = 'idle', onPlayerChange, onUpdate, onSave }) => (
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
          <CalculationInput value={values.prelevements} onChange={(value) => onUpdate('prelevements', value)} />
          <CalculationCell label="TOTAL TPE" />
          <CalculationInput value={values.tpe} onChange={(value) => onUpdate('tpe', value)} />

          <CalculationCell label="TOTAL POURBOIRES" />
          <CalculationInput value={values.pourboires} onChange={(value) => onUpdate('pourboires', value)} />
          <BlankCell />
          <BlankCell />

          <BlankCell />
          <BlankCell />
          <CalculationCell label="TOTAL MOBILES" />
          <CalculationInput value={values.mobiles} onChange={(value) => onUpdate('mobiles', value)} />

          <CalculationCell label="TOTAL RETRAIT AUTRES DEPARTEMENT" />
          <CalculationInput value={values.autres} onChange={(value) => onUpdate('autres', value)} />
          <CalculationCell label="TOTAL BONUS" />
          <CalculationInput value={values.bonus} onChange={(value) => onUpdate('bonus', value)} />

          <CalculationCell label="TOTAL RESTAURANT PAYE" />
          <CalculationInput value={values.restaurant} onChange={(value) => onUpdate('restaurant', value)} />
          <BlankCell />
          <BlankCell />

          <BlankCell />
          <BlankCell />
          <BlankCell />
          <BlankCell />

          <TotalCell label="TOTAL 1" />
          <CalculationInput value={values.total1} onChange={(value) => onUpdate('total1', value)} />
          <TotalCell label="TOTAL 2" />
          <CalculationInput value={values.total2} onChange={(value) => onUpdate('total2', value)} />
        </div>

        <div className="grid grid-cols-[1.35fr_.85fr_1.2fr] border-t" style={casinoBorder}>
          <div className="border-r" style={casinoBorder}>
            <BottomRow label="TOTAL 2 - TOTAL 1" value={values.difference} onChange={(value) => onUpdate('difference', value)} />
            <BottomRow label="TOTAL ESPECES CAISSE" value={values.especes} onChange={(value) => onUpdate('especes', value)} />
            <BottomRow label="RESULTAT FINAL" value={values.resultat} onChange={(value) => onUpdate('resultat', value)} />
          </div>
          <div className="border-r" style={casinoBorder}>
            <BlankBottomRow />
            <BlankBottomRow />
            <BlankBottomRow />
          </div>
          <label className="p-3 min-h-36 flex flex-col gap-2 text-xs font-semibold">
            Signature Responsable
            <input
              className="flex-1 min-h-20 w-full bg-transparent px-2 text-sm font-normal outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)]"
              value={values.signature || ''}
              onChange={(event) => onUpdate('signature', event.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-end gap-3 print:hidden">
      {saveState === 'saved' && <span className="text-xs text-green-700">Enregistré</span>}
      {saveState === 'error' && <span className="text-xs text-red-700">Erreur d’enregistrement</span>}
      <button type="button" className="action" onClick={onSave} disabled={saveState === 'saving'}>{saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer le calcul'}</button>
    </div>
  </div>
);

const CalculationCell: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-20 border-r border-b p-3 flex items-center font-semibold text-[11px] leading-tight" style={casinoBorder}>{label}</div>
);

const CalculationInput: React.FC<{ value?: string; onChange: (value: string) => void }> = ({ value = '', onChange }) => (
  <input className="min-h-20 w-full min-w-0 border-r border-b bg-transparent px-3 text-base text-primary outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)]" style={casinoBorder} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
);

const BlankCell: React.FC = () => <div className="min-h-20 border-r border-b" style={casinoBorder} />;
const TotalCell: React.FC<{ label: string }> = ({ label }) => <div className="min-h-14 border-r p-2 flex items-center justify-center font-bold text-[11px]" style={casinoBorder}>{label}</div>;
const BottomRow: React.FC<{ label: string; value?: string; onChange?: (value: string) => void }> = ({ label, value = '', onChange }) => <label className="grid grid-cols-[1fr_.85fr] min-h-12 border-b last:border-b-0" style={casinoBorder}><span className="px-2 py-2 font-semibold text-center border-r flex items-center justify-center text-[10px] leading-tight" style={casinoBorder}>{label}</span><input className="w-full min-w-0 bg-transparent px-2 text-sm text-primary outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent)]" inputMode="decimal" value={value} onChange={(event) => onChange?.(event.target.value)} /></label>;
const BlankBottomRow: React.FC = () => <div className="min-h-12 border-b last:border-b-0" style={casinoBorder} />;

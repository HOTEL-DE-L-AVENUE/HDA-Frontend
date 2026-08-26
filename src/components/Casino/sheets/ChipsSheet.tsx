import React from 'react';
import { ChipLine, casinoBorder, casinoCurrency, casinoInput } from './types';

interface ChipsSheetProps {
  chips: ChipLine[];
  openingTotal: number;
  closingTotal: number;
  onUpdate: (value: number, key: keyof Omit<ChipLine, 'value'>, content: string) => void;
}

export const ChipsSheet: React.FC<ChipsSheetProps> = ({ chips, openingTotal, closingTotal, onUpdate }) => (
  <div className="flex flex-col gap-7">
    <section><SheetTitle title="Fiche Poker Night — jetons" subtitle="Comptage de départ et de fermeture." /><ChipTable chips={chips} onUpdate={onUpdate} fields={['previous', 'opening', 'closing']} headers={['Valeur des jetons', 'Total de la veille', 'Valeur départ', 'Total fermeture']} /><div className="grid sm:grid-cols-2 gap-2 mt-3"><Stat label="VALEUR DÉPART" value={openingTotal} /><Stat label="VALEUR FERMETURE" value={closingTotal} /></div></section>
    <section><SheetTitle title="Total des prélèvements" subtitle="Nombre de jetons prélevés pour chaque valeur." /><ChipTable chips={chips} onUpdate={onUpdate} fields={['withdrawn']} headers={['Valeur des jetons', 'Nombre de jetons', 'Valeur totale']} /></section>
  </div>
);

const ChipTable: React.FC<{ chips: ChipLine[]; onUpdate: ChipsSheetProps['onUpdate']; fields: (keyof Omit<ChipLine, 'value'>)[]; headers: string[] }> = ({ chips, onUpdate, fields, headers }) => <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-xs border" style={casinoBorder}><thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>{headers.map((header) => <th key={header} className="p-3 text-left text-secondary border-r last:border-r-0" style={casinoBorder}>{header}</th>)}</tr></thead><tbody>{chips.map((line) => <tr key={line.value}><td className="p-2 font-semibold text-primary border-r border-b" style={casinoBorder}>{casinoCurrency.format(line.value)} Ar</td>{fields.map((field) => <td key={field} className="border-r border-b" style={casinoBorder}><input className={casinoInput} inputMode="numeric" value={line[field]} onChange={(event) => onUpdate(line.value, field, event.target.value)} /></td>)}{fields.length === 1 && <td className="p-2 text-primary border-b" style={casinoBorder}>{casinoCurrency.format(line.value * (Number(line.withdrawn) || 0))} Ar</td>}</tr>)}</tbody></table></div>;
const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }}><p className="text-muted text-[11px]">{label}</p><p className="text-primary font-bold">{casinoCurrency.format(value)} Ar</p></div>;
const SheetTitle: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => <div className="mb-4"><h2 className="text-primary text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>{title}</h2><p className="text-muted text-xs mt-1">{subtitle}</p></div>;

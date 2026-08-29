import React, { useMemo, useState } from 'react';
import { Clipboard, Download, Printer } from 'lucide-react';
import { ChipLine, PlayerLine, casinoBorder, casinoCurrency, parseCasinoAmount } from './types';
import type { CasinoRegisteredPlayer } from '../../../services/casinoTablesJeu.service';

interface DailyReportSheetProps {
  date: string;
  table: string;
  players: PlayerLine[];
  chips: ChipLine[];
  restaurantPayments: { especes: boolean; tpe: boolean };
  finals: Record<string, Record<string, string>>;
  registeredPlayers: CasinoRegisteredPlayer[];
}

const uniquePlayers = (players: PlayerLine[]) => players.filter((player, index, lines) =>
  lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index
);

const formatAmount = (value: number) => `${casinoCurrency.format(value)} Ar`;

const playerAmount = (player: PlayerLine, players: PlayerLine[]) => players
  .filter((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id))
  .reduce((total, line) => total + parseCasinoAmount(line.caves) * parseCasinoAmount(line.amount), 0);

const paymentLabel = (player: PlayerLine) => {
  const options = (() => {
    try {
      const parsed = JSON.parse(player.resultPaymentOptions || '[]');
      return Array.isArray(parsed) ? parsed.map((entry) => typeof entry === 'string' ? entry : entry?.option).filter(Boolean) : [];
    } catch {
      return [];
    }
  })();
  return options.length ? ` (${options.join(', ')})` : player.paymentMethod ? ` (${player.paymentMethod})` : '';
};

export const buildDailyReport = ({ date, table, players, chips, restaurantPayments, finals, registeredPlayers }: DailyReportSheetProps) => {
  const listedPlayers = uniquePlayers(players).filter((player) => player.name.trim() || playerAmount(player, players) > 0);
  const playingRegisteredIds = new Set(players.map((player) => player.casinoPlayerId).filter((id): id is number => Number.isInteger(id)));
  const waitingPlayers = registeredPlayers.filter((player) => player.statut === 'ACTIF'
    && player.mode_jeu === 'EN_ATTENTE'
    && !playingRegisteredIds.has(player.id));
  const totalCaves = listedPlayers.reduce((total, player) => total + playerAmount(player, players), 0);
  const withdrawn = chips.reduce((total, chip) => total + chip.value * parseCasinoAmount(chip.withdrawn), 0);
  const tpePlayers = listedPlayers.filter((player) => player.paymentMethod.toLowerCase().includes('tpe'));
  const finalValues = (key: string) => Object.values(finals)
    .map((values) => ({ values, amount: parseCasinoAmount(values?.[key]) }))
    .filter(({ amount }) => amount > 0)
    .map(({ values, amount }) => `${formatAmount(amount)}${values?.name ? ` (${values.name})` : ''}`)
    .join(' - ');
  const finalValue = (key: string) => finalValues(key);
  const lines = [
    `Rapport du ${date.split('-').reverse().join('/')}`,
    '',
    `Table : ${table}`,
    '',
    `# Nombre joueurs : ${listedPlayers.length}`,
    ...listedPlayers.map((player) => {
      const amount = playerAmount(player, players);
      const status = player.payment === 'Non payé' || player.paymentMethod.toLowerCase() === 'np' ? ' np' : '';
      return `${player.name.trim() || `Joueur ${player.ficheId ?? player.id}`} : ${formatAmount(amount)}${status}${paymentLabel(player)}`;
    }),
    '',
    '# Sit out :',
    '',
    '# Joueur sortie :',
    '',
    '# Joueurs en attente :',
    ...(waitingPlayers.length ? waitingPlayers.map((player) => `${player.nom} ${player.prenom || ''}`.trim()) : ['']),
    '# Mobil :',
    '',
    '# TPE :',
    ...(tpePlayers.length ? tpePlayers.map((player) => `${formatAmount(playerAmount(player, players))} (${player.name})`) : restaurantPayments.tpe ? ['À préciser'] : ['']),
    '',
    '# Offert :', '',
    '# Bonus :',
    ...listedPlayers.flatMap((player) => player.bonuses ? [`${player.name} : ${player.bonuses}`] : []),
    '',
    '# Euro / Dollars :', '',
    '# Chèque :', '',
    '# Crédit :', finalValue('credit'),
    '# Crédit payé :', '',
    '# Dépôt :', finalValue('depot'),
    '# Dépôt payé :', '',
    '# Bar et Resto :',
    ...(restaurantPayments.especes ? ['Espèces'] : []),
    ...(restaurantPayments.tpe ? ['TPE'] : []),
    '',
    '# Prolongation :', finalValue('prolongation'),
    '# PB :', finalValue('pourboires'),
    '# Retrait :', `Total prélèvements jetons : ${formatAmount(withdrawn)}`,
    '',
    '# Bureau :', '',
    '# Devis :', '',
    '# Espece :', finalValue('especes') || `Total caves : ${formatAmount(totalCaves)}`,
  ];
  return lines.join('\n');
};

export const DailyReportSheet: React.FC<DailyReportSheetProps> = (props) => {
  const [copied, setCopied] = useState(false);
  const report = useMemo(() => buildDailyReport(props), [props]);

  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-casino-${props.date}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <section className="flex flex-col gap-4">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
      <div><h2 className="text-primary text-xl font-bold">Rapport journalier</h2><p className="text-muted text-xs mt-1">Généré automatiquement à partir de la fiche de jeu.</p></div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" className="action secondary" onClick={copyReport}><Clipboard size={15} /> {copied ? 'Copié' : 'Copier'}</button>
        <button type="button" className="action secondary" onClick={downloadReport}><Download size={15} /> Télécharger</button>
        <button type="button" className="action" onClick={() => window.print()}><Printer size={15} /> Imprimer</button>
      </div>
    </div>
    <textarea readOnly value={report} aria-label="Rapport journalier généré" className="w-full min-h-[680px] rounded-xl p-4 text-sm leading-6 text-primary outline-none resize-y" style={{ backgroundColor: 'var(--color-bg)', ...casinoBorder }} />
  </section>;
};
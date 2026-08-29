import React, { useState } from 'react';
import { Edit2, Play, Trash2 } from 'lucide-react';
import { PlayerLine, casinoBorder } from './types';
import { CasinoRegisteredPlayer } from '../../../services/casinoTablesJeu.service';
import { Modal } from '../common';

interface PlayerSetupSheetProps {
  players: PlayerLine[];
  isAdmin: boolean;
  canManageGame: boolean;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  onUpdate: (id: number, key: keyof PlayerLine, value: string) => void;
  onAdd: () => void;
  onRemove: (ficheId: number) => void;
  onSave: () => void;
  registeredPlayers: CasinoRegisteredPlayer[];
  onRegister: (player: { nom: string; prenom: string; email: string; telephone: string; date_inscription: string; depot: string; credit: string; mode_jeu: 'EN_ATTENTE' | 'EN_JEU' }) => Promise<void>;
  onPlay: (player: CasinoRegisteredPlayer, deposit?: string, credit?: string) => Promise<void>;
  onDeleteRegisteredPlayer?: (player: CasinoRegisteredPlayer) => Promise<void>;
  onUpdateRegisteredPlayer: (id: number, player: Partial<CasinoRegisteredPlayer>) => Promise<void>;
}

const inputClass = 'w-full rounded border bg-transparent px-2 py-2 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60';

export const PlayerSetupSheet: React.FC<PlayerSetupSheetProps> = ({ players, isAdmin, canManageGame, saveState = 'idle', onUpdate, onAdd, onRemove, onSave, registeredPlayers = [], onRegister, onPlay, onDeleteRegisteredPlayer, onUpdateRegisteredPlayer }) => {
  const playerList = players.filter((player, index, lines) => Boolean(player.casinoPlayerId || player.name.trim()) && lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index);
  const emptyPlayer = { nom: '', prenom: '', email: '', telephone: '', date_inscription: new Date().toISOString().slice(0, 10), depot: '', credit: '', mode_jeu: 'EN_ATTENTE' as const };
  const [newPlayer, setNewPlayer] = useState(emptyPlayer);
  const [amounts, setAmounts] = useState<Record<number, { deposit: string; credit: string }>>({});
  const [error, setError] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<CasinoRegisteredPlayer | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const register = async () => {
    if (!newPlayer.nom.trim()) { setError('Le nom du joueur est obligatoire.'); return; }
    try { setError(''); await onRegister(newPlayer); setNewPlayer(emptyPlayer); setShowRegistrationModal(false); } catch { setError('Impossible d’enregistrer le joueur.'); }
  };

  const play = async (player: CasinoRegisteredPlayer) => {
    const amount = amounts[player.id] || { deposit: String(player.depot || ''), credit: String(player.credit || '') };
    try { setError(''); await onPlay(player, amount.deposit, amount.credit); } catch { setError('Impossible d’ajouter ce joueur à la partie.'); }
  };

  const savePlayerChanges = async () => {
    if (!editingPlayer) return;
    try {
      setError('');
      await onUpdateRegisteredPlayer(editingPlayer.id, editingPlayer);
      setEditingPlayer(null);
    } catch {
      setError('Impossible de modifier ce joueur.');
    }
  };

  return <div className="p-2 text-white sm:p-3">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-bold">Joueurs — début de jeu</h2><p className="text-sm text-muted">Renseignez les coordonnées et la situation initiale de chaque joueur.</p></div>
      {canManageGame && <button type="button" className="action secondary self-start sm:self-auto" onClick={onAdd}>Ajouter une ligne libre</button>}
    </div>
    {canManageGame && <div className="mb-5 flex justify-end"><button type="button" className="action" onClick={() => { setError(''); setShowRegistrationModal(true); }}>Inscrire un joueur</button></div>}

    {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

    <h3 className="mb-2 font-semibold">Joueurs inscrits</h3>
    <div className="mb-5 overflow-x-auto rounded-xl border" style={casinoBorder}>
      <table className="w-full min-w-[820px] border-collapse text-xs sm:text-sm"><thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>
        <th className="border p-2 text-left" style={casinoBorder}>Joueur</th><th className="border p-2 text-left" style={casinoBorder}>E-mail</th><th className="border p-2 text-left" style={casinoBorder}>Inscrit le</th><th className="border p-2 text-left" style={casinoBorder}>Dépôt de la partie</th><th className="border p-2 text-left" style={casinoBorder}>Crédit de la partie</th>{isAdmin && <th className="border p-2 text-center" style={casinoBorder}>Action</th>}
      </tr></thead><tbody>{registeredPlayers.map((player) => {
        const amount = amounts[player.id] || { deposit: String(player.depot || ''), credit: String(player.credit || '') };
        const alreadyPlaying = playerList.some((line) => line.casinoPlayerId === player.id);
        return <tr key={player.id}><td className="border p-2" style={casinoBorder}>{player.nom} {player.prenom || ''}</td><td className="border p-2" style={casinoBorder}>{player.email || '—'}</td><td className="border p-2" style={casinoBorder}>{player.date_inscription ? new Date(player.date_inscription).toLocaleDateString('fr-FR') : '—'}</td><td className="border p-2 text-right" style={casinoBorder}>{amount.deposit || '0'}</td><td className="border p-2 text-right" style={casinoBorder}>{amount.credit || '0'}</td>{isAdmin && <td className="border p-1 text-center" style={casinoBorder}><div className="flex items-center justify-center gap-2"><span className="text-xs text-muted">{alreadyPlaying ? 'En jeu' : 'En attente'}</span><button type="button" className="rounded p-2 text-yellow-300 hover:text-yellow-200" title="Modifier le joueur" onClick={() => setEditingPlayer({ ...player, date_inscription: player.date_inscription?.slice(0, 10) || '' })}><Edit2 size={16} /></button><button type="button" className="rounded p-2 text-red-400 hover:text-red-300" title="Supprimer le joueur" aria-label={`Supprimer ${player.nom}`} onClick={() => window.confirm(`Supprimer ${player.nom} ${player.prenom || ''} ?`) && void onDeleteRegisteredPlayer?.(player)}><Trash2 size={16} /></button>{!alreadyPlaying && <button type="button" className="rounded p-2 text-green-400 hover:text-green-300" title="Faire jouer le joueur en attente" aria-label={`Faire jouer ${player.nom}`} onClick={() => play(player)}><Play size={16} /></button>}</div></td>}</tr>;
      })}</tbody></table>
    </div>
    {canManageGame && !isAdmin && registeredPlayers.some((player) => !playerList.some((line) => line.casinoPlayerId === player.id)) && <div className="mb-5 flex flex-wrap gap-2"><span className="self-center text-xs text-muted">Ajouter à la partie :</span>{registeredPlayers.filter((player) => !playerList.some((line) => line.casinoPlayerId === player.id)).map((player) => <button key={player.id} type="button" className="action secondary text-xs" onClick={() => play(player)}><Play size={14} /> {player.nom} {player.prenom || ''}</button>)}</div>}
    <h3 className="mb-2 font-semibold">Joueurs de la partie</h3>

    <div className="overflow-x-auto rounded-xl border" style={casinoBorder}>
      <table className="w-full min-w-[760px] border-collapse text-xs sm:text-sm">
        <thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>
          <th className="border p-2 text-left" style={casinoBorder}>Joueur</th>
          <th className="border p-2 text-left" style={casinoBorder}>E-mail (récapitulatif)</th>
          <th className="border p-2 text-left" style={casinoBorder}>Dépôt initial (Ar)</th>
          <th className="border p-2 text-left" style={casinoBorder}>Crédit initial (Ar)</th>
          {isAdmin && <th className="border p-2 text-center" style={casinoBorder}>Action</th>}
        </tr></thead>
        <tbody>{playerList.map((player) => {
          const ficheId = player.ficheId ?? player.id;
          return <tr key={ficheId}>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} value={player.name} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'name', event.target.value)} placeholder="Nom complet" /></td>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} type="email" value={player.email || ''} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'email', event.target.value)} placeholder="joueur@email.com" /></td>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} inputMode="decimal" value={player.initialDeposit || ''} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'initialDeposit', event.target.value)} placeholder="0" /></td>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} inputMode="decimal" value={player.initialCredit || ''} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'initialCredit', event.target.value)} placeholder="0" /></td>
            {isAdmin && <td className="border p-1 text-center" style={casinoBorder}><button type="button" className="rounded p-2 text-red-400 hover:text-red-300" title="Supprimer le joueur" aria-label={`Supprimer ${player.name || 'ce joueur'}`} onClick={() => window.confirm(`Supprimer ${player.name || 'ce joueur'} et ses lignes de jeu ?`) && onRemove(ficheId)}><Trash2 size={16} /></button></td>}
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className="mt-4 flex items-center justify-end gap-3">
      {saveState === 'saved' && <span className="text-xs text-green-400">Enregistré</span>}
      {saveState === 'error' && <span className="text-xs text-red-400">Erreur d’enregistrement</span>}
      {canManageGame && <button type="button" className="action" disabled={saveState === 'saving'} onClick={() => onSave()}>{saveState === 'saving' ? 'Enregistrement...' : 'Enregistrer les joueurs'}</button>}
    </div>
    {showRegistrationModal && <Modal title="Inscrire un joueur" subtitle="Créer une fiche joueur persistante" onClose={() => setShowRegistrationModal(false)} footer={<><button type="button" className="action secondary" onClick={() => setShowRegistrationModal(false)}>Annuler</button><button type="button" className="action" onClick={register}>Inscrire le joueur</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} value={newPlayer.nom} onChange={(event) => setNewPlayer((current: any) => ({ ...current, nom: event.target.value }))} placeholder="Nom *" />
        <input className={inputClass} value={newPlayer.prenom} onChange={(event) => setNewPlayer((current: any) => ({ ...current, prenom: event.target.value }))} placeholder="Prénom" />
        <input className={inputClass} type="email" value={newPlayer.email} onChange={(event) => setNewPlayer((current: any) => ({ ...current, email: event.target.value }))} placeholder="E-mail" />
        <input className={inputClass} value={newPlayer.telephone} onChange={(event) => setNewPlayer((current: any) => ({ ...current, telephone: event.target.value }))} placeholder="Téléphone" />
        <input className={inputClass} type="date" value={newPlayer.date_inscription} onChange={(event) => setNewPlayer((current: any) => ({ ...current, date_inscription: event.target.value }))} aria-label="Date d'inscription" />
        <input className={inputClass} inputMode="decimal" value={newPlayer.depot} onChange={(event) => setNewPlayer((current: any) => ({ ...current, depot: event.target.value }))} placeholder="Dépôt initial (Ar)" />
        <input className={inputClass} inputMode="decimal" value={newPlayer.credit} onChange={(event) => setNewPlayer((current: any) => ({ ...current, credit: event.target.value }))} placeholder="Crédit initial (Ar)" />
        <select className={inputClass} value={newPlayer.mode_jeu} onChange={(event) => setNewPlayer((current) => ({ ...current, mode_jeu: event.target.value as 'EN_ATTENTE' | 'EN_JEU' }))} aria-label="Mode du joueur">
          <option value="EN_ATTENTE">Joueur en attente</option>
          <option value="EN_JEU">Joueur à jouer maintenant</option>
        </select>
      </div>
    </Modal>}
    {editingPlayer && <Modal title={`Modifier ${editingPlayer.nom}`} subtitle="Mettre à jour la fiche joueur" onClose={() => setEditingPlayer(null)} footer={<><button type="button" className="action secondary" onClick={() => setEditingPlayer(null)}>Annuler</button><button type="button" className="action" onClick={savePlayerChanges}>Enregistrer les modifications</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} value={editingPlayer.nom} onChange={(event) => setEditingPlayer((current) => current ? { ...current, nom: event.target.value } : current)} placeholder="Nom" />
        <input className={inputClass} value={editingPlayer.prenom || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, prenom: event.target.value } : current)} placeholder="Prénom" />
        <input className={inputClass} type="email" value={editingPlayer.email || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, email: event.target.value } : current)} placeholder="E-mail" />
        <input className={inputClass} value={editingPlayer.telephone || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, telephone: event.target.value } : current)} placeholder="Téléphone" />
        <input className={inputClass} type="date" value={editingPlayer.date_inscription || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, date_inscription: event.target.value } : current)} />
        <input className={inputClass} inputMode="decimal" value={String(editingPlayer.depot || '')} onChange={(event) => setEditingPlayer((current) => current ? { ...current, depot: event.target.value } : current)} placeholder="Dépôt (Ar)" />
        <input className={inputClass} inputMode="decimal" value={String(editingPlayer.credit || '')} onChange={(event) => setEditingPlayer((current) => current ? { ...current, credit: event.target.value } : current)} placeholder="Crédit (Ar)" />
      </div>
    </Modal>}
  </div>;
};

import React, { useEffect, useState } from 'react';
import { Edit2, Eye, Play, Search, Trash2 } from 'lucide-react';
import { PlayerLine, casinoBorder, parseCasinoAmount } from './types';
import { CasinoRegisteredPlayer } from '../../../services/casinoTablesJeu.service';
import { Modal } from '../common';
import uploadService from '../../../services/upload.service';
import { useToast } from '../../../context/ToastContext';

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
  onRegister: (player: { nom: string; prenom: string; surnom: string; whatsapp: string; telephone: string; identite_type: string; identite_numero: string; identite_nom_complet: string; identite_date_emission: string; identite_verifiee: boolean; identite_fichiers_urls: string; date_inscription: string; depot: string; credit: string; mode_jeu: 'EN_ATTENTE' | 'EN_JEU' }) => Promise<void>;
  onPlay: (player: CasinoRegisteredPlayer, deposit?: string, credit?: string) => Promise<void>;
  onDeleteRegisteredPlayer?: (player: CasinoRegisteredPlayer) => Promise<void>;
  onUpdateRegisteredPlayer: (id: number, player: Partial<CasinoRegisteredPlayer>) => Promise<void>;
}

const inputClass = 'w-full rounded border bg-transparent px-2 py-2 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60';

export const PlayerSetupSheet: React.FC<PlayerSetupSheetProps> = ({ players, isAdmin, canManageGame, saveState = 'idle', onUpdate, onAdd, onRemove, onSave, registeredPlayers = [], onRegister, onPlay, onDeleteRegisteredPlayer, onUpdateRegisteredPlayer }) => {
  const { showToast } = useToast();
  const playerList = players.filter((player, index, lines) => Boolean(player.casinoPlayerId || player.name.trim()) && lines.findIndex((line) => (line.ficheId ?? line.id) === (player.ficheId ?? player.id)) === index);
  const emptyPlayer = { nom: '', prenom: '', surnom: '', whatsapp: '', telephone: '', identite_type: 'CIN', identite_numero: '', identite_nom_complet: '', identite_date_emission: '', identite_verifiee: false, date_inscription: new Date().toISOString().slice(0, 10), depot: '', credit: '', mode_jeu: 'EN_ATTENTE' as const };
  const [newPlayer, setNewPlayer] = useState(emptyPlayer);
  const [amounts, setAmounts] = useState<Record<number, { deposit: string; credit: string }>>({});
  const [identityFiles, setIdentityFiles] = useState<File[]>([]);
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<CasinoRegisteredPlayer | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<CasinoRegisteredPlayer | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const identityFileUrls = (player: CasinoRegisteredPlayer | null) => {
    if (!player) return [];
    try {
      const parsed = JSON.parse(player.identite_fichiers_urls || '[]');
      return Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === 'string') : [];
    } catch {
      return player.identite_fichier_url ? [player.identite_fichier_url] : [];
    }
  };
  const identityFileUrl = (url: string) => `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${url}`;
  const normalizedSearch = playerSearch.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredRegisteredPlayers = registeredPlayers.filter((player) => {
    if (!normalizedSearch) return true;
    return [player.nom, player.prenom, player.surnom, player.whatsapp, player.telephone]
      .filter(Boolean)
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  useEffect(() => {
    players.forEach((player) => {
      if (!player.casinoPlayerId || parseCasinoAmount(player.initialDeposit) > 0) return;
      const registeredPlayer = registeredPlayers.find((item) => item.id === player.casinoPlayerId);
      const registeredDeposit = parseCasinoAmount(registeredPlayer?.depot);
      const paymentOptions = player.resultPaymentOptions || '';
      const depositWasPaid = paymentOptions.includes('Dépôt payé');
      if (registeredDeposit > 0 && !depositWasPaid) {
        onUpdate(player.id, 'initialDeposit', String(registeredDeposit));
      }
    });
  }, [players, registeredPlayers, onUpdate]);

  const register = async () => {
    if (!newPlayer.nom.trim()) { showToast('Le nom du joueur est obligatoire.', 'error'); return; }
    if (!newPlayer.identite_nom_complet.trim() || !newPlayer.identite_numero.trim() || !newPlayer.identite_date_emission || !newPlayer.identite_verifiee || identityFiles.length < 3) {
      showToast('L’identité complète, la confirmation et au moins 3 fichiers sont obligatoires.', 'error');
      return;
    }
    try {
      setUploadingIdentity(true);
      const uploadedFiles = await Promise.all(identityFiles.map((file) => uploadService.uploadFile(file)));
      await onRegister({ ...newPlayer, identite_fichiers_urls: JSON.stringify(uploadedFiles.map((file) => file.url)) });
      setIdentityFiles([]);
      setNewPlayer(emptyPlayer);
      setShowRegistrationModal(false);
    } catch { showToast('Impossible d’enregistrer le joueur ou sa pièce d’identité.', 'error'); }
    finally { setUploadingIdentity(false); }
  };

  const play = async (player: CasinoRegisteredPlayer) => {
    const amount = amounts[player.id] || { deposit: String(player.depot || ''), credit: String(player.credit || '') };
    try { await onPlay(player, amount.deposit, amount.credit); } catch { showToast('Impossible d’ajouter ce joueur à la partie.', 'error'); }
  };

  const savePlayerChanges = async () => {
    if (!editingPlayer) return;
    try {
      await onUpdateRegisteredPlayer(editingPlayer.id, editingPlayer);
      setEditingPlayer(null);
    } catch {
      showToast('Impossible de modifier ce joueur.', 'error');
    }
  };

  return <div className="p-2 text-white sm:p-3">
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-bold">Joueurs — début de jeu</h2><p className="text-sm text-muted">Renseignez les coordonnées et la situation initiale de chaque joueur.</p></div>
      {canManageGame && <button type="button" className="action secondary self-start sm:self-auto" onClick={onAdd}>Ajouter une ligne libre</button>}
    </div>
    {canManageGame && <div className="mb-5 flex justify-end"><button type="button" className="action" onClick={() => { setShowRegistrationModal(true); }}>Inscrire un joueur</button></div>}

    <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold">Joueurs inscrits</h3>
        <span className="rounded-full border px-3 py-1 text-xs font-semibold text-accent" style={casinoBorder}>
          Effectif inscrit : {registeredPlayers.length} joueur{registeredPlayers.length > 1 ? 's' : ''}
        </span>
      </div>
      <label className="flex w-full items-center gap-2 rounded-lg border px-2 py-1 sm:max-w-sm" style={casinoBorder}>
        <Search size={16} className="text-muted" aria-hidden="true" />
        <input className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-400" value={playerSearch} onChange={(event) => setPlayerSearch(event.target.value)} placeholder="Rechercher un joueur" aria-label="Rechercher un joueur inscrit" />
      </label>
    </div>
    <div className="mb-5 overflow-x-auto rounded-xl border" style={casinoBorder}>
      <table className="w-full min-w-[980px] border-collapse text-xs sm:text-sm"><thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>
        <th className="border p-2 text-left" style={casinoBorder}>Joueur</th><th className="border p-2 text-left" style={casinoBorder}>Surnom</th><th className="border p-2 text-left" style={casinoBorder}>WhatsApp</th><th className="border p-2 text-left" style={casinoBorder}>Inscrit le</th><th className="border p-2 text-left" style={casinoBorder}>Dépôt Avant</th><th className="border p-2 text-left" style={casinoBorder}>Crédit Avant</th>{isAdmin && <th className="border p-2 text-center" style={casinoBorder}>Action</th>}
      </tr></thead><tbody>{filteredRegisteredPlayers.map((player) => {
        const playerInGame = playerList.find((line) => line.casinoPlayerId === player.id);
        const alreadyPlaying = Boolean(playerInGame);
        const amount = amounts[player.id] || {
          deposit: playerInGame ? playerInGame.initialDeposit : String(player.depot || ''),
          credit: playerInGame ? playerInGame.initialCredit : String(player.credit || ''),
        };
        return <tr key={player.id}><td className="border p-2" style={casinoBorder}>{player.nom} {player.prenom || ''}</td><td className="border p-2" style={casinoBorder}>{player.surnom || '—'}</td><td className="border p-2" style={casinoBorder}>{player.whatsapp || '—'}</td><td className="border p-2" style={casinoBorder}>{player.date_inscription ? new Date(player.date_inscription).toLocaleDateString('fr-FR') : '—'}</td><td className="border p-2 text-right" style={casinoBorder}>{amount.deposit || '0'}</td><td className="border p-2 text-right" style={casinoBorder}>{amount.credit || '0'}</td>{isAdmin && <td className="border p-1 text-center" style={casinoBorder}><div className="flex items-center justify-center gap-2"><span className="text-xs text-muted">{alreadyPlaying ? 'En jeu' : 'En attente'}</span><button type="button" className="rounded p-2 text-cyan-300 hover:text-cyan-200" title="Voir les informations et l'identité" aria-label={`Voir ${player.nom}`} onClick={() => setViewingPlayer(player)}><Eye size={16} /></button><button type="button" className="rounded p-2 text-yellow-300 hover:text-yellow-200" title="Modifier le joueur" onClick={() => setEditingPlayer({ ...player, date_inscription: player.date_inscription?.slice(0, 10) || '' })}><Edit2 size={16} /></button><button type="button" className="rounded p-2 text-red-400 hover:text-red-300" title="Supprimer le joueur" aria-label={`Supprimer ${player.nom}`} onClick={() => window.confirm(`Supprimer ${player.nom} ${player.prenom || ''} ?`) && void onDeleteRegisteredPlayer?.(player)}><Trash2 size={16} /></button>{!alreadyPlaying && <button type="button" className="rounded p-2 text-green-400 hover:text-green-300" title="Faire jouer le joueur en attente" aria-label={`Faire jouer ${player.nom}`} onClick={() => play(player)}><Play size={16} /></button>}</div></td>}</tr>;
      })}</tbody></table>
    </div>
    {canManageGame && !isAdmin && registeredPlayers.some((player) => !playerList.some((line) => line.casinoPlayerId === player.id)) && <div className="mb-5 flex flex-wrap gap-2"><span className="self-center text-xs text-muted">Ajouter à la partie :</span>{registeredPlayers.filter((player) => !playerList.some((line) => line.casinoPlayerId === player.id)).map((player) => <button key={player.id} type="button" className="action secondary text-xs" onClick={() => play(player)}><Play size={14} /> {player.nom} {player.prenom || ''}</button>)}</div>}
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="font-semibold">Joueurs de la partie</h3>
      <span className="rounded-full border px-3 py-1 text-xs font-semibold text-accent" style={casinoBorder}>
        Effectif total : {playerList.length} joueur{playerList.length > 1 ? 's' : ''}
      </span>
    </div>

    <div className="overflow-x-auto rounded-xl border" style={casinoBorder}>
      <table className="w-full min-w-[760px] border-collapse text-xs sm:text-sm">
        <thead style={{ backgroundColor: 'var(--color-bg)' }}><tr>
          <th className="border p-2 text-left" style={casinoBorder}>Joueur</th>
          <th className="border p-2 text-left" style={casinoBorder}>Surnom</th>
          <th className="border p-2 text-left" style={casinoBorder}>WhatsApp</th>
          <th className="border p-2 text-left" style={casinoBorder}>Dépôt initial (Ar)</th>
          <th className="border p-2 text-left" style={casinoBorder}>Crédit initial (Ar)</th>
          {isAdmin && <th className="border p-2 text-center" style={casinoBorder}>Action</th>}
        </tr></thead>
        <tbody>{playerList.map((player) => {
          const ficheId = player.ficheId ?? player.id;
          return <tr key={ficheId}>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} value={player.name} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'name', event.target.value)} placeholder="Nom complet" /></td>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} value={player.surnom || ''} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'surnom', event.target.value)} placeholder="Surnom" /></td>
            <td className="border p-1" style={casinoBorder}><input className={inputClass} value={player.whatsapp || ''} disabled={!canManageGame} onChange={(event) => onUpdate(player.id, 'whatsapp', event.target.value)} placeholder="WhatsApp" /></td>
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
    {showRegistrationModal && <Modal title="Inscrire un joueur" subtitle="Créer une fiche joueur persistante avec pièce vérifiée" onClose={() => setShowRegistrationModal(false)} footer={<><button type="button" className="action secondary" onClick={() => setShowRegistrationModal(false)}>Annuler</button><button type="button" className="action" disabled={uploadingIdentity} onClick={register}>{uploadingIdentity ? 'Téléversement...' : 'Inscrire le joueur'}</button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClass} value={newPlayer.nom} onChange={(event) => setNewPlayer((current: any) => ({ ...current, nom: event.target.value }))} placeholder="Nom *" />
        <input className={inputClass} value={newPlayer.prenom} onChange={(event) => setNewPlayer((current: any) => ({ ...current, prenom: event.target.value }))} placeholder="Prénom" />
        <input className={inputClass} value={newPlayer.surnom} onChange={(event) => setNewPlayer((current: any) => ({ ...current, surnom: event.target.value }))} placeholder="Surnom" />
        <input className={inputClass} value={newPlayer.whatsapp} onChange={(event) => setNewPlayer((current: any) => ({ ...current, whatsapp: event.target.value }))} placeholder="WhatsApp" />
        <select className={inputClass} value={newPlayer.identite_type} onChange={(event) => setNewPlayer((current) => ({ ...current, identite_type: event.target.value }))} aria-label="Type de pièce"><option>CIN</option><option>Passeport</option><option>Permis de conduire</option><option>Carte d'identité nationale</option></select>
        <input className={inputClass} value={newPlayer.identite_numero} onChange={(event) => setNewPlayer((current: any) => ({ ...current, identite_numero: event.target.value }))} placeholder="N° de pièce *" />
        <input className={inputClass} value={newPlayer.identite_nom_complet} onChange={(event) => setNewPlayer((current: any) => ({ ...current, identite_nom_complet: event.target.value }))} placeholder="Nom complet sur la pièce *" />
        <input className={inputClass} type="date" value={newPlayer.identite_date_emission} onChange={(event) => setNewPlayer((current: any) => ({ ...current, identite_date_emission: event.target.value }))} aria-label="Date d'émission de la pièce" />
        <div className="col-span-full rounded-xl border p-3" style={casinoBorder}>
          <div className="mb-3"><p className="font-semibold">Pièces d’identité à téléverser</p><p className="text-xs text-muted">Ajoutez 3 fichiers obligatoires : recto, verso et justificatif complémentaire. PDF, JPG ou PNG.</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            {['Pièce 1 — Recto', 'Pièce 2 — Verso', 'Pièce 3 — Justificatif'].map((label, index) => (
              <label key={label} className={`flex min-h-28 cursor-pointer flex-col justify-between rounded-lg border p-3 transition ${identityFiles[index] ? 'border-green-400 bg-green-400/10' : 'border-dashed border-yellow-300/60 hover:bg-yellow-300/10'}`} style={casinoBorder}>
                <span className="text-xs font-semibold">{label} *</span>
                <span className="my-2 truncate text-[11px] text-muted">{identityFiles[index]?.name || 'Cliquer pour choisir un fichier'}</span>
                <input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setIdentityFiles((current) => { const next = [...current]; const file = event.target.files?.[0]; if (file) next[index] = file; return next; })} />
              </label>
            ))}
          </div>
          <p className={`mt-2 text-xs ${identityFiles.filter(Boolean).length >= 3 ? 'text-green-400' : 'text-yellow-300'}`}>{identityFiles.filter(Boolean).length}/3 fichier(s) requis</p>
        </div>
        <label className="col-span-full inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={newPlayer.identite_verifiee} onChange={(event) => setNewPlayer((current) => ({ ...current, identite_verifiee: event.target.checked }))} /> J’ai vérifié la pièce originale et confirmé l’identité du joueur *</label>
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
        <input className={inputClass} value={editingPlayer.surnom || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, surnom: event.target.value } : current)} placeholder="Surnom" />
        <input className={inputClass} value={editingPlayer.whatsapp || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, whatsapp: event.target.value } : current)} placeholder="WhatsApp" />
        <input className={inputClass} type="date" value={editingPlayer.date_inscription || ''} onChange={(event) => setEditingPlayer((current) => current ? { ...current, date_inscription: event.target.value } : current)} />
        <input className={inputClass} inputMode="decimal" value={String(editingPlayer.depot || '')} onChange={(event) => setEditingPlayer((current) => current ? { ...current, depot: event.target.value } : current)} placeholder="Dépôt (Ar)" />
        <input className={inputClass} inputMode="decimal" value={String(editingPlayer.credit || '')} onChange={(event) => setEditingPlayer((current) => current ? { ...current, credit: event.target.value } : current)} placeholder="Crédit (Ar)" />
      </div>
    </Modal>}
    {viewingPlayer && <Modal title={`Informations — ${viewingPlayer.surnom || viewingPlayer.nom}`} subtitle="Identité et documents vérifiés" onClose={() => setViewingPlayer(null)} footer={<button type="button" className="action secondary" onClick={() => setViewingPlayer(null)}>Fermer</button>}>
      <div className="grid gap-2 text-sm text-primary sm:grid-cols-2">
        <p><span className="text-muted">Nom :</span> {viewingPlayer.nom} {viewingPlayer.prenom || ''}</p>
        <p><span className="text-muted">Surnom :</span> {viewingPlayer.surnom || '—'}</p>
        <p><span className="text-muted">WhatsApp :</span> {viewingPlayer.whatsapp || '—'}</p>
        <p><span className="text-muted">Téléphone :</span> {viewingPlayer.telephone || '—'}</p>
        <p><span className="text-muted">Dépôt :</span> {viewingPlayer.depot || 0} Ar</p>
        <p><span className="text-muted">Crédit :</span> {viewingPlayer.credit || 0} Ar</p>
      </div>
      <div className="mt-4 rounded-lg border p-3" style={casinoBorder}>
        <p className="mb-2 font-semibold">Identité</p>
        <p className="text-sm">{viewingPlayer.identite_type || '—'} n° {viewingPlayer.identite_numero || '—'}</p>
        <p className="text-sm">Nom sur la pièce : {viewingPlayer.identite_nom_complet || '—'}</p>
        <p className="text-sm">Émise le : {viewingPlayer.identite_date_emission || '—'}</p>
        <p className={`mt-2 text-xs font-semibold ${viewingPlayer.identite_verifiee ? 'text-green-400' : 'text-red-400'}`}>{viewingPlayer.identite_verifiee ? 'Identité vérifiée' : 'Identité non vérifiée'}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">{identityFileUrls(viewingPlayer).map((url, index) => <a key={`${url}-${index}`} href={identityFileUrl(url)} target="_blank" rel="noreferrer" className="rounded border border-dashed p-3 text-center text-xs text-cyan-300 hover:bg-cyan-300/10">Voir le document {index + 1}</a>)}</div>
      </div>
    </Modal>}
  </div>;
};

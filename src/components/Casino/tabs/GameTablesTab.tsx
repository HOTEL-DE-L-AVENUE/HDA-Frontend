import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Unlock, LockKeyhole, Coins, RefreshCw, FileText, Clock, AlertTriangle, Archive, ArchiveRestore } from 'lucide-react';
import {
  SectionCard,
  Spinner,
  EmptyState,
  ErrorBanner,
  Badge,
  Button,
  Select,
} from '../common';
import { roomsApi, cashiersApi, sessionsApi } from '../../../services/casino.service';
import { tablesJeuApi } from '../../../services/casinoTablesJeu.service';
import { TableFormModal } from '../modals/TableFormModal';
import { CaveModal } from '../modals/CaveModal';
import { ProlongationModal } from '../modals/ProlongationModal';
import { PourboireModal } from '../modals/PourboireModal';
import { FeuilleTableModal } from '../modals/FeuilleTableModal';
import type { Room, Cashier, CashSession } from '../../../types/casino.types';
import type { TableJeu } from '../../../types/casinoTablesJeu.types';
import { TYPE_JEU_LABELS } from '../../../types/casinoTablesJeu.types';

type PhaseMinuteur = 'JEU_SIMPLE' | 'PROLONGATION';

interface EtatMinuteur {
  remainingMs: number;
  phase: PhaseMinuteur;
  disponible: boolean;
}

/**
 * Deux temps distincts :
 *  - Tant qu'aucune prolongation n'a encore été faite : phase JEU_SIMPLE,
 *    référence = created_at, durée = duree_jeu_simple_minutes. À expiration :
 *    label "Temps de jeu terminé", bouton Prolongation affiché pour la 1ère fois.
 *  - Dès qu'au moins une prolongation existe : phase PROLONGATION,
 *    référence = derniere_prolongation_at, durée = duree_prolongation_minutes.
 *    À expiration : label "Timeout Pour la Prolongation".
 */
function etatMinuteur(table: TableJeu, now: number): EtatMinuteur {
  const enPhaseSimple = !table.derniere_prolongation_at;
  const reference = enPhaseSimple
    ? (table.derniere_ouverture_at || table.created_at)
    : table.derniere_prolongation_at!;
  const dureeMinutes = enPhaseSimple ? table.duree_jeu_simple_minutes : table.duree_prolongation_minutes;
  const expiry = new Date(reference).getTime() + dureeMinutes * 60000;
  const remaining = expiry - now;
  return { remainingMs: remaining, phase: enPhaseSimple ? 'JEU_SIMPLE' : 'PROLONGATION', disponible: remaining <= 0 };
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export const GameTablesTab: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [activeSessions, setActiveSessions] = useState<CashSession[]>([]);
  const [tables, setTables] = useState<TableJeu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedCashierId, setSelectedCashierId] = useState<number | null>(null);

  const [showTableForm, setShowTableForm] = useState<{ table?: TableJeu | null } | null>(null);
  const [caveTarget, setCaveTarget] = useState<{ table: TableJeu; isRecave: boolean } | null>(null);
  const [prolongationTarget, setProlongationTarget] = useState<TableJeu | null>(null);
  const [pourboireTarget, setPourboireTarget] = useState<TableJeu | null>(null);
  const [feuilleTarget, setFeuilleTarget] = useState<TableJeu | null>(null);
  const [actingTableId, setActingTableId] = useState<number | null>(null);

  // Tick pour rafraîchir les décomptes de prolongation à l'écran (indépendant des appels API).
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadRoomsAndSessions() {
    const [r, c, s] = await Promise.all([roomsApi.list(), cashiersApi.list(), sessionsApi.active()]);
    setRooms(r);
    setCashiers(c);
    setActiveSessions(s);
    if (!selectedRoomId && r.length) setSelectedRoomId(r[0].id);
  }

  async function loadTables(roomId: number) {
    const t = await tablesJeuApi.list({ room_id: roomId });
    setTables(t);
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await loadRoomsAndSessions();
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement des salles.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;
    loadTables(selectedRoomId).catch((e: any) => setError(e?.message || 'Erreur de chargement des tables.'));
    const roomCashiers = cashiers.filter((c) => c.room_id === selectedRoomId);
    setSelectedCashierId(roomCashiers[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId, cashiers]);

  const roomCashiers = useMemo(() => cashiers.filter((c) => c.room_id === selectedRoomId), [cashiers, selectedRoomId]);
  const selectedSession = useMemo(
    () => activeSessions.find((s) => s.cashier_id === selectedCashierId) || null,
    [activeSessions, selectedCashierId]
  );

  async function handleToggleTable(table: TableJeu) {
    if (table.statut === 'OUVERTE') {
      // La fermeture passe d'abord par la déclaration des pourboires.
      setPourboireTarget(table);
      return;
    }
    setActingTableId(table.id);
    try {
      await tablesJeuApi.ouvrir(table.id);
      if (selectedRoomId) await loadTables(selectedRoomId);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors du changement de statut.');
    } finally {
      setActingTableId(null);
    }
  }

  async function handleCloseAfterPourboire(table: TableJeu) {
    setPourboireTarget(null);
    setActingTableId(table.id);
    try {
      await tablesJeuApi.fermer(table.id);
      if (selectedRoomId) await loadTables(selectedRoomId);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de la fermeture.');
    } finally {
      setActingTableId(null);
    }
  }

  async function handleDeleteTable(table: TableJeu) {
    if (!confirm(`Supprimer la table "${table.numero}" ?`)) return;
    try {
      await tablesJeuApi.remove(table.id);
      if (selectedRoomId) await loadTables(selectedRoomId);
    } catch (e: any) {
      // Filet de sécurité : le bouton est censé être désactivé quand a_historique
      // est vrai, mais si la donnée n'a pas été rafraîchie entre-temps, le 409
      // du serveur reste explicite plutôt que l'erreur SQL brute.
      alert(e?.response?.data?.message || e?.message || 'Suppression impossible.');
    }
  }

  async function handleArchiveTable(table: TableJeu) {
    if (!confirm(`Archiver la table "${table.numero}" ? Elle disparaîtra de la rotation active mais son historique reste consultable via "Feuille".`)) return;
    setActingTableId(table.id);
    try {
      await tablesJeuApi.archiver(table.id);
      if (selectedRoomId) await loadTables(selectedRoomId);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors de l'archivage.");
    } finally {
      setActingTableId(null);
    }
  }

  async function handleUnarchiveTable(table: TableJeu) {
    setActingTableId(table.id);
    try {
      await tablesJeuApi.desarchiver(table.id);
      if (selectedRoomId) await loadTables(selectedRoomId);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Erreur lors du désarchivage.");
    } finally {
      setActingTableId(null);
    }
  }

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) || null;

  if (loading) return <Spinner label="Chargement…" />;

  return (
    <div className="flex flex-col gap-4 w-full">
      {error && <ErrorBanner message={error} />}

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Colonne salles */}
        <SectionCard title="Salles">
          {rooms.length === 0 ? (
            <EmptyState label="Aucune salle configurée." />
          ) : (
            <div className="flex flex-col gap-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className="flex items-center justify-between gap-2 rounded-xl p-2.5 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: selectedRoomId === room.id ? 'var(--color-accent)' : 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: selectedRoomId === room.id ? '#000' : 'var(--text-primary, inherit)' }}
                  >
                    {room.nom}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Colonne tables de la salle */}
        <div className="flex flex-col gap-4">
          {selectedRoom && (
            <SectionCard
              title={`Tables de jeu — ${selectedRoom.nom}`}
              action={
                <div className="flex items-center gap-2">
                  {roomCashiers.length > 0 && (
                    <Select
                      value={selectedCashierId ?? ''}
                      onChange={(e) => setSelectedCashierId(Number(e.target.value) || null)}
                      className="text-xs py-1.5"
                    >
                      {roomCashiers.map((c) => (
                        <option key={c.id} value={c.id}>
                          Caisse {c.code}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Button className="text-xs" icon={<Plus size={14} />} onClick={() => setShowTableForm({ table: null })}>
                    Table
                  </Button>
                </div>
              }
            >
              {!selectedSession && (
                <p className="text-muted text-[11px] mb-3">
                  Aucune session de caisse ouverte pour cette salle : les caves/recaves/prolongations seront
                  désactivées tant qu'une session n'est pas ouverte (onglet « Salles »).
                </p>
              )}

              {tables.length === 0 ? (
                <EmptyState label="Aucune table de jeu configurée pour cette salle." />
              ) : (
                <div className="flex flex-col gap-2">
                  {tables.map((table) => {
                    const minuteur = etatMinuteur(table, now);

                    return (
                      <div
                        key={table.id}
                        className="flex items-center justify-between gap-2 rounded-xl p-3 flex-wrap"
                        style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-primary text-sm font-semibold truncate">{table.numero}</p>
                            <Badge tone={table.statut === 'OUVERTE' ? 'success' : table.statut === 'ARCHIVEE' ? 'warning' : 'neutral'}>
                              {table.statut}
                            </Badge>
                            {table.statut === 'OUVERTE' && minuteur.disponible && (
                              <Badge tone="danger">
                                <AlertTriangle size={11} className="inline mr-1" />
                                {minuteur.phase === 'JEU_SIMPLE' ? 'Temps de jeu terminé' : 'Timeout Pour la Prolongation'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted text-[11px]">
                            {TYPE_JEU_LABELS[table.type_jeu]} · cave min. {table.cave_minimum.toLocaleString('fr-FR')} Ar
                            {' · '}croupier {table.salaire_horaire_croupier.toLocaleString('fr-FR')} Ar/h
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {table.statut === 'ARCHIVEE' ? (
                            <>
                              <Button
                                variant="secondary"
                                className="text-[11px] py-1"
                                icon={<FileText size={12} />}
                                onClick={() => setFeuilleTarget(table)}
                              >
                                Feuille
                              </Button>
                              <Button
                                variant="secondary"
                                className="text-[11px] py-1"
                                icon={<ArchiveRestore size={12} />}
                                onClick={() => handleUnarchiveTable(table)}
                                disabled={actingTableId === table.id}
                              >
                                Désarchiver
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                className="text-[11px] py-1"
                                icon={<Coins size={12} />}
                                onClick={() => setCaveTarget({ table, isRecave: false })}
                                disabled={!selectedSession || table.statut !== 'OUVERTE'}
                              >
                                Cave
                              </Button>
                              <Button
                                variant="secondary"
                                className="text-[11px] py-1"
                                icon={<RefreshCw size={12} />}
                                onClick={() => setCaveTarget({ table, isRecave: true })}
                                disabled={!selectedSession || table.statut !== 'OUVERTE'}
                              >
                                Recave
                              </Button>

                              {/* Prolongation : masqué/inactif tant que le temps de jeu simple (1ère fois)
                                  ou le temps de la prolongation en cours n'est pas écoulé */}
                              {table.statut === 'OUVERTE' && !minuteur.disponible ? (
                                <Badge tone="neutral">
                                  <Clock size={11} className="inline mr-1" />
                                  {formatCountdown(minuteur.remainingMs)}
                                </Badge>
                              ) : (
                                <Button
                                  variant="secondary"
                                  className="text-[11px] py-1"
                                  icon={<Clock size={12} />}
                                  onClick={() => setProlongationTarget(table)}
                                  disabled={!selectedSession || table.statut !== 'OUVERTE'}
                                >
                                  Prolongation
                                </Button>
                              )}

                              <Button
                                variant="secondary"
                                className="text-[11px] py-1"
                                icon={<FileText size={12} />}
                                onClick={() => setFeuilleTarget(table)}
                              >
                                Feuille
                              </Button>
                              <button
                                onClick={() => handleToggleTable(table)}
                                disabled={actingTableId === table.id}
                                className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70"
                                title={table.statut === 'OUVERTE' ? 'Fermer la table' : 'Ouvrir la table'}
                              >
                                {table.statut === 'OUVERTE' ? <LockKeyhole size={14} /> : <Unlock size={14} />}
                              </button>
                              <button
                                onClick={() => setShowTableForm({ table })}
                                className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70"
                              >
                                <Pencil size={14} />
                              </button>

                              {/* Suppression bloquée en base (FK) dès qu'un historique existe :
                                  on propose directement "Archiver" plutôt que de laisser
                                  l'utilisateur se prendre l'erreur SQL. */}
                              {table.a_historique ? (
                                <button
                                  onClick={() => handleArchiveTable(table)}
                                  disabled={actingTableId === table.id}
                                  className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70"
                                  title="Cette table a un historique (caves/prolongations/pourboires) : suppression impossible, archivez-la à la place."
                                >
                                  <Archive size={14} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeleteTable(table)}
                                  className="w-7 h-7 rounded flex items-center justify-center hover:opacity-70"
                                  title="Supprimer la table"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          )}
        </div>
      </div>

      {/* Modales */}
      {showTableForm && selectedRoom && (
        <TableFormModal
          room={selectedRoom}
          table={showTableForm.table}
          onClose={() => setShowTableForm(null)}
          onSuccess={() => {
            setShowTableForm(null);
            if (selectedRoomId) loadTables(selectedRoomId);
          }}
        />
      )}

      {caveTarget && selectedSession && (
        <CaveModal
          table={caveTarget.table}
          sessionId={selectedSession.id}
          isRecave={caveTarget.isRecave}
          onClose={() => setCaveTarget(null)}
          onSuccess={() => {
            setCaveTarget(null);
            if (selectedRoomId) loadTables(selectedRoomId);
          }}
        />
      )}

      {prolongationTarget && selectedSession && (
        <ProlongationModal
          table={prolongationTarget}
          sessionId={selectedSession.id}
          onClose={() => setProlongationTarget(null)}
          onSuccess={() => {
            setProlongationTarget(null);
            if (selectedRoomId) loadTables(selectedRoomId); // recharge derniere_prolongation_at -> reset du timer
          }}
        />
      )}

      {pourboireTarget && selectedSession && (
        <PourboireModal
          table={pourboireTarget}
          sessionId={selectedSession.id}
          onClose={() => setPourboireTarget(null)}
          onDone={() => handleCloseAfterPourboire(pourboireTarget)}
        />
      )}

      {feuilleTarget && <FeuilleTableModal table={feuilleTarget} onClose={() => setFeuilleTarget(null)} />}
    </div>
  );
};

export default GameTablesTab;
import React, { useEffect, useState } from 'react';
import { RefreshCw, Link2, ShieldCheck, ArrowRightLeft, Check, X } from 'lucide-react';
import {
  SectionCard,
  Spinner,
  EmptyState,
  ErrorBanner,
  Badge,
  Button,
  Field,
  TextInput,
  Select,
  formatAriary,
  formatDateTime,
} from '../common';
import { sessionsApi, reportsApi } from '../../../services/casino.service';
import { caisseTransfersApi } from '../../../services/caisseTransfers.service';
import type { CashSession, EcartCaisseRow, FluxASynchroniserRow } from '../../../types/casino.types';
import type { CaisseTransfer, StatutCaisseTransfer } from '../../../types/caisseTransfers.types';
import { MODULE_CAISSE_LABELS, STATUT_TRANSFER_LABELS } from '../../../types/caisseTransfers.types';

export const CaisseTab: React.FC = () => {
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [ecarts, setEcarts] = useState<EcartCaisseRow[]>([]);
  const [flux, setFlux] = useState<FluxASynchroniserRow[]>([]);
  const [transfers, setTransfers] = useState<CaisseTransfer[]>([]);
  const [transferStatutFilter, setTransferStatutFilter] = useState<StatutCaisseTransfer | ''>('');
  const [salleFilter, setSalleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingTransferId, setActingTransferId] = useState<number | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, ec, fl, tr] = await Promise.all([
        sessionsApi.list(),
        reportsApi.ecartsCaisse({ salle: salleFilter || undefined }),
        reportsApi.fluxASynchroniser(),
        caisseTransfersApi.list({ statut: transferStatutFilter || undefined, limit: 50 }),
      ]);
      setSessions(s);
      setEcarts(ec);
      setFlux(fl);
      setTransfers(tr);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement de la caisse globale.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferStatutFilter]);

  async function handleConfirmTransfer(t: CaisseTransfer) {
    setActingTransferId(t.id);
    try {
      await caisseTransfersApi.confirm(t.id);
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors de la confirmation.');
    } finally {
      setActingTransferId(null);
    }
  }

  async function handleRejectTransfer(t: CaisseTransfer) {
    const motif = window.prompt('Motif du refus :') || undefined;
    setActingTransferId(t.id);
    try {
      await caisseTransfersApi.reject(t.id, { motif_refus: motif });
      await loadAll();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur lors du refus.');
    } finally {
      setActingTransferId(null);
    }
  }

  if (loading) return <Spinner label="Chargement…" />;

  return (
    <div className="flex flex-col gap-4 w-full">
      {error && <ErrorBanner message={error} />}

      <SectionCard
        title="Principe : source unique"
        action={<ShieldCheck size={16} className="text-muted" />}
      >
        <p className="text-muted text-xs">
          La caisse casino est la source unique de vérité pour ses mouvements. Chaque écriture (entrée, sortie,
          opération, mouvement de jetons) est transmise au module financier global d'HDA via un événement interne,
          avec une référence de liaison <code>ref_flux_global</code>. Aucune double saisie n'est nécessaire ; en cas
          d'échec du webhook, la liste ci-dessous permet une réconciliation par lot.
        </p>
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Écarts de caisse"
          action={
            <div className="flex items-center gap-2">
              <TextInput
                placeholder="Filtrer par salle…"
                value={salleFilter}
                onChange={(e) => setSalleFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadAll()}
                className="text-xs py-1.5 w-40"
              />
              <Button variant="secondary" className="text-xs" icon={<RefreshCw size={14} />} onClick={loadAll}>
                Filtrer
              </Button>
            </div>
          }
        >
          {ecarts.length === 0 ? (
            <EmptyState label="Aucun écart trouvé." />
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {ecarts.map((row) => (
                <div
                  key={row.session_id}
                  className="rounded-xl p-3 text-xs"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-primary font-semibold">
                      {row.caisse} · {row.salle}
                    </p>
                    <Badge tone={!row.ecart ? 'success' : row.ecart > 0 ? 'info' : 'danger'}>
                      {row.ecart == null ? '—' : `${row.ecart > 0 ? '+' : ''}${formatAriary(row.ecart)}`}
                    </Badge>
                  </div>
                  <p className="text-muted">
                    Théorique {formatAriary(row.fond_final_theorique)} · Déclaré {formatAriary(row.fond_final_declare)}
                  </p>
                  <p className="text-muted">
                    {formatDateTime(row.ouverture_at)} → {formatDateTime(row.fermeture_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Historique des sessions">
          {sessions.length === 0 ? (
            <EmptyState label="Aucune session enregistrée." />
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl p-2.5 text-xs"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                >
                  <div>
                    <p className="text-primary font-medium">Session #{s.id} · caisse {s.cashier_id}</p>
                    <p className="text-muted">
                      {formatDateTime(s.ouverture_at)} {s.fermeture_at ? `→ ${formatDateTime(s.fermeture_at)}` : ''}
                    </p>
                  </div>
                  <Badge tone={s.statut === 'OUVERTE' ? 'success' : 'neutral'}>{s.statut}</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Transferts inter-caisses"
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-2">
              <Select
                value={transferStatutFilter}
                onChange={(e) => setTransferStatutFilter(e.target.value as StatutCaisseTransfer | '')}
                className="text-xs py-1.5 w-40"
              >
                <option value="">Tous statuts</option>
                {Object.entries(STATUT_TRANSFER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" className="text-xs" icon={<ArrowRightLeft size={14} />} onClick={loadAll}>
                Rafraîchir
              </Button>
            </div>
          }
        >
          {transfers.length === 0 ? (
            <EmptyState label="Aucun transfert inter-caisses." />
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {transfers.map((t) => {
                const actionnableIci = t.statut === 'EN_ATTENTE' && t.module_destination === 'CASINO';
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl p-3 text-xs"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                  >
                    <div className="min-w-0">
                      <p className="text-primary font-semibold">
                        {MODULE_CAISSE_LABELS[t.module_source]} (#{t.session_source_id}) → {MODULE_CAISSE_LABELS[t.module_destination]} (#{t.session_destination_id})
                      </p>
                      <p className="text-muted">
                        {formatAriary(t.montant)} · {t.motif || 'sans motif'} · {formatDateTime(t.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        tone={
                          t.statut === 'CONFIRME' ? 'success' : t.statut === 'REFUSE' ? 'danger' : t.statut === 'ANNULE' ? 'neutral' : 'warning'
                        }
                      >
                        {STATUT_TRANSFER_LABELS[t.statut]}
                      </Badge>
                      {actionnableIci && (
                        <>
                          <Button
                            className="text-[11px] py-1"
                            icon={<Check size={12} />}
                            onClick={() => handleConfirmTransfer(t)}
                            disabled={actingTransferId === t.id}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="secondary"
                            className="text-[11px] py-1"
                            icon={<X size={12} />}
                            onClick={() => handleRejectTransfer(t)}
                            disabled={actingTransferId === t.id}
                          >
                            Refuser
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Flux à synchroniser"
          className="lg:col-span-2"
          action={
            <Button variant="secondary" className="text-xs" icon={<Link2 size={14} />} onClick={loadAll}>
              Rafraîchir
            </Button>
          }
        >
          {flux.length === 0 ? (
            <EmptyState label="Tout est synchronisé avec le module financier global." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted text-left">
                    <th className="py-1.5 pr-2">Source</th>
                    <th className="py-1.5 pr-2">ID</th>
                    <th className="py-1.5 pr-2">Référence flux global</th>
                    <th className="py-1.5 pr-2 text-right">Montant</th>
                    <th className="py-1.5 text-right">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {flux.map((row, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td className="py-1.5 pr-2 text-primary">{row.source}</td>
                      <td className="py-1.5 pr-2 text-muted">#{row.id}</td>
                      <td className="py-1.5 pr-2 text-muted font-mono">{row.ref_flux_global}</td>
                      <td className="py-1.5 pr-2 text-right text-primary font-semibold">{formatAriary(row.montant)}</td>
                      <td className="py-1.5 text-right text-muted">{formatDateTime(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default CaisseTab;
import React, { useEffect, useState } from 'react';
import { RefreshCw, Link2, ShieldCheck } from 'lucide-react';
import {
  SectionCard,
  Spinner,
  EmptyState,
  ErrorBanner,
  Badge,
  Button,
  Field,
  TextInput,
  formatAriary,
  formatDateTime,
} from '../common';
import { sessionsApi, reportsApi } from '../../../services/casino.service';
import type { CashSession, EcartCaisseRow, FluxASynchroniserRow } from '../../../types/casino.types';

export const CaisseTab: React.FC = () => {
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [ecarts, setEcarts] = useState<EcartCaisseRow[]>([]);
  const [flux, setFlux] = useState<FluxASynchroniserRow[]>([]);
  const [salleFilter, setSalleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [s, ec, fl] = await Promise.all([
        sessionsApi.list(),
        reportsApi.ecartsCaisse({ salle: salleFilter || undefined }),
        reportsApi.fluxASynchroniser(),
      ]);
      setSessions(s);
      setEcarts(ec);
      setFlux(fl);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement de la caisse globale.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

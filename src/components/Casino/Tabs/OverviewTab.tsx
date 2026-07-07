import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { CasinoSharedProps } from '../shared-props';
import {
  fetchProduitNet,
  fetchEcartsCaisse,
  fetchEncoursCredit,
  fetchFluxASynchroniser,
} from '../../../services/casino.service';
import type { ProduitNetRow, EcartCaisseRow, EncoursCreditRow, FluxASynchroniserRow } from '../types';
import { formatCurrency } from '../../../utils/data';

const Card: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div className="rounded-2xl p-4 md:p-5 w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-primary font-semibold text-sm">{title}</h4>
      {action}
    </div>
    {children}
  </div>
);

export const OverviewTab: React.FC<CasinoSharedProps> = ({ dashboard }) => {
  const [produitNet, setProduitNet] = useState<ProduitNetRow[]>([]);
  const [ecarts, setEcarts] = useState<EcartCaisseRow[]>([]);
  const [encours, setEncours] = useState<EncoursCreditRow[]>([]);
  const [flux, setFlux] = useState<FluxASynchroniserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReports = () => {
    setLoading(true);
    Promise.all([
      fetchProduitNet().then(setProduitNet).catch(() => setProduitNet([])),
      fetchEcartsCaisse().then(setEcarts).catch(() => setEcarts([])),
      fetchEncoursCredit().then(setEncours).catch(() => setEncours([])),
      fetchFluxASynchroniser().then(setFlux).catch(() => setFlux([])),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-4">
      {dashboard && dashboard.incidents_ouverts > 0 && (
        <div
          className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
        >
          <AlertTriangle size={16} />
          {dashboard.incidents_ouverts} incident(s) ouvert(s) à traiter.
        </div>
      )}

      <Card
        title="Produit net par salle"
        action={
          <button onClick={loadReports} className="text-muted hover:text-primary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      >
        {produitNet.length === 0 ? (
          <p className="text-muted text-xs">Aucune donnée sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted text-left">
                  <th className="py-1 pr-3">Salle</th>
                  <th className="py-1 pr-3">Jour</th>
                  <th className="py-1 pr-3">Entrées</th>
                  <th className="py-1 pr-3">Sorties</th>
                  <th className="py-1">Produit net</th>
                </tr>
              </thead>
              <tbody>
                {produitNet.map((row, i) => (
                  <tr key={i} className="text-primary border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-1.5 pr-3">{row.salle}</td>
                    <td className="py-1.5 pr-3">{row.jour}</td>
                    <td className="py-1.5 pr-3">{formatCurrency(row.total_entrees)}</td>
                    <td className="py-1.5 pr-3">{formatCurrency(row.total_sorties)}</td>
                    <td className="py-1.5 font-semibold">{formatCurrency(row.produit_net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Écarts de caisse">
        {ecarts.length === 0 ? (
          <p className="text-muted text-xs">Aucun écart enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted text-left">
                  <th className="py-1 pr-3">Caisse</th>
                  <th className="py-1 pr-3">Salle</th>
                  <th className="py-1 pr-3">Théorique</th>
                  <th className="py-1 pr-3">Déclaré</th>
                  <th className="py-1">Écart</th>
                </tr>
              </thead>
              <tbody>
                {ecarts.map((row) => (
                  <tr key={row.session_id} className="text-primary border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="py-1.5 pr-3">{row.caisse}</td>
                    <td className="py-1.5 pr-3">{row.salle}</td>
                    <td className="py-1.5 pr-3">{formatCurrency(row.fond_final_theorique)}</td>
                    <td className="py-1.5 pr-3">{row.fond_final_declare != null ? formatCurrency(row.fond_final_declare) : '—'}</td>
                    <td
                      className="py-1.5 font-semibold"
                      style={{ color: row.ecart && row.ecart !== 0 ? 'var(--color-danger)' : undefined }}
                    >
                      {row.ecart != null ? formatCurrency(row.ecart) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Encours de crédit par client">
          {encours.length === 0 ? (
            <p className="text-muted text-xs">Aucun encours actif.</p>
          ) : (
            <div className="space-y-2">
              {encours.map((row) => (
                <div key={row.client_id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-primary font-medium">{row.client}</p>
                    <p className="text-muted">{row.nb_credits_actifs} crédit(s) actif(s) · échéance {row.prochaine_echeance || '—'}</p>
                  </div>
                  <p className="text-primary font-semibold">{formatCurrency(row.encours_total)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Flux à synchroniser">
          {flux.length === 0 ? (
            <p className="text-muted text-xs">Tout est synchronisé.</p>
          ) : (
            <div className="space-y-2">
              {flux.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-primary font-medium">{row.source} #{row.id}</p>
                    <p className="text-muted">{row.ref_flux_global} · {row.created_at}</p>
                  </div>
                  <p className="text-primary font-semibold">{formatCurrency(row.montant)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

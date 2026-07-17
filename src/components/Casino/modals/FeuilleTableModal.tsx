import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import { Modal, Spinner, ErrorBanner, Badge, Button, formatAriary, formatDateTime } from '../common';
import { tablesJeuApi } from '../../../services/casinoTablesJeu.service';
import type { TableJeu, FeuilleTable } from '../../../types/casinoTablesJeu.types';

interface FeuilleTableModalProps {
  table: TableJeu;
  date?: string; // YYYY-MM-DD, défaut aujourd'hui
  onClose: () => void;
}

export const FeuilleTableModal: React.FC<FeuilleTableModalProps> = ({ table, date, onClose }) => {
  const [feuille, setFeuille] = useState<FeuilleTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const f = await tablesJeuApi.feuille(table.id, { date });
        setFeuille(f);
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement de la feuille de table.');
      } finally {
        setLoading(false);
      }
    })();
  }, [table.id, date]);

  return (
    <Modal
      title={`Feuille de table — ${table.numero}`}
      subtitle={
        feuille
          ? `${feuille.date} · jeu simple ${feuille.table.duree_jeu_simple_minutes} min · prolongation ${feuille.table.duree_prolongation_minutes} min`
          : undefined
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          <Button icon={<Printer size={16} />} onClick={() => window.print()} disabled={!feuille}>
            Imprimer
          </Button>
        </>
      }
    >
      {loading ? (
        <Spinner label="Chargement…" />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !feuille ? null : (
        <div className="flex flex-col gap-5">
          {/* Caves / recaves */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted text-left" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="py-1.5 pr-2">Joueur</th>
                  <th className="py-1.5 pr-2">N° adhérent</th>
                  <th className="py-1.5 pr-2">Heure arrivée</th>
                  <th className="py-1.5 pr-2">Heure</th>
                  <th className="py-1.5 pr-2 text-right">Nb caves</th>
                  <th className="py-1.5 pr-2 text-right">Montant cave</th>
                  <th className="py-1.5 pr-2 text-right">Total caves</th>
                  <th className="py-1.5 pr-2 text-center">Payé</th>
                  <th className="py-1.5 text-center">Signature</th>
                </tr>
              </thead>
              <tbody>
                {feuille.lignes.map((l, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td className="py-1.5 pr-2 text-primary font-medium">{l.joueur}</td>
                    <td className="py-1.5 pr-2 text-muted">{l.numero_adherent || '—'}</td>
                    <td className="py-1.5 pr-2 text-muted">{l.heure_arrivee}</td>
                    <td className="py-1.5 pr-2 text-muted">{l.heure}</td>
                    <td className="py-1.5 pr-2 text-right text-muted">{l.numero_cave}</td>
                    <td className="py-1.5 pr-2 text-right text-primary font-semibold">{formatAriary(l.montant_cave)}</td>
                    <td className="py-1.5 pr-2 text-right text-primary">{formatAriary(l.montant_total_joueur)}</td>
                    <td className="py-1.5 pr-2 text-center">
                      <Badge tone={l.statut_paiement === 'PAYE' ? 'success' : 'danger'}>
                        {l.statut_paiement === 'PAYE' ? l.moyen_paiement || 'Payé' : 'Non payé'}
                      </Badge>
                    </td>
                    <td className="py-1.5 text-center">
                      <Badge tone={l.signature_presente ? 'success' : 'danger'}>
                        {l.signature_presente ? '✓' : 'Manquante'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {feuille.lignes.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-3 text-center text-muted">
                      Aucune cave enregistrée ce jour.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Prolongations */}
          <div>
            <p className="text-primary text-xs font-semibold mb-1.5">Prolongations</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted text-left" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th className="py-1.5 pr-2">Joueur</th>
                    <th className="py-1.5 pr-2">Heure</th>
                    <th className="py-1.5 pr-2 text-right">Montant</th>
                    <th className="py-1.5 pr-2 text-center">Payé</th>
                    <th className="py-1.5 text-center">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {feuille.prolongations.map((p, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td className="py-1.5 pr-2 text-primary font-medium">{p.joueur}</td>
                      <td className="py-1.5 pr-2 text-muted">{formatDateTime(p.heure)}</td>
                      <td className="py-1.5 pr-2 text-right text-primary font-semibold">{formatAriary(p.montant)}</td>
                      <td className="py-1.5 pr-2 text-center">
                        <Badge tone={p.statut_paiement === 'PAYE' ? 'success' : 'danger'}>
                          {p.statut_paiement === 'PAYE' ? p.moyen_paiement || 'Payé' : 'Non payé'}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-center">
                        <Badge tone={p.signature_presente ? 'success' : 'danger'}>
                          {p.signature_presente ? '✓' : 'Manquante'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {feuille.prolongations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-muted">
                        Aucune prolongation ce jour.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TotalStat label="Total cashing (jetons)" value={formatAriary(feuille.totaux.total_cashing_jetons)} />
            <TotalStat label="Total caves encaissées" value={formatAriary(feuille.totaux.total_caves_encaissees)} />
            <TotalStat label="Payé — Espèces" value={formatAriary(feuille.totaux.montant_paye_especes)} />
            <TotalStat label="Payé — TPE" value={formatAriary(feuille.totaux.montant_paye_tpe)} />
            <TotalStat label="Non payé (caves)" value={formatAriary(feuille.totaux.montant_non_paye)} />
            <TotalStat label="TOTAL PROLONGATION" value={formatAriary(feuille.totaux.total_prolongation)} highlight />
            <TotalStat label="Prolongation payée" value={formatAriary(feuille.totaux.total_prolongation_payee)} />
            <TotalStat label="Prolongation non payée" value={formatAriary(feuille.totaux.total_prolongation_non_payee)} />
          </div>

          {/* Pourboires */}
          <div className="grid grid-cols-3 gap-2">
            <TotalStat label="Pourboires — Jetons" value={formatAriary(feuille.pourboires.total_jetons)} />
            <TotalStat label="Pourboires — Espèces" value={formatAriary(feuille.pourboires.total_especes)} />
            <TotalStat label="TOTAL POURBOIRES" value={formatAriary(feuille.pourboires.total)} highlight />
          </div>
        </div>
      )}
    </Modal>
  );
};

const TotalStat: React.FC<{ label: string; value: React.ReactNode; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div
    className="rounded-xl p-2.5"
    style={{
      backgroundColor: highlight ? 'var(--color-accent)' : 'var(--color-bg)',
      border: '1px solid var(--color-border)',
    }}
  >
    <p className="text-[10px]" style={{ color: highlight ? '#000' : 'var(--text-muted, inherit)' }}>{label}</p>
    <p className="font-semibold" style={{ color: highlight ? '#000' : 'var(--text-primary, inherit)' }}>{value}</p>
  </div>
);

export default FeuilleTableModal;
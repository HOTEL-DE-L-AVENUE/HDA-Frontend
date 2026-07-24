import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Modal, Spinner, ErrorBanner, Badge, Button, formatAriary, formatDateTime } from '../common';
import { tablesJeuApi } from '../../../services/casinoTablesJeu.service';
import type { TableJeu, FeuilleTable } from '../../../types/casinoTablesJeu.types';
import { TYPE_JEU_LABELS } from '../../../types/casinoTablesJeu.types';

interface FeuilleTableModalProps {
  table: TableJeu;
  date?: string; // YYYY-MM-DD, défaut aujourd'hui
  onClose: () => void;
}

/** Complète un tableau avec des lignes vides (null) jusqu'à `min` — pour reproduire
 *  les lignes pré-imprimées vierges de la fiche papier (à remplir à la main si besoin). */
function padArray<T>(arr: T[], min: number): (T | null)[] {
  if (arr.length >= min) return arr;
  return [...arr, ...Array(min - arr.length).fill(null)];
}

// AJOUT v1.1 : valeurs de jetons pour les tableaux vierges de la fiche Poker Night Kamoula
const VALEURS_JETONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];

const printTh: React.CSSProperties = { border: '1px solid #000', padding: '3px 4px', textAlign: 'left', background: '#eee', fontSize: '9px' };
const printTd: React.CSSProperties = { border: '1px solid #000', padding: '3px 4px', fontSize: '9px', height: 20 };
const printCellHeader: React.CSSProperties = { border: '1px solid #000', padding: '3px 4px', fontWeight: 700, background: '#eee', width: '25%', fontSize: '10px' };
const printCellValue: React.CSSProperties = { border: '1px solid #000', padding: '3px 4px', width: '25%', fontSize: '10px' };

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

  // Lignes vierges façon fiche papier : 20 caves, 8 prolongations, à compléter au stylo
  // si la fiche est imprimée avant la fin du service.
  const paddedLignes = feuille ? padArray(feuille.lignes, 20) : [];
  const paddedProlongations = feuille ? padArray(feuille.prolongations, 8) : [];

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
        <>
        <div className="flex flex-col gap-5 print:hidden">
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
                      {l.signature_data ? (
                        <img
                          src={l.signature_data}
                          alt="Signature"
                          className="inline-block h-6 max-w-[80px] object-contain"
                          style={{ filter: 'invert(0)' }}
                        />
                      ) : (
                        <Badge tone={l.signature_presente ? 'success' : 'danger'}>
                          {l.signature_presente ? '✓' : 'Manquante'}
                        </Badge>
                      )}
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
                        {p.signature_data ? (
                          <img
                            src={p.signature_data}
                            alt="Signature"
                            className="inline-block h-6 max-w-[80px] object-contain"
                          />
                        ) : (
                          <Badge tone={p.signature_presente ? 'success' : 'danger'}>
                            {p.signature_presente ? '✓' : 'Manquante'}
                          </Badge>
                        )}
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

        {/* Bloc imprimable uniquement — masqué à l'écran, affiché au print.
            Rendu via portail vers document.body : la Modal a un panneau interne en
            overflow-y-auto à hauteur limitée, donc un bloc absolute resté à l'intérieur
            se fait couper (les signatures en bas de fiche disparaissaient). */}
        {createPortal(
        <div className="hidden print:block text-black feuille-print-area">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .feuille-print-area, .feuille-print-area * { visibility: visible; }
              .feuille-print-area { position: absolute; left: 0; top: 0; width: 100%; }
              @page { size: A4; margin: 12mm; }
            }
          `}</style>

          <h1 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
            FICHE DE TABLE — {feuille.table.numero}
          </h1>
          <p style={{ textAlign: 'center', fontSize: 11, marginBottom: 10 }}>
            {TYPE_JEU_LABELS[feuille.table.type_jeu]} · Salle {feuille.table.salle}
          </p>

          {/* En-tête */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
            <tbody>
              <tr>
                <td style={printCellHeader}>DATE</td>
                <td style={printCellValue}>{feuille.date}</td>
                <td style={printCellHeader}>CAVE MINIMUM</td>
                <td style={printCellValue}>{formatAriary(feuille.table.cave_minimum)}</td>
              </tr>
              <tr>
                <td style={printCellHeader}>DUREE JEU SIMPLE</td>
                <td style={printCellValue}>{feuille.table.duree_jeu_simple_minutes} min</td>
                <td style={printCellHeader}>DUREE PROLONGATION</td>
                <td style={printCellValue}>{feuille.table.duree_prolongation_minutes} min</td>
              </tr>
            </tbody>
          </table>

          {/* Caves / recaves */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={printTh}>Heure arrivée</th>
                <th style={printTh}>Joueur</th>
                <th style={printTh}>N° adhérent</th>
                <th style={printTh}>Heure</th>
                <th style={printTh}>N° cave</th>
                <th style={printTh}>Montant cave</th>
                <th style={printTh}>Total joueur</th>
                <th style={printTh}>Payé</th>
                <th style={{ ...printTh, width: 90 }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {paddedLignes.map((l, idx) => (
                <tr key={idx}>
                  <td style={printTd}>{l?.heure_arrivee || ''}</td>
                  <td style={printTd}>{l?.joueur || ''}</td>
                  <td style={printTd}>{l?.numero_adherent || ''}</td>
                  <td style={printTd}>{l?.heure || ''}</td>
                  <td style={printTd}>{l ? l.numero_cave : ''}</td>
                  <td style={{ ...printTd, textAlign: 'right' }}>{l ? formatAriary(l.montant_cave) : ''}</td>
                  <td style={{ ...printTd, textAlign: 'right' }}>{l ? formatAriary(l.montant_total_joueur) : ''}</td>
                  <td style={{ ...printTd, textAlign: 'center' }}>
                    {l ? (l.statut_paiement === 'PAYE' ? (l.moyen_paiement || 'Payé') : 'Non payé') : ''}
                  </td>
                  <td style={{ ...printTd, textAlign: 'center' }}>
                    {l?.signature_data ? (
                      <img src={l.signature_data} alt="" style={{ height: 16, maxWidth: 80, objectFit: 'contain' }} />
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Prolongations */}
          <p style={{ fontSize: 11, fontWeight: 700, margin: '10px 0 4px' }}>PROLONGATIONS</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={printTh}>Heure</th>
                <th style={printTh}>Joueur</th>
                <th style={printTh}>Montant</th>
                <th style={printTh}>Payé</th>
                <th style={{ ...printTh, width: 90 }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {paddedProlongations.map((p, idx) => (
                <tr key={idx}>
                  <td style={printTd}>{p ? formatDateTime(p.heure) : ''}</td>
                  <td style={printTd}>{p?.joueur || ''}</td>
                  <td style={{ ...printTd, textAlign: 'right' }}>{p ? formatAriary(p.montant) : ''}</td>
                  <td style={{ ...printTd, textAlign: 'center' }}>
                    {p ? (p.statut_paiement === 'PAYE' ? (p.moyen_paiement || 'Payé') : 'Non payé') : ''}
                  </td>
                  <td style={{ ...printTd, textAlign: 'center' }}>
                    {p?.signature_data ? (
                      <img src={p.signature_data} alt="" style={{ height: 16, maxWidth: 80, objectFit: 'contain' }} />
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pourboires */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <tbody>
              <tr>
                <td style={printCellHeader}>POURBOIRES — JETONS</td>
                <td style={printCellValue}>{formatAriary(feuille.pourboires.total_jetons)}</td>
                <td style={printCellHeader}>POURBOIRES — ESPECES</td>
                <td style={printCellValue}>{formatAriary(feuille.pourboires.total_especes)}</td>
                <td style={printCellHeader}>TOTAL POURBOIRES</td>
                <td style={printCellValue}>{formatAriary(feuille.pourboires.total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totaux */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
            <tbody>
              <tr>
                <td style={printCellHeader}>TOTAL CASHING EN JETONS</td>
                <td style={printCellValue}>{formatAriary(feuille.totaux.total_cashing_jetons)}</td>
                <td style={printCellHeader}>TOTAL CAVES CAVEES</td>
                <td style={printCellValue}>{formatAriary(feuille.totaux.total_caves_encaissees)}</td>
              </tr>
              <tr>
                <td style={printCellHeader}>MONTANT PAYE — ESPECES</td>
                <td style={printCellValue}>{formatAriary(feuille.totaux.montant_paye_especes)}</td>
                <td style={printCellHeader}>MONTANT PAYE — TPE</td>
                <td style={printCellValue}>{formatAriary(feuille.totaux.montant_paye_tpe)}</td>
              </tr>
              <tr>
                <td style={printCellHeader}>RESTE A PAYER (non payé)</td>
                <td style={printCellValue}>{formatAriary(feuille.totaux.montant_non_paye)}</td>
                <td style={printCellHeader}>TOTAL PROLONGATION</td>
                <td style={printCellValue}>{formatAriary(feuille.totaux.total_prolongation)}</td>
              </tr>
              {/* Non suivi côté données → champs vierges à remplir à la main, comme demandé */}
              <tr>
                <td style={printCellHeader}>TOTAL BON RESTAURANT</td>
                <td style={printCellValue}>&nbsp;</td>
                <td style={printCellHeader}>TOTAL OFFERT</td>
                <td style={printCellValue}>&nbsp;</td>
              </tr>
            </tbody>
          </table>

          {/* Signatures finales */}
          <table style={{ width: '100%', marginTop: 28 }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', fontSize: 10, paddingTop: 24 }}>
                  SIGNATURE CROUPIER
                  <div style={{ marginTop: 24, borderTop: '1px solid #000', width: '80%' }} />
                </td>
                <td style={{ width: '50%', fontSize: 10, paddingTop: 24 }}>
                  SIGNATURE RESPONSABLE
                  <div style={{ marginTop: 24, borderTop: '1px solid #000', width: '80%' }} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* AJOUT v1.1 : page "Fiche Poker Night Kamoula" — deux tableaux vierges de dénombrement des jetons */}
          <div style={{ pageBreakBefore: 'always', marginTop: 20 }}>
            <h1 style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
              FICHE POKER NIGHT KAMOULA
            </h1>

            {/* Tableau 1 : total de la veille / valeur départ / total fermeture — vierge, à remplir à la main */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={printTh}>VALEURS DES JETONS</th>
                  <th style={printTh}>TOTAL DE LA VEILLE</th>
                  <th style={printTh}>VALEUR</th>
                  <th style={printTh}>VALEUR DEPART</th>
                  <th style={printTh}>TOTAL FERMETURE</th>
                </tr>
              </thead>
              <tbody>
                {VALEURS_JETONS.map((v) => (
                  <tr key={`pn1-${v}`}>
                    <td style={printTd}>{v.toLocaleString('fr-FR')}</td>
                    <td style={printTd}>&nbsp;</td>
                    <td style={printTd}>&nbsp;</td>
                    <td style={printTd}>&nbsp;</td>
                    <td style={printTd}>&nbsp;</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...printTd, fontWeight: 700, textAlign: 'center' }} colSpan={5}>
                    TOTAL
                  </td>
                </tr>
              </tbody>
            </table>

            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, margin: '6px 0' }}>
              TOTAL DES PRELEVEMENTS
            </p>

            {/* Tableau 2 : nombre de jetons / valeur totale — vierge, à remplir à la main */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={printTh}>VALEURS DES JETONS</th>
                  <th style={printTh}>&nbsp;</th>
                  <th style={printTh}>NOMBRE DE JETONS</th>
                  <th style={printTh}>VALEUR TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {VALEURS_JETONS.map((v) => (
                  <tr key={`pn2-${v}`}>
                    <td style={printTd}>{v.toLocaleString('fr-FR')}</td>
                    <td style={printTd}>&nbsp;</td>
                    <td style={printTd}>&nbsp;</td>
                    <td style={printTd}>&nbsp;</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...printTd, fontWeight: 700 }} colSpan={2}>
                    TOTAL DES PRELEVEMENTS
                  </td>
                  <td style={printTd}>&nbsp;</td>
                  <td style={printTd}>&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>,
        document.body
        )}
        </>
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
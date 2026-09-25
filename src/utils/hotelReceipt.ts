// src/utils/hotelReceipt.ts
// Tickets 80 mm (imprimante thermique) pour l'Hôtel :
//  - le ticket de la réservation (détail des prestations, déjà payé, reste à payer)
//  - l'historique des paiements (paiement initial + rectifications)
import { Reservation, ReservationExtraService, ReservationPayment } from '../types/hotel.types';
import { formatCurrency } from './data';

export interface HotelReceiptData {
  reservationId?: number;
  clientName: string;
  roomNumber: string;
  dateArrivee?: string;
  dateDepart?: string;
  typeReservation?: string;
  pdjInclus?: boolean;
  hebergement: number;
  laundry: number;
  remisePourcentage?: number;
  extras: ReservationExtraService[];
  total: number;
  montantPaye: number;
  payments: ReservationPayment[];
  rectificationLines?: Array<{ label: string; montant: number }>;
}

const paymentLabels: Record<string, string> = {
  ESPECES: 'Espèces', TPE: 'TPE', MVOLA: 'MVola', ORANGE_MONEY: 'Orange Money',
  CARTE: 'Carte bancaire', VIREMENT: 'Virement', CREDIT: 'Crédit', GRATUIT: 'Gratuit',
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatDay = (value?: string) => (value ? new Date(value).toLocaleDateString('fr-FR') : '—');
const formatDateTimeFr = (value?: string) => (value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const nightsBetween = (from?: string, to?: string) => {
  if (!from || !to) return 0;
  return Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
};

const RECEIPT_STYLE = `
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body { width: 74mm; margin: 0 auto; font-family: monospace; color: #111; font-size: 10px; line-height: 1.35; }
  .header { text-align: center; border-bottom: 1px dashed #111; padding-bottom: 6px; margin-bottom: 6px; }
  .header img { width: 36px; height: 36px; object-fit: contain; }
  .header h1 { margin: 2px 0 0; font-size: 13px; }
  .muted { color: #555; font-size: 9px; }
  p { margin: 2px 0; }
  h2 { margin: 8px 0 3px; font-size: 11px; text-align: center; border-top: 1px dashed #111; padding-top: 5px; }
  .row { display: flex; justify-content: space-between; gap: 6px; padding: 2px 0; }
  .row span:first-child { overflow-wrap: anywhere; }
  .row span:last-child { white-space: nowrap; text-align: right; }
  .line { border-bottom: 1px dotted #999; }
  .sub { color: #555; font-size: 9px; padding-left: 6px; }
  .total { border-top: 1px solid #111; margin-top: 5px; padding-top: 4px; font-weight: bold; font-size: 12px; }
  .due { border: 1px solid #111; margin-top: 5px; padding: 4px; font-weight: bold; font-size: 13px; }
  .paid { font-weight: bold; }
  .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #111; padding-top: 6px; }
`;

const printTicket = (title: string, body: string) => {
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) {
    alert('Autorisez les fenêtres pop-up pour imprimer le ticket.');
    return;
  }
  printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${RECEIPT_STYLE}</style></head><body>${body}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  // Attend le chargement du logo avant d'imprimer.
  const doPrint = () => { printWindow.print(); };
  if (printWindow.document.readyState === 'complete') setTimeout(doPrint, 250);
  else printWindow.onload = () => setTimeout(doPrint, 100);
};

const headerMarkup = (title: string, data: HotelReceiptData) => `
  <div class="header">
    <img src="/logo_s.png" alt="HDA" />
    <h1>${escapeHtml(title)}</h1>
    ${data.reservationId ? `<p>Réservation n° ${data.reservationId}</p>` : ''}
    <p class="muted">Imprimé le ${escapeHtml(new Date().toLocaleString('fr-FR'))}</p>
  </div>
  <p><strong>Client :</strong> ${escapeHtml(data.clientName || '—')}</p>
  <p><strong>Chambre :</strong> ${escapeHtml(data.roomNumber || '—')}</p>
  <p><strong>Séjour :</strong> ${escapeHtml(formatDay(data.dateArrivee))} → ${escapeHtml(formatDay(data.dateDepart))} (${nightsBetween(data.dateArrivee, data.dateDepart)} nuit(s))</p>
`;

const paymentsMarkup = (payments: ReservationPayment[]) => payments.map((payment, index) => `
  <div class="line">
    <div class="row paid"><span>${index === 0 ? 'Paiement initial' : `Rectification n°${index}`}</span><span>${escapeHtml(formatCurrency(payment.montant))}</span></div>
    <div class="sub">${escapeHtml(formatDateTimeFr(payment.created_at))} · ${escapeHtml(paymentLabels[payment.moyen_paiement || ''] || payment.moyen_paiement || '—')}${payment.created_by_nom ? ` · ${escapeHtml(`${payment.created_by_prenom || ''} ${payment.created_by_nom}`.trim())}` : ''}</div>
  </div>
`).join('');

const balanceMarkup = (data: HotelReceiptData) => {
  const due = Math.round((data.total - data.montantPaye) * 100) / 100;
  return `
    <div class="row total"><span>TOTAL RÉSERVATION</span><span>${escapeHtml(formatCurrency(data.total))}</span></div>
    ${data.montantPaye > 0 ? `<div class="row"><span>Déjà payé</span><span>- ${escapeHtml(formatCurrency(data.montantPaye))}</span></div>` : ''}
    <div class="row due"><span>${due > 0 ? (data.montantPaye > 0 ? 'RECTIFICATION À PAYER' : 'À PAYER') : due < 0 ? 'TROP-PERÇU' : 'SOLDÉ'}</span><span>${escapeHtml(formatCurrency(Math.abs(due)))}</span></div>
  `;
};

// Ticket de la réservation : toutes les prestations + historique + reste à payer.
export const printReservationTicket = (data: HotelReceiptData) => {
  const extras = data.extras.map((item) => `
    <div class="line">
      <div class="row"><span>${item.type === 'TRANSFERT' ? 'Transfert' : 'Excursion'} : ${escapeHtml(item.description)}</span><span>${escapeHtml(formatCurrency(Number(item.prix) || 0))}</span></div>
      ${(item.date || item.heure || item.personnes) ? `<div class="sub">${escapeHtml([item.date ? formatDay(item.date) : '', item.heure, item.personnes ? `${item.personnes} pers.` : ''].filter(Boolean).join(' · '))}</div>` : ''}
    </div>`).join('');

  const body = `
    ${headerMarkup('Ticket réservation', data)}
    <p><strong>Type :</strong> ${data.typeReservation === 'BOOKING' ? 'Booking.com' : 'Sur place'} · ${data.pdjInclus ? 'PDJ inclus' : 'PDJ non inclus'}</p>
    <h2>PRESTATIONS</h2>
    <div class="row line"><span>Hébergement</span><span>${escapeHtml(formatCurrency(data.hebergement))}</span></div>
    ${data.laundry > 0 ? `<div class="row line"><span>Blanchisserie</span><span>${escapeHtml(formatCurrency(data.laundry))}</span></div>` : ''}
    ${Number(data.remisePourcentage || 0) > 0 ? `<div class="row line"><span>Remise hébergement</span><span>${data.remisePourcentage}%</span></div>` : ''}
    ${extras}
    ${data.payments.length ? `<h2>PAIEMENTS</h2>${paymentsMarkup(data.payments)}` : ''}
    ${data.rectificationLines && data.rectificationLines.length ? `<h2>RECTIFICATION</h2>${data.rectificationLines.map((line) => `<div class="row line"><span>${escapeHtml(line.label)}</span><span>${line.montant > 0 ? '+' : ''}${escapeHtml(formatCurrency(line.montant))}</span></div>`).join('')}` : ''}
    ${balanceMarkup(data)}
    <div class="footer"><p>Merci de votre visite</p></div>
  `;
  printTicket(`Réservation ${data.reservationId ?? ''}`, body);
};

// Ticket de l'historique des paiements uniquement.
export const printPaymentHistoryTicket = (data: HotelReceiptData) => {
  const body = `
    ${headerMarkup('Historique des paiements', data)}
    <h2>PAIEMENTS</h2>
    ${data.payments.length ? paymentsMarkup(data.payments) : '<p class="muted">Aucun paiement enregistré.</p>'}
    <div class="row total"><span>TOTAL PAYÉ</span><span>${escapeHtml(formatCurrency(data.montantPaye))}</span></div>
    ${balanceMarkup(data)}
    <div class="footer"><p>Merci de votre visite</p></div>
  `;
  printTicket(`Historique paiements ${data.reservationId ?? ''}`, body);
};

// Construit les données du ticket depuis une réservation telle que renvoyée par l'API
// (utilisé depuis la liste des réservations).
export const receiptDataFromReservation = (reservation: Reservation & { client_nom?: string; client_prenom?: string; room_numero?: string }, payments: ReservationPayment[]): HotelReceiptData => {
  let extras: ReservationExtraService[] = [];
  if (Array.isArray(reservation.services_extras)) extras = reservation.services_extras;
  else if (reservation.services_extras) {
    try { const parsed = JSON.parse(reservation.services_extras); extras = Array.isArray(parsed) ? parsed : []; } catch { extras = []; }
  }
  const extrasTotal = extras.reduce((sum, item) => sum + (Number(item.prix) || 0), 0);
  const laundry = reservation.laundry_included ? Number(reservation.laundry_price || 0) : 0;
  const total = Number(reservation.montant_total || 0);
  const clientName = reservation.client
    ? `${reservation.client.prenom || ''} ${reservation.client.nom || ''}`.trim()
    : `${reservation.client_prenom || ''} ${reservation.client_nom || ''}`.trim();
  return {
    reservationId: reservation.id,
    clientName,
    roomNumber: String(reservation.room?.numero ?? reservation.room_numero ?? ''),
    dateArrivee: reservation.date_arrivee,
    dateDepart: reservation.date_depart,
    typeReservation: reservation.type_reservation,
    pdjInclus: Boolean(reservation.pdj_inclus),
    hebergement: Math.max(0, total - extrasTotal - laundry),
    laundry,
    remisePourcentage: Number(reservation.remise_pourcentage || 0),
    extras,
    total,
    montantPaye: Number(reservation.montant_paye || 0),
    payments,
  };
};

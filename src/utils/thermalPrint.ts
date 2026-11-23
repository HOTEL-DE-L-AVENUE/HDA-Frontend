// src/utils/thermalPrint.ts
// Impression unique pour toute l'application : imprimante thermique 80 mm MTH-P80A
// (ESC/POS, Bluetooth depuis la tablette via le service d'impression Android « Thermer »,
// ou USB depuis un ordinateur avec le pilote de l'imprimante).
//
// Chaque document est mis en page pour la zone imprimable du rouleau 80 mm (72 mm,
// 576 points), en noir pur : les gris et les couleurs sont tramés par la tête thermique
// et deviennent illisibles. Le format du papier est fixé par le pilote (Thermer → 80 mm).

export const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const THERMAL_BASE_CSS = `
  @page { margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { width: 100%; max-width: 72mm; margin: 0 auto; padding: 2mm 1mm 6mm; font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 12px; line-height: 1.35; overflow-wrap: anywhere; }
  img { filter: grayscale(1); }
  h1 { margin: 2px 0; font-size: 15px; text-align: center; }
  h2 { margin: 8px 0 3px; padding-top: 5px; font-size: 12px; text-align: center; border-top: 1px dashed #000; }
  p { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 4px; }
  th, td { padding: 2px 1px; text-align: left; vertical-align: top; border-bottom: 1px dashed #000; overflow-wrap: anywhere; }
  th { font-size: 11px; border-bottom: 1px solid #000; }
  .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
  .header img, img.logo { width: 40px; height: 40px; object-fit: contain; }
  .center { text-align: center; }
  .right, .number { text-align: right; }
  .muted { color: #000; font-size: 10px; }
  .sep { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; padding: 2px 0; }
  .row > :first-child { min-width: 0; overflow-wrap: anywhere; }
  .row > :last-child { white-space: nowrap; text-align: right; }
  .line { border-bottom: 1px dashed #000; }
  .sub { font-size: 10px; padding-left: 6px; }
  .total { border-top: 1px solid #000; margin-top: 5px; padding-top: 4px; font-weight: bold; font-size: 14px; }
  .box { border: 1px solid #000; margin-top: 5px; padding: 4px; font-weight: bold; font-size: 14px; }
  .signature { display: block; max-width: 60mm; max-height: 22mm; margin: 2px auto; object-fit: contain; }
  .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; }
  pre.report { margin: 0; white-space: pre-wrap; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.4; }
`;

export const THERMAL_LOGO = '/logo_s.png';

export interface ThermalOrderReceipt {
  module: 'BAR' | 'RESTAURANT';
  orderId: number | string;
  client: string;
  table?: string | number | null;
  date?: string | Date | null;
  cashier: string;
  terminal: string;
  paymentMethod?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
}

export interface ThermalOrderInvoice {
  module: 'BAR' | 'RESTAURANT';
  orderId: number | string;
  client: string;
  table?: string | number | null;
  date?: string | Date | null;
  notes?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
}

const paymentMethodLabels: Record<string, string> = {
  ESPECES: 'Espèces',
  CARTE: 'Carte bancaire',
  TPE: 'TPE',
  CREDIT: 'Crédit',
  EURO: 'Euro',
  ORANGE_MONEY: 'Orange Money',
  MVOLA: 'MVola',
  DOLLAR: 'Dollar',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  GRATUIT: 'Gratuit',
};

const renderOrderReceipt = (receipt: ThermalOrderReceipt) => {
  const moduleLabel = receipt.module === 'BAR' ? 'Bar & Lounge' : 'Restaurant';
  const paymentMethod = String(receipt.paymentMethod || '').trim().toUpperCase();
  const paymentLabel = paymentMethodLabels[paymentMethod] || paymentMethod || 'Non renseigné';
  const receiptDate = receipt.date ? new Date(receipt.date).toLocaleString('fr-FR') : '—';
  const itemRows = receipt.items.map((item) => `
    <div class="row">
      <span>${escapeHtml(item.name)} ×${Number(item.quantity) || 0}</span>
      <span>${escapeHtml(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)))} MGA</span>
    </div>`).join('');
  return `
    <section class="order-receipt">
    ${thermalHeader(`REÇU DE PAIEMENT — ${moduleLabel}`, [`Commande #${receipt.orderId}`])}
    <p><strong>Client :</strong> ${escapeHtml(receipt.client || 'Client anonyme')}</p>
    <p><strong>Table / emplacement :</strong> ${escapeHtml(receipt.table ?? '—')}</p>
    <p><strong>Date :</strong> ${escapeHtml(receiptDate)}</p>
    <p><strong>Caissier :</strong> ${escapeHtml(receipt.cashier)}</p>
    <p><strong>Terminal :</strong> ${escapeHtml(receipt.terminal)}</p>
    <div class="sep"></div>
    <h2>Articles</h2>
    ${itemRows || '<p class="center">Aucun article.</p>'}
    <div class="row total">
      <span>TOTAL</span>
      <span>${escapeHtml(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(receipt.total) || 0))} MGA</span>
    </div>
    <div class="row">
      <strong>Mode de paiement</strong>
      <span>${escapeHtml(paymentLabel)}</span>
    </div>
    </section>`;
};

export const printOrderInvoice = (invoice: ThermalOrderInvoice) => {
  const moduleLabel = invoice.module === 'BAR' ? 'Bar & Lounge' : 'Restaurant';
  const invoiceDate = invoice.date ? new Date(invoice.date).toLocaleString('fr-FR') : '—';
  const itemRows = invoice.items.map((item) => `
    <div class="line">
      <div class="row">
        <span>${escapeHtml(item.name)} ×${Number(item.quantity) || 0}</span>
        <span>${escapeHtml(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)))} MGA</span>
      </div>
      <div class="sub">PU ${escapeHtml(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(item.unitPrice) || 0))} MGA</div>
    </div>`).join('');
  return printThermal(
    `FACTURE — ${moduleLabel} — commande #${invoice.orderId}`,
    `
      ${thermalHeader(`FACTURE — ${moduleLabel}`, [`Commande #${invoice.orderId}`])}
      <p><strong>Client :</strong> ${escapeHtml(invoice.client || 'Client anonyme')}</p>
      <p><strong>Table / emplacement :</strong> ${escapeHtml(invoice.table ?? '—')}</p>
      <p><strong>Date :</strong> ${escapeHtml(invoiceDate)}</p>
      ${invoice.notes ? `<p><strong>Notes :</strong> ${escapeHtml(invoice.notes)}</p>` : ''}
      <div class="sep"></div>
      <h2>Détail de la facture</h2>
      ${itemRows || '<p class="center">Aucun article.</p>'}
      <div class="row total">
        <span>TOTAL À PAYER</span>
        <span>${escapeHtml(new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(invoice.total) || 0))} MGA</span>
      </div>
    `,
  );
};

export const printOrderReceipt = (receipt: ThermalOrderReceipt) => {
  const moduleLabel = receipt.module === 'BAR' ? 'Bar & Lounge' : 'Restaurant';
  return printThermal(`Reçu ${moduleLabel} — commande #${receipt.orderId}`, renderOrderReceipt(receipt));
};

export const printOrderReceipts = (receipts: ThermalOrderReceipt[]) => {
  if (receipts.length === 0) return false;
  const moduleLabel = receipts[0].module === 'BAR' ? 'Bar & Lounge' : 'Restaurant';
  return printThermal(
    `Reçus ${moduleLabel} — ${receipts.length} commandes`,
    receipts.map(renderOrderReceipt).join(''),
    { css: '.order-receipt + .order-receipt { margin-top: 8mm; padding-top: 3mm; border-top: 1px dashed #000; }' },
  );
};

// En-tête standard des tickets (logo + titre + date d'impression).
export const thermalHeader = (title: string, lines: string[] = []) => `
  <div class="header">
    <img class="logo" src="${THERMAL_LOGO}" alt="HDA" />
    <h1>${escapeHtml(title)}</h1>
    ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
    <p class="muted">Imprimé le ${escapeHtml(new Date().toLocaleString('fr-FR'))}</p>
  </div>`;

// À appeler directement dans le gestionnaire de clic quand le contenu est chargé ensuite
// (appel réseau) : une fenêtre ouverte après un `await` est bloquée par le navigateur.
export const openPrintWindow = () => {
  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) alert('Autorisez les fenêtres pop-up pour imprimer.');
  return printWindow;
};

interface ThermalPrintOptions {
  css?: string;
  target?: Window | null;
}

// Écrit le document dans une fenêtre dédiée et lance l'impression une fois les images
// (logo, signatures) chargées. Sur tablette, la boîte d'impression Android s'ouvre :
// choisir l'imprimante Thermer / MHT-P80A.
export const printThermal = (title: string, body: string, options: ThermalPrintOptions = {}) => {
  const printWindow = options.target === undefined ? openPrintWindow() : options.target;
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>${THERMAL_BASE_CSS}${options.css || ''}</style></head><body>${body}</body></html>`);
  printWindow.document.close();

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    printWindow.print();
  };
  const images = Array.from(printWindow.document.images);
  const pending = images.filter((image) => !image.complete);
  if (pending.length === 0) {
    setTimeout(doPrint, 250);
  } else {
    let remaining = pending.length;
    const done = () => { remaining -= 1; if (remaining <= 0) setTimeout(doPrint, 100); };
    pending.forEach((image) => { image.onload = done; image.onerror = done; });
    // Une image qui ne répond pas ne doit pas bloquer l'impression.
    setTimeout(doPrint, 3000);
  }
  return true;
};

// Rapport texte (rapports journaliers) imprimé tel quel sur le rouleau.
export const printThermalText = (title: string, text: string, options: ThermalPrintOptions = {}) =>
  printThermal(title, `${thermalHeader(title)}<pre class="report">${escapeHtml(text)}</pre>`, options);

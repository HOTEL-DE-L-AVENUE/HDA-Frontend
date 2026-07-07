// ============================================================================
// Types du module Casino — alignés sur casinoRoutes.js (voir CASINO_README.md)
// ============================================================================

export type TypeSalle = 'VIP' | 'POKER' | 'MACHINES' | 'TABLE_JEUX' | 'AUTRE';
export type StatutSalle = 'OUVERTE' | 'FERMEE' | 'EN_TRAVAUX';
export type StatutCaisse = 'OUVERTE' | 'FERMEE' | 'MAINTENANCE';
export type StatutSession = 'OUVERTE' | 'FERMEE';
export type MoyenPaiement = 'ESPECES' | 'CARTE' | 'VIREMENT' | 'MOBILE_MONEY' | 'AUTRE';
export type NiveauCarte = 'STANDARD' | 'SILVER' | 'GOLD' | 'VIP';
export type StatutCarte = 'ACTIVE' | 'SUSPENDUE' | 'PERDUE';
export type StatutSpecialClient = 'NORMAL' | 'VIP' | 'A_SURVEILLER' | 'EXCLU' | 'AUTO_EXCLU';
export type TypeIncident = 'INCIDENT' | 'LITIGE';
export type GraviteIncident = 'FAIBLE' | 'MOYENNE' | 'ELEVEE';
export type StatutIncident = 'OUVERT' | 'EN_COURS' | 'RESOLU';
export type StatutChipType = 'ACTIF' | 'INACTIF';
export type StatutCredit = 'ACTIF' | 'EN_RETARD' | 'SOLDE';
export type DecisionScore = 'VALIDEE' | 'CONTESTEE' | 'ANNULEE';
export type EntreeVia = 'QR' | 'MANUEL';

// --- Salles & caisses -------------------------------------------------------

export interface CasinoRoom {
  id: number;
  code: string;
  nom: string;
  type_salle: TypeSalle;
  statut: StatutSalle;
  created_at?: string;
  updated_at?: string;
}

export interface CasinoCashier {
  id: number;
  room_id: number;
  code: string;
  nom: string;
  statut: StatutCaisse;
}

// --- Sessions de caisse ------------------------------------------------------

export interface CasinoSession {
  id: number;
  cashier_id: number;
  user_id: number;
  ouverture_at: string;
  fermeture_at: string | null;
  fond_initial: number;
  fond_final_theorique: number | null;
  fond_final_declare: number | null;
  ecart: number | null;
  statut: StatutSession;
  commentaire?: string | null;
}

export interface SessionSummary {
  session: CasinoSession;
  total_entrees: number;
  total_sorties: number;
  solde_theorique: number;
}

export interface SessionTransactionRow {
  source: 'cash_operation' | 'chip_transaction';
  id: number;
  type_operation: string;
  montant: number;
  moyen_paiement: MoyenPaiement;
  client_id: number | null;
  client_libre: string | null;
  created_at: string;
}

// --- Clients (module casino) -------------------------------------------------

export interface Client {
  id: number;
  code_client?: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  is_casino_player?: boolean;
  statut?: string;
}

export interface ClientProfileBundle {
  client: Client;
  profile: CasinoClientProfile | null;
  card: CasinoCard | null;
  dernier_score: CasinoScore | null;
}

export interface ClientVisit {
  id: number;
  room_id: number;
  entree_at: string;
  sortie_at: string | null;
  entree_via: EntreeVia;
}

export interface SalleFrequentee {
  id: number;
  nom: string;
  nb_visites: number;
}

export interface ClientHistory {
  visites: ClientVisit[];
  salles_frequentees: SalleFrequentee[];
}

export interface ClientConsumption {
  nb_commandes: number;
  panier_moyen: number;
  premiere_commande: string | null;
  derniere_commande: string | null;
}

// --- Cartes de fidélité -------------------------------------------------------

export interface CasinoCard {
  id: number;
  client_id: number;
  numero_carte: string;
  qr_code: string;
  niveau: NiveauCarte;
  plafond_credit: number;
  statut: StatutCarte;
  date_emission: string;
}

// --- Antécédents client (profils & incidents) --------------------------------

export interface CasinoClientProfile {
  id: number;
  client_id: number;
  statut_special: StatutSpecialClient;
  motif?: string | null;
  decide_par?: number | null;
  updated_at?: string;
}

export interface CasinoIncident {
  id: number;
  client_id: number;
  session_id: number | null;
  type: TypeIncident;
  gravite: GraviteIncident;
  description: string;
  statut: StatutIncident;
  resolved_at?: string | null;
  created_at?: string;
}

// --- Jetons --------------------------------------------------------------------

export interface ChipType {
  id: number;
  code: string;
  nom: string;
  valeur_nominale: number;
  couleur: string;
  statut: StatutChipType;
}

export interface ChipMovement {
  id: number;
  session_id: number;
  chip_type_id: number;
  type_jeton?: string;
  quantite: number;
  montant_total: number;
  client_id: number | null;
  client_libre: string | null;
  moyen_paiement: MoyenPaiement;
  created_at?: string;
}

// --- Opérations de caisse --------------------------------------------------------

export type TypeOperation =
  | 'BUY_IN'
  | 'CASH_OUT'
  | 'DEPOT'
  | 'AVANCE_CREDIT'
  | 'REMBOURSEMENT_CREDIT';

export interface CashOperation {
  id: number;
  session_id: number;
  type_operation: TypeOperation;
  montant: number;
  moyen_paiement: MoyenPaiement;
  client_id: number | null;
  client_libre: string | null;
  created_at?: string;
}

// --- Crédits joueur -----------------------------------------------------------

export interface CasinoCredit {
  id: number;
  client_id: number;
  montant: number;
  encours: number;
  echeance: string;
  session_id: number | null;
  statut: StatutCredit;
  created_at?: string;
}

export interface CreditRepayment {
  id: number;
  credit_id: number;
  montant: number;
  moyen_paiement: MoyenPaiement;
  delai_jours: number;
  created_at?: string;
}

// --- Scoring de crédit ----------------------------------------------------------

export interface ScoringConfigItem {
  cle: string;
  valeur: string;
  description?: string;
  updated_by?: number;
  updated_at?: string;
}

export interface ScoreFactor {
  valeur?: number;
  score?: number;
  poids?: number;
  [key: string]: any;
}

export interface CasinoScore {
  id: number;
  client_id: number;
  score: string;
  categorie: string;
  facteurs: Record<string, ScoreFactor>;
  calcule_le: string;
  decision: DecisionScore | 'AUCUNE';
  decide_par?: number | null;
  decide_le?: string | null;
  commentaire_contestation?: string | null;
}

// --- Visites de salle -------------------------------------------------------------

export interface Visit {
  id: number;
  room_id: number;
  client_id: number;
  qr_code?: string | null;
  entree_via: EntreeVia;
  entree_at: string;
  sortie_at: string | null;
  nom?: string;
  prenom?: string;
}

// --- Tableau de bord & rapports ------------------------------------------------------

export interface DashboardStats {
  salles_total: number;
  salles_ouvertes: number;
  sessions_ouvertes: number;
  produit_net_jour: number;
  encours_credit_total: number;
  incidents_ouverts: number;
}

export interface ProduitNetRow {
  room_id: number;
  salle: string;
  jour: string;
  total_entrees: number;
  total_sorties: number;
  produit_net: number;
}

export interface EcartCaisseRow {
  session_id: number;
  caisse: string;
  salle: string;
  user_id: number;
  ouverture_at: string;
  fermeture_at: string | null;
  fond_initial: number;
  fond_final_theorique: number;
  fond_final_declare: number | null;
  ecart: number | null;
}

export interface EncoursCreditRow {
  client_id: number;
  client: string;
  nb_credits_actifs: number;
  encours_total: number;
  prochaine_echeance: string | null;
}

export interface FluxASynchroniserRow {
  source: string;
  id: number;
  ref_flux_global: string;
  montant: number;
  created_at: string;
}

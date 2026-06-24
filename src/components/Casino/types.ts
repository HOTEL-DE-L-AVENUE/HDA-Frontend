// ============================================
// TYPES CORRESPONDANT EXACTEMENT À LA BASE DE DONNÉES
// ============================================

// Table: casino_rooms
export interface CasinoRoom {
  id: number;
  nom: string;
  type_salle: string;
  statut: 'OUVERTE' | 'FERMEE' | 'EN_TRAVAUX';
}

// Table: casino_cashiers
export interface CasinoCashier {
  id: number;
  room_id: number;
  nom: string;
  statut: 'OUVERTE' | 'FERMEE' | 'EN_PAUSE';
  room?: CasinoRoom;
}

// Table: casino_sessions
export interface CasinoSession {
  id: number;
  cashier_id: number;
  user_id: number;
  ouverture_at: string;
  fermeture_at: string | null;
  fond_initial: number;
  fond_final: number | null;
  ecart: number | null;
  cashier?: CasinoCashier;
  user?: any;
}

// Table: casino_cards
export interface CasinoCard {
  id: number;
  client_id: number;
  numero_carte: string;
  niveau: string;
  points: number;
  client?: any;
}

// Table: casino_visits
export interface CasinoVisit {
  id: number;
  client_id: number;
  room_id: number;
  entree_at: string;
  sortie_at: string | null;
  client?: any;
  room?: CasinoRoom;
}

// Table: casino_transactions
export interface CasinoTransaction {
  id: number;
  client_id: number | null;
  session_id: number | null;
  type_transaction: 'ACHAT_JETONS' | 'RACHAT_JETONS' | 'GAIN' | 'PERTE' | 'DEPOT' | 'RETRAIT';
  montant: number;
  moyen_paiement: 'ESPECES' | 'CARTE' | 'MOBILE_MONEY' | 'VIREMENT' | 'COMPTE';
  created_at: string;
  client?: any;
  session?: CasinoSession;
}

// Table: casino_chip_transactions
export interface CasinoChipTransaction {
  id: number;
  client_id: number;
  transaction_type: 'ACHAT' | 'RACHAT' | 'GAIN' | 'PERTE';
  quantite: number;
  valeur_unitaire: number;
  created_at: string;
  client?: any;
}

// Table: casino_credits
export interface CasinoCredit {
  id: number;
  client_id: number;
  montant_accorde: number;
  encours: number;
  echeance: string;
  statut: 'ACTIF' | 'REMBOURSE' | 'EXPIRE' | 'ANNULE';
  client?: any;
}

// Table: casino_scores
export interface CasinoScore {
  id: number;
  client_id: number;
  score: number;
  categorie: 'GENERAL' | 'MOIS' | 'SEMAINE' | 'TOURNOI';
  details: any;
  client?: any;
}

// Table: clients
export interface Client {
  id: number;
  code_client: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse?: string;
  date_naissance?: string;
  type_piece?: string;
  numero_piece?: string;
  photo_url?: string;
  is_casino_player: boolean;
  statut: 'ACTIF' | 'INACTIF' | 'BLOQUE';
  created_at?: string;
  updated_at?: string;
}

// ============================================
// TYPES POUR LES FORMULAIRES
// ============================================

export interface RoomFormData {
  nom: string;
  type_salle: string;
  statut: CasinoRoom['statut'];
}

export interface CashierFormData {
  room_id: number;
  nom: string;
  statut: CasinoCashier['statut'];
}

export interface SessionFormData {
  cashier_id: number;
  user_id: number;
  fond_initial: number;
}

export interface TransactionFormData {
  client_id: number;
  session_id: number;
  type_transaction: CasinoTransaction['type_transaction'];
  montant: number;
  moyen_paiement: CasinoTransaction['moyen_paiement'];
  description?: string;
}

export interface ChipTransactionFormData {
  client_id: number;
  transaction_type: CasinoChipTransaction['transaction_type'];
  quantite: number;
  valeur_unitaire: number;
}

export interface CardFormData {
  client_id: number;
  niveau: string;
}

export interface CreditFormData {
  client_id: number;
  montant_accorde: number;
  echeance: string;
}
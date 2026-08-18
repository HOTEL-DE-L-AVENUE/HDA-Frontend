// ─── Métier (aligné sur la BDD) ──────────────────────────────

/** Correspond à products (type_produit = PRODUIT_FINI, source_module = BAR) */
export interface BarProduct {
  id: number;
  nom: string;
  ingredients: string;
  prix: number;
  categorie: string;
  alcool: boolean;
}

/** Solde caisse du module bar (issu de financial_transactions + module = 'bar') */
export interface BarCaisseStats {
  solde: number;
  entrees: number;
  sorties: number;
}

/** Données agrégées pour les meilleures ventes */
export interface BestSeller {
  nom: string;
  ventes: number;
  montant: string;
}

export interface BarCommandeItem {
  product_id?: number;
  nom: string;
  quantite: number;
  prix: number;
}

export interface BarCommande {
  id: number;
  client: string;
  table: number;
  statut: 'En attente' | 'En préparation' | 'Servie' | 'Encaissée';
  total: number;
  items: BarCommandeItem[];
  created_at?: string;
}

// ==================== BAR LOUNGE ====================

export interface BarTable {
  id: number;
  numero: string;
  capacite: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'EN_COURS';
}

export interface BarCashier {
  id: number;
  nom: string;
  statut: 'OUVERTE' | 'FERMEE';
  current_session?: BarSession;
}

export interface BarSession {
  id: number;
  cashier_id: number;
  user_id?: number;
  ouverture_at: string;
  fermeture_at?: string;
  fond_initial: number;
  fond_final?: number;
  ecart?: number;
}

export interface BarStockItem {
  id: number;
  product_id: number;
  location_id: number;
  quantite: number;
  unite: string;
  product_nom: string;
  product_categorie: string;
  location_nom: string;
}

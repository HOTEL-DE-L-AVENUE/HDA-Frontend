// ─── Métier (aligné sur la BDD) ──────────────────────────────────────────────

/** Correspond à products (type_produit = PRODUIT_FINI, source_module = BAR) */
export interface BarProduct {
  id: string;
  nom: string;
  ingredients: string;
  prix: number;           // prix_vente
  categorie: string;      // categories.nom
  alcool: boolean;        // champ UI dérivé de la catégorie
}

/** Correspond à orders + order_items (source_module = 'BAR') */
export interface BarOrder {
  id: number;
  client_id?: number;
  source_module: 'BAR';
  montant_total: number;
  statut: 'EN_ATTENTE' | 'SERVI' | 'ANNULE';
  created_at: string;
  items: BarOrderItem[];
}

export interface BarOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantite: number;
  prix_unitaire: number;
}

/** Données agrégées pour les meilleures ventes (calculé côté API) */
export interface BestSeller {
  nom: string;
  ventes: number;
  montant: string;   // pré-formaté
}

/** Solde caisse du module bar (issu de financial_transactions + module = 'bar') */
export interface BarCaisseStats {
  solde: number;
  entrees: number;
  sorties: number;
}
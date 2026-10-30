// src/services/stock.service.ts
import api from '../lib/api';

export interface StockLocation {
  id: number;
  nom: string;
}

export interface StockItem {
  id: number;
  product_id: number;
  location_id: number;
  quantite: number;
  product?: {
    id: number;
    nom: string;
    code?: string;
    prix_vente?: number;
  };
  location?: StockLocation;
}

export type StockStatus = 'ok' | 'faible' | 'eleve' | 'rupture';

export type StockModule = 'BAR' | 'RESTAURANT' | 'HOTEL' | 'HEBERGEMENT' | 'CASINO' | 'STOCK';
export type StockItemType = 'PRODUCT' | 'INGREDIENT';
export type StockMovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';

// Ligne de la vue consolidée du stock (tous modules confondus)
export interface StockOverviewItem {
  cle: string;
  module: string;
  emplacement: string;
  product_id: number | null;
  ingredient_id?: number | null;
  item_type?: StockItemType;
  location_id?: number | null;
  nom: string;
  code: string | null;
  categorie: string | null;
  prix_achat?: number | null;
  quantite: number;
  seuil_minimum: number;
  seuil_maximum?: number | null;
  stock_initial?: number | null;
  stock_debut_mois?: number | null;
  entree_mensuel?: number | null;
  sortie_mensuel?: number | null;
  vente_mensuel?: number | null;
  stock_reel?: number | null;
  ecart?: number | null;
  unite: string | null;
  updated_at: string | null;
  statut?: StockStatus;
}

export interface StockMovement {
  id: number;
  source?: string;
  created_at: string;
  date_operation?: string | null;
  type_mouvement: StockMovementType;
  quantite: number;
  stock_after: number | null;
  est_vente?: boolean;
  reference_externe?: string | null;
  commentaire?: string | null;
  motif: string | null;
  user_nom: string | null;
}

export interface StockItemDetails {
  item: StockOverviewItem & {
    prix_vente: number | null;
    prix_achat: number | null;
    type_produit: string | null;
  };
  history: StockMovement[];
}

// Ligne d'historique consolidée (bar, stock produits, ingrédients restaurant)
export interface StockHistoryEntry {
  module: string;
  item_type: StockItemType;
  item_id: number;
  location_id: number | null;
  article_nom: string;
  unite: string | null;
  id: number;
  source: string;
  date_operation: string | null;
  created_at: string;
  type_mouvement: StockMovementType;
  quantite: number;
  stock_after: number | null;
  motif: string | null;
  reference_externe: string | null;
  commentaire: string | null;
  user_nom: string | null;
  est_vente: boolean;
}

export interface StockInventory {
  id: number;
  item_type: 'BAR_PRODUCT' | 'PRODUCT' | 'INGREDIENT';
  product_id: number | null;
  ingredient_id: number | null;
  location_id: number | null;
  inventory_date: string;
  stock_theorique: number;
  stock_reel: number;
  ecart: number;
  motif: string | null;
  commentaire: string | null;
  user_id: number | null;
  regularise: boolean;
  movement_id: number | null;
  article_nom: string;
  user_nom: string | null;
}

export interface StockArticleInput {
  module: StockModule;
  nom: string;
  categorie?: string;
  unite?: string;
  quantite?: number;
  seuil_minimum?: number;
  seuil_maximum?: number | null;
  prix_achat?: number;
  prix_vente?: number;
  description?: string;
  code?: string;
  location_id?: number;
  alcool?: boolean;
}

export interface StockMovementInput {
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  motif?: string;
  date_operation?: string;
  reference_externe?: string;
  commentaire?: string;
}

export interface StockInventoryInput {
  stock_reel: number;
  regularise?: boolean;
  motif?: string;
  commentaire?: string;
  inventory_date?: string;
}

const unwrap = <T,>(response: { data?: any }): T => response.data?.data ?? response.data;

export const stockService = {
  // Tous les articles du bar, du restaurant et de l'hôtel avec leur quantité restante.
  // `month` (AAAA-MM) alimente les colonnes mensuelles (début de mois, entrées, sorties, ventes).
  async getOverview(month?: string | null): Promise<StockOverviewItem[]> {
    const response = await api.get('/api/stock/overview', {
      params: month ? { month } : undefined,
    });
    return unwrap<StockOverviewItem[]>(response) || [];
  },

  // Détail d'un article de la vue consolidée et ses derniers mouvements
  async getOverviewItem(cle: string, month?: string | null): Promise<StockItemDetails> {
    const response = await api.get(`/api/stock/overview/${encodeURIComponent(cle)}`, {
      params: month ? { month } : undefined,
    });
    return unwrap<StockItemDetails>(response);
  },

  async createArticle(data: StockArticleInput): Promise<{ cle: string }> {
    const response = await api.post('/api/stock/overview/articles', data);
    return unwrap<{ cle: string }>(response);
  },

  // Entrée ou sortie manuelle sur une ligne (article bar, produit ou ingrédient)
  async recordItemMovement(cle: string, data: StockMovementInput) {
    const response = await api.post(`/api/stock/overview/${encodeURIComponent(cle)}/movements`, data);
    return unwrap<{ cle: string; movement: StockMovement }>(response);
  },

  // Inventaire physique : stock théorique, stock réel et écart, avec régularisation optionnelle
  async createInventory(cle: string, data: StockInventoryInput) {
    const response = await api.post(`/api/stock/overview/${encodeURIComponent(cle)}/inventories`, data);
    return unwrap<{
      inventory: StockInventory;
      theoretical: number;
      difference: number;
      regularise: boolean;
      movement: StockMovement | null;
    }>(response);
  },

  async getInventories(filters?: { month?: string; cle?: string; limit?: number; offset?: number }): Promise<StockInventory[]> {
    const response = await api.get('/api/stock/inventories', { params: filters });
    return unwrap<StockInventory[]>(response) || [];
  },

  async getHistory(filters?: {
    month?: string;
    cle?: string;
    module?: string;
    type?: StockMovementType;
    limit?: number;
    offset?: number;
  }): Promise<StockHistoryEntry[]> {
    const response = await api.get('/api/stock/history', { params: filters });
    return unwrap<StockHistoryEntry[]>(response) || [];
  },

  async updateOverviewItem(cle: string, data: {
    quantite: number;
    seuil_minimum?: number;
    seuil_maximum?: number | null;
    unite?: string;
    nom?: string;
    prix_achat?: number;
  }) {
    // Le backend gère les trois types de lignes (BAR, STK, ING) sur cette route,
    // y compris la validation d'unité des ingrédients utilisés dans les recettes.
    const response = await api.put(`/api/stock/overview/${encodeURIComponent(cle)}`, data);
    return unwrap(response);
  },

  async deleteOverviewItem(cle: string) {
    const ingredientMatch = /^ING-(\d+)-(\d+)$/.exec(cle);
    if (ingredientMatch) {
      const response = await api.delete('/api/restaurant/stock', {
        params: {
          ingredient_id: Number(ingredientMatch[1]),
          location_id: Number(ingredientMatch[2]),
        },
      });
      return unwrap(response);
    }
    const response = await api.delete(`/api/stock/overview/${encodeURIComponent(cle)}`);
    return unwrap(response);
  },

  // Get all stock locations
  async getLocations(): Promise<StockLocation[]> {
    const response = await api.get('/api/stock/locations');
    return unwrap<StockLocation[]>(response) || [];
  },

  // Get stock by location
  async getByLocation(locationId: number): Promise<StockItem[]> {
    const response = await api.get(`/api/stock/stocks?location_id=${locationId}`);
    return unwrap<StockItem[]>(response) || [];
  },

  // Get stock by product
  async getByProduct(productId: number): Promise<StockItem[]> {
    const response = await api.get(`/api/stock/products/${productId}/stock`);
    return unwrap<StockItem[]>(response) || [];
  },

  // Get hotel stock (location_id = 5)
  async getHotelStock(): Promise<StockItem[]> {
    return this.getByLocation(5);
  },

  // Record stock movement
  async recordMovement(data: {
    product_id: number;
    location_id: number;
    type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
    quantite: number;
    source_module?: string;
    reference_id?: number;
  }) {
    const response = await api.post('/api/stock/movements', data);
    return response.data;
  },

  // Create a supplier purchase for the selected module. The financial report
  // values the stock currently available in that module as its outflow.
  async createPurchase(data: {
    supplier_id: number;
    location_id: number;
    source_module: 'HEBERGEMENT' | 'HOTEL' | 'RESTAURANT' | 'BAR' | 'CASINO' | 'GENERAL';
    items: Array<{ product_id: number; quantite: number; prix_unitaire: number }>;
  }) {
    const response = await api.post('/api/stock/purchases', data);
    return unwrap(response);
  },

  // Get stock movements
  async getMovements(filters?: {
    product_id?: number;
    location_id?: number;
    type?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.location_id) params.append('location_id', filters.location_id.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await api.get(`/api/stock/movements${params.toString() ? `?${params.toString()}` : ''}`);
    return unwrap<StockItem[]>(response) || [];
  },
};

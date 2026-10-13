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

// Ligne de la vue consolidée du stock (tous modules confondus)
export interface StockOverviewItem {
  cle: string;
  module: string;
  emplacement: string;
  product_id: number | null;
  ingredient_id?: number | null;
  item_type?: 'PRODUCT' | 'INGREDIENT';
  location_id?: number | null;
  nom: string;
  code: string | null;
  categorie: string | null;
  prix_achat?: number | null;
  quantite: number;
  seuil_minimum: number;
  unite: string | null;
  updated_at: string | null;
}

export interface StockItemDetails {
  item: StockOverviewItem & {
    prix_vente: number | null;
    prix_achat: number | null;
    type_produit: string | null;
  };
  history: Array<{
    id: number;
    created_at: string;
    type_mouvement: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
    quantite: number;
    stock_after: number | null;
    motif: string | null;
    user_nom: string | null;
  }>;
}

export const stockService = {
  // Tous les articles du bar, du restaurant et de l'hôtel avec leur quantité restante
  async getOverview(): Promise<StockOverviewItem[]> {
    const response = await api.get('/api/stock/overview');
    return response.data?.data || response.data || [];
  },

  // Détail d'un article de la vue consolidée et ses derniers mouvements
  async getOverviewItem(cle: string): Promise<StockItemDetails> {
    const response = await api.get(`/api/stock/overview/${cle}`);
    return response.data?.data || response.data;
  },

  async updateOverviewItem(cle: string, data: {
    quantite: number;
    seuil_minimum?: number;
    unite?: string;
    nom?: string;
    prix_achat?: number;
  }) {
    const ingredientMatch = /^ING-(\d+)-(\d+)$/.exec(cle);
    if (ingredientMatch) {
      const response = await api.put(`/api/restaurant/ingredients/${ingredientMatch[1]}`, {
        nom: data.nom,
        unite: data.unite,
        prix_achat: data.prix_achat,
        quantite: data.quantite,
        location_id: Number(ingredientMatch[2]),
      });
      return response.data?.data || response.data;
    }
    const response = await api.put(`/api/stock/overview/${cle}`, data);
    return response.data?.data || response.data;
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
      return response.data?.data || response.data;
    }
    const response = await api.delete(`/api/stock/overview/${cle}`);
    return response.data?.data || response.data;
  },

  // Get all stock locations
  async getLocations(): Promise<StockLocation[]> {
    const response = await api.get('/api/stock/locations');
    return response.data?.data || response.data || [];
  },

  // Get stock by location
  async getByLocation(locationId: number): Promise<StockItem[]> {
    const response = await api.get(`/api/stock/stocks?location_id=${locationId}`);
    return response.data?.data || response.data || [];
  },

  // Get stock by product
  async getByProduct(productId: number): Promise<StockItem[]> {
    const response = await api.get(`/api/stock/products/${productId}/stock`);
    return response.data?.data || response.data || [];
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
    return response.data?.data || response.data;
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
    return response.data?.data || response.data || [];
  },
};

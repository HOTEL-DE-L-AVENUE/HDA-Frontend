import api from '../lib/api';
import type {
  Table,
  Product,
  MenuItem,
  Order,
  Recipe,
  Cashier,
  RestaurantStats,
  ApiResponse,
} from '../types/restaurant';

// ==================== TABLES ====================

export const getTables = (params?: { statut?: string; capacite_min?: number }) =>
  api.get<ApiResponse<Table[]>>('/api/restaurant/tables', { params }).then(res => res.data);

export const getTableById = (id: number) =>
  api.get<ApiResponse<Table>>(`/api/restaurant/tables/${id}`).then(res => res.data);

export const createTable = (data: { numero: string; capacite: number; statut?: string }) =>
  api.post<ApiResponse<Table>>('/api/restaurant/tables', data).then(res => res.data);

export const updateTable = (id: number, data: Partial<Table>) =>
  api.put<ApiResponse<Table>>(`/api/restaurant/tables/${id}`, data).then(res => res.data);

export const deleteTable = (id: number) =>
  api.delete<ApiResponse<null>>(`/api/restaurant/tables/${id}`).then(res => res.data);

// ==================== MENU & PRODUITS ====================

export const getMenu = () =>
  api.get<ApiResponse<MenuItem[]>>('/api/restaurant/menu').then(res => res.data);

export const getProducts = (params?: Record<string, any>) =>
  api.get<ApiResponse<Product[]>>('/api/restaurant/products', { params }).then(res => res.data);

export const getProductById = (id: number) =>
  api.get<ApiResponse<Product>>(`/api/restaurant/products/${id}`).then(res => res.data);

// ==================== RECETTES ====================

export const createRecipe = (data: {
  product_id: number;
  nom: string;
  ingredients?: { ingredient_id: number; quantite: number }[];
}) =>
  api.post<ApiResponse<Recipe>>('/api/restaurant/recipes', data).then(res => res.data);

export const getRecipeById = (id: number) =>
  api.get<ApiResponse<Recipe>>(`/api/restaurant/recipes/${id}`).then(res => res.data);

// ==================== COMMANDES ====================

export const getOrders = (params?: {
  statut?: string;
  client_id?: number;
  date_debut?: string;
  date_fin?: string;
}) =>
  api.get<ApiResponse<Order[]>>('/api/restaurant/orders', { params }).then(res => res.data);

export const getOrderById = (id: number) =>
  api.get<ApiResponse<Order>>(`/api/restaurant/orders/${id}`).then(res => res.data);

export const createOrder = (data: {
  client_id?: number;
  table_id?: number;
  items: { product_id: number; quantite: number; prix_unitaire: number }[];
}) =>
  api.post<ApiResponse<Order>>('/api/restaurant/orders', data).then(res => res.data);

export const updateOrderStatus = (id: number, statut: string) =>
  api.put<ApiResponse<Order>>(`/api/restaurant/orders/${id}/status`, { statut }).then(res => res.data);

// ==================== PAIEMENTS ====================

export const processPayment = (data: {
  order_id: number;
  montant: number;
  moyen_paiement: string;
  client_id?: number;
}) =>
  api.post<ApiResponse<{ payment_id: number }>>('/api/restaurant/payments', data).then(res => res.data);

export const billToRoom = (data: { order_id: number; room_id: number }) =>
  api.post<ApiResponse<{ invoice_id: number }>>('/api/restaurant/bill-to-room', data).then(res => res.data);

// ==================== CAISSE ====================

export const openCashier = (data: { nom: string; user_id: number; fond_initial: number }) =>
  api.post<ApiResponse<{ cashier_id: number; session_id: number }>>('/api/restaurant/cashier/open', data).then(res => res.data);

export const closeCashier = (data: { session_id: number; fond_final: number }) =>
  api.post<ApiResponse<null>>('/api/restaurant/cashier/close', data).then(res => res.data);

export const getCashierStatus = () =>
  api.get<ApiResponse<Cashier[]>>('/api/restaurant/cashier/status').then(res => res.data);

// ==================== REPORTING ====================

export const getStats = (params: { date_debut: string; date_fin: string }) =>
  api.get<ApiResponse<RestaurantStats>>('/api/restaurant/stats', { params }).then(res => res.data);

// ==================== STOCK ====================
export const getStockLocations = () =>
  api.get('/api/restaurant/stock/locations').then(res => res.data);

export const getStocks = (params?: Record<string, any>) =>
  api.get('/api/restaurant/stock', { params }).then(res => res.data);

export const getStockMovements = (params?: Record<string, any>) =>
  api.get('/api/restaurant/stock/movements', { params }).then(res => res.data);

export const adjustStock = (data: {
  product_id: number;
  location_id: number;
  type_mouvement: 'ENTREE' | 'SORTIE';
  quantite: number;
  source_module?: string;
  reference_id?: number;
  commentaire?: string;
}) =>
  api.post('/api/restaurant/stock/adjust', data).then(res => res.data);

export const createProduct = (data: {
  nom: string;
  unite: string;
  type_produit?: string;
  prix_achat?: number;
  prix_vente?: number;
  category_id?: number;
}) =>
  api.post('/api/restaurant/products', data).then(res => res.data);

// ==================== PRODUITS ====================
export const updateProduct = (id: number, data: Partial<{
  nom: string; unite: string; prix_achat: number; prix_vente: number;
  actif: boolean; type_produit: string; category_id: number;
}>) =>
  api.put(`/api/restaurant/products/${id}`, data).then(res => res.data);



// ==================== FOURNISSEURS ====================
export const getSuppliers = () =>
  api.get('/api/restaurant/suppliers').then(res => res.data);

export const createSupplier = (data: { nom: string; telephone?: string; email?: string }) =>
  api.post('/api/restaurant/suppliers', data).then(res => res.data);

// ==================== ACHATS ====================
export const getPurchases = () =>
  api.get('/api/restaurant/purchases').then(res => res.data);

export const getPurchaseById = (id: number) =>
  api.get(`/api/restaurant/purchases/${id}`).then(res => res.data);

export const createPurchase = (data: {
  supplier_id: number;
  items: { product_id: number; location_id: number; quantite: number; prix_unitaire: number }[];
}) =>
  api.post('/api/restaurant/purchases', data).then(res => res.data);

// ==================== RECETTES ====================
export const getAllRecipes = () =>
  api.get('/api/restaurant/recipes').then(res => res.data);

export const updateRecipe = (id: number, data: {
  nom?: string;
  ingredients?: { ingredient_id: number; quantite: number }[];
}) =>
  api.put(`/api/restaurant/recipes/${id}`, data).then(res => res.data);

export const deleteRecipe = (id: number) =>
  api.delete(`/api/restaurant/recipes/${id}`).then(res => res.data);

// ==================== UNITÉS ====================
export const getUnits = () =>
  api.get('/api/restaurant/units').then(res => res.data);

// ==================== TYPES DE PRODUITS ====================
export const getProductTypes = () =>
  api.get('/api/restaurant/product-types').then(res => res.data);

// ==================== CATÉGORIES ====================
export const getCategories = () =>
  api.get('/api/restaurant/categories').then(res => res.data);
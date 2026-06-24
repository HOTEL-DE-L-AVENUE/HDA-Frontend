export interface TableRestaurant {
  id: number;
  numero: string;
  capacite: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'HORS_SERVICE';
}

export interface Order {
  id: number;
  client_id: number | null;
  source_module: 'RESTAURANT' | 'BAR' | 'CASINO' | 'HOTEL';
  montant_total: number;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'SERVIE' | 'PAYEE' | 'ANNULEE';
  created_at: string;
  table?: TableRestaurant;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantite: number;
  prix_unitaire: number;
  product?: Product;
}

export interface Product {
  id: number;
  category_id: number;
  code: string;
  nom: string;
  unite: string;
  prix_achat: number;
  prix_vente: number;
  actif: boolean;
  type_produit: 'MATIERE_PREMIERE' | 'PRODUIT_FINI' | 'CONSOMMABLE' | 'SERVICE';
  category?: Category;
}

export interface Category {
  id: number;
  nom: string;
}

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
  statut?: string;
}
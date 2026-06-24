// types/hotel.types.ts
export interface RoomType {
  id: number;
  nom: string;
  description: string | null;
}

export interface Room {
  id: number;
  room_type_id: number | null;
  numero: string;
  capacite: number | null;
  prix_nuit: number | null;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'NETTOYAGE' | 'MAINTENANCE' | 'HORS_SERVICE';
  room_type?: RoomType;
}

export interface Reservation {
  id: number;
  client_id: number;
  room_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number | null;
  statut: string;
  client?: Client;
  room?: Room;
}

export interface Client {
  id: number;
  code_client: string | null;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  date_naissance: string | null;
  type_piece: string | null;
  numero_piece: string | null;
  photo_url: string | null;
  is_casino_player: boolean;
  statut: 'ACTIF' | 'INACTIF' | 'BLOCKED';
}

export interface Stay {
  id: number;
  reservation_id: number | null;
  checkin_at: string | null;
  checkout_at: string | null;
  reservation?: Reservation;
}

export interface Equipment {
  id: number;
  code: string | null;
  nom: string;
  categorie: string | null;
  description: string | null;
}

export interface RoomEquipment {
  id: number;
  room_id: number;
  equipment_id: number;
  quantite: number;
  statut: 'BON' | 'EN_PANNE' | 'REMPLACE' | 'HORS_SERVICE';
  equipment?: Equipment;
}

export interface RoomMaintenance {
  id: number;
  room_id: number;
  equipment_id: number | null;
  type_intervention: 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE';
  description: string | null;
  statut: 'OUVERT' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  date_declaration: string;
  date_resolution: string | null;
  cout: number;
  created_by: number | null;
}

export interface HousekeepingTask {
  id: number;
  room_id: number;
  assigned_user_id: number | null;
  type_tache: 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE';
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  commentaire: string | null;
  planned_at: string | null;
  completed_at: string | null;
}

export interface MinibarItem {
  id: number;
  room_id: number;
  product_id: number;
  quantite: number;
  seuil_alerte: number;
  product?: CSSMathProduct;
}

export interface MinibarConsumption {
  id: number;
  room_id: number;
  client_id: number;
  product_id: number;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  facturee: boolean;
  consumed_at: string;
}
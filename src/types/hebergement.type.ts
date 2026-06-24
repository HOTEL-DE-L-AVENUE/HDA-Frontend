export interface RoomType {
  id: number;
  nom: string;
  description: string;
  prix_base?: number;
}

export interface Room {
  id: number;
  room_type_id: number;
  numero: string;
  capacite: number;
  prix_nuit: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'NETTOYAGE' | 'MAINTENANCE' | 'HORS_SERVICE';
  room_type?: RoomType;
}

export interface Reservation {
  id: number;
  client_id: number;
  room_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  statut: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  client_nom?: string;
  client_prenom?: string;
  room_numero?: string;
}

export interface Equipment {
  id: number;
  code: string;
  nom: string;
  categorie: string;
  description: string;
}

export interface RoomEquipment {
  id: number;
  room_id: number;
  equipment_id: number;
  quantite: number;
  statut: 'BON' | 'EN_PANNE' | 'REMPLACE' | 'HORS_SERVICE';
  equipment?: Equipment;
}

export interface HousekeepingTask {
  id: number;
  room_id: number;
  assigned_user_id: number;
  type_tache: 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE';
  statut: 'A_FAIRE' | 'EN_COURS' | 'TERMINE';
  commentaire: string;
  planned_at: string;
  completed_at: string;
}

export interface RoomMaintenance {
  id: number;
  room_id: number;
  equipment_id: number;
  type_intervention: 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE';
  description: string;
  statut: 'OUVERT' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  date_declaration: string;
  date_resolution: string;
  cout: number;
}

export interface Client {
  is_casino_player: any;
  is_casino_player: any;
  id: number;
  code_client: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  type_piece?: string;
  numero_piece?: string;
}

// Formulaires
export interface ReservationForm {
  client_id: number;
  room_id: number;
  date_arrivee: string;
  date_depart: string;
  montant_total: number;
  statut: 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
}

export interface RoomForm {
  room_type_id: number;
  numero: string;
  capacite: number;
  prix_nuit: number;
  statut: 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'NETTOYAGE' | 'MAINTENANCE' | 'HORS_SERVICE';
}

export interface EquipmentForm {
  room_id: number;
  equipment_id: number;
  quantite: number;
  statut: 'BON' | 'EN_PANNE' | 'REMPLACE' | 'HORS_SERVICE';
}

export interface HousekeepingForm {
  room_id: number;
  assigned_user_id: number;
  type_tache: 'NETTOYAGE' | 'DESINFECTION' | 'CHANGEMENT_DRAPS' | 'CONTROLE';
  commentaire: string;
  planned_at: string;
}

export interface MaintenanceForm {
  room_id: number;
  equipment_id: number;
  type_intervention: 'PREVENTIVE' | 'CORRECTIVE' | 'URGENCE';
  description: string;
  cout: number;
}

// Constantes
export const STATUTS_ROOM = {
  LIBRE: { label: 'Libre', variant: 'success' },
  OCCUPEE: { label: 'Occupée', variant: 'warning' },
  RESERVEE: { label: 'Réservée', variant: 'info' },
  NETTOYAGE: { label: 'Nettoyage', variant: 'secondary' },
  MAINTENANCE: { label: 'Maintenance', variant: 'danger' },
  HORS_SERVICE: { label: 'Hors service', variant: 'danger' },
};

export const STATUTS_RESERVATION = {
  CONFIRMEE: { label: 'Confirmée', variant: 'success' },
  EN_COURS: { label: 'En cours', variant: 'warning' },
  TERMINEE: { label: 'Terminée', variant: 'secondary' },
  ANNULEE: { label: 'Annulée', variant: 'danger' },
};

export const TYPES_EQUIPMENT_STATUT = {
  BON: { label: 'Bon', variant: 'success' },
  EN_PANNE: { label: 'En panne', variant: 'danger' },
  REMPLACE: { label: 'Remplacé', variant: 'warning' },
  HORS_SERVICE: { label: 'Hors service', variant: 'danger' },
};

export const TYPES_HOUSEKEEPING = {
  NETTOYAGE: 'Nettoyage',
  DESINFECTION: 'Désinfection',
  CHANGEMENT_DRAPS: 'Changement draps',
  CONTROLE: 'Contrôle',
};

export const TABS = [
  { id: 'reservations', label: 'Réservations', icon: 'Calendar' },
  { id: 'chambres', label: 'Chambres', icon: 'BedDouble' },
  { id: 'equipements', label: 'Équipements', icon: 'Settings' },
  { id: 'housekeeping', label: 'Ménage', icon: 'Housekeeping' },
  { id: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
  { id: 'stock', label: 'Stock', icon: 'Package' },
  { id: 'caisse', label: 'Caisse', icon: 'DollarSign' },
];
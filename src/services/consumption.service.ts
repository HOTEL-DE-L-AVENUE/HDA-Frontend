// src/services/consumption.service.ts
import api from '../lib/api';

export const consumptionService = {
  // Récupérer les consommations d'une chambre
  async getByRoom(roomId: number) {
    // ✅ CORRECTION: Cette route doit exister dans le backend
    const response = await api.get(`/api/consumptions/room/${roomId}`);
    return response.data;
  },

  // Créer une consommation
  async create(data: { 
    room_id: number; 
    client_id: number; 
    product_id: number; 
    quantite: number; 
    prix_unitaire: number;
  }) {
    const response = await api.post('/api/consumptions', data);
    return response.data;
  },

  // Marquer comme facturée
  async markAsBilled(id: number) {
    const response = await api.patch(`/api/consumptions/${id}/bill`);
    return response.data;
  },
};
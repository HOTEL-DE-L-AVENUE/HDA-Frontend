// src/services/minibar.service.ts
import api from '../lib/api';

export const minibarService = {
  // Récupérer tous les minibars
  async getAll(filters?: { room_id?: number; product_id?: number; seuil_alerte?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.room_id) params.append('room_id', filters.room_id.toString());
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.seuil_alerte) params.append('seuil_alerte', 'true');
    
    // ✅ CORRECTION: Utiliser '/api/minibars' (avec 's')
    const response = await api.get(`/api/minibar?${params.toString()}`);
    return response.data;
  },

  // Récupérer les statistiques
  async getStats() {
    // ✅ CORRECTION: Utiliser '/api/minibars/stats'
    const response = await api.get('/api/minibar/stats');
    return response.data;
  },

  // Récupérer le minibar d'une chambre
  async getByRoom(roomId: number) {
    // ✅ CORRECTION: Utiliser '/api/minibars/room'
    const response = await api.get(`/api/minibar/room/${roomId}`);
    return response.data;
  },

  // Mettre à jour la quantité
  async updateQuantity(id: number, quantite: number) {
    // ✅ CORRECTION: Utiliser '/api/minibars' avec 'quantity'
    const response = await api.patch(`/api/minibar/${id}/quantity`, { quantite });
    return response.data;
  },

  // Supprimer un produit
  async delete(id: number) {
    const response = await api.delete(`/api/minibar/${id}`);
    return response.data;
  },
};
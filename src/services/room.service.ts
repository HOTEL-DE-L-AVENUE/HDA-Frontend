// src/services/room.service.ts
import api from '../lib/api';
import { Room, RoomType } from '../types/hotel.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// Service pour les types de chambres
export const roomTypeService = {
  getRoomTypes: async (): Promise<RoomType[]> => {
    try {
      const response = await api.get<ApiResponse<RoomType[]>>('/api/room-types');
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getRoomTypes:', error);
      throw error;
    }
  },

  getRoomTypeById: async (id: number): Promise<RoomType> => {
    try {
      const response = await api.get<ApiResponse<RoomType>>(`/api/room-types/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getRoomTypeById ${id}:`, error);
      throw error;
    }
  },

  createRoomType: async (data: { nom: string; description?: string }): Promise<RoomType> => {
    try {
      const response = await api.post<ApiResponse<RoomType>>('/api/room-types', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createRoomType:', error);
      throw error;
    }
  },

  updateRoomType: async (id: number, data: { nom: string; description?: string }): Promise<RoomType> => {
    try {
      const response = await api.put<ApiResponse<RoomType>>(`/api/room-types/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateRoomType ${id}:`, error);
      throw error;
    }
  },

  deleteRoomType: async (id: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`/api/room-types/${id}`);
    } catch (error) {
      console.error(`❌ Erreur deleteRoomType ${id}:`, error);
      throw error;
    }
  }
};

// Service pour les chambres
export const roomService = {
  getRooms: async (): Promise<Room[]> => {
    try {
      const response = await api.get<ApiResponse<Room[]>>('/api/rooms');
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getRooms:', error);
      throw error;
    }
  },

  getRoomById: async (id: number): Promise<Room> => {
    try {
      const response = await api.get<ApiResponse<Room>>(`/api/rooms/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur getRoomById ${id}:`, error);
      throw error;
    }
  },

  createRoom: async (data: Omit<Room, 'id' | 'room_type'>): Promise<Room> => {
    try {
      const response = await api.post<ApiResponse<Room>>('/api/rooms', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createRoom:', error);
      throw error;
    }
  },

  updateRoom: async (id: number, data: Partial<Room>): Promise<Room> => {
    try {
      const response = await api.put<ApiResponse<Room>>(`/api/rooms/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateRoom ${id}:`, error);
      throw error;
    }
  },

  updateRoomStatus: async (roomId: number, status: string): Promise<Room> => {
    try {
      const response = await api.put<ApiResponse<Room>>(`/api/rooms/${roomId}/status`, {
        statut: status
      });
      return response.data.data;
    } catch (error) {
      console.error(`❌ Erreur updateRoomStatus ${roomId}:`, error);
      throw error;
    }
  },

  deleteRoom: async (roomId: number): Promise<void> => {
    try {
      await api.delete<ApiResponse<void>>(`/api/rooms/${roomId}`);
    } catch (error) {
      console.error(`❌ Erreur deleteRoom ${roomId}:`, error);
      throw error;
    }
  }
};
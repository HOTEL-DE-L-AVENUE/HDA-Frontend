// src/hooks/useReservations.ts
import { useState, useEffect, useCallback } from 'react';
import { reservationService } from '../services/reservation.service';
import { Reservation } from '../types/hotel.types';

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Charger toutes les réservations
  const loadReservations = useCallback(async (filters?: {
    statut?: string;
    client_id?: number;
    room_id?: number;
    date_arrivee?: string;
    date_depart?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reservationService.getReservations(filters);
      setReservations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des réservations');
      console.error('❌ loadReservations error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques
  const loadStats = useCallback(async () => {
    try {
      const data = await reservationService.getReservationStats();
      setStats(data);
    } catch (err: any) {
      console.error('❌ loadStats error:', err);
    }
  }, []);

  // Créer une réservation
  const createReservation = useCallback(async (data: any) => {
    try {
      setError(null);
      const newReservation = await reservationService.createReservation(data);
      setReservations(prev => [...prev, newReservation]);
      return newReservation;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
      console.error('❌ createReservation error:', err);
      throw err;
    }
  }, []);

  // Mettre à jour une réservation
  const updateReservation = useCallback(async (id: number, data: any) => {
    try {
      setError(null);
      const updatedReservation = await reservationService.updateReservation(id, data);
      setReservations(prev => prev.map(res => res.id === id ? updatedReservation : res));
      return updatedReservation;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
      console.error('❌ updateReservation error:', err);
      throw err;
    }
  }, []);

  // Mettre à jour le statut
  const updateStatus = useCallback(async (id: number, statut: string) => {
    try {
      setError(null);
      const updatedReservation = await reservationService.updateReservationStatus(id, statut);
      setReservations(prev => prev.map(res => res.id === id ? updatedReservation : res));
      return updatedReservation;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
      console.error('❌ updateStatus error:', err);
      throw err;
    }
  }, []);

  // Supprimer une réservation
  const deleteReservation = useCallback(async (id: number) => {
    try {
      setError(null);
      await reservationService.deleteReservation(id);
      setReservations(prev => prev.filter(res => res.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      console.error('❌ deleteReservation error:', err);
      throw err;
    }
  }, []);

  // Annuler une réservation
  const cancelReservation = useCallback(async (id: number) => {
    return await updateStatus(id, 'ANNULEE');
  }, [updateStatus]);

  useEffect(() => {
    loadReservations();
    loadStats();
  }, [loadReservations, loadStats]);

  return {
    reservations,
    loading,
    error,
    stats,
    loadReservations,
    loadStats,
    createReservation,
    updateReservation,
    updateStatus,
    deleteReservation,
    cancelReservation
  };
};
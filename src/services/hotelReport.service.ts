// src/services/hotelReport.service.ts
//
// Rapport journalier de l'hôtel (« Situation du chambre durant la Nuité »).
// Comme housekeeping/maintenance, les routes vivent sous le domaine
// « hébergement » côté backend : /api/hebergement/daily-reports.
import api from '../lib/api';
import { HotelDailyReport } from '../types/hotel.types';

const BASE_URL = '/api/hebergement/daily-reports';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

export type HotelDailyReportPayload = Pick<
  HotelDailyReport,
  | 'reportDate'
  | 'heureDebut'
  | 'heureFin'
  | 'receptionniste'
  | 'rooms'
  | 'observations'
  | 'metrics'
  | 'autoState'
>;

export const hotelReportService = {
  /** Rapport d'une date donnée, ou null s'il n'a jamais été enregistré. */
  getReport: async (date: string): Promise<HotelDailyReport | null> => {
    try {
      const response = await api.get<ApiResponse<HotelDailyReport | null>>(`${BASE_URL}/${date}`);
      return response.data.data ?? null;
    } catch (error) {
      console.error(`❌ Erreur getReport ${date}:`, error);
      throw error;
    }
  },

  /** Historique des rapports, du plus récent au plus ancien. */
  listReports: async (filters?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<HotelDailyReport[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('start_date', filters.startDate);
      if (filters?.endDate) params.append('end_date', filters.endDate);
      if (filters?.limit) params.append('limit', String(filters.limit));

      const url = `${BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse<HotelDailyReport[]>>(url);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur listReports:', error);
      throw error;
    }
  },

  /** Crée ou remplace le rapport de la date fournie. */
  saveReport: async (payload: HotelDailyReportPayload): Promise<HotelDailyReport> => {
    try {
      const response = await api.post<ApiResponse<HotelDailyReport>>(BASE_URL, payload);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur saveReport:', error);
      throw error;
    }
  },

  /** Suppression réservée à l'administrateur. */
  deleteReport: async (date: string): Promise<void> => {
    try {
      await api.delete<ApiResponse<unknown>>(`${BASE_URL}/${date}`);
    } catch (error) {
      console.error(`❌ Erreur deleteReport ${date}:`, error);
      throw error;
    }
  },
};

export default hotelReportService;

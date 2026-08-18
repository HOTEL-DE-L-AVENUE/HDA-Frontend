// src/services/finance.service.ts
import api from '../lib/api';

// ==================== TYPES ====================

export interface Invoice {
  id: number;
  client_id: number | null;
  montant_total: number;
  statut: string;
  created_at?: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  montant: number;
}

export interface Payment {
  id: number;
  client_id: number | null;
  invoice_id: number | null;
  montant: number;
  moyen_paiement: string;
  created_at?: string;
}

export interface FinancialTransaction {
  id: number;
  client_id: number | null;
  module: string;
  type_flux: string;
  montant: number;
  reference_id: number | null;
  ref_flux_global: string | null;
  description: string;
  statut_sync: string;
  synced_at: string | null;
  created_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  items: InvoiceItem[];
  payments: Payment[];
}

export interface ModuleCaisseSolde {
  solde: number;
  entrees: number;
  sorties: number;
}

export interface FinancialStats {
  totalRevenu: number;
  totalDepenses: number;
  soldeGlobal: number;
}

// ==================== API SERVICE ====================

export const financeService = {
  // ==================== INVOICES ====================
  
  async getInvoices(params?: { client_id?: number; statut?: string }) {
    try {
      const response = await api.get('/finance/invoices', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getInvoices:', error);
      return [];
    }
  },

  async getInvoiceById(id: number) {
    try {
      const response = await api.get(`/api/finance/invoices/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getInvoiceById:', error);
      return null;
    }
  },

  async getInvoiceDetail(id: number) {
    try {
      const response = await api.get(`/api/finance/invoices/${id}/detail`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getInvoiceDetail:', error);
      return null;
    }
  },

  async createInvoice(data: { client_id: number; items: Array<{ description: string; montant: number }> }) {
    try {
      const response = await api.post('/api/finance/invoices', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur createInvoice:', error);
      throw error;
    }
  },

  // ==================== PAYMENTS ====================
  
  async getPayments(params?: { client_id?: number; invoice_id?: number }) {
    try {
      const response = await api.get('/api/finance/payments', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getPayments:', error);
      return [];
    }
  },

  async getPaymentById(id: number) {
    try {
      const response = await api.get(`/api/finance/payments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getPaymentById:', error);
      return null;
    }
  },

  async recordPayment(data: { client_id: number; invoice_id: number; montant: number; moyen_paiement: string }) {
    try {
      const response = await api.post('/api/finance/payments', data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur recordPayment:', error);
      throw error;
    }
  },

  // ==================== FINANCIAL TRANSACTIONS ====================
  
  async getTransactions(params?: { client_id?: number; module?: string; type_flux?: string }) {
    try {
      const response = await api.get('/api/finance/transactions', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getTransactions:', error);
      return [];
    }
  },

  async getTransactionById(id: number) {
    try {
      const response = await api.get(`/api/finance/transactions/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Erreur getTransactionById:', error);
      return null;
    }
  },

  // ==================== CLIENT STATEMENTS ====================
  
  async getClientStatement(clientId: number) {
    try {
      const response = await api.get(`/api/finance/clients/${clientId}/statement`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getClientStatement:', error);
      return [];
    }
  },

  // ==================== FINANCIAL STATISTICS ====================
  
  async getFinancialStats(): Promise<FinancialStats> {
    try {
      // Calculate stats from transactions since backend doesn't have a dedicated stats endpoint
      const transactions = await this.getTransactions();
      
      const totalRevenu = transactions
        .filter((t: { type_flux: string; }) => t.type_flux === 'ENTREE')
        .reduce((sum: number, t: { montant: any; }) => sum + Number(t.montant), 0);
      
      const totalDepenses = transactions
        .filter((t: { type_flux: string; }) => t.type_flux === 'SORTIE')
        .reduce((sum: number, t: { montant: any; }) => sum + Number(t.montant), 0);
      
      return {
        totalRevenu,
        totalDepenses,
        soldeGlobal: totalRevenu - totalDepenses
      };
    } catch (error) {
      console.error('❌ Erreur getFinancialStats:', error);
      return {
        totalRevenu: 0,
        totalDepenses: 0,
        soldeGlobal: 0
      };
    }
  },

  // ==================== MODULE CAISSE SOLDE ====================
  
  async getModuleCaisseSolde(module: string): Promise<ModuleCaisseSolde> {
    try {
      const transactions = await this.getTransactions({ module });
      
      const entrees = transactions
        .filter((t: { type_flux: string; }) => t.type_flux === 'ENTREE')
        .reduce((sum: number, t: { montant: any; }) => sum + Number(t.montant), 0);
      
      const sorties = transactions
        .filter((t: { type_flux: string; }) => t.type_flux === 'SORTIE')
        .reduce((sum: number, t: { montant: any; }) => sum + Number(t.montant), 0);
      
      return {
        solde: entrees - sorties,
        entrees,
        sorties
      };
    } catch (error) {
      console.error('❌ Erreur getModuleCaisseSolde:', error);
      return {
        solde: 0,
        entrees: 0,
        sorties: 0
      };
    }
  },

  // ==================== INVOICE ITEMS ====================
  
  async getInvoiceItems(params?: { invoice_id?: number }) {
    try {
      const response = await api.get('/finance/invoice-items', { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erreur getInvoiceItems:', error);
      return [];
    }
  }
};

export default financeService;
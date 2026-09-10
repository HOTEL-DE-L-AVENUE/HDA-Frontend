import api from '../lib/api';

export interface RHEmployee {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  department: string;
  position: string;
  joined_at: string;
  contract_type: string;
  salary: number;
  status: string;
  contract_end_date?: string | null;
}

export interface RHDashboard {
  total: number;
  active: number;
  absent: number;
  onLeave: number;
  payrollTotal: number;
  pendingLeave: number;
  departments: Array<{ department: string; total: number }>;
  expiringContracts: Array<{ id: number; first_name: string; last_name: string; contract_end_date: string }>;
}

const rhService = {
  async getDashboard(): Promise<RHDashboard> {
    const response = await api.get('/api/rh/dashboard');
    return response.data.data;
  },
  async listEmployees(params?: { search?: string; department?: string; status?: string }): Promise<RHEmployee[]> {
    const response = await api.get('/api/rh/employees', { params });
    return response.data.data;
  },
  async createEmployee(payload: Record<string, unknown>): Promise<RHEmployee> {
    const response = await api.post('/api/rh/employees', payload);
    return response.data.data;
  },
  async listLeaveRequests(): Promise<any[]> {
    const response = await api.get('/api/rh/leave-requests');
    return response.data.data;
  },
  async updateLeaveStatus(id: number, status: 'APPROUVE' | 'REFUSE' | 'EN_ATTENTE') {
    const response = await api.patch(`/api/rh/leave-requests/${id}/status`, { status });
    return response.data.data;
  },
  async listAttendance(date?: string): Promise<any[]> {
    const response = await api.get('/api/rh/attendance', { params: { date } });
    return response.data.data;
  },
  async listPayroll(period?: string): Promise<any[]> {
    const response = await api.get('/api/rh/payroll', { params: { period } });
    return response.data.data;
  },
};

export default rhService;

import api from '../lib/api';

export interface RHEmployee { id: number; matricule: string; first_name: string; last_name: string; department: string; position: string; joined_at: string; contract_type: string; salary: number; status: string; photo_url?: string | null; birth_date?: string | null; phone?: string | null; address?: string | null; email?: string | null; identification_number?: string | null; contract_end_date?: string | null; departure_date?: string | null; departure_reason?: string | null; }
export interface RHDashboard { total: number; active: number; absent: number; onLeave: number; payrollTotal: number; pendingLeave: number; departments: Array<{ department: string; total: number }>; expiringContracts: Array<{ id: number; matricule: string; first_name: string; last_name: string; contract_end_date: string }>; }
export interface RHAttendance { employee_id: number; matricule: string; first_name: string; last_name: string; department: string; attendance_date?: string; check_in?: string | null; check_out?: string | null; attendance_status: string; notes?: string | null; }
export interface RHPayroll { id: number; employee_id: number; matricule: string; first_name: string; last_name: string; base_salary: number; overtime_amount: number; bonuses: number; allowances: number; advances: number; deductions: number; net_amount: number; status: string; period_month: string; }
export interface RHLeave { id: number; employee_id: number; first_name: string; last_name: string; leave_type: string; start_date: string; end_date: string; days: number; reason?: string; status: string; annual_remaining?: number; }
export interface RHEvaluation { id: number; employee_id: number; period: string; score?: number; comment?: string; evaluation_date: string; status: string; }
export interface Page<T> { rows: T[]; meta?: { page: number; limit: number; total: number; totalPages: number; period?: string }; }
const page = <T>(response: any): Page<T> => ({ rows: response.data.data, meta: response.data.meta });

const rhService = {
  async getDashboard() { return (await api.get('/api/rh/dashboard')).data.data as RHDashboard; },
  async listEmployees(params?: Record<string, unknown>) { return page<RHEmployee>(await api.get('/api/rh/employees', { params })); },
  async getEmployee(id: number) { return (await api.get(`/api/rh/employees/${id}`)).data.data as RHEmployee; },
  async createEmployee(payload: Record<string, unknown>) { return (await api.post('/api/rh/employees', payload)).data.data as RHEmployee; },
  async updateEmployee(id: number, payload: Record<string, unknown>) { return (await api.put(`/api/rh/employees/${id}`, payload)).data.data as RHEmployee; },
  async offboardEmployee(id: number, reason: string) { return (await api.post(`/api/rh/employees/${id}/offboard`, { reason })).data.data as RHEmployee; },
  async listLeaveRequests(params?: Record<string, unknown>) { return page<RHLeave>(await api.get('/api/rh/leave-requests', { params })); },
  async createLeaveRequest(payload: Record<string, unknown>) { return (await api.post('/api/rh/leave-requests', payload)).data.data as RHLeave; },
  async updateLeaveStatus(id: number, status: 'APPROUVE' | 'REFUSE' | 'ANNULE') { return (await api.patch(`/api/rh/leave-requests/${id}/status`, { status })).data.data as RHLeave; },
  async listAttendance(params?: Record<string, unknown>) { return page<RHAttendance>(await api.get('/api/rh/attendance', { params })); },
  async checkIn(employee_id: number) { return (await api.post('/api/rh/attendance/check-in', { employee_id })).data.data; },
  async checkOut(employee_id: number) { return (await api.post('/api/rh/attendance/check-out', { employee_id })).data.data; },
  async listPayroll(params?: Record<string, unknown>) { return page<RHPayroll>(await api.get('/api/rh/payroll', { params })); },
  async generatePayroll(period: string) { return page<RHPayroll>(await api.post(`/api/rh/payroll/${period}/generate`)); },
  async updatePayroll(id: number, payload: Record<string, number>) { return (await api.patch(`/api/rh/payroll/${id}`, payload)).data.data as RHPayroll; },
  async updatePayrollStatus(id: number, status: 'VALIDE' | 'PAYE') { return (await api.patch(`/api/rh/payroll/${id}/status`, { status })).data.data as RHPayroll; },
  async downloadPayslip(period: string, employeeId: number) { return api.get(`/api/rh/payroll/${period}/payslip/${employeeId}`, { responseType: 'blob' }); },
  async listEvaluations(params?: Record<string, unknown>) { return page<RHEvaluation>(await api.get('/api/rh/evaluations', { params })); },
};
export default rhService;

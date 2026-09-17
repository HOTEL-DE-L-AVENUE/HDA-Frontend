import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, Check, ChevronRight, Clock3, Download, FileText, Plus, Search, ShieldCheck, Trash2, UserPlus, UsersRound, WalletCards, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import AuthService from '../services/authService';
import rhService, { RHAttendance, RHDashboard, RHEmployee, RHEvaluation, RHLeave, RHPayroll } from '../services/rh.service';

type RHView = 'overview' | 'employees' | 'attendance' | 'payroll' | 'evaluations';
const departments = ['Administration', 'Réception', 'Restauration', 'Casino', 'Maintenance', 'Hébergement', 'Sécurité'];
const emptyEmployee = { first_name: '', last_name: '', department: 'Administration', position: '', contract_type: 'CDI', status: 'ACTIF', joined_at: new Date().toISOString().slice(0, 10), salary: '', phone: '', address: '', email: '', birth_date: '', identification_number: '', contract_end_date: '' };
const formatMoney = (value: number) => `${new Intl.NumberFormat('fr-FR').format(Number(value || 0))} Ar`;
const labelStatus = (status: string) => ({ ACTIF: 'Actif', EN_CONGE: 'En congé', SUSPENDU: 'Suspendu', SORTI: 'Sorti' }[status] || status);
const colour = (status: string) => status === 'SORTI' ? '#b64f4d' : status === 'SUSPENDU' ? '#9c6b2e' : status === 'EN_CONGE' ? '#a76625' : '#28796e';
const initials = (e: { first_name: string; last_name: string }) => `${e.first_name[0] || ''}${e.last_name[0] || ''}`.toUpperCase();

export const RHPage: React.FC = () => {
  const role = AuthService.getCurrentUser()?.role;
  // 'manager' désactivé ici pour l'instant : le backend (requireHR dans rhRoutes.js)
  // ne reconnaît que admin / rh_manager / rh ou un module 'rh' explicite, donc la vue
  // de gestion complète ci-dessous tombe en erreur pour un manager (paie, effectifs...).
  // En attendant, le manager voit l'espace self-service (fiche + congés + pointage),
  // comme les autres rôles non-admin.
  const isRHManager = role === 'admin'; // || role === 'manager'
  if (!isRHManager) return <MyRHSpace />;
  return <RHManagerView />;
};

// ─────────────────────────────────────────────
// Vue self-service : tout utilisateur non admin/manager (barman, réceptionniste,
// croupier, etc.). Toujours sur la route /rh, toujours dans cette page — pas
// d'onglet séparé. Lecture seule sur sa fiche + demande de congé uniquement.
// ─────────────────────────────────────────────
const MyRHSpace: React.FC = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<RHEmployee | null>(null);
  const [leaves, setLeaves] = useState<RHLeave[]>([]);
  const [attendance, setAttendance] = useState<RHAttendance[]>([]);
  const [error, setError] = useState('');
  const [notLinked, setNotLinked] = useState(false);
  const [leaveForm, setLeaveForm] = useState(false);

  const load = async () => {
    setError(''); setNotLinked(false);
    try {
      const [p, l, a] = await Promise.all([rhService.getMyProfile(), rhService.listMyLeaveRequests({ limit: 50 }), rhService.listMyAttendance({ limit: 31 })]);
      setProfile(p); setLeaves(l.rows); setAttendance(a.rows);
    } catch (e: any) {
      if (e?.response?.status === 404) setNotLinked(true);
      else setError('Vos données RH ne peuvent pas être chargées. Vérifiez votre connexion.');
    }
  };
  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.find(a => a.attendance_date === today);

  const handleCheckIn = async () => {
    try {
      await rhService.checkMyIn();
      showToast('Arrivée enregistrée.', 'success');
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Pointage impossible.', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      await rhService.checkMyOut();
      showToast('Départ enregistré.', 'success');
      load();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Pointage impossible.', 'error');
    }
  };

  if (notLinked) {
    return <div className="min-h-[calc(100vh-120px)] space-y-4 pb-8">
      <header><div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#2b7a78]"><ShieldCheck size={16} /> Ressources humaines</div><h1 className="text-3xl font-bold text-primary">Mon dossier</h1></header>
      <div className="rounded-xl border border-base bg-surface p-5 text-sm text-secondary">Aucune fiche RH n'est encore liée à votre compte. Contactez un administrateur pour la mise en place.</div>
    </div>;
  }

  return <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#2b7a78]"><ShieldCheck size={16} /> Ressources humaines</div><h1 className="text-3xl font-bold text-primary">Mon dossier</h1><p className="mt-1 text-sm text-secondary">Vos informations personnelles et vos demandes de congé.</p></div>
      <button onClick={() => setLeaveForm(true)} className="flex h-10 items-center gap-2 rounded-xl bg-[#2b7a78] px-4 text-sm font-semibold text-white"><Plus size={16} /> Demander un congé</button>
    </header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {profile && <section className="rounded-2xl border border-base bg-surface p-5">
      <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2b7a78] text-sm font-semibold text-white">{initials(profile)}</span><div><h2 className="font-semibold text-primary">{profile.first_name} {profile.last_name}</h2><p className="text-sm text-secondary">{profile.matricule} · {profile.position}</p></div></div>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <p>Département <strong className="float-right">{profile.department}</strong></p>
        <p>Contrat <strong className="float-right">{profile.contract_type}</strong></p>
        <p>Date d'entrée <strong className="float-right">{profile.joined_at}</strong></p>
        <p>Statut <strong className="float-right" style={{ color: colour(profile.status) }}>{labelStatus(profile.status)}</strong></p>
      </div>
    </section>}
    <section className="rounded-2xl border border-base bg-surface p-5">
      <h2 className="font-semibold text-primary">Mes demandes de congé</h2>
      <div className="mt-4 space-y-3">
        {leaves.map((l) => <div key={l.id} className="rounded-xl border border-base p-3"><p className="text-sm">{l.leave_type} · {l.start_date} au {l.end_date} · {l.days} jour(s)</p><p className="text-xs">Statut : {l.status}{l.annual_remaining !== undefined ? ` · Solde annuel : ${l.annual_remaining}` : ''}</p>{l.reason && <p className="text-xs text-secondary">{l.reason}</p>}</div>)}
        {!leaves.length && <p className="text-sm text-secondary">Aucune demande de congé.</p>}
      </div>
    </section>
    <section className="rounded-2xl border border-base bg-surface p-5">
      <h2 className="font-semibold text-primary">Ma présence</h2>
      <div className="mt-4 flex gap-2">
        {!todayAttendance?.check_in && <button onClick={handleCheckIn} className="flex h-10 items-center gap-2 rounded-xl bg-[#2b7a78] px-4 text-sm font-semibold text-white"><Clock3 size={16} /> Entrée</button>}
        {todayAttendance?.check_in && !todayAttendance?.check_out && <button onClick={handleCheckOut} className="flex h-10 items-center gap-2 rounded-xl bg-[#2b7a78] px-4 text-sm font-semibold text-white"><Clock3 size={16} /> Sortie</button>}
        {todayAttendance?.check_out && <span className="flex h-10 items-center gap-2 rounded-xl bg-surface-2 px-4 text-sm text-secondary"><Check size={16} /> Journée terminée</span>}
      </div>
      <div className="mt-4 space-y-2">
        {attendance.map((a) => <div key={a.id} className="rounded-xl border border-base p-3"><p className="text-sm">{a.attendance_date}</p><p className="text-xs text-secondary">Entrée : {a.check_in || '--:--'} · Sortie : {a.check_out || '--:--'} · Statut : {a.status || a.attendance_status}</p></div>)}
        {!attendance.length && <p className="text-sm text-secondary">Aucun pointage enregistré.</p>}
      </div>
    </section>
    {leaveForm && <MyLeaveModal close={() => setLeaveForm(false)} done={load} toast={showToast} />}
  </div>;
};

const MyLeaveModal = ({ close, done, toast }: { close: () => void; done: () => void; toast: (message: string, type: 'success' | 'error') => void }) => {
  const [f, setF] = useState({ leave_type: 'ANNUEL', start_date: '', end_date: '', reason: '' });
  return <div className="fixed inset-0 z-[60] bg-black/30 p-4"><form onSubmit={async (e) => { e.preventDefault(); try { await rhService.createMyLeaveRequest(f); toast('Demande envoyée.', 'success'); close(); done(); } catch (err: any) { toast(err?.response?.data?.message || 'Envoi impossible.', 'error'); } }} className="mx-auto mt-20 max-w-md rounded-2xl bg-surface p-6">
    <h2 className="font-bold">Demander un congé</h2>
    <div className="mt-4 space-y-3">
      <select value={f.leave_type} onChange={(e) => setF({ ...f, leave_type: e.target.value })} className="w-full rounded border p-2"><option value="ANNUEL">Annuel</option><option value="MALADIE">Maladie</option><option value="MATERNITE_PATERNITE">Maternité/paternité</option><option value="SANS_SOLDE">Sans solde</option></select>
      <input required type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} className="w-full rounded border p-2" />
      <input required type="date" value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} className="w-full rounded border p-2" />
      <input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Motif" className="w-full rounded border p-2" />
    </div>
    <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={close}>Annuler</button><button className="rounded bg-[#2b7a78] px-3 py-2 text-white">Envoyer</button></div>
  </form></div>;
};

// ─────────────────────────────────────────────
// Vue de gestion complète : admin / manager, inchangée.
// ─────────────────────────────────────────────
const RHManagerView: React.FC = () => {
  const { showToast } = useToast();
  const [view, setView] = useState<RHView>('overview'); const [employees, setEmployees] = useState<RHEmployee[]>([]); const [dashboard, setDashboard] = useState<RHDashboard | null>(null); const [attendance, setAttendance] = useState<RHAttendance[]>([]); const [leaves, setLeaves] = useState<RHLeave[]>([]); const [payroll, setPayroll] = useState<RHPayroll[]>([]); const [evaluations, setEvaluations] = useState<RHEvaluation[]>([]);
  const [error, setError] = useState(''); const [search, setSearch] = useState(''); const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10)); const [employeeForm, setEmployeeForm] = useState<Record<string, string> | null>(null); const [selected, setSelected] = useState<RHEmployee | null>(null); const [leaveForm, setLeaveForm] = useState(false);
  const [myAttendance, setMyAttendance] = useState<RHAttendance[]>([]); const [myNotLinked, setMyNotLinked] = useState(false);
  const [payrollSearch, setPayrollSearch] = useState('');
  const [selectedPayroll, setSelectedPayroll] = useState<RHPayroll | null>(null);
  const [payrollAdjustment, setPayrollAdjustment] = useState<RHPayroll | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<Record<string, string>>({
    overtime_amount: '',
    bonuses: '',
    allowances: '',
    advances: '',
    deductions: '',
  });
  const load = async () => {
    setError('');
    try { const [es, d, l, a, p, ev] = await Promise.all([rhService.listEmployees({ limit: 100, search }), rhService.getDashboard(), rhService.listLeaveRequests({ limit: 100 }), rhService.listAttendance({ date: attendanceDate, limit: 100 }), rhService.listPayroll({ period, limit: 100 }), rhService.listEvaluations({ limit: 100 })]); setEmployees(es.rows); setDashboard(d); setLeaves(l.rows); setAttendance(a.rows); setPayroll(p.rows); setEvaluations(ev.rows); } catch { setError('Les données RH ne peuvent pas être chargées. Vérifiez votre accès et la connexion au serveur.'); }
  };
  // Un manager/admin est aussi un employé : il pointe sa propre présence via /rh/me,
  // comme le font les autres rôles dans MyRHSpace, en plus de gérer celle des autres.
  const loadMine = async () => {
    try { const a = await rhService.listMyAttendance({ limit: 31 }); setMyAttendance(a.rows); setMyNotLinked(false); } catch (e: any) { if (e?.response?.status === 404) setMyNotLinked(true); }
  };
  const handleMyCheckIn = async () => { try { await rhService.checkMyIn(); showToast('Arrivée enregistrée.', 'success'); loadMine(); } catch (e: any) { showToast(e?.response?.data?.message || 'Pointage impossible.', 'error'); } };
  const handleMyCheckOut = async () => { try { await rhService.checkMyOut(); showToast('Départ enregistré.', 'success'); loadMine(); } catch (e: any) { showToast(e?.response?.data?.message || 'Pointage impossible.', 'error'); } };
  const todayMine = myAttendance.find(a => a.attendance_date === new Date().toISOString().slice(0, 10));
  useEffect(() => { load(); loadMine(); }, []); // Sensitive data is never cached in localStorage.
  useEffect(() => { rhService.listAttendance({ date: attendanceDate, limit: 100 }).then((r) => setAttendance(r.rows)).catch(() => setError('Impossible de charger les présences.')); }, [attendanceDate]);
  useEffect(() => { rhService.listPayroll({ period, limit: 100 }).then((r) => setPayroll(r.rows)).catch(() => setError('Impossible de charger la paie.')); }, [period]);
  useEffect(() => { if (!payrollToDelete) return; const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !deletingPayroll) setPayrollToDelete(null); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [payrollToDelete, deletingPayroll]);
  const pendingLeaves = leaves.filter((l) => l.status === 'EN_ATTENTE'); const totals = useMemo(() => payroll.reduce((a, p) => ({ base: a.base + Number(p.base_salary), extras: a.extras + Number(p.overtime_amount) + Number(p.bonuses) + Number(p.allowances), deductions: a.deductions + Number(p.advances) + Number(p.deductions), net: a.net + Number(p.net_amount) }), { base: 0, extras: 0, deductions: 0, net: 0 }), [payroll]);
  const refreshAfterAction = () => load();
  const saveEmployee = async (event: React.FormEvent) => { event.preventDefault(); if (!employeeForm) return; try { const { id: _id, matricule: _matricule, departure_date: _departureDate, departure_reason: _departureReason, ...editable } = employeeForm; const payload: Record<string, unknown> = { ...editable, salary: Number(employeeForm.salary), birth_date: employeeForm.birth_date || null, contract_end_date: employeeForm.contract_end_date || null, email: employeeForm.email || null, phone: employeeForm.phone || null, address: employeeForm.address || null, identification_number: employeeForm.identification_number || null }; if (selected && ['EN_CONGE', 'SORTI'].includes(selected.status)) delete payload.status; const updatedEmployee = selected ? await rhService.updateEmployee(selected.id, payload) : await rhService.createEmployee(payload); setEmployeeForm(null); setSelected(null); if (selected) { setEmployees((current) => current.map((emp) => emp.id === selected.id ? { ...emp, ...updatedEmployee } : emp)); setPayroll((current) => current.map((line) => line.employee_id === selected.id ? { ...line, base_salary: Number(updatedEmployee.salary ?? line.base_salary), first_name: updatedEmployee.first_name || line.first_name, last_name: updatedEmployee.last_name || line.last_name, matricule: updatedEmployee.matricule || line.matricule } : line)); setSelectedPayroll((current) => current && current.employee_id === selected.id ? { ...current, base_salary: Number(updatedEmployee.salary ?? current.base_salary), first_name: updatedEmployee.first_name || current.first_name, last_name: updatedEmployee.last_name || current.last_name, matricule: updatedEmployee.matricule || current.matricule } : current); }
    showToast('Dossier employé enregistré.', 'success'); refreshAfterAction(); } catch (e: any) { showToast(e?.response?.data?.message || 'Enregistrement impossible.', 'error'); } };
  const handleLeave = async (id: number, status: 'APPROUVE' | 'REFUSE') => { try { await rhService.updateLeaveStatus(id, status); showToast(status === 'APPROUVE' ? 'Congé approuvé.' : 'Congé refusé.', 'success'); refreshAfterAction(); } catch (e: any) { showToast(e?.response?.data?.message || 'Mise à jour impossible.', 'error'); } };
  const generate = async () => { try { const r = await rhService.generatePayroll(period); setPayroll(r.rows); showToast('Paie préparée : les absences et congés sans solde ont été calculés.', 'success'); } catch (e: any) { showToast(e?.response?.data?.message || 'Préparation impossible.', 'error'); } };
  const point = async (employeeId: number, action: 'in' | 'out') => { try { action === 'in' ? await rhService.checkIn(employeeId) : await rhService.checkOut(employeeId); showToast(action === 'in' ? 'Arrivée enregistrée.' : 'Départ enregistré.', 'success'); const r = await rhService.listAttendance({ date: attendanceDate, limit: 100 }); setAttendance(r.rows); } catch (e: any) { showToast(e?.response?.data?.message || 'Pointage impossible.', 'error'); } };
  const changePayroll = async (line: RHPayroll, status: 'VALIDE' | 'PAYE') => { try { await rhService.updatePayrollStatus(line.id, status); showToast(`Paie ${status === 'VALIDE' ? 'validée' : 'marquée payée'}.`, 'success'); refreshAfterAction(); } catch (e: any) { showToast(e?.response?.data?.message || 'Action impossible.', 'error'); } };
  const openPayrollAdjustment = (line: RHPayroll) => {
    setSelectedPayroll(line);
    setPayrollAdjustment(line);
    setAdjustmentForm({
      overtime_amount: String(line.overtime_amount ?? 0),
      bonuses: String(line.bonuses ?? 0),
      allowances: String(line.allowances ?? 0),
      advances: String(line.advances ?? 0),
      deductions: String(line.deductions ?? 0),
    });
  };
  const savePayrollAdjustment = async () => {
    if (!payrollAdjustment) return;
    const fields = ['overtime_amount', 'bonuses', 'allowances', 'advances', 'deductions'] as const;
    const payload: Record<string, number> = {};
    for (const field of fields) {
      const value = adjustmentForm[field];
      if (value === '' || !/^\d+(\.\d{1,2})?$/.test(value)) {
        showToast('Saisissez un montant valide pour chaque champ.', 'error');
        return;
      }
      payload[field] = Number(value);
    }
    try {
      await rhService.updatePayroll(payrollAdjustment.id, payload);
      showToast('Ajustement enregistré avec succès.', 'success');
      setPayrollAdjustment(null);
      refreshAfterAction();
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Mise à jour impossible.', 'error');
    }
  };
  const downloadPayslip = async (line: RHPayroll) => { try { const response = await rhService.downloadPayslip(period, line.employee_id); const url = URL.createObjectURL(response.data); const a = document.createElement('a'); a.href = url; a.download = `bulletin-${line.matricule}-${period}.pdf`; a.click(); URL.revokeObjectURL(url); } catch { showToast('Téléchargement du bulletin impossible.', 'error'); } };
  const nav: Array<[RHView, string, React.ReactNode]> = [['overview', 'Vue d’ensemble', <BarChart3 size={17} />], ['employees', 'Employés', <UsersRound size={17} />], ['attendance', 'Présences & congés', <CalendarDays size={17} />], ['payroll', 'Paie', <WalletCards size={17} />], ['evaluations', 'Évaluations', <FileText size={17} />]];
  return <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8"><header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#2b7a78]"><ShieldCheck size={16} /> Administration du personnel</div><h1 className="text-3xl font-bold text-primary">Ressources humaines</h1><p className="mt-1 text-sm text-secondary">Données RH sécurisées et actions traçables.</p></div><button onClick={() => { setSelected(null); setEmployeeForm(emptyEmployee); }} className="flex h-10 items-center gap-2 rounded-xl bg-[#2b7a78] px-4 text-sm font-semibold text-white"><UserPlus size={16} /> Nouvel employé</button></header>
    {!myNotLinked && <section className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-base bg-surface p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-sm text-secondary"><Clock3 size={16} className="text-[#2b7a78]" /><span>Ma présence aujourd’hui : {todayMine?.check_in ? `Entrée ${todayMine.check_in}` : 'Pas encore pointé'}{todayMine?.check_out ? ` · Sortie ${todayMine.check_out}` : ''}</span></div>{!todayMine?.check_in && <button onClick={handleMyCheckIn} className="flex h-9 items-center gap-2 rounded-xl bg-[#2b7a78] px-4 text-sm font-semibold text-white"><Clock3 size={15} /> Entrée</button>}{todayMine?.check_in && !todayMine?.check_out && <button onClick={handleMyCheckOut} className="flex h-9 items-center gap-2 rounded-xl bg-[#2b7a78] px-4 text-sm font-semibold text-white"><Clock3 size={15} /> Sortie</button>}{todayMine?.check_out && <span className="flex h-9 items-center gap-2 rounded-xl bg-surface-2 px-4 text-sm text-secondary"><Check size={15} /> Journée terminée</span>}</section>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="flex gap-1 overflow-x-auto border-b border-base">{nav.map(([id, label, icon]) => <button key={id} onClick={() => setView(id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm ${view === id ? 'border-[#2b7a78] text-[#2b7a78]' : 'border-transparent text-secondary'}`}>{icon}{label}</button>)}</div>
    {view === 'overview' && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Effectif total', dashboard?.total || 0, `${dashboard?.active || 0} actifs`, <UsersRound size={20} />], ['Présences aujourd’hui', `${attendance.filter(a => ['PRESENT', 'RETARD'].includes(a.attendance_status || '')).length}/${attendance.length}`, `${dashboard?.absent || 0} absence(s)`, <Clock3 size={20} />], ['Congés en cours', dashboard?.onLeave || 0, `${dashboard?.pendingLeave || 0} à traiter`, <CalendarDays size={20} />], ['Masse salariale', formatMoney(dashboard?.payrollTotal || 0), 'Estimation mensuelle', <WalletCards size={20} />]].map(([label, value, detail, icon]) => <div key={String(label)} className="rounded-2xl border border-base bg-surface p-5 shadow-sm"><div className="flex justify-between"><div><p className="text-sm text-secondary">{label}</p><p className="mt-2 text-2xl font-bold text-primary">{value}</p></div><span className="text-[#2b7a78]">{icon as React.ReactNode}</span></div><p className="mt-4 text-xs text-secondary">{detail}</p></div>)}</div><div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-base bg-surface p-5"><h2 className="font-semibold text-primary">Effectif par département</h2><div className="mt-4 space-y-3">{(dashboard?.departments || []).map(d => <div key={d.department} className="flex justify-between text-sm"><span>{d.department}</span><strong>{d.total}</strong></div>)}</div></section><section className="rounded-2xl border border-base bg-surface p-5"><h2 className="font-semibold text-primary">À traiter</h2><div className="mt-3 space-y-2">{pendingLeaves.map(l => <button key={l.id} onClick={() => setView('attendance')} className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left"><CalendarDays size={16} /><span className="flex-1"><strong className="block text-sm">Demande de congé</strong><small>{l.first_name} {l.last_name} · {l.days} jour(s)</small></span><ChevronRight size={16} /></button>)}{(dashboard?.expiringContracts || []).map(c => <button key={c.id} onClick={() => setView('employees')} className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left"><AlertTriangle size={16} /><span className="flex-1"><strong className="block text-sm">Contrat à renouveler</strong><small>{c.first_name} {c.last_name} · {c.contract_end_date}</small></span><ChevronRight size={16} /></button>)}{!pendingLeaves.length && !(dashboard?.expiringContracts || []).length && <p className="text-sm text-secondary">Aucune action en attente.</p>}</div></section></div></>}
    {view === 'employees' && <section className="rounded-2xl border border-base bg-surface"><div className="flex justify-between gap-3 border-b border-base p-4"><h2 className="font-semibold text-primary">Registre des employés</h2><label className="flex items-center gap-2 rounded-xl border border-base px-3"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Rechercher" className="h-9 bg-transparent outline-none" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-2 text-secondary"><tr><th className="p-3">Employé</th><th>Poste</th><th>Contrat</th><th>Statut</th><th /></tr></thead><tbody>{employees.map(e => <tr key={e.id} className="border-t border-base"><td className="p-3"><strong>{e.first_name} {e.last_name}</strong><small className="block text-secondary">{e.matricule}</small></td><td>{e.department} · {e.position}</td><td>{e.contract_type}</td><td><span style={{ color: colour(e.status) }}>{labelStatus(e.status)}</span></td><td><button onClick={() => { setSelected(e); setEmployeeForm({ ...emptyEmployee, ...Object.fromEntries(Object.entries(e).map(([k,v]) => [k, v == null ? '' : String(v)])) }); }} title="Ouvrir le dossier"><ChevronRight size={18}/></button></td></tr>)}</tbody></table></div></section>}
    {view === 'attendance' && <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]"><section className="rounded-2xl border border-base bg-surface p-5"><div className="flex justify-between"><div><h2 className="font-semibold text-primary">Suivi des présences</h2><input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="mt-2 rounded border p-1" /></div><Clock3 size={19}/></div><div className="mt-4 space-y-2">{attendance.map(a => <div key={a.employee_id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3"><span className="rounded bg-[#2b7a78] p-2 text-xs text-white">{initials({ first_name: a.first_name || '', last_name: a.last_name || '' })}</span><span className="flex-1"><strong className="block text-sm">{a.first_name} {a.last_name}</strong><small>{a.department} · {a.attendance_status}</small></span><span className="text-right text-xs">{a.check_in || '--:--'}<br/>{a.check_out || '--:--'}</span>{attendanceDate === new Date().toISOString().slice(0, 10) && <span className="flex gap-1"><button onClick={() => point(a.employee_id, 'in')} className="rounded bg-[#2b7a78] px-2 py-1 text-xs text-white">Entrée</button><button onClick={() => point(a.employee_id, 'out')} className="rounded border px-2 py-1 text-xs">Sortie</button></span>}</div>)}</div></section><section className="rounded-2xl border border-base bg-surface p-5"><div className="flex justify-between"><div><h2 className="font-semibold text-primary">Demandes de congé</h2><p className="text-xs text-secondary">Solde annuel affiché après traitement</p></div><button onClick={() => setLeaveForm(true)} className="rounded bg-[#2b7a78] px-2 text-white"><Plus size={16}/></button></div><div className="mt-4 space-y-3">{leaves.map(l => <div key={l.id} className="rounded-xl border border-base p-3"><strong className="text-sm">{l.first_name} {l.last_name}</strong><p className="text-xs text-secondary">{l.leave_type} · {l.start_date} au {l.end_date} · {l.days} jours</p><p className="text-xs">Statut : {l.status}{l.annual_remaining !== undefined ? ` · Solde annuel : ${l.annual_remaining}` : ''}</p>{l.status === 'EN_ATTENTE' && <div className="mt-2 flex gap-2"><button onClick={() => handleLeave(l.id, 'APPROUVE')} className="rounded bg-[#2b7a78] px-2 py-1 text-xs text-white"><Check size={13}/></button><button onClick={() => handleLeave(l.id, 'REFUSE')} className="rounded border px-2 py-1 text-xs"><X size={13}/></button></div>}</div>)}</div></section></div>}
    {view === 'payroll' && <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]"><section className="rounded-2xl border border-base bg-surface p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-primary">Préparation de la paie</h2><input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="mt-2 rounded border p-1" /></div><button onClick={generate} className="rounded-xl bg-[#2b7a78] px-3 py-2 text-xs text-white">Préparer la paie</button></div><div className="mt-4 mb-3"><label className="flex items-center gap-2 rounded-xl border border-base bg-surface-2 px-3 py-2 text-sm text-secondary"><Search size={16} /><input value={payrollSearch} onChange={e => setPayrollSearch(e.target.value)} placeholder="Rechercher un employé" className="w-full bg-transparent outline-none" /></label></div><div className="mt-4 space-y-2">{payroll.filter((p) => `${p.first_name} ${p.last_name} ${p.matricule}`.toLowerCase().includes(payrollSearch.toLowerCase())).map(p => <button key={p.id} type="button" onClick={() => setSelectedPayroll(p)} className="block w-full rounded-xl bg-surface-2 p-3 text-left"><div className="flex justify-between"><strong className="text-sm">{p.first_name} {p.last_name}</strong><strong>{formatMoney(p.net_amount)}</strong></div><small>Base {formatMoney(p.base_salary)} · HS {formatMoney(p.overtime_amount)} · Retenues {formatMoney(p.deductions)}</small><div className="mt-2 flex gap-2"><button type="button" disabled={p.status !== 'BROUILLON'} onClick={(e) => { e.stopPropagation(); openPayrollAdjustment(p); }} className="rounded border px-2 py-1 text-xs disabled:opacity-40">Ajuster</button><button type="button" disabled={p.status !== 'BROUILLON'} onClick={(e) => { e.stopPropagation(); changePayroll(p, 'VALIDE'); }} className="rounded border px-2 py-1 text-xs disabled:opacity-40">Valider</button><button type="button" disabled={p.status !== 'VALIDE'} onClick={(e) => { e.stopPropagation(); changePayroll(p, 'PAYE'); }} className="rounded border px-2 py-1 text-xs disabled:opacity-40">Payer</button><button type="button" onClick={(e) => { e.stopPropagation(); downloadPayslip(p); }} className="rounded border px-2 py-1 text-xs"><Download size={13}/></button><span className="text-xs">{p.status}</span></div></button>)}</div></section><section className="rounded-2xl border border-base bg-surface p-5"><h2 className="font-semibold text-primary">Résumé réel de la période</h2>{selectedPayroll ? <div className="mt-4 rounded-xl border border-base bg-surface-2 p-3"><p className="text-sm text-secondary">Employé ciblé</p><h3 className="mt-1 text-lg font-bold text-primary">{selectedPayroll.first_name} {selectedPayroll.last_name}</h3></div> : <div className="mt-4 text-sm text-secondary">Aucun employé sélectionné.</div>}<div className="mt-5 space-y-3 text-sm">{selectedPayroll ? <><p>Salaires de base <strong className="float-right">{formatMoney(Number(selectedPayroll.base_salary || 0))}</strong></p><p>Variables <strong className="float-right">{formatMoney(Number(selectedPayroll.overtime_amount || 0) + Number(selectedPayroll.bonuses || 0) + Number(selectedPayroll.allowances || 0))}</strong></p><p>Avances et retenues <strong className="float-right">-{formatMoney(Number(selectedPayroll.advances || 0) + Number(selectedPayroll.deductions || 0))}</strong></p><p className="border-t pt-3 font-semibold">Net à payer <strong className="float-right text-[#2b7a78]">{formatMoney(Number(selectedPayroll.net_amount || 0))}</strong></p></> : <><p>Salaires de base <strong className="float-right">{formatMoney(totals.base)}</strong></p><p>Variables <strong className="float-right">{formatMoney(totals.extras)}</strong></p><p>Avances et retenues <strong className="float-right">-{formatMoney(totals.deductions)}</strong></p><p className="border-t pt-3 font-semibold">Net à payer <strong className="float-right text-[#2b7a78]">{formatMoney(totals.net)}</strong></p></>}</div><p className="mt-5 text-xs text-secondary">CNAPS, OSTIE et IRSA ne sont pas calculés automatiquement.</p></section></div>}
    {view === 'evaluations' && <section className="rounded-2xl border border-base bg-surface p-5"><h2 className="font-semibold text-primary">Évaluations de performance</h2><div className="mt-4 space-y-2">{evaluations.map(e => <div key={e.id} className="rounded-xl bg-surface-2 p-3 text-sm">Employé #{e.employee_id} · {e.period} · score {e.score ?? '—'} · {e.status}<small className="block text-secondary">{e.comment || 'Aucun commentaire'}</small></div>)}{!evaluations.length && <p className="text-sm text-secondary">Aucune évaluation enregistrée.</p>}</div></section>}
    {payrollToDelete && <div onClick={() => !deletingPayroll && setPayrollToDelete(null)} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-2xl border border-base bg-surface shadow-2xl"><div className="p-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500"><Trash2 size={26}/></div><h2 className="mt-4 text-lg font-bold text-primary">Supprimer cette ligne de paie ?</h2><p className="mt-2 text-sm text-secondary">La ligne de <strong className="text-primary">{payrollToDelete.first_name} {payrollToDelete.last_name}</strong> sera définitivement retirée de la paie. Cette action est irréversible.</p><div className="mt-4 space-y-1 rounded-xl bg-surface-2 p-3 text-left text-xs text-secondary"><p className="flex justify-between"><span>Période</span><strong className="text-primary">{String(payrollToDelete.period_month || period).slice(0, 7)}</strong></p><p className="flex justify-between"><span>Net à payer</span><strong className="text-primary">{formatMoney(payrollToDelete.net_amount)}</strong></p><p className="flex justify-between"><span>Statut</span><strong className="text-primary">{payrollToDelete.status}</strong></p></div></div><div className="flex gap-2 border-t border-base bg-surface-2 p-4"><button type="button" disabled={deletingPayroll} onClick={() => setPayrollToDelete(null)} className="flex-1 rounded-xl border border-base px-4 py-2 text-sm font-medium text-primary transition hover:bg-surface disabled:opacity-40">Annuler</button><button type="button" autoFocus disabled={deletingPayroll} onClick={confirmRemovePayroll} className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">{deletingPayroll ? 'Suppression…' : 'Supprimer'}</button></div></div></div>}
    {employeeForm && <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/30 p-4"><form onSubmit={saveEmployee} className="mx-auto my-8 max-w-2xl rounded-2xl bg-surface p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">{selected ? 'Dossier employé' : 'Nouvel employé'}</h2><button type="button" onClick={() => {setEmployeeForm(null);setSelected(null)}}><X/></button></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['first_name','Prénom','text'],['last_name','Nom','text'],['position','Poste','text'],['salary','Salaire (Ar)','number'],['phone','Téléphone','text'],['email','E-mail','email'],['birth_date','Date de naissance','date'],['identification_number','N° identité','text'],['address','Adresse','text'],['joined_at','Date d’entrée','date'],['contract_end_date','Fin de contrat','date']].map(([key,label,type]) => <label key={key} className="text-sm">{label}<input required={['first_name','last_name','position','salary','joined_at'].includes(key)} type={type} value={employeeForm[key] || ''} onChange={e => setEmployeeForm({...employeeForm,[key]:e.target.value})} className="mt-1 h-10 w-full rounded border p-2"/></label>)}<label className="text-sm">Département<select value={employeeForm.department} onChange={e => setEmployeeForm({...employeeForm,department:e.target.value})} className="mt-1 h-10 w-full rounded border p-2">{departments.map(d=><option key={d}>{d}</option>)}</select></label><label className="text-sm">Contrat<select value={employeeForm.contract_type} onChange={e => setEmployeeForm({...employeeForm,contract_type:e.target.value})} className="mt-1 h-10 w-full rounded border p-2"><option>CDI</option><option>CDD</option><option>Stage</option></select></label>{selected && selected.status !== 'SORTI' && <label className="text-sm">Statut d’emploi<select value={employeeForm.status === 'SUSPENDU' ? 'SUSPENDU' : 'ACTIF'} onChange={e => setEmployeeForm({...employeeForm,status:e.target.value})} className="mt-1 h-10 w-full rounded border p-2"><option value="ACTIF">Actif</option><option value="SUSPENDU">Suspendu</option></select></label>}</div>{selected && selected.status !== 'SORTI' && <button type="button" onClick={async()=>{const reason=window.prompt('Motif de sortie :'); if(reason){try{await rhService.offboardEmployee(selected.id,reason);showToast('Sortie enregistrée.','success');setEmployeeForm(null);setSelected(null);refreshAfterAction()}catch{showToast('Sortie impossible.','error')}}}} className="mt-4 text-sm text-red-600">Enregistrer une sortie</button>}<div className="mt-6 flex justify-end"><button className="rounded bg-[#2b7a78] px-4 py-2 text-white">Enregistrer</button></div></form></div>}
    {payrollAdjustment && <div className="fixed inset-0 z-[70] bg-black/40 p-4"><div className="mx-auto mt-20 max-w-lg rounded-2xl bg-surface p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-primary">Ajuster la paie</h2><button type="button" onClick={() => setPayrollAdjustment(null)} className="rounded border p-2"><X size={16} /></button></div><div className="mt-4 space-y-4"><p className="text-sm text-secondary">Employé : <strong className="text-primary">{payrollAdjustment.first_name} {payrollAdjustment.last_name}</strong></p>{([
      ['overtime_amount', 'Heures supplémentaires (Ar)'],
      ['bonuses', 'Primes (Ar)'],
      ['allowances', 'Allocations (Ar)'],
      ['advances', 'Avances (Ar)'],
      ['deductions', 'Retenues (Ar)'],
    ] as const).map(([key, label]) => <label key={key} className="block text-sm"><span className="mb-1 block text-secondary">{label}</span><input type="number" min="0" step="0.01" value={adjustmentForm[key]} onChange={(e) => setAdjustmentForm((current) => ({ ...current, [key]: e.target.value }))} className="h-10 w-full rounded border p-2" /></label>)}<div className="flex justify-end gap-2"><button type="button" onClick={() => setPayrollAdjustment(null)} className="rounded border px-3 py-2 text-sm">Annuler</button><button type="button" onClick={savePayrollAdjustment} className="rounded bg-[#2b7a78] px-3 py-2 text-sm text-white">Enregistrer</button></div></div></div></div>}
    {leaveForm && <LeaveModal employees={employees} close={() => setLeaveForm(false)} done={refreshAfterAction} toast={showToast}/>}</div>;
};
const LeaveModal = ({ employees, close, done, toast }: { employees: RHEmployee[]; close: () => void; done: () => void; toast: (message: string, type: 'success' | 'error') => void }) => { const [f,setF]=useState({employee_id:'',leave_type:'ANNUEL',start_date:'',end_date:'',reason:''}); return <div className="fixed inset-0 z-[60] bg-black/30 p-4"><form onSubmit={async e=>{e.preventDefault();try{await rhService.createLeaveRequest({...f,employee_id:Number(f.employee_id)});toast('Demande créée.','success');close();done()}catch(err:any){toast(err?.response?.data?.message||'Création impossible.','error')}}} className="mx-auto mt-20 max-w-md rounded-2xl bg-surface p-6"><h2 className="font-bold">Nouvelle demande de congé</h2><div className="mt-4 space-y-3"><select required value={f.employee_id} onChange={e=>setF({...f,employee_id:e.target.value})} className="w-full rounded border p-2"><option value="">Employé</option>{employees.filter(e=>e.status!=='SORTI').map(e=><option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}</select><select value={f.leave_type} onChange={e=>setF({...f,leave_type:e.target.value})} className="w-full rounded border p-2"><option value="ANNUEL">Annuel</option><option value="MALADIE">Maladie</option><option value="MATERNITE_PATERNITE">Maternité/paternité</option><option value="SANS_SOLDE">Sans solde</option></select><input required type="date" value={f.start_date} onChange={e=>setF({...f,start_date:e.target.value})} className="w-full rounded border p-2"/><input required type="date" value={f.end_date} onChange={e=>setF({...f,end_date:e.target.value})} className="w-full rounded border p-2"/><input value={f.reason} onChange={e=>setF({...f,reason:e.target.value})} placeholder="Motif" className="w-full rounded border p-2"/></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={close}>Annuler</button><button className="rounded bg-[#2b7a78] px-3 py-2 text-white">Envoyer</button></div></form></div> };

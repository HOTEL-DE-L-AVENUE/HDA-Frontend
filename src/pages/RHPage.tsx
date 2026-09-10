import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import rhService, { RHEmployee, RHDashboard } from '../services/rh.service';

type RHView = 'overview' | 'employees' | 'attendance' | 'payroll';
type EmployeeStatus = 'Actif' | 'En congé' | 'Absent';

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  contract: string;
  joinedAt: string;
  salary: number;
  status: EmployeeStatus;
  initials: string;
  color: string;
};

const initialEmployees: Employee[] = [
  { id: 1, firstName: 'Mamy', lastName: 'Rakoto', department: 'Réception', position: 'Responsable réception', contract: 'CDI', joinedAt: '12 mars 2021', salary: 1850000, status: 'Actif', initials: 'MR', color: '#2b7a78' },
  { id: 2, firstName: 'Lova', lastName: 'Razanakoto', department: 'Restauration', position: 'Chef de rang', contract: 'CDI', joinedAt: '05 juin 2022', salary: 1250000, status: 'Actif', initials: 'LR', color: '#d97745' },
  { id: 3, firstName: 'Sarah', lastName: 'Andrianina', department: 'Administration', position: 'Assistante RH', contract: 'CDD', joinedAt: '18 septembre 2023', salary: 1100000, status: 'En congé', initials: 'SA', color: '#8067a7' },
  { id: 4, firstName: 'Tiana', lastName: 'Raveloson', department: 'Casino', position: 'Croupier', contract: 'CDI', joinedAt: '21 janvier 2020', salary: 1450000, status: 'Actif', initials: 'TR', color: '#be6657' },
  { id: 5, firstName: 'Hery', lastName: 'Ratsimba', department: 'Maintenance', position: 'Technicien', contract: 'CDD', joinedAt: '02 novembre 2024', salary: 980000, status: 'Absent', initials: 'HR', color: '#4d7890' },
];

const formatMoney = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} Ar`;
const storageKey = 'hda-rh-employees';

const statusStyles: Record<EmployeeStatus, { background: string; color: string }> = {
  Actif: { background: '#e5f4ef', color: '#28796e' },
  'En congé': { background: '#fff1df', color: '#a76625' },
  Absent: { background: '#fae8e7', color: '#b64f4d' },
};

const mapStatus = (status: string): EmployeeStatus => {
  if (status === 'EN_CONGE') return 'En congé';
  if (status === 'ABSENT') return 'Absent';
  return 'Actif';
};

const mapEmployee = (employee: RHEmployee): Employee => ({
  id: employee.id,
  firstName: employee.first_name,
  lastName: employee.last_name,
  department: employee.department,
  position: employee.position,
  contract: employee.contract_type,
  joinedAt: employee.joined_at,
  salary: Number(employee.salary || 0),
  status: mapStatus(employee.status),
  initials: `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase(),
  color: '#2b7a78',
});

const navigation: Array<{ id: RHView; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Vue d’ensemble', icon: <BarChart3 size={17} /> },
  { id: 'employees', label: 'Employés', icon: <UsersRound size={17} /> },
  { id: 'attendance', label: 'Présences & congés', icon: <CalendarDays size={17} /> },
  { id: 'payroll', label: 'Paie', icon: <WalletCards size={17} /> },
];

const StatCard = ({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: React.ReactNode; tone: string }) => (
  <div className="rounded-2xl border border-base bg-surface p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-secondary">{label}</p>
        <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: tone, color: 'var(--color-primary)' }}>{icon}</span>
    </div>
    <p className="mt-4 text-xs text-secondary">{detail}</p>
  </div>
);

export const RHPage: React.FC = () => {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [dashboardData, setDashboardData] = useState<RHDashboard | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<RHView>('overview');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('Tous les départements');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', department: 'Administration', position: '', contract: 'CDI' });
  useEffect(() => {
    let cancelled = false;
    const loadRHData = async () => {
      try {
        const [remoteEmployees, remoteDashboard, remoteLeaveRequests] = await Promise.all([
          rhService.listEmployees(), rhService.getDashboard(), rhService.listLeaveRequests(),
        ]);
        if (!cancelled) {
          setEmployees(remoteEmployees.map(mapEmployee));
          setDashboardData(remoteDashboard);
          setLeaveRequests(remoteLeaveRequests);
        }
      } catch {
        const saved = localStorage.getItem(storageKey);
        if (!cancelled && saved) {
          try { setEmployees(JSON.parse(saved)); } catch { localStorage.removeItem(storageKey); }
        }
      }
    };
    loadRHData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(employees));
  }, [employees]);

  const departments = useMemo(() => ['Tous les départements', ...Array.from(new Set(employees.map((employee) => employee.department)))], [employees]);
  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const term = search.toLowerCase();
    const matchesSearch = `${employee.firstName} ${employee.lastName} ${employee.position}`.toLowerCase().includes(term);
    return matchesSearch && (department === 'Tous les départements' || employee.department === department);
  }), [department, employees, search]);

  const activeCount = dashboardData?.active ?? employees.filter((employee) => employee.status === 'Actif').length;
  const leaveCount = dashboardData?.onLeave ?? employees.filter((employee) => employee.status === 'En congé').length;
  const absenceCount = dashboardData?.absent ?? employees.filter((employee) => employee.status === 'Absent').length;
  const payrollTotal = dashboardData?.payrollTotal ?? employees.reduce((total, employee) => total + employee.salary, 0);

  const addEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.position.trim()) {
      showToast('Renseignez le nom et le poste de l’employé.', 'error');
      return;
    }
    try {
      const created = await rhService.createEmployee({
        first_name: form.firstName.trim(), last_name: form.lastName.trim(), department: form.department,
        position: form.position.trim(), contract_type: form.contract, joined_at: new Date().toISOString().slice(0, 10), status: 'ACTIF', salary: 0,
      });
      setEmployees((current) => [...current, mapEmployee(created)]);
      setDashboardData((current) => current ? { ...current, total: current.total + 1, active: current.active + 1 } : current);
      setForm({ firstName: '', lastName: '', department: 'Administration', position: '', contract: 'CDI' });
      setShowEmployeeForm(false);
      showToast('Employé ajouté au registre RH.', 'success');
    } catch {
      showToast('Impossible d’enregistrer l’employé. Vérifiez la connexion au backend.', 'error');
    }
  };

  const updateLeaveRequest = async (id: number | undefined, status: 'APPROUVE' | 'REFUSE') => {
    if (!id) {
      showToast('Aucune demande de congé disponible.', 'error');
      return;
    }
    try {
      await rhService.updateLeaveStatus(id, status);
      setLeaveRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
      showToast(status === 'APPROUVE' ? 'Demande de congé validée.' : 'Demande refusée.', 'success');
    } catch {
      showToast('Impossible de mettre à jour la demande de congé.', 'error');
    }
  };

  const exportEmployees = () => {
    const rows = [['Nom', 'Département', 'Poste', 'Contrat', 'Statut'], ...filteredEmployees.map((employee) => [`${employee.firstName} ${employee.lastName}`, employee.department, employee.position, employee.contract, employee.status])];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'registre-employes-hda.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Le registre RH a été exporté.', 'success');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium" style={{ color: '#2b7a78' }}><ShieldCheck size={16} /> Administration du personnel</div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Ressources humaines</h1>
          <p className="mt-1 text-sm text-secondary">Pilotez le cycle de vie des équipes de l’Hôtel de l’Avenue.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportEmployees} className="flex h-10 items-center gap-2 rounded-xl border border-base bg-surface px-4 text-sm font-medium text-primary transition hover:bg-surface-2"><Download size={16} /> Exporter</button>
          <button onClick={() => setShowEmployeeForm(true)} className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90" style={{ backgroundColor: '#2b7a78' }}><UserPlus size={16} /> Nouvel employé</button>
        </div>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-base">
        {navigation.map((item) => <button key={item.id} onClick={() => setActiveView(item.id)} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition ${activeView === item.id ? 'border-[#2b7a78] text-[#2b7a78]' : 'border-transparent text-secondary hover:text-primary'}`}>{item.icon}{item.label}</button>)}
      </div>

      {activeView === 'overview' && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Effectif total" value={String(employees.length).padStart(2, '0')} detail={`${activeCount} employés actifs`} icon={<UsersRound size={20} />} tone="#dcefeb" />
          <StatCard label="Présences aujourd’hui" value={`${Math.max(activeCount - absenceCount, 0)}/${employees.length}`} detail={`${absenceCount} absence à traiter`} icon={<Clock3 size={20} />} tone="#e9e2f4" />
          <StatCard label="Congés en cours" value={String(leaveCount).padStart(2, '0')} detail="1 demande à valider" icon={<CalendarDays size={20} />} tone="#fcebd7" />
          <StatCard label="Masse salariale" value={`${(payrollTotal / 1000000).toFixed(1)}M`} detail="Estimation mensuelle" icon={<WalletCards size={20} />} tone="#f4e2e1" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-base bg-surface p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-primary">Effectif par département</h2><p className="mt-1 text-xs text-secondary">Répartition actuelle des collaborateurs</p></div><BarChart3 size={19} className="text-secondary" /></div>
            <div className="space-y-4">{departments.slice(1).map((name) => { const count = employees.filter((employee) => employee.department === name).length; const width = Math.max(16, (count / Math.max(employees.length, 1)) * 100); return <div key={name}><div className="mb-1 flex justify-between text-sm"><span className="text-primary">{name}</span><span className="text-secondary">{count}</span></div><div className="h-2 rounded-full bg-surface-2"><div className="h-2 rounded-full" style={{ width: `${width}%`, backgroundColor: '#2b7a78' }} /></div></div>; })}</div>
          </section>
          <section className="rounded-2xl border border-base bg-surface p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-primary">À traiter</h2><p className="mt-1 text-xs text-secondary">Vos prochaines actions RH</p></div><AlertTriangle size={19} style={{ color: '#d97745' }} /></div><div className="space-y-3"><button onClick={() => setActiveView('attendance')} className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left transition hover:bg-surface-3"><span className="rounded-lg bg-[#fff1df] p-2 text-[#a76625]"><CalendarDays size={16} /></span><span className="flex-1"><strong className="block text-sm text-primary">Demande de congé</strong><small className="text-xs text-secondary">Sarah Andrianina · 3 jours</small></span><ChevronRight size={16} className="text-secondary" /></button><button onClick={() => setActiveView('employees')} className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left transition hover:bg-surface-3"><span className="rounded-lg bg-[#fae8e7] p-2 text-[#b64f4d]"><FileText size={16} /></span><span className="flex-1"><strong className="block text-sm text-primary">Contrat à renouveler</strong><small className="text-xs text-secondary">CDD · échéance dans 18 jours</small></span><ChevronRight size={16} className="text-secondary" /></button></div></section>
        </div>
      </>}

      {activeView === 'employees' && <section className="rounded-2xl border border-base bg-surface shadow-sm"><div className="flex flex-col gap-3 border-b border-base p-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-semibold text-primary">Registre des employés</h2><p className="mt-1 text-xs text-secondary">Dossiers actifs et historique professionnel</p></div><div className="flex flex-wrap gap-2"><label className="flex h-10 items-center gap-2 rounded-xl border border-base bg-surface-2 px-3"><Search size={16} className="text-secondary" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." className="w-36 bg-transparent text-sm text-primary outline-none" /></label><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-10 rounded-xl border border-base bg-surface-2 px-3 text-sm text-primary outline-none">{departments.map((item) => <option key={item}>{item}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-surface-2 text-xs uppercase text-secondary"><tr><th className="px-5 py-3 font-medium">Employé</th><th className="px-5 py-3 font-medium">Département / poste</th><th className="px-5 py-3 font-medium">Contrat</th><th className="px-5 py-3 font-medium">Entrée</th><th className="px-5 py-3 font-medium">Statut</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-base">{filteredEmployees.map((employee) => <tr key={employee.id} className="transition hover:bg-surface-2"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: employee.color }}>{employee.initials}</span><span><strong className="block text-primary">{employee.firstName} {employee.lastName}</strong><small className="text-xs text-secondary">Matricule HDA-{String(employee.id).padStart(4, '0')}</small></span></div></td><td className="px-5 py-4"><span className="block text-primary">{employee.department}</span><small className="text-xs text-secondary">{employee.position}</small></td><td className="px-5 py-4 text-primary">{employee.contract}</td><td className="px-5 py-4 text-secondary">{employee.joinedAt}</td><td className="px-5 py-4"><span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: statusStyles[employee.status].background, color: statusStyles[employee.status].color }}>{employee.status}</span></td><td className="px-5 py-4 text-right"><button className="text-secondary hover:text-primary" title="Ouvrir le dossier"><ChevronRight size={17} /></button></td></tr>)}</tbody></table>{filteredEmployees.length === 0 && <p className="p-8 text-center text-sm text-secondary">Aucun employé ne correspond aux filtres.</p>}</div></section>}

      {activeView === 'attendance' && <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]"><section className="rounded-2xl border border-base bg-surface p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-primary">Suivi des présences</h2><p className="mt-1 text-xs text-secondary">Pointage du mercredi 09 septembre 2026</p></div><Clock3 size={19} className="text-secondary" /></div><div className="space-y-3">{employees.map((employee, index) => <div key={employee.id} className="flex items-center gap-3 rounded-xl bg-surface-2 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: employee.color }}>{employee.initials}</span><span className="flex-1"><strong className="block text-sm text-primary">{employee.firstName} {employee.lastName}</strong><small className="text-xs text-secondary">{employee.department}</small></span><span className="text-right"><strong className="block text-sm text-primary">{employee.status === 'Absent' ? '--:--' : `0${7 + (index % 2)}:${index ? '4' : '58'}`}</strong><small className="text-xs" style={{ color: employee.status === 'Absent' ? '#b64f4d' : '#28796e' }}>{employee.status === 'Absent' ? 'Absence signalée' : 'Présent'}</small></span></div>)}</div></section><section className="rounded-2xl border border-base bg-surface p-5 shadow-sm"><h2 className="font-semibold text-primary">Demandes de congé</h2><p className="mt-1 text-xs text-secondary">Validation en attente</p><div className="mt-5 rounded-xl border border-[#f2dec4] bg-[#fffaf4] p-4"><div className="flex items-start gap-3"><CalendarDays size={18} className="mt-0.5 text-[#a76625]" /><div className="flex-1"><strong className="text-sm text-primary">Sarah Andrianina</strong><p className="mt-1 text-xs text-secondary">Congé annuel · 14 au 16 septembre</p><div className="mt-3 flex gap-2"><button onClick={() => showToast('Demande de congé validée.', 'success')} className="flex items-center gap-1 rounded-lg bg-[#2b7a78] px-3 py-2 text-xs font-semibold text-white"><Check size={14} /> Valider</button><button onClick={() => showToast('Demande refusée.', 'error')} className="flex items-center gap-1 rounded-lg border border-base px-3 py-2 text-xs font-semibold text-primary"><X size={14} /> Refuser</button></div></div></div></div></section></div>}

      {activeView === 'payroll' && <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]"><section className="rounded-2xl border border-base bg-surface p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-primary">Préparation de la paie</h2><p className="mt-1 text-xs text-secondary">Période de septembre 2026</p></div><button onClick={() => showToast('La paie est prête pour validation.', 'success')} className="rounded-xl px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#2b7a78' }}>Préparer la paie</button></div><div className="mt-5 divide-y divide-base">{employees.map((employee) => <div key={employee.id} className="flex items-center justify-between py-3"><div><strong className="block text-sm text-primary">{employee.firstName} {employee.lastName}</strong><small className="text-xs text-secondary">Base · {employee.contract}</small></div><span className="text-sm font-semibold text-primary">{employee.salary ? formatMoney(employee.salary) : 'À compléter'}</span></div>)}</div></section><section className="rounded-2xl border border-base bg-surface p-5 shadow-sm"><h2 className="font-semibold text-primary">Résumé de la période</h2><div className="mt-5 space-y-4"><div className="flex justify-between text-sm"><span className="text-secondary">Salaires de base</span><strong className="text-primary">{formatMoney(payrollTotal)}</strong></div><div className="flex justify-between text-sm"><span className="text-secondary">Heures supplémentaires</span><strong className="text-primary">215 000 Ar</strong></div><div className="flex justify-between text-sm"><span className="text-secondary">Avances et retenues</span><strong className="text-primary">-180 000 Ar</strong></div><div className="border-t border-base pt-4"><div className="flex justify-between"><span className="font-semibold text-primary">Net à payer estimé</span><strong className="text-xl text-[#2b7a78]">{formatMoney(payrollTotal + 35000)}</strong></div></div></div></section></div>}

      {showEmployeeForm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && setShowEmployeeForm(false)}><form onSubmit={addEmployee} className="w-full max-w-lg rounded-2xl border border-base bg-surface p-6 shadow-xl"><div className="mb-5 flex items-start justify-between"><div><h2 className="text-xl font-bold text-primary">Nouvel employé</h2><p className="mt-1 text-sm text-secondary">Créez un dossier local en quelques étapes.</p></div><button type="button" onClick={() => setShowEmployeeForm(false)} className="rounded-lg p-1 text-secondary hover:bg-surface-2"><X size={19} /></button></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-secondary">Prénom<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-base bg-surface-2 px-3 text-primary outline-none focus:border-[#2b7a78]" /></label><label className="text-sm text-secondary">Nom<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-base bg-surface-2 px-3 text-primary outline-none focus:border-[#2b7a78]" /></label><label className="text-sm text-secondary sm:col-span-2">Poste<input required value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} placeholder="Ex. Responsable hébergement" className="mt-1 h-10 w-full rounded-xl border border-base bg-surface-2 px-3 text-primary outline-none focus:border-[#2b7a78]" /></label><label className="text-sm text-secondary">Département<select value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-base bg-surface-2 px-3 text-primary outline-none"><option>Administration</option><option>Réception</option><option>Restauration</option><option>Casino</option><option>Maintenance</option></select></label><label className="text-sm text-secondary">Contrat<select value={form.contract} onChange={(event) => setForm({ ...form, contract: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-base bg-surface-2 px-3 text-primary outline-none"><option>CDI</option><option>CDD</option><option>Stage</option></select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setShowEmployeeForm(false)} className="h-10 rounded-xl border border-base px-4 text-sm font-medium text-primary">Annuler</button><button type="submit" className="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white" style={{ backgroundColor: '#2b7a78' }}><Plus size={16} /> Ajouter</button></div></form></div>}
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ContactRound, Download, Dices, Pencil, Plus, Save, ShieldCheck, Sparkles, Trash2, UtensilsCrossed, Wine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import planningService, { PlanningAssignment } from '../services/planning.service';
import rhService, { RHEmployee } from '../services/rh.service';
import { exportWeeklyPlanningPdf } from '../utils/planningPdf';

const categories: Array<{ name: string; icon: LucideIcon; description: string; prefix: string; color: string }> = [
  { name: 'Videur', icon: ShieldCheck, description: 'Équipe de sécurité', prefix: 'V', color: '#ff6b00' },
  { name: 'Femme de ménage', icon: Sparkles, description: 'Personnel d’entretien', prefix: 'F', color: '#ff9f1c' },
  { name: 'Agents d’accueil', icon: ContactRound, description: 'Accueil et réception', prefix: 'A', color: '#ff355e' },
  { name: 'Bar', icon: Wine, description: 'Équipe du bar', prefix: 'B', color: '#39ff14' },
  { name: 'Restaurant', icon: UtensilsCrossed, description: 'Équipe de restauration', prefix: 'R', color: '#00e5ff' },
  { name: 'Poker', icon: Dices, description: 'Équipe poker', prefix: 'P', color: '#4d7dff' },
];

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => localDate(new Date());
const getWeekDates = (dateValue: string) => {
  const monday = new Date(`${dateValue}T12:00:00`);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return Array.from({ length: 6 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return localDate(day);
  });
};
const defaultSchedule = '00:00 – 00:00';
const emptyAssignments = (): PlanningAssignment[] => Array.from({ length: 6 }, (_, index) => ({ slot: index + 1, employeeId: null, employeeName: '', schedule: defaultSchedule }));
const fullName = (employee: RHEmployee) => `${employee.first_name} ${employee.last_name}`.trim();
const displayDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const parseSchedule = (schedule: string): [number, number, number, number] => {
  const match = /^(\d{1,2})(?::(\d{1,2}))?\s*[–-]\s*(\d{1,2})(?::(\d{1,2}))?$/.exec(schedule.trim());
  if (!match) return [0, 0, 0, 0];
  return match.slice(1).map((value, index) => Math.min(index % 2 === 0 ? 23 : 59, Number(value || 0))) as [number, number, number, number];
};
const formatSchedule = (values: [number, number, number, number]) => `${String(values[0]).padStart(2, '0')}:${String(values[1]).padStart(2, '0')} – ${String(values[2]).padStart(2, '0')}:${String(values[3]).padStart(2, '0')}`;
const normalizeAssignments = (assignments: PlanningAssignment[]) => {
  const rows = new Map(emptyAssignments().map((item) => [item.slot, item]));
  assignments.forEach((item) => rows.set(item.slot, { ...item, schedule: formatSchedule(parseSchedule(item.schedule || defaultSchedule)) }));
  return [...rows.values()].sort((left, right) => left.slot - right.slot);
};

const TimeValueControl = ({ value, max, label, disabled, onChange, increment = 1 }: { value: number; max: number; label: string; disabled: boolean; onChange: (value: number) => void; increment?: number }) => {
  const formattedValue = String(value).padStart(2, '0');
  const [draft, setDraft] = useState(formattedValue);

  useEffect(() => setDraft(formattedValue), [formattedValue]);

  const commit = (raw: string) => {
    if (!raw) {
      setDraft(formattedValue);
      return;
    }
    const nextValue = Math.max(0, Math.min(max, Number(raw)));
    onChange(nextValue);
    setDraft(String(nextValue).padStart(2, '0'));
  };

  const changeBy = (amount: number) => {
    const nextValue = (value + amount + max + 1) % (max + 1);
    onChange(nextValue);
    setDraft(String(nextValue).padStart(2, '0'));
  };

  return <div className="flex items-center gap-0">
    <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} value={draft} disabled={disabled} aria-label={label} onChange={(event) => {
      const raw = event.target.value.replace(/\D/g, '').slice(0, 2);
      setDraft(raw);
      if (raw.length === 2) commit(raw);
    }} onBlur={() => { if (draft !== formattedValue) commit(draft); }} className="h-6 w-6 rounded border border-base bg-surface px-0 text-center text-[10px] font-semibold tabular-nums text-primary outline-none focus:border-accent/60 disabled:opacity-60" />
    <span className="flex flex-col">
      <button type="button" disabled={disabled} aria-label={`${label} suivant`} title={`${label} suivant`} onClick={() => changeBy(increment)} className="flex h-3 w-2.5 items-center justify-center rounded-t border border-base bg-surface-2 text-[8px] leading-none text-secondary hover:text-primary disabled:opacity-50">↑</button>
      <button type="button" disabled={disabled} aria-label={`${label} précédent`} title={`${label} précédent`} onClick={() => changeBy(-increment)} className="flex h-3 w-2.5 items-center justify-center rounded-b border-x border-b border-base bg-surface-2 text-[8px] leading-none text-secondary hover:text-primary disabled:opacity-50">↓</button>
    </span>
  </div>;
};

const SchedulePicker = ({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) => {
  const values = parseSchedule(value);
  const update = (index: number, nextValue: number) => {
    const nextValues = [...values] as [number, number, number, number];
    nextValues[index] = nextValue;
    onChange(formatSchedule(nextValues));
  };
  return <div className="space-y-1 rounded-lg border border-base bg-surface-2 p-0.5">
    <div className="flex items-center justify-between gap-0"><span className="w-5 shrink-0 text-[9px] text-muted">Début</span><div className="flex items-center gap-0"><TimeValueControl value={values[0]} max={23} label="Heure de début" disabled={disabled} onChange={(next) => update(0, next)} /><span className="text-[10px] font-semibold text-muted">:</span><TimeValueControl value={values[1]} max={59} label="Minute de début" disabled={disabled} increment={5} onChange={(next) => update(1, next)} /></div></div>
    <div className="flex items-center justify-between gap-0"><span className="w-5 shrink-0 text-[9px] text-muted">Fin</span><div className="flex items-center gap-0"><TimeValueControl value={values[2]} max={23} label="Heure de fin" disabled={disabled} onChange={(next) => update(2, next)} /><span className="text-[10px] font-semibold text-muted">:</span><TimeValueControl value={values[3]} max={59} label="Minute de fin" disabled={disabled} increment={5} onChange={(next) => update(3, next)} /></div></div>
  </div>;
};

export default function PlanningPage() {
  const { showToast } = useToast();
  const [category, setCategory] = useState(categories[0].name);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekAssignments, setWeekAssignments] = useState<Record<string, PlanningAssignment[]>>({});
  const [dirtyDates, setDirtyDates] = useState<string[]>([]);
  const [employees, setEmployees] = useState<RHEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);

  const activeCategory = categories.find((item) => item.name === category) || categories[0];
  const CategoryIcon = activeCategory.icon;
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const slots = useMemo(() => {
    const allSlots = new Set<number>([1, 2, 3, 4, 5, 6]);
    weekDates.forEach((date) => (weekAssignments[date] || []).forEach((item) => allSlots.add(item.slot)));
    return [...allSlots].sort((left, right) => left - right);
  }, [weekAssignments, weekDates]);
  const assignedCount = weekDates.reduce((total, date) => total + (weekAssignments[date] || []).filter((item) => item.employeeName.trim()).length, 0);

  useEffect(() => {
    let active = true;
    rhService.listEmployees({ limit: 100, status: 'ACTIF' })
      .then((result) => { if (active) setEmployees(result.rows); })
      .catch(() => { if (active) setEmployees([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setDirtyDates([]);
    Promise.all(weekDates.map((date) => planningService.getDaily(date, category)))
      .then((days) => {
        if (active) setWeekAssignments(Object.fromEntries(days.map((day) => [day.date, normalizeAssignments(day.assignments)])));
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError?.response?.data?.error?.message || 'Impossible de charger cette semaine de planning.');
        setWeekAssignments(Object.fromEntries(weekDates.map((date) => [date, emptyAssignments()])));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [weekDates, category]);

  const confirmSelectionChange = () => !dirtyDates.length || window.confirm('Des modifications ne sont pas enregistrées. Voulez-vous les abandonner ?');

  const selectCategory = (nextCategory: string) => {
    if (nextCategory !== category && confirmSelectionChange()) setCategory(nextCategory);
  };

  const selectDate = (nextDate: string) => {
    if (nextDate !== selectedDate && confirmSelectionChange()) setSelectedDate(nextDate);
  };

  const shiftWeek = (amount: number) => {
    if (!confirmSelectionChange()) return;
    const monday = new Date(`${weekDates[0]}T12:00:00`);
    monday.setDate(monday.getDate() + amount * 7);
    setSelectedDate(localDate(monday));
  };

  const updateAssignment = (date: string, slot: number, patch: Partial<PlanningAssignment>) => {
    setWeekAssignments((current) => ({
      ...current,
      [date]: (current[date] || emptyAssignments()).map((item) => item.slot === slot ? { ...item, ...patch } : item),
    }));
    setDirtyDates((current) => current.includes(date) ? current : [...current, date]);
  };

  const updateEmployee = (date: string, slot: number, employeeName: string) => {
    const match = employees.find((employee) => fullName(employee).toLocaleLowerCase('fr') === employeeName.trim().toLocaleLowerCase('fr'));
    updateAssignment(date, slot, { employeeName, employeeId: match?.id ?? null });
  };

  const addAssignment = () => {
    const nextSlot = Math.max(0, ...slots) + 1;
    setWeekAssignments((current) => Object.fromEntries(weekDates.map((date) => [
      date,
      [...(current[date] || emptyAssignments()), { slot: nextSlot, employeeId: null, employeeName: '', schedule: defaultSchedule }],
    ])));
    setDirtyDates((current) => [...new Set([...current, ...weekDates])]);
  };

  const removeAssignment = (slot: number) => {
    setWeekAssignments((current) => Object.fromEntries(weekDates.map((date) => [
      date,
      (current[date] || emptyAssignments()).filter((item) => item.slot !== slot),
    ])));
    setDirtyDates((current) => [...new Set([...current, ...weekDates])]);
  };

  const save = async () => {
    const datesToSave = [...dirtyDates];
    if (!datesToSave.length) return;
    setSaving(true);
    setError('');
    const results = await Promise.allSettled(datesToSave.map((date) => planningService.saveDaily({
      date,
      category,
      assignments: (weekAssignments[date] || []).filter((item) => item.employeeName.trim()).map((item) => ({ ...item, employeeName: item.employeeName.trim(), schedule: item.schedule.trim() })),
    })));
    const savedDays: Array<[string, PlanningAssignment[]]> = [];
    const failedDates: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') savedDays.push([datesToSave[index], normalizeAssignments(result.value.assignments)]);
      else failedDates.push(datesToSave[index]);
    });
    if (savedDays.length) setWeekAssignments((current) => ({ ...current, ...Object.fromEntries(savedDays) }));
    setDirtyDates(failedDates);
    if (failedDates.length) {
      const message = `Enregistrement impossible pour ${failedDates.map(displayDate).join(', ')}.`;
      setError(message);
      showToast(message, 'error');
    } else {
      showToast(`Planning ${category} enregistré pour la semaine.`, 'success');
    }
    setSaving(false);
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      await exportWeeklyPlanningPdf({ category, prefix: activeCategory.prefix, weekDates, assignmentsByDate: weekAssignments });
      showToast(`PDF ${category} téléchargé.`, 'success');
    } catch {
      showToast('La génération du PDF a échoué.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const weekLabel = `${displayDate(weekDates[0])} – ${displayDate(weekDates[5])}`;
  const dirty = dirtyDates.length > 0;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-accent"><CalendarDays size={16} /> Organisation des équipes</div>
          <h1 className="text-3xl font-bold text-primary">Planning</h1>
          <p className="mt-1 text-sm text-secondary">Organisez les équipes du lundi au samedi, jour par jour.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-base bg-surface px-4 py-3 text-sm text-secondary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-4 text-accent"><CalendarDays size={17} /></span>
          <span><strong className="block text-primary">{assignedCount} affectation{assignedCount > 1 ? 's' : ''}</strong><span className="text-xs">sur la semaine sélectionnée</span></span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-base bg-surface p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Catégories</p>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {categories.map((item) => {
              const Icon = item.icon;
              const selected = category === item.name;
              return <button key={item.name} type="button" onClick={() => selectCategory(item.name)} disabled={saving} aria-current={selected ? 'page' : undefined} style={selected ? { borderColor: `${item.color}66`, backgroundColor: `${item.color}10`, boxShadow: `0 0 16px ${item.color}18` } : undefined} className={`flex min-h-[66px] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${selected ? '' : 'border-transparent bg-surface-2 hover:border-base hover:bg-surface'}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color: item.color, backgroundColor: selected ? `${item.color}24` : 'var(--color-surface)', boxShadow: selected ? `0 0 12px ${item.color}44` : 'none' }}><Icon size={18} /></span>
                <span className="min-w-0"><strong className={`block truncate text-sm ${selected ? 'text-primary' : 'text-secondary'}`}>{item.name}</strong><span className="hidden text-xs text-muted sm:block">{item.description}</span></span>
              </button>;
            })}
          </nav>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-base bg-surface p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ color: activeCategory.color, backgroundColor: `${activeCategory.color}18`, boxShadow: `0 0 14px ${activeCategory.color}33` }}><CategoryIcon size={23} /></span>
              <div><h2 className="text-xl font-semibold text-primary">{category} <span className="font-normal text-secondary">– Personnel</span></h2><p className="mt-1 text-sm capitalize text-muted">{weekLabel}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => shiftWeek(-1)} disabled={saving} aria-label="Semaine précédente" className="flex h-10 w-10 items-center justify-center rounded-lg border border-base bg-surface-2 text-secondary hover:text-primary disabled:opacity-50"><ChevronLeft size={18} /></button>
              <label className="relative flex h-10 items-center gap-2 rounded-lg border border-base bg-surface-2 px-3 text-secondary">
                <CalendarDays size={16} />
                <input aria-label="Date de la semaine" type="date" value={selectedDate} onChange={(event) => event.target.value && selectDate(event.target.value)} disabled={saving} className="w-[135px] bg-transparent text-sm text-primary outline-none" />
              </label>
              <button type="button" onClick={() => shiftWeek(1)} disabled={saving} aria-label="Semaine suivante" className="flex h-10 w-10 items-center justify-center rounded-lg border border-base bg-surface-2 text-secondary hover:text-primary disabled:opacity-50"><ChevronRight size={18} /></button>
              <button type="button" onClick={() => selectDate(today())} disabled={saving} className="h-10 rounded-lg border border-base px-3 text-sm font-medium text-secondary hover:bg-surface-2 hover:text-primary disabled:opacity-50">Cette semaine</button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-base bg-surface">
            <div className="flex flex-col justify-between gap-3 border-b border-base px-5 py-4 sm:flex-row sm:items-center">
              <div><h3 className="font-semibold text-primary">Personnel prévu</h3><p className="mt-1 text-xs text-muted">Lundi à samedi · chaque journée est enregistrée séparément.</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={addAssignment} disabled={loading || saving || exporting} className="flex h-10 items-center gap-2 rounded-lg border border-base px-3 text-sm font-medium text-secondary hover:bg-surface-2 hover:text-primary disabled:opacity-50"><Plus size={16} /> Ajouter une ligne</button>
                <button type="button" onClick={exportPdf} disabled={loading || saving || exporting} className="flex h-10 items-center gap-2 rounded-lg border border-accent/40 bg-accent-4 px-3 text-sm font-medium text-accent hover:bg-accent/15 disabled:opacity-50"><Download size={16} />{exporting ? 'Création…' : 'Exporter PDF'}</button>
                <button type="button" onClick={save} disabled={loading || saving || exporting || !dirty} className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Save size={16} />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </div>

            {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
            {loading ? <div className="px-5 py-12 text-center text-sm text-muted">Chargement du planning…</div> : <>
              <datalist id="planning-employees">{employees.map((employee) => <option key={employee.id} value={fullName(employee)} />)}</datalist>
              <div>
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="bg-surface-2/60 text-[9px] uppercase tracking-wide text-muted sm:text-[11px]">
                      <th className="w-10 px-1 py-3 font-medium sm:w-14">Poste</th>
                      {weekDates.map((date, index) => <th key={date} className="px-1 py-3 font-medium sm:px-2"><span className="block text-primary">{['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][index]}</span><span className="mt-0.5 block font-normal normal-case">{new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => <tr key={slot} className="border-t border-base/70">
                      <th scope="row" className="px-1 py-3 text-left sm:px-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-4 text-xs font-semibold sm:h-9 sm:w-10 sm:text-sm" style={{ color: activeCategory.color, backgroundColor: `${activeCategory.color}18` }}>{activeCategory.prefix}{slot}</span></th>
                      {weekDates.map((date) => {
                        const assignment = (weekAssignments[date] || []).find((item) => item.slot === slot) || { slot, employeeId: null, employeeName: '', schedule: defaultSchedule };
                        const editingKey = `${date}-${slot}`;
                        const isEditing = editingAssignment === editingKey;
                        return <td key={`${date}-${slot}`} className="min-w-0 px-1 py-2 align-top sm:px-2 sm:py-3">
                          <div className="min-w-0 space-y-1.5">
                            {isEditing ? <input autoFocus list="planning-employees" value={assignment.employeeName} onChange={(event) => updateEmployee(date, slot, event.target.value)} onBlur={() => setEditingAssignment((current) => current === editingKey ? null : current)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} disabled={saving} placeholder="Employé" aria-label={`Employé ${activeCategory.prefix}${slot}, ${displayDate(date)}`} className="h-8 w-full min-w-0 rounded-lg border border-base bg-surface-2 px-1.5 text-xs text-primary outline-none transition focus:border-accent/60 disabled:opacity-60 sm:text-sm" /> : <div className="flex min-h-8 min-w-0 items-center justify-between gap-0.5 rounded-lg border border-base bg-surface-2 px-1.5 py-1">
                              <span title={assignment.employeeName || 'Aucun employé'} className="min-w-0 break-words text-[10px] leading-tight text-primary sm:text-xs">{assignment.employeeName || <span className="text-muted">Employé</span>}</span>
                              <button type="button" onClick={() => setEditingAssignment(editingKey)} disabled={saving} className="flex h-6 shrink-0 items-center gap-0.5 rounded-md px-0.5 text-[9px] font-semibold text-accent hover:bg-accent-4 disabled:opacity-50 sm:gap-1 sm:px-1.5 sm:text-[10px]" aria-label={`Modifier ${activeCategory.prefix}${slot} ${displayDate(date)}`} title="Modifier"><Pencil size={12} />Modifier</button>
                            </div>}
                            <SchedulePicker value={assignment.schedule} disabled={saving} onChange={(schedule) => updateAssignment(date, slot, { schedule })} />
                          </div>
                        </td>;
                      })}
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col justify-between gap-2 border-t border-base px-5 py-3 text-xs text-muted sm:flex-row sm:items-center"><span>{assignedCount} affectation{assignedCount > 1 ? 's' : ''} sur la période affichée</span><span>{dirty ? 'Modifications non enregistrées' : 'Planning synchronisé'}</span></div>
            </>}
          </div>
        </section>
      </div>
    </div>
  );
}

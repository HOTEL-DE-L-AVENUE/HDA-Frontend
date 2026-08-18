
// src/pages/UtilisateursPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useHDA } from '../context/HDAContext';
import { User, UserRole, ModuleType } from '../types';
import { formatDate } from '../utils/data';
import { Modal, Input, Select, Button, Badge } from '../components/UI';
import { Users, Plus, Edit2, Trash2, Shield, Eye, EyeOff, Key } from 'lucide-react';
import api from '../lib/api';

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  receptioniste: 'Réceptionniste',
  caisse: 'Caissier',
  water: 'Barman',
  housekeeping: 'Personnel d’entretien',
};

const roleIcons: Record<string, string> = {
  admin: '👑',
  manager: '🎯',
  receptioniste: '🛎️',
  caisse: '💰',
  water: '🍸',
  housekeeping: '🧹',
};

const moduleLabels: Record<string, string> = {
  hebergement: 'Hébergement',
  hotel: 'Hôtel',
  restaurant: 'Restaurant',
  bar: 'Bar',
  casino: 'Casino',
  finances: 'Finances',
};

const allModules: ModuleType[] = ['hebergement', 'hotel', 'restaurant', 'bar', 'casino', 'finances'];

const getApiErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  return data?.error?.message || data?.message || error?.message || fallback;
};

const parseModules = (mod: any): ModuleType[] => {
  if (!mod) return [];
  if (Array.isArray(mod)) {
    return mod.map(m => (typeof m === 'object' && m !== null ? m.id : String(m))) as ModuleType[];
  }
  if (typeof mod === 'string') {
    try {
      const parsed = JSON.parse(mod);
      if (Array.isArray(parsed)) {
        return parsed.map(m => (typeof m === 'object' && m !== null ? m.id : String(m))) as ModuleType[];
      }
    } catch {
      return mod.split(',').map(s => s.trim()).filter(Boolean) as ModuleType[];
    }
  }
  return [];
};

export const UtilisateursPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', role: 'manager' as UserRole,
    module: [] as ModuleType[], actif: true, password: ''
  });

  const fetchRealUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/users', { params: { limit: 100 } });
      const rawUsers = response.data?.data;
      if (!Array.isArray(rawUsers)) {
        throw new Error('Réponse utilisateurs invalide');
      }

      const formattedUsers: User[] = rawUsers.map((u: any) => ({
        id: String(u.id_admin),
        nom: u.nom,
        prenom: u.prenom || '',
        email: u.email,
        role: (u.role || 'manager') as User['role'],
        module: parseModules(u.module),
        actif: u.statut === 'actif',
        createdAt: u.date_creation || new Date().toISOString(),
        lastLogin: u.last_login || null,
      }));
      dispatch({ type: 'SET_USERS', payload: formattedUsers });
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err, 'Impossible de charger les utilisateurs.'));
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRealUsers();
  }, [fetchRealUsers]);

  // Calcul du nombre de managers par module (pour la règle max 2 managers par module)
  const getManagersCountByModule = useCallback((): Record<ModuleType, number> => {
    const counts: Record<string, number> = {
      hebergement: 0,
      hotel: 0,
      restaurant: 0,
      bar: 0,
      casino: 0,
      finances: 0,
    };

    state.users.forEach(u => {
      if (u.role === 'manager') {
        // Ne pas compter l'utilisateur en cours d'édition
        if (editUser && String(u.id) === String(editUser.id)) return;
        const uMods = parseModules(u.module);
        uMods.forEach(mod => {
          if (counts[mod] !== undefined) {
            counts[mod]++;
          }
        });
      }
    });

    return counts as Record<ModuleType, number>;
  }, [state.users, editUser]);

  const managersCountByModule = getManagersCountByModule();

  const filtered = state.users.filter(u =>
    `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user: User) => {
    setEditUser(user);
    setErrorMessage('');
    setForm({ 
      nom: user.nom, 
      prenom: user.prenom, 
      email: user.email, 
      role: user.role, 
      module: parseModules(user.module), 
      actif: user.actif, 
      password: '' 
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email) {
      setErrorMessage('Le nom, le prénom et l\'email sont requis');
      return;
    }
    if (!editUser && !form.password) {
      setErrorMessage('Le mot de passe est requis pour créer un compte');
      return;
    }

    // Validation : Règle max 2 managers par module
    if (form.role === 'manager') {
      const selectedMods = parseModules(form.module);
      for (const mod of selectedMods) {
        const count = managersCountByModule[mod] || 0;
        if (count >= 2) {
          setErrorMessage(`Le module "${moduleLabels[mod] || mod}" a déjà atteint sa limite maximale de 2 managers.`);
          return;
        }
      }
    }
    
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      if (editUser) {
        await api.put(`/api/admin/users/${editUser.id}`, {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          role: form.role,
          module: form.module,
          statut: form.actif ? 'actif' : 'inactif'
        });
      } else {
        await api.post('/api/auth/register', {
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          mot_de_passe: form.password,
          role: form.role,
          module: form.module,
          statut: form.actif ? 'actif' : 'inactif',
        });
      }

      await fetchRealUsers();
      setShowModal(false);
      setEditUser(null);
      setForm({ nom: '', prenom: '', email: '', role: 'manager', module: [], actif: true, password: '' });
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err, 'Une erreur est survenue.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    try {
      await api.delete(`/api/admin/users/${id}`);
      await fetchRealUsers();
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err, 'Impossible de supprimer cet utilisateur.'));
    }
  };

  const toggleModule = (mod: ModuleType) => {
    const currentModules = parseModules(form.module);
    const exists = currentModules.includes(mod);

    // Si on veut ajouter le module et que le rôle est manager, vérifier la limite de 2
    if (!exists && form.role === 'manager') {
      const currentCount = managersCountByModule[mod] || 0;
      if (currentCount >= 2) {
        setErrorMessage(`Limite atteinte : Le module "${moduleLabels[mod] || mod}" a déjà 2 managers assignés.`);
        return;
      }
    }

    setErrorMessage('');
    setForm(prev => {
      const cur = parseModules(prev.module);
      return {
        ...prev,
        module: cur.includes(mod) ? cur.filter(m => m !== mod) : [...cur, mod]
      };
    });
  };

  const activeCount = state.users.filter(u => u.actif).length;
  const managerCount = state.users.filter(u => u.role === 'manager').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Utilisateurs
          </h2>
          <p className="text-muted text-sm mt-1">Gestion des accès et permissions</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
          <Users size={24} className="text-black" />
        </div>
      </div>

      {errorMessage && !showModal && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Utilisateurs', value: state.users.length, color: 'text-primary' },
          { label: 'Actifs', value: activeCount, color: 'text-success' },
          { label: 'Inactifs', value: state.users.length - activeCount, color: 'text-muted' },
          { label: 'Managers', value: managerCount, color: 'text-accent' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-base rounded-2xl p-5">
            <p className="text-muted text-xs mb-1">{s.label}</p>
            <p className={`${s.color} font-bold text-xl`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-base rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-b border-base">
          <h3 className="text-primary font-semibold flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            Gestion des Accès
          </h3>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Rechercher..." 
                className="w-full sm:w-48 h-9 pl-9 pr-3 bg-surface-2 border border-base rounded-xl text-primary placeholder-muted text-sm focus:outline-none focus:border-accent/50" 
              />
            </div>
            <Button icon={<Plus size={16} />} onClick={() => { setEditUser(null); setErrorMessage(''); setShowModal(true); }}>
              Ajouter
            </Button>
          </div>
        </div>

        <div className="divide-y divide-base">
          {isLoading ? (
            <div className="px-6 py-8 text-center text-muted text-sm">Chargement des utilisateurs…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted text-sm">
              Aucun utilisateur trouvé.
            </div>
          ) : (
            filtered.map(user => {
              const userModulesList = parseModules(user.module);
              return (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-2 transition-colors">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    user.role === 'manager' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                    user.role === 'caisse' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-slate-600 to-slate-700'
                  }`}>
                    <span className="text-black font-bold text-sm">{user.prenom?.[0] || ''}{user.nom?.[0] || ''}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-primary font-medium">{user.prenom} {user.nom}</p>
                      <span className="text-sm">{roleIcons[user.role]}</span>
                    </div>
                    <p className="text-muted text-xs">{user.email}</p>
                  </div>

                  <div className="hidden md:block">
                    <Badge variant={user.role}>{roleLabels[user.role] || user.role}</Badge>
                  </div>

                  <div className="hidden lg:flex flex-wrap gap-1 max-w-48">
                    {userModulesList.slice(0, 3).map(m => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-xs bg-surface-2 text-muted border border-base">
                        {moduleLabels[m] || m}
                      </span>
                    ))}
                    {userModulesList.length > 3 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-surface-2 text-muted border border-base">
                        +{userModulesList.length - 3}
                      </span>
                    )}
                  </div>

                  <div>
                    <Badge variant={user.actif ? 'actif' : 'inactif'}>
                      {user.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  <div className="hidden xl:block text-right">
                    <p className="text-muted text-xs">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openEdit(user)} className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-primary transition-all">
                      <Edit2 size={14} />
                    </button>
                    {user.id !== state.currentUser?.id && (
                      <button onClick={() => handleDeleteUser(user.id)} className="w-8 h-8 rounded-lg bg-danger-bg hover:bg-danger/20 flex items-center justify-center text-danger transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Role Legend */}
      <div className="bg-surface border border-base rounded-2xl p-6">
        <h3 className="text-primary font-semibold mb-4 flex items-center gap-2">
          <Key size={16} className="text-accent" />
          Niveaux d'Accès
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.entries(roleLabels) as [string, string][]).map(([role, label]) => (
            <div key={role} className="flex items-start gap-3 p-4 rounded-xl bg-surface-2/50 border border-base">
              <span className="text-2xl">{roleIcons[role]}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-primary font-medium text-sm">{label}</p>
                  <Badge variant={role}>{role}</Badge>
                </div>
                <p className="text-muted text-xs">
                  {role === 'manager' && 'Gestion des modules assignés'}
                  {role === 'receptioniste' && 'Accueil, clients et réservations'}
                  {role === 'caisse' && 'Accès aux opérations de caisse'}
                  {role === 'water' && 'Service du bar'}
                  {role === 'housekeeping' && 'Entretien et gestion des chambres'}
                  {role === 'viewer' && 'Lecture seule, sans modification'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditUser(null); }} title={editUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur'} size="lg">
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
              {errorMessage}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Prénom" />
            <Input label="Nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Nom de famille" />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@hda.com" />
          
          <div className="relative">
            <Input label="Mot de passe" type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 bottom-3 text-muted hover:text-primary">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Select label="Rôle" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})} 
            options={Object.entries(roleLabels).map(([k, v]) => ({ value: k, label: v }))} />

          <div>
            <label className="text-muted text-sm font-medium block mb-2">Modules autorisés</label>
            <div className="grid grid-cols-3 gap-2">
              {allModules.map(mod => {
                const isSelected = parseModules(form.module).includes(mod);
                return (
                  <button
                    key={mod}
                    onClick={() => toggleModule(mod)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-accent-4 text-accent border-accent/40'
                        : 'bg-surface-2 text-muted border-base hover:text-primary'
                    }`}
                  >
                    {moduleLabels[mod]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setForm({...form, actif: !form.actif})}
              className={`w-12 h-6 rounded-full transition-all ${form.actif ? 'bg-success' : 'bg-surface-3'} relative`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.actif ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className="text-muted text-sm">{form.actif ? 'Compte actif' : 'Compte inactif'}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditUser(null); }} className="flex-1">Annuler</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enregistrement…' : editUser ? 'Mettre à jour' : 'Créer le compte'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UtilisateursPage;

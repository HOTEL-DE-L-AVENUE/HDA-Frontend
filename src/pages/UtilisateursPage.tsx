// src/pages/UtilisateursPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useHDA } from '../context/HDAContext';
import { User, UserRole, ModuleType } from '../types';
import { formatDate } from '../utils/data';
import { Modal, Input, Select, Button, Badge } from '../components/UI';
import { Users, Plus, Edit2, Trash2, Shield, Eye, EyeOff, Key } from 'lucide-react';
import AuthService from '../services/authService';
import api from '../lib/api';

const roleLabels: Record<string, string> = {
  manager: 'Manager',
  caissier: 'Caissier',
  stock_manager: 'Gestionnaire Stock',
  viewer: 'Lecteur',
};

const roleIcons: Record<string, string> = {
  manager: '🎯',
  caissier: '💰',
  stock_manager: '📦',
  viewer: '👁️',
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

// Extraction d'ID ultra-robuste avec repli par index pour sécuriser l'affichage
const extractId = (u: any, index: number = 0): string => {
  const id = u.id_admin || u.id_user || u.id || u._id || u.id_utilisateur || u.userId || u.ID;
  return id !== undefined && id !== null && String(id).trim() !== '' 
    ? String(id) 
    : `user-fallback-${index}`;
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
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', role: 'manager' as UserRole,
    module: [] as ModuleType[], actif: true, password: ''
  });

  const fetchRealUsers = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/users');
      console.log("Données brutes reçues de l'API users:", response.data);

      const rawData = response.data.data || response.data.users || response.data.result || response.data;
      
      if (Array.isArray(rawData)) {
        const formattedUsers = rawData.map((u: any, index: number) => ({
          id: extractId(u, index),
          nom: u.nom || u.name || u.Nom || 'Nom inconnu',
          prenom: u.prenom || u.firstName || u.Prenom || '',
          email: u.email || u.mail || '',
          role: u.role || 'viewer',
          module: parseModules(u.module || u.modules),
          actif: u.statut === 'actif' || u.actif === true || u.status === 'actif' || u.statut === 1,
          lastLogin: u.lastLogin || u.date_creation || null
        }));
        
        console.log("Utilisateurs formatés prêts à l'affichage:", formattedUsers);
        dispatch({ type: 'SET_USERS', payload: formattedUsers });
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRealUsers();
  }, [fetchRealUsers]);

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
    if (!form.nom || !form.email) {
      setErrorMessage('Le nom et l\'email sont requis');
      return;
    }
    
    try {
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
        await AuthService.register({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          mot_de_passe: form.password,
          role: form.role,
          module: form.module,
          statut: form.actif ? 'actif' : 'inactif'
        });
      }

      await fetchRealUsers();
      setShowModal(false);
      setEditUser(null);
      setForm({ nom: '', prenom: '', email: '', role: 'manager', module: [], actif: true, password: '' });
    } catch (err: any) {
      const errorMsg = typeof err === 'string' 
        ? err 
        : err?.response?.data?.message || err?.message || 'Une erreur est survenue';
      setErrorMessage(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      if (id.length > 15 && !id.match(/^[0-9]+$/)) {
        dispatch({ type: 'DELETE_USER', payload: id });
        return;
      }
      await api.delete(`/api/admin/users/${id}`);
      await fetchRealUsers();
    } catch (err) {
      console.error("Erreur lors de la suppression de l'utilisateur:", err);
      dispatch({ type: 'DELETE_USER', payload: id });
    }
  };

  const toggleModule = (mod: ModuleType) => {
    setForm(prev => {
      const currentModules = parseModules(prev.module);
      const exists = currentModules.includes(mod);
      return {
        ...prev,
        module: exists ? currentModules.filter(m => m !== mod) : [...currentModules, mod]
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
          {filtered.length === 0 ? (
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
                    user.role === 'caissier' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
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
                  {role === 'caissier' && 'Accès aux opérations de caisse'}
                  {role === 'stock_manager' && 'Gestion des stocks uniquement'}
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
            <Button onClick={handleSubmit} className="flex-1">{editUser ? 'Mettre à jour' : 'Créer le compte'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UtilisateursPage;
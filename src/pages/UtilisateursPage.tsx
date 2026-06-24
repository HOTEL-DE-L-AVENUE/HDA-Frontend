import React, { useState } from 'react';
import { useHDA } from '../context/HDAContext';
import { User, UserRole, ModuleType } from '../types';
import { formatDate } from '../utils/data';
import { Modal, Input, Select, Button, Badge } from '../components/UI';
import { Users, Plus, Edit2, Trash2, Shield, Eye, EyeOff, Key } from 'lucide-react';

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
  caissier: 'Caissier',
  stock_manager: 'Gestionnaire Stock',
  viewer: 'Lecteur',
};

const roleIcons: Record<UserRole, string> = {
  admin: '👑',
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

export const UtilisateursPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', role: 'viewer' as UserRole,
    module: [] as ModuleType[], actif: true, password: ''
  });

  const filtered = state.users.filter(u =>
    `${u.nom} ${u.prenom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ nom: user.nom, prenom: user.prenom, email: user.email, role: user.role, module: user.module, actif: user.actif, password: '' });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.nom || !form.email) return;
    if (editUser) {
      dispatch({ type: 'UPDATE_USER', payload: { ...editUser, ...form } });
    } else {
      dispatch({ type: 'ADD_USER', payload: { ...form } });
    }
    setShowModal(false);
    setEditUser(null);
    setForm({ nom: '', prenom: '', email: '', role: 'viewer', module: [], actif: true, password: '' });
  };

  const toggleModule = (mod: ModuleType) => {
    setForm(prev => ({
      ...prev,
      module: prev.module.includes(mod) ? prev.module.filter(m => m !== mod) : [...prev.module, mod]
    }));
  };

  const activeCount = state.users.filter(u => u.actif).length;
  const adminCount = state.users.filter(u => u.role === 'admin').length;

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
          { label: 'Administrateurs', value: adminCount, color: 'text-accent' },
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
            <Button icon={<Plus size={16} />} onClick={() => { setEditUser(null); setShowModal(true); }}>
              Ajouter
            </Button>
          </div>
        </div>

        <div className="divide-y divide-base">
          {filtered.map(user => (
            <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-2 transition-colors">
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                user.role === 'admin' ? 'bg-accent' :
                user.role === 'manager' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                user.role === 'caissier' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                'bg-gradient-to-br from-slate-600 to-slate-700'
              }`}>
                <span className="text-black font-bold text-sm">{user.prenom[0]}{user.nom[0]}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-primary font-medium">{user.prenom} {user.nom}</p>
                  <span className="text-sm">{roleIcons[user.role]}</span>
                </div>
                <p className="text-muted text-xs">{user.email}</p>
              </div>

              {/* Role */}
              <div className="hidden md:block">
                <Badge variant={user.role}>{roleLabels[user.role]}</Badge>
              </div>

              {/* Modules */}
              <div className="hidden lg:flex flex-wrap gap-1 max-w-48">
                {user.module.slice(0, 3).map(m => (
                  <span key={m} className="px-2 py-0.5 rounded-full text-xs bg-surface-2 text-muted border border-base">
                    {moduleLabels[m] || m}
                  </span>
                ))}
                {user.module.length > 3 && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-surface-2 text-muted border border-base">
                    +{user.module.length - 3}
                  </span>
                )}
              </div>

              {/* Status */}
              <div>
                <Badge variant={user.actif ? 'actif' : 'inactif'}>
                  {user.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              {/* Last Login */}
              <div className="hidden xl:block text-right">
                <p className="text-muted text-xs">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => openEdit(user)} className="w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-muted hover:text-primary transition-all">
                  <Edit2 size={14} />
                </button>
                {user.id !== state.currentUser.id && (
                  <button onClick={() => dispatch({ type: 'DELETE_USER', payload: user.id })} className="w-8 h-8 rounded-lg bg-danger-bg hover:bg-danger/20 flex items-center justify-center text-danger transition-all">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Legend */}
      <div className="bg-surface border border-base rounded-2xl p-6">
        <h3 className="text-primary font-semibold mb-4 flex items-center gap-2">
          <Key size={16} className="text-accent" />
          Niveaux d'Accès
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.entries(roleLabels) as [UserRole, string][]).map(([role, label]) => (
            <div key={role} className="flex items-start gap-3 p-4 rounded-xl bg-surface-2/50 border border-base">
              <span className="text-2xl">{roleIcons[role]}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-primary font-medium text-sm">{label}</p>
                  <Badge variant={role}>{role}</Badge>
                </div>
                <p className="text-muted text-xs">
                  {role === 'admin' && 'Accès complet à toute la plateforme'}
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
              {allModules.map(mod => (
                <button
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    form.module.includes(mod)
                      ? 'bg-accent-4 text-accent border-accent/40'
                      : 'bg-surface-2 text-muted border-base hover:text-primary'
                  }`}
                >
                  {moduleLabels[mod]}
                </button>
              ))}
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
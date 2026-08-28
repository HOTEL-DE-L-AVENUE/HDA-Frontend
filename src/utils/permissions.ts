// src/utils/permissions.ts
// Utilitaires centralisés pour la gestion des permissions et accès aux modules

import { ModuleType, UserRole } from '../types';

/**
 * Matrice stricte des modules accessibles par rôle :
 * - admin : accès total à tous les modules
 * - manager : uniquement le(s) module(s) assigné(s) lors de sa création
 * - caissier : commandes et fonctions de caisse sur le module affecté
 * - stock_manager / gestionnaire_de_stock : fonctions de gestion de stock uniquement sur le(s) module(s) assigné(s)
 */
export const ROLE_MODULE_PERMISSIONS: Record<string, ModuleType[]> = {
  admin: ['dashboard', 'hebergement', 'hotel', 'restaurant', 'bar', 'alcool', 'casino', 'finances', 'clients', 'utilisateurs'],
  caissier: ['finances', 'restaurant', 'bar', 'alcool', 'casino', 'hebergement'],
  caisse: ['finances', 'restaurant', 'bar', 'alcool', 'casino', 'hebergement'],
  stock_manager: ['hotel', 'restaurant', 'bar', 'alcool', 'hebergement', 'casino'],
  gestionnaire_de_stock: ['hotel', 'restaurant', 'bar', 'alcool', 'hebergement', 'casino'],
  receptioniste: ['hebergement', 'hotel', 'clients'],
  water: ['bar', 'alcool'],
  housekeeping: ['hotel', 'hebergement'],
};

/**
 * Modules réservés uniquement aux administrateurs.
 */
const ADMIN_ONLY_MODULES: ModuleType[] = ['utilisateurs'];

/**
 * Parse de façon robuste les modules d'un utilisateur, quel que soit leur format
 * (tableau de strings, tableau d'objets, JSON stringifié, CSV).
 */
export function parseUserModules(rawModules: any): string[] {
  if (!rawModules) return [];

  if (Array.isArray(rawModules)) {
    return rawModules
      .map((m: any) => (typeof m === 'string' ? m : m?.id ?? m?.name ?? null))
      .filter(Boolean);
  }

  if (typeof rawModules === 'string') {
    try {
      const parsed = JSON.parse(rawModules);
      if (Array.isArray(parsed)) {
        return parsed
          .map((m: any) => (typeof m === 'string' ? m : m?.id ?? m?.name ?? null))
          .filter(Boolean);
      }
    } catch {
      // Pas du JSON — traiter comme CSV
      return rawModules.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return [];
}

/**
 * Détermine si un utilisateur peut accéder à un module donné.
 */
export function canAccessModule(
  user: { role: string; module?: string[] | any } | null,
  moduleId: string,
  allowedRoles?: string[]
): boolean {
  if (!user) return false;

  const role = user.role?.toLowerCase() || '';

  // 1. Admin : accès total
  if (role === 'admin') return true;

  // 2. Modules réservés strictement à l'admin
  if (ADMIN_ONLY_MODULES.includes(moduleId as ModuleType)) return false;

  // 3. Manager : accès UNIQUEMENT aux modules assignés
  if (role === 'manager') {
    const userModules = parseUserModules(user.module);
    if (moduleId === 'dashboard') {
      return userModules.length === 0 || userModules.includes('dashboard');
    }
    return userModules.includes(moduleId);
  }

  // 4. Stock Manager / Gestionnaire de stock : accès UNIQUEMENT aux modules assignés (pas de dashboard)
  if (role === 'stock_manager' || role === 'gestionnaire_de_stock') {
    if (moduleId === 'dashboard') return false;
    const userModules = parseUserModules(user.module);
    return userModules.includes(moduleId);
  }

  // 5. Caissier : finances ou modules avec encaissement
  if (role === 'caissier' || role === 'caisse') {
    const userModules = parseUserModules(user.module);
    if (userModules.length > 0) {
      return userModules.includes(moduleId);
    }
    return ['finances', 'restaurant', 'bar', 'alcool', 'casino', 'hebergement'].includes(moduleId);
  }

  // 6. Autres rôles métiers spécifiques
  if (ROLE_MODULE_PERMISSIONS[role]) {
    const allowed = ROLE_MODULE_PERMISSIONS[role];
    const userModules = parseUserModules(user.module);
    if (userModules.length > 0) {
      return userModules.includes(moduleId);
    }
    return allowed.includes(moduleId as ModuleType);
  }

  // Si allowedRoles est fourni, vérifier
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) return false;
    const userModules = parseUserModules(user.module);
    if (userModules.length > 0) {
      return userModules.includes(moduleId);
    }
    return true;
  }

  return false;
}

/**
 * Vérifie si un rôle ou utilisateur correspond à l'administrateur.
 */
export function isAdmin(userOrRole?: { role?: string } | string | null): boolean {
  if (!userOrRole) return false;
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  return (role || '').toLowerCase() === 'admin';
}

export function isCashier(userOrRole?: { role?: string } | string | null): boolean {
  if (!userOrRole) return false;
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  return ['caisse', 'caissier'].includes((role || '').toLowerCase());
}

export function isStockManager(userOrRole?: { role?: string } | string | null): boolean {
  if (!userOrRole) return false;
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  return ['stock_manager', 'gestionnaire_de_stock'].includes((role || '').toLowerCase());
}

/**
 * Filtre les onglets/sous-sections secondaires au sein d'un module en fonction du rôle
 */
export function filterTabsByRole<T extends { id: string }>(tabs: T[], userRole?: string): T[] {
  const role = userRole?.toLowerCase() || '';

  // 1. Si admin : accès à tous les onglets
  if (role === 'admin') {
    return tabs;
  }

  if (role === 'caisse' || role === 'caissier') {
    return tabs.filter(t => t.id === 'caisse' || t.id.includes('caisse') || t.id === 'commandes');
  }

  // 2. Si non-admin : exclure systématiquement les onglets de caisse
  const nonCaisseTabs = tabs.filter(t => t.id !== 'caisse' && !t.id.includes('caisse'));

  // 3. Stock Manager / Gestionnaire de stock : restreindre uniquement au stock
  if (role === 'stock_manager' || role === 'gestionnaire_de_stock') {
    const stockTabs = nonCaisseTabs.filter(t => t.id === 'stock' || t.id.includes('stock'));
    return stockTabs.length > 0 ? stockTabs : nonCaisseTabs;
  }

  return nonCaisseTabs;
}

/**
 * Retourne l'onglet par défaut d'un module selon le rôle de l'utilisateur
 */
export function getDefaultTabForRole(defaultTab: string, userRole?: string): string {
  const role = userRole?.toLowerCase() || '';
  if (role === 'caisse' || role === 'caissier') return 'caisse';
  if (role === 'stock_manager' || role === 'gestionnaire_de_stock') return 'stock';
  if (role !== 'admin' && (defaultTab === 'caisse' || defaultTab.includes('caisse'))) {
    return 'stock';
  }
  return defaultTab;
}

/**
 * Retourne la première route accessible par l'utilisateur lors de la connexion.
 */
export function getDefaultRoute(user: { role: string; module?: string[] | any } | null): string {
  if (!user) return '/';

  const role = user.role?.toLowerCase() || '';

  if (role === 'admin') return '/dashboard';

  // Replis par défaut selon le rôle
  switch (role) {
    case 'caissier':
    case 'caisse':
      return '/finances';
    case 'stock_manager':
    case 'gestionnaire_de_stock':
      const stockModules = parseUserModules(user.module);
      if (stockModules.length > 0) {
        return `/${stockModules[0]}`;
      }
      return '/restaurant';
    case 'receptioniste':
      return '/hebergement';
    case 'water':
      return '/bar';
    case 'housekeeping':
      return '/hotel';
    default:
      const modules = parseUserModules(user.module);
      if (modules.length > 0) {
        return `/${modules[0]}`;
      }
      return '/hebergement';
  }
}
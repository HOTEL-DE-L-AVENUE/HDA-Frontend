import api from "../lib/api";

// ----------------------------------------------------------------------
// Rôles utilisateur (correspond à la table users)
// ----------------------------------------------------------------------
export const UserRole = {
  ADMIN: "admin",
  MANAGER: "manager",
  RECEPTIONIST: "receptioniste",
  CASHIER: "caisse",
  WAITER: "water",
  HOUSEKEEPING: "housekeeping",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// ----------------------------------------------------------------------
// Validation du mot de passe
// ----------------------------------------------------------------------
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_VALIDATION_ERRORS = {
  EMPTY: "Le mot de passe ne peut pas être vide",
  TOO_SHORT: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
};

interface PasswordValidationResult {
  valid: boolean;
  error: string | null;
}

const validatePassword = (password: string | null | undefined): PasswordValidationResult => {
  if (!password || password.trim().length === 0) {
    return { valid: false, error: PASSWORD_VALIDATION_ERRORS.EMPTY };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: PASSWORD_VALIDATION_ERRORS.TOO_SHORT };
  }
  return { valid: true, error: null };
};

// ----------------------------------------------------------------------
// Interface utilisateur (adaptée à la table `users`)
// ----------------------------------------------------------------------
export interface User {
  id: number;
  nom: string;
  prenom?: string;
  email: string;
  role: UserRoleType;
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------------
// Réponse standard de l'API
// ----------------------------------------------------------------------
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  user?: T;
  token?: string;
  refreshToken?: string;
  redirectTo?: string;
  error?: string;
}

// ----------------------------------------------------------------------
// Stockage sécurisé (localStorage -> sessionStorage fallback)
// ----------------------------------------------------------------------
class SecureStorage {
  static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      sessionStorage.setItem(key, value);
    }
  }

  static getItem(key: string): string | null {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  }
}

// ----------------------------------------------------------------------
// AuthService
// ----------------------------------------------------------------------
class AuthService {
  // --------------------------------------------------
  // Connexion
  // --------------------------------------------------
  static async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      console.log("🔐 Tentative de connexion:", { email });

      const response = await api.post("/api/auth/login", { email, password });
      const data = response.data as ApiResponse<User>;

      if (!data.success || !data.user || !data.token) {
        throw new Error(data.error || data.message || "Échec de la connexion");
      }

      const user = data.user;
      this.setAuthData(user, data.token, data.refreshToken);

      console.log("✅ Connexion réussie:", { email: user.email, role: user.role });
      return { user, token: data.token };
    } catch (error: any) {
      console.error("❌ Erreur de connexion:", error.message);
      throw this.handleError(error, "Erreur lors de la connexion");
    }
  }

  // --------------------------------------------------
  // Déconnexion
  // --------------------------------------------------
  static async logout(): Promise<void> {
    try {
      const refreshToken = SecureStorage.getItem("refresh-token");
      if (refreshToken) {
        await api.post("/api/auth/logout", { refreshToken }).catch(() => {});
      }
    } finally {
      SecureStorage.clear();
      window.dispatchEvent(new Event("auth-change"));
      console.log("👋 Utilisateur déconnecté");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
  }

  // --------------------------------------------------
  // Rafraîchir le token
  // --------------------------------------------------
  static async refreshToken(): Promise<string> {
    const refreshToken = SecureStorage.getItem("refresh-token");
    if (!refreshToken) {
      throw new Error("Aucun refresh token disponible");
    }
    try {
      console.log("🔄 Rafraîchissement du token...");
      const response = await api.post("/api/auth/refresh-token", { refreshToken });
      const data = response.data as ApiResponse;
      if (!data.success || !data.token) {
        throw new Error(data.error || "Échec du rafraîchissement");
      }
      SecureStorage.setItem("auth-token", data.token);
      console.log("✅ Token rafraîchi");
      return data.token;
    } catch (error: any) {
      console.error("❌ Erreur refresh token:", error.message);
      this.logout();
      throw error;
    }
  }

  // --------------------------------------------------
  // Récupération du profil utilisateur
  // --------------------------------------------------
  static async getProfile(): Promise<User> {
    try {
      const response = await api.get("/api/auth/profile");
      const data = response.data as ApiResponse<User>;
      if (!data.success || !data.user) {
        throw new Error(data.message || "Profil non trouvé");
      }
      return data.user;
    } catch (error: any) {
      throw this.handleError(error, "Erreur lors du chargement du profil");
    }
  }

  // --------------------------------------------------
  // Changement de mot de passe (utilisateur connecté)
  // --------------------------------------------------
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }
    try {
      const response = await api.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });
      const data = response.data as ApiResponse;
      if (!data.success) {
        throw new Error(data.error || "Échec du changement de mot de passe");
      }
    } catch (error: any) {
      throw this.handleError(error, "Erreur lors du changement de mot de passe");
    }
  }

  // --------------------------------------------------
  // Gestion du stockage des données d'authentification
  // --------------------------------------------------
  private static setAuthData(user: User, token: string, refreshToken?: string): void {
    SecureStorage.setItem("auth-token", token);
    if (refreshToken) {
      SecureStorage.setItem("refresh-token", refreshToken);
    }
    SecureStorage.setItem("user-data", JSON.stringify(user));
    window.dispatchEvent(new Event("auth-change"));
  }

  // --------------------------------------------------
  // Récupération des données locales
  // --------------------------------------------------
  static getCurrentUser(): User | null {
    try {
      const data = SecureStorage.getItem("user-data");
      if (!data) return null;
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  }

  static getToken(): string | null {
    return SecureStorage.getItem("auth-token");
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // --------------------------------------------------
  // Contrôle des rôles
  // --------------------------------------------------
  static hasRole(requiredRole: UserRoleType | UserRoleType[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Admin a tous les droits
    if (user.role === UserRole.ADMIN) return true;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }

  // --------------------------------------------------
  // Redirection après connexion selon le rôle
  // --------------------------------------------------
  static getRedirectPath(): string {
    const user = this.getCurrentUser();
    if (!user) return "/login";

    const roleRedirects: Record<UserRoleType, string> = {
      admin: "/dashboard",
      manager: "/dashboard",
      receptioniste: "/dashboard",
      caisse: "/dashboard",
      water: "/dashboard",
      housekeeping: "/dashboard",
    };

    return roleRedirects[user.role] || "/";
  }

  // --------------------------------------------------
  // Gestion des erreurs
  // --------------------------------------------------
  private static handleError(error: any, defaultMessage: string): Error {
    console.error("🔥 AuthService Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.code === "ERR_NETWORK") {
      return new Error("Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur le port 4000.");
    }

    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    switch (error.response?.status) {
      case 401:
        return new Error("Identifiants invalides.");
      case 403:
        return new Error("Accès interdit.");
      default:
        return new Error(error.message || defaultMessage);
    }
  }
}

export default AuthService;
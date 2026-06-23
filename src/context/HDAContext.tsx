import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  StockItem, 
  CaisseTransaction, 
  User, 
  JeuCasino, 
  ModuleType,
  Reservation,
  Commande,
  StockMovement,
  Chambre
} from '../types';
import { 
  initialUsers, 
  initialStockItems, 
  initialTransactions, 
  initialJeuxCasino,
  reservations,
  commandes,
  stockMovements,
  generateId
} from '../utils/data';

// ==================== STATE ====================

interface HDAState {
  users: User[];
  currentUser: User;
  stockItems: StockItem[];
  transactions: CaisseTransaction[];
  jeux: JeuCasino[];
  reservations: Reservation[];
  commandes: Commande[];
  stockMovements: StockMovement[];
  chambres: Chambre[];
  activeModule: ModuleType;
  sidebarCollapsed: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

// ==================== DONNÉES INITIALES POUR LES CHAMBRES ====================

const initialChambres: Chambre[] = [
  {
    id: 'ch1',
    numero: '101',
    type: 'simple',
    prix: 120,
    status: 'libre',
    etage: 1,
    capacite: 2,
  },
  {
    id: 'ch2',
    numero: '102',
    type: 'double',
    prix: 180,
    status: 'occupee',
    etage: 1,
    capacite: 2,
  },
  {
    id: 'ch3',
    numero: '201',
    type: 'suite',
    prix: 350,
    status: 'libre',
    etage: 2,
    capacite: 4,
  },
  {
    id: 'ch4',
    numero: '202',
    type: 'vip',
    prix: 250,
    status: 'reservee',
    etage: 2,
    capacite: 2,
  },
  {
    id: 'ch5',
    numero: '301',
    type: 'vip',
    prix: 500,
    status: 'libre',
    etage: 3,
    capacite: 4,
  }
];

// ==================== ACTIONS ====================

type Action =
  | { type: 'SET_MODULE'; payload: ModuleType }
  | { type: 'TOGGLE_SIDEBAR' }
  // Actions Stock
  | { type: 'ADD_STOCK_ITEM'; payload: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_STOCK_ITEM'; payload: StockItem }
  | { type: 'DELETE_STOCK_ITEM'; payload: string }
  // Actions Transactions
  | { type: 'ADD_TRANSACTION'; payload: Omit<CaisseTransaction, 'id' | 'date'> }
  | { type: 'ADD_CASINO_TRANSACTION'; payload: { jeuId: string; transaction: Omit<CaisseTransaction, 'id' | 'date'> } }
  // Actions Utilisateurs
  | { type: 'ADD_USER'; payload: Omit<User, 'id' | 'createdAt'> }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  // Actions Réservations
  | { type: 'ADD_RESERVATION'; payload: Omit<Reservation, 'id' | 'createdAt'> }
  | { type: 'UPDATE_RESERVATION'; payload: Reservation }
  | { type: 'DELETE_RESERVATION'; payload: string }
  // Actions Commandes
  | { type: 'ADD_COMMANDE'; payload: Omit<Commande, 'id' | 'createdAt'> }
  | { type: 'UPDATE_COMMANDE'; payload: Commande }
  | { type: 'DELETE_COMMANDE'; payload: string }
  // Actions Jeux Casino
  | { type: 'UPDATE_JEU'; payload: JeuCasino }
  // Actions Notifications
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'CLEAR_NOTIFICATION'; payload: string }
  // Actions Chambres
  | { type: 'ADD_CHAMBRE'; payload: Chambre }
  | { type: 'UPDATE_CHAMBRE'; payload: Chambre }
  | { type: 'DELETE_CHAMBRE'; payload: string };

// ==================== REDUCER ====================

const hdaReducer = (state: HDAState, action: Action): HDAState => {
  switch (action.type) {
    // ===== NAVIGATION =====
    case 'SET_MODULE':
      return { ...state, activeModule: action.payload };
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    
    // ===== STOCK =====
    case 'ADD_STOCK_ITEM': {
      const newItem: StockItem = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...state, stockItems: [...state.stockItems, newItem] };
    }
    
    case 'UPDATE_STOCK_ITEM':
      return {
        ...state,
        stockItems: state.stockItems.map(item =>
          item.id === action.payload.id 
            ? { ...action.payload, updatedAt: new Date().toISOString() } 
            : item
        )
      };
    
    case 'DELETE_STOCK_ITEM':
      return {
        ...state,
        stockItems: state.stockItems.filter(item => item.id !== action.payload)
      };
    
    // ===== TRANSACTIONS =====
    case 'ADD_TRANSACTION': {
      const newTransaction: CaisseTransaction = {
        ...action.payload,
        id: generateId(),
        date: new Date().toISOString(),
      };
      return { ...state, transactions: [newTransaction, ...state.transactions] };
    }
    
    case 'ADD_CASINO_TRANSACTION': {
      const { jeuId, transaction } = action.payload;
      const newTransaction: CaisseTransaction = {
        ...transaction,
        id: generateId(),
        date: new Date().toISOString(),
      };
      
      const updatedJeux = state.jeux.map(jeu => {
        if (jeu.id === jeuId) {
          const delta = transaction.type === 'entree' ? transaction.montant : -transaction.montant;
          return {
            ...jeu,
            caisse: {
              ...jeu.caisse,
              soldeTotal: jeu.caisse.soldeTotal + delta,
              totalEntrees: transaction.type === 'entree' 
                ? jeu.caisse.totalEntrees + transaction.montant 
                : jeu.caisse.totalEntrees,
              totalSorties: transaction.type === 'sortie' 
                ? jeu.caisse.totalSorties + transaction.montant 
                : jeu.caisse.totalSorties,
              transactions: [newTransaction, ...jeu.caisse.transactions]
            }
          };
        }
        return jeu;
      });
      
      return {
        ...state,
        jeux: updatedJeux,
        transactions: [newTransaction, ...state.transactions]
      };
    }
    
    // ===== UTILISATEURS =====
    case 'ADD_USER': {
      const newUser: User = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      return { ...state, users: [...state.users, newUser] };
    }
    
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? action.payload : u)
      };
    
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(u => u.id !== action.payload)
      };
    
    // ===== RÉSERVATIONS =====
    case 'ADD_RESERVATION': {
      const newRes: Reservation = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      return { ...state, reservations: [newRes, ...state.reservations] };
    }
    
    case 'UPDATE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.map(r => r.id === action.payload.id ? action.payload : r)
      };
    
    case 'DELETE_RESERVATION':
      return {
        ...state,
        reservations: state.reservations.filter(r => r.id !== action.payload)
      };
    
    // ===== COMMANDES =====
    case 'ADD_COMMANDE': {
      const newCmd: Commande = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      return { ...state, commandes: [newCmd, ...state.commandes] };
    }
    
    case 'UPDATE_COMMANDE':
      return {
        ...state,
        commandes: state.commandes.map(c => c.id === action.payload.id ? action.payload : c)
      };
    
    case 'DELETE_COMMANDE':
      return {
        ...state,
        commandes: state.commandes.filter(c => c.id !== action.payload)
      };
    
    // ===== JEUX CASINO =====
    case 'UPDATE_JEU':
      return {
        ...state,
        jeux: state.jeux.map(j => j.id === action.payload.id ? action.payload : j)
      };
    
    // ===== NOTIFICATIONS =====
    case 'ADD_NOTIFICATION': {
      const notif: Notification = {
        ...action.payload,
        id: generateId(),
        timestamp: new Date().toISOString()
      };
      return { ...state, notifications: [notif, ...state.notifications.slice(0, 9)] };
    }
    
    case 'CLEAR_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };

    // ===== CHAMBRES =====
    case 'ADD_CHAMBRE':
      return {
        ...state,
        chambres: [...state.chambres, action.payload]
      };
    
    case 'UPDATE_CHAMBRE':
      return {
        ...state,
        chambres: state.chambres.map(c => 
          c.id === action.payload.id ? action.payload : c
        )
      };
    
    case 'DELETE_CHAMBRE':
      return {
        ...state,
        chambres: state.chambres.filter(c => c.id !== action.payload)
      };
    
    default:
      return state;
  }
};

// ==================== STATE INITIAL ====================

const initialState: HDAState = {
  users: initialUsers,
  currentUser: initialUsers[0],
  stockItems: initialStockItems,
  transactions: initialTransactions,
  jeux: initialJeuxCasino,
  reservations: reservations,
  commandes: commandes,
  stockMovements: stockMovements,
  chambres: initialChambres,
  activeModule: 'dashboard',
  sidebarCollapsed: false,
  notifications: [
    { id: 'n1', type: 'warning', message: 'Stock faible: Serviettes de Bain (8 unités)', timestamp: new Date().toISOString() },
    { id: 'n2', type: 'warning', message: 'Stock faible: Champagne Brut (7 bouteilles)', timestamp: new Date().toISOString() },
    { id: 'n3', type: 'error', message: 'Stock épuisé: Truffe Noire', timestamp: new Date().toISOString() },
  ]
};

// ==================== CONTEXT ====================

interface HDAContextType {
  state: HDAState;
  dispatch: React.Dispatch<Action>;
  // Helpers
  getModuleTransactions: (module: ModuleType) => CaisseTransaction[];
  getModuleStock: (module: ModuleType) => StockItem[];
  getModuleCaisseSolde: (module: ModuleType) => { solde: number; entrees: number; sorties: number };
  getCasinoTotalCaisse: () => { solde: number; entrees: number; sorties: number };
  getGlobalStats: () => { totalRevenu: number; totalDepenses: number; soldeGlobal: number };
}

const HDAContext = createContext<HDAContextType | undefined>(undefined);

export const HDAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(hdaReducer, initialState);

  // ===== HELPERS =====
  
  const getModuleTransactions = (module: ModuleType) => {
    return state.transactions.filter(t => t.module === module);
  };

  const getModuleStock = (module: ModuleType) => {
    return state.stockItems.filter(s => s.module === module);
  };

  const getModuleCaisseSolde = (module: ModuleType) => {
    const txs = getModuleTransactions(module);
    const entrees = txs.filter(t => t.type === 'entree').reduce((sum, t) => sum + t.montant, 0);
    const sorties = txs.filter(t => t.type === 'sortie').reduce((sum, t) => sum + t.montant, 0);
    return { solde: entrees - sorties, entrees, sorties };
  };

  const getCasinoTotalCaisse = () => {
    const solde = state.jeux.reduce((sum, j) => sum + j.caisse.soldeTotal, 0);
    const entrees = state.jeux.reduce((sum, j) => sum + j.caisse.totalEntrees, 0);
    const sorties = state.jeux.reduce((sum, j) => sum + j.caisse.totalSorties, 0);
    return { solde, entrees, sorties };
  };

  const getGlobalStats = () => {
    const modules: ModuleType[] = ['hebergement', 'hotel', 'restaurant', 'bar'];
    let totalRevenu = 0;
    let totalDepenses = 0;
    
    modules.forEach(m => {
      const { entrees, sorties } = getModuleCaisseSolde(m);
      totalRevenu += entrees;
      totalDepenses += sorties;
    });
    
    const casino = getCasinoTotalCaisse();
    totalRevenu += casino.entrees;
    totalDepenses += casino.sorties;
    
    return { totalRevenu, totalDepenses, soldeGlobal: totalRevenu - totalDepenses };
  };

  return (
    <HDAContext.Provider value={{ 
      state, 
      dispatch, 
      getModuleTransactions, 
      getModuleStock, 
      getModuleCaisseSolde,
      getCasinoTotalCaisse,
      getGlobalStats
    }}>
      {children}
    </HDAContext.Provider>
  );
};

export const useHDA = () => {
  const context = useContext(HDAContext);
  if (!context) throw new Error('useHDA must be used within HDAProvider');
  return context;
};
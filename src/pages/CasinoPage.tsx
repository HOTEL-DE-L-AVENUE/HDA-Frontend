import React, { useState, useEffect } from 'react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency } from '../utils/data';
import { 
  Dices, 
  TrendingUp, 
  TrendingDown, 
  Users,
  LayoutDashboard,
  CreditCard,
  Package,
  DollarSign
} from 'lucide-react';

// Import des composants du dossier Casino
import { CasinoHeader } from '../components/Casino/Entete/CasinoHeader';
import { CasinoTabs } from '../components/Casino/Tabs/CasinoTabs';
import { OverviewTab } from '../components/Casino/Tabs/OverviewTab';
import { RoomsTab } from '../components/Casino/Tabs/RoomsTab';
import { CardsTab } from '../components/Casino/Tabs/CardsTab';
import { ClientsTab } from '../components/Casino/Tabs/ClientsTab';
import { StockTab } from '../components/Casino/Tabs/StockTab';
import { CaisseTab } from '../components/Casino/Tabs/CaisseTab';
import { RoomModal } from '../components/Casino/Modals/RoomModal';
import { CashierModal } from '../components/Casino/Modals/CashierModal';
import { SessionModal } from '../components/Casino/Modals/SessionModal';
import { TransactionModal } from '../components/Casino/Modals/TransactionModal';
import { ChipTransactionModal } from '../components/Casino/Modals/ChipTransactionModal';
import { CardModal } from '../components/Casino/Modals/CardModal';
import { CreditModal } from '../components/Casino/Modals/CreditModal';

// Types
import type { 
  CasinoRoom, 
  CasinoCashier, 
  CasinoSession, 
  CasinoCard, 
  CasinoTransaction,
  CasinoChipTransaction,
  CasinoCredit,
  Client 
} from '../components/Casino/types';

export const CasinoPage: React.FC = () => {
  const { state, dispatch } = useHDA();
  
  // États
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<CasinoRoom | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Données
  const [rooms, setRooms] = useState<CasinoRoom[]>([]);
  const [cashiers, setCashiers] = useState<CasinoCashier[]>([]);
  const [sessions, setSessions] = useState<CasinoSession[]>([]);
  const [cards, setCards] = useState<CasinoCard[]>([]);
  const [transactions, setTransactions] = useState<CasinoTransaction[]>([]);
  const [chipTransactions, setChipTransactions] = useState<CasinoChipTransaction[]>([]);
  const [credits, setCredits] = useState<CasinoCredit[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Modales
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCashierModal, setShowCashierModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showChipTransactionModal, setShowChipTransactionModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  
  // Formulaires
  const [roomForm, setRoomForm] = useState({ nom: '', type_salle: 'PRINCIPALE', statut: 'OUVERTE' as const });
  const [cashierForm, setCashierForm] = useState({ room_id: 0, nom: '', statut: 'OUVERTE' as const });
  const [sessionForm, setSessionForm] = useState({ cashier_id: 0, user_id: 0, fond_initial: 0 });
  const [transactionForm, setTransactionForm] = useState({
    client_id: 0, session_id: 0, type_transaction: 'ACHAT_JETONS' as const,
    montant: 0, moyen_paiement: 'ESPECES' as const, description: ''
  });
  const [chipTransactionForm, setChipTransactionForm] = useState({
    client_id: 0, transaction_type: 'ACHAT' as const, quantite: 0, valeur_unitaire: 0
  });
  const [cardForm, setCardForm] = useState({ client_id: 0, niveau: 'BRONZE' });
  const [creditForm, setCreditForm] = useState({ client_id: 0, montant_accorde: 0, echeance: '' });

  // Chargement des données
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // Clients
      const mockClients: Client[] = [
        { id: 1, code_client: 'CL001', nom: 'Rakoto', prenom: 'Jean', telephone: '+261 34 123 4567', email: 'jean@email.com', is_casino_player: true, statut: 'ACTIF' },
        { id: 2, code_client: 'CL002', nom: 'Rabe', prenom: 'Marie', telephone: '+261 33 987 6543', email: 'marie@email.com', is_casino_player: true, statut: 'ACTIF' },
        { id: 3, code_client: 'CL003', nom: 'Andrian', prenom: 'Pierre', telephone: '+261 32 456 7890', email: 'pierre@email.com', is_casino_player: false, statut: 'ACTIF' },
        { id: 4, code_client: 'CL004', nom: 'Razafy', prenom: 'Lala', telephone: '+261 34 789 0123', email: 'lala@email.com', is_casino_player: true, statut: 'ACTIF' },
      ];
      setClients(mockClients);

      // Rooms
      const mockRooms: CasinoRoom[] = [
        { id: 1, nom: 'Salle Principale', type_salle: 'PRINCIPALE', statut: 'OUVERTE' },
        { id: 2, nom: 'Salle VIP', type_salle: 'VIP', statut: 'OUVERTE' },
        { id: 3, nom: 'Salle Poker', type_salle: 'POKER', statut: 'OUVERTE' },
        { id: 4, nom: 'Salle Machines', type_salle: 'MACHINES', statut: 'FERMEE' },
      ];
      setRooms(mockRooms);

      // Cashiers
      const mockCashiers: CasinoCashier[] = [
        { id: 1, room_id: 1, nom: 'Caisse 1 - Principale', statut: 'OUVERTE' },
        { id: 2, room_id: 1, nom: 'Caisse 2 - Principale', statut: 'OUVERTE' },
        { id: 3, room_id: 2, nom: 'Caisse VIP', statut: 'OUVERTE' },
        { id: 4, room_id: 3, nom: 'Caisse Poker', statut: 'FERMEE' },
      ];
      setCashiers(mockCashiers);

      // Sessions
      const mockSessions: CasinoSession[] = [
        { id: 1, cashier_id: 1, user_id: 1, ouverture_at: new Date().toISOString(), fermeture_at: null, fond_initial: 5000, fond_final: null, ecart: null },
        { id: 2, cashier_id: 2, user_id: 1, ouverture_at: new Date(Date.now() - 3600000).toISOString(), fermeture_at: new Date().toISOString(), fond_initial: 3000, fond_final: 4500, ecart: 1500 },
      ];
      setSessions(mockSessions);

      // Cards
      const mockCards: CasinoCard[] = [
        { id: 1, client_id: 1, numero_carte: 'CARD-0001', niveau: 'OR', points: 1250 },
        { id: 2, client_id: 2, numero_carte: 'CARD-0002', niveau: 'ARGENT', points: 450 },
        { id: 3, client_id: 4, numero_carte: 'CARD-0003', niveau: 'PLATINE', points: 3200 },
      ];
      setCards(mockCards);

      // Transactions
      const mockTransactions: CasinoTransaction[] = [
        { id: 1, client_id: 1, session_id: 1, type_transaction: 'ACHAT_JETONS', montant: 1000, moyen_paiement: 'ESPECES', created_at: new Date().toISOString() },
        { id: 2, client_id: 2, session_id: 1, type_transaction: 'GAIN', montant: 2500, moyen_paiement: 'CARTE', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, client_id: 1, session_id: 2, type_transaction: 'DEPOT', montant: 5000, moyen_paiement: 'VIREMENT', created_at: new Date(Date.now() - 7200000).toISOString() },
      ];
      setTransactions(mockTransactions);

      // Credits
      const mockCredits: CasinoCredit[] = [
        { id: 1, client_id: 1, montant_accorde: 5000, encours: 3200, echeance: '2026-07-01', statut: 'ACTIF' },
        { id: 2, client_id: 2, montant_accorde: 2000, encours: 500, echeance: '2026-06-15', statut: 'ACTIF' },
      ];
      setCredits(mockCredits);

      setLoading(false);
    }, 500);
  }, []);

  // Calcul des totaux
  const casinoTotal = {
    solde: transactions.reduce((sum, t) => {
      if (t.type_transaction === 'ACHAT_JETONS' || t.type_transaction === 'GAIN' || t.type_transaction === 'DEPOT') {
        return sum + t.montant;
      }
      return sum - t.montant;
    }, 0),
    entrees: transactions.filter(t => t.type_transaction === 'ACHAT_JETONS' || t.type_transaction === 'GAIN' || t.type_transaction === 'DEPOT').reduce((sum, t) => sum + t.montant, 0),
    sorties: transactions.filter(t => t.type_transaction === 'RACHAT_JETONS' || t.type_transaction === 'PERTE' || t.type_transaction === 'RETRAIT').reduce((sum, t) => sum + t.montant, 0),
  };

  const roomsActives = rooms.filter(r => r.statut === 'OUVERTE');
  const cashiersActifs = cashiers.filter(c => c.statut === 'OUVERTE');
  const joueursActifs = clients.filter(c => c.is_casino_player && c.statut === 'ACTIF');

  // Données pour le graphique
  const barData = rooms.map(room => {
    const roomTransactions = transactions.filter(t => {
      const session = sessions.find(s => s.id === t.session_id);
      const cashier = cashiers.find(c => c.id === session?.cashier_id);
      return cashier?.room_id === room.id;
    });
    const entrees = roomTransactions.filter(t => t.type_transaction === 'ACHAT_JETONS' || t.type_transaction === 'GAIN' || t.type_transaction === 'DEPOT').reduce((sum, t) => sum + t.montant, 0);
    const sorties = roomTransactions.filter(t => t.type_transaction === 'RACHAT_JETONS' || t.type_transaction === 'PERTE' || t.type_transaction === 'RETRAIT').reduce((sum, t) => sum + t.montant, 0);
    return { name: room.nom.split(' ')[0], solde: entrees - sorties, entrees, sorties, actif: room.statut === 'OUVERTE' };
  });

  // Statistiques
  const stats = [
    { label: 'Solde Casino', value: formatCurrency(casinoTotal.solde), icon: <Dices size={20} className="text-black" /> },
    { label: 'Total Entrées', value: formatCurrency(casinoTotal.entrees), icon: <TrendingUp size={20} className="text-black" /> },
    { label: 'Total Sorties', value: formatCurrency(casinoTotal.sorties), icon: <TrendingDown size={20} className="text-black" /> },
    { label: 'Joueurs Actifs', value: joueursActifs.length, icon: <Users size={20} className="text-black" /> },
  ];

  // Handlers
  const handleAddRoom = (data: any) => {
    const newRoom: CasinoRoom = { id: rooms.length + 1, ...data };
    setRooms([...rooms, newRoom]);
    alert('Salle créée avec succès !');
  };

  const handleAddCashier = (data: any) => {
    const newCashier: CasinoCashier = { id: cashiers.length + 1, ...data };
    setCashiers([...cashiers, newCashier]);
    alert('Caisse créée avec succès !');
  };

  const handleAddSession = (data: any) => {
    const newSession: CasinoSession = {
      id: sessions.length + 1,
      ...data,
      ouverture_at: new Date().toISOString(),
      fermeture_at: null,
      fond_final: null,
      ecart: null
    };
    setSessions([...sessions, newSession]);
    alert('Session ouverte avec succès !');
  };

  const handleAddTransaction = (data: any) => {
    const newTransaction: CasinoTransaction = {
      id: transactions.length + 1,
      ...data,
      created_at: new Date().toISOString()
    };
    setTransactions([...transactions, newTransaction]);
    alert('Transaction enregistrée avec succès !');
  };

  const handleAddChipTransaction = (data: any) => {
    const newChipTransaction: CasinoChipTransaction = {
      id: chipTransactions.length + 1,
      ...data,
      created_at: new Date().toISOString()
    };
    setChipTransactions([...chipTransactions, newChipTransaction]);
    alert('Transaction de jetons enregistrée !');
  };

  const handleAddCard = (data: any) => {
    const newCard: CasinoCard = {
      id: cards.length + 1,
      ...data,
      numero_carte: `CARD-${String(cards.length + 1).padStart(4, '0')}`,
      points: 0
    };
    setCards([...cards, newCard]);
    alert('Carte de fidélité créée avec succès !');
  };

  const handleAddCredit = (data: any) => {
    const newCredit: CasinoCredit = {
      id: credits.length + 1,
      ...data,
      encours: data.montant_accorde,
      statut: 'ACTIF'
    };
    setCredits([...credits, newCredit]);
    alert('Crédit accordé avec succès !');
  };

  // Props partagées
  const sharedProps = {
    rooms,
    cashiers,
    sessions,
    cards,
    transactions,
    chipTransactions,
    credits,
    clients,
    selectedRoom,
    setSelectedRoom,
    barData,
    casinoTotal,
    roomsActives,
    cashiersActifs,
    joueursActifs,
    searchQuery,
    filterStatus,
    setSearchQuery,
    setFilterStatus,
    onNewRoom: () => setShowRoomModal(true),
    onNewCashier: () => setShowCashierModal(true),
    onNewSession: () => setShowSessionModal(true),
    onNewTransaction: () => setShowTransactionModal(true),
    onNewChipTransaction: () => setShowChipTransactionModal(true),
    onNewCard: () => setShowCardModal(true),
    onNewCredit: () => setShowCreditModal(true),
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden p-6">
      {/* Header avec statistiques */}
      <CasinoHeader 
        stats={stats}
        onNewRoom={() => setShowRoomModal(true)}
        onNewSession={() => setShowSessionModal(true)}
        onNewTransaction={() => setShowTransactionModal(true)}
      />

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher une salle, un joueur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl text-primary placeholder-subtle text-sm"
            style={{
              backgroundColor: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-48 h-10 rounded-xl text-primary text-sm px-4"
          style={{
            backgroundColor: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            outline: 'none',
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="OUVERTE">Ouverte</option>
          <option value="FERMEE">Fermée</option>
          <option value="ACTIF">Actif</option>
          <option value="INACTIF">Inactif</option>
        </select>
      </div>

      {/* Onglets */}
      <CasinoTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenu des onglets */}
      <div className="w-full">
        {activeTab === 'overview' && <OverviewTab {...sharedProps} />}
        {activeTab === 'rooms' && <RoomsTab {...sharedProps} />}
        {activeTab === 'cards' && <CardsTab {...sharedProps} />}
        {activeTab === 'clients' && <ClientsTab {...sharedProps} />}
        {activeTab === 'stock' && <StockTab />}
        {activeTab === 'caisse' && <CaisseTab {...sharedProps} />}
      </div>

      {/* ========== MODALS ========== */}
      
      <RoomModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        onSubmit={handleAddRoom}
      />

      <CashierModal
        isOpen={showCashierModal}
        onClose={() => setShowCashierModal(false)}
        rooms={rooms}
        onSubmit={handleAddCashier}
      />

      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        cashiers={cashiers}
        onSubmit={handleAddSession}
      />

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        clients={clients}
        sessions={sessions}
        onSubmit={handleAddTransaction}
      />

      <ChipTransactionModal
        isOpen={showChipTransactionModal}
        onClose={() => setShowChipTransactionModal(false)}
        clients={clients}
        onSubmit={handleAddChipTransaction}
      />

      <CardModal
        isOpen={showCardModal}
        onClose={() => setShowCardModal(false)}
        clients={clients}
        onSubmit={handleAddCard}
      />

      <CreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        clients={clients}
        onSubmit={handleAddCredit}
      />
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency } from '../utils/data';
import {
  fetchCasinoBundle,
  createRoom as apiCreateRoom,
  createCashier as apiCreateCashier,
  openSession as apiOpenSession,
  recordTransaction as apiRecordTransaction,
  recordChipTransaction as apiRecordChipTransaction,
  createCard as apiCreateCard,
  grantCredit as apiGrantCredit,
} from '../lib/casinoApi';
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
  const [loadError, setLoadError] = useState<string | null>(null);
  
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
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchCasinoBundle()
      .then(({ clients, rooms, cashiers, sessions, cards, credits, transactions, chipTransactions }) => {
        if (cancelled) return;
        setClients(clients);
        setRooms(rooms);
        setCashiers(cashiers);
        setSessions(sessions);
        setCards(cards);
        setCredits(credits);
        setTransactions(transactions);
        setChipTransactions(chipTransactions);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erreur chargement module casino', err);
        setLoadError("Impossible de charger les données du casino. Réessayez.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
  const handleAddRoom = async (data: any) => {
    try {
      const newRoom = await apiCreateRoom(data);
      setRooms([...rooms, newRoom]);
      alert('Salle créée avec succès !');
    } catch (err) {
      console.error(err);
      alert("Échec de la création de la salle.");
    }
  };

  const handleAddCashier = async (data: any) => {
    try {
      const newCashier = await apiCreateCashier(data);
      setCashiers([...cashiers, newCashier]);
      alert('Caisse créée avec succès !');
    } catch (err) {
      console.error(err);
      alert("Échec de la création de la caisse.");
    }
  };

  const handleAddSession = async (data: any) => {
    try {
      // Le formulaire envoie un user_id, mais openSession() ne le transmet pas :
      // le backend déduit l'agent du token JWT (voir casinoApi.ts).
      const newSession = await apiOpenSession(data);
      setSessions([...sessions, newSession]);
      alert('Session ouverte avec succès !');
    } catch (err) {
      console.error(err);
      alert("Échec de l'ouverture de session.");
    }
  };

  const handleAddTransaction = async (data: any) => {
    try {
      const newTransaction = await apiRecordTransaction(data);
      setTransactions([...transactions, newTransaction]);
      alert('Transaction enregistrée avec succès !');
    } catch (err) {
      console.error(err);
      alert("Échec de l'enregistrement de la transaction.");
    }
  };

  const handleAddChipTransaction = async (data: any) => {
    try {
      // Le formulaire propose ACHAT | RACHAT | GAIN | PERTE, mais le backend n'a que
      // /chips/buy et /chips/sell : recordChipTransaction() route RACHAT vers sell,
      // et tout le reste (dont GAIN/PERTE, qui n'ont pas de sens pour les jetons) vers buy.
      const newChipTransaction = await apiRecordChipTransaction(data);
      setChipTransactions([...chipTransactions, newChipTransaction]);
      alert('Transaction de jetons enregistrée !');
    } catch (err) {
      console.error(err);
      alert("Échec de l'enregistrement de la transaction de jetons.");
    }
  };

  const handleAddCard = async (data: any) => {
    try {
      const newCard = await apiCreateCard(data);
      setCards([...cards, newCard]);
      alert('Carte de fidélité créée avec succès !');
    } catch (err) {
      console.error(err);
      alert("Échec de la création de la carte.");
    }
  };

  const handleAddCredit = async (data: any) => {
    try {
      // Le formulaire envoie montant_accorde ; grantCredit() le convertit en "montant"
      // pour la route /credits/grant (voir casinoApi.ts).
      const newCredit = await apiGrantCredit(data);
      setCredits([...credits, newCredit]);
      alert('Crédit accordé avec succès !');
    } catch (err) {
      console.error(err);
      alert("Échec de l'octroi du crédit.");
    }
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
      {loadError && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}>
          {loadError}
        </div>
      )}
      {loading && rooms.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-muted">Chargement du module casino…</p>
        </div>
      ) : (
      <>
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
      </>
      )}
    </div>
  );
};
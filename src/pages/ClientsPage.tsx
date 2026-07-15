// src/pages/ClientsPage.tsx
import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Filter,
  Download,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  X,
  QrCode,
  Copy,
  Check,
  Share2,
  Printer,
  Users,
  Loader,
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  CreditCard,
  Building,
  Hash,
  Camera,
  Plus,
  Shield,
  FileCheck,
  Landmark,
  Briefcase
} from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { Client, ClientFormData, ClientKyc, ClientKycFormData, NiveauRisque } from '../services/client.service';
import SignaturePad from '../components/SignaturePad';
import toast from 'react-hot-toast';

const ClientsPage: React.FC = () => {
  const { 
    clients, 
    loading, 
    error, 
    loadClients,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
    loadClientWithDetails,
    loadClientKyc,
    saveClientKyc,
    loadClientKycSignature,
    createClientKycSignature
  } = useClients();

  // États
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const itemsPerPage: number = 5;

  // Formulaire
  const initialFormData: ClientFormData = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    type_piece: '',
    numero_piece: '',
    statut: 'ACTIF',
    is_casino_player: false,
    code_client: ''
  };
  
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fiche KYC (Know Your Customer) — conformité LBC/FT, uniquement pour les joueurs de casino
  const initialKycData: ClientKycFormData = {
    lieu_naissance: '',
    nationalite: '',
    profession: '',
    date_delivrance_piece: '',
    date_expiration_piece: '',
    autorite_delivrance: '',
    source_revenus: '',
    revenu_mensuel_estime: null,
    mode_paiement: '',
    banque: '',
    doc_piece_identite: false,
    doc_justificatif_domicile: false,
    doc_photo_client: false,
    doc_autre: '',
    niveau_risque: null,
    commentaires_risque: '',
    declaration_client: false,
    date_verification: '',
  };

  const [kycData, setKycData] = useState<ClientKycFormData>(initialKycData);
  const [kycSignature, setKycSignature] = useState<string | null>(null);
  // Ne devient true que si le client dessine réellement une nouvelle signature dans ce
  // formulaire (voir handleSignatureChange) — évite de recréer un doublon en base à
  // chaque simple modification du client si la signature existante n'a pas changé.
  const [signatureDirty, setSignatureDirty] = useState<boolean>(false);
  const [isLoadingKyc, setIsLoadingKyc] = useState<boolean>(false);
  const [viewedKyc, setViewedKyc] = useState<ClientKyc | null>(null);
  const [viewedSignature, setViewedSignature] = useState<string | null>(null);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchClients(searchTerm);
      } else {
        loadClients();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, searchClients, loadClients]);

  // Filtrer les clients
  const getFilteredClients = (): Client[] => {
    let filtered = clients;
    
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(client => 
        client.statut?.toLowerCase() === filterStatus
      );
    }
    
    return filtered;
  };

  const filteredClients: Client[] = getFilteredClients();
  const totalPages: number = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex: number = (currentPage - 1) * itemsPerPage;
  const paginatedClients: Client[] = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.nom?.trim()) {
      errors.nom = 'Le nom est requis';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }
    if (formData.telephone && !/^[0-9+\s-]{8,}$/.test(formData.telephone)) {
      errors.telephone = 'Téléphone invalide';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestionnaires d'événements
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Gestionnaire dédié aux champs de la fiche KYC
  const handleKycInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setKycData(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : (name === 'revenu_mensuel_estime' ? (value === '' ? null : Number(value)) : value)
    }));
  };

  // Gestionnaire pour SignaturePad — n'est appelé que lors d'une action réelle de
  // l'utilisateur (validation ou "refaire la signature"), jamais lors du simple
  // chargement d'une signature existante depuis le serveur.
  const handleSignatureChange = (dataUrl: string | null): void => {
    setKycSignature(dataUrl);
    setSignatureDirty(true);
  };

  // Ouvrir le modal d'ajout
  const openAddModal = (): void => {
    setEditingClient(null);
    setFormData(initialFormData);
    setFormErrors({});
    setKycData(initialKycData);
    setKycSignature(null);
    setSignatureDirty(false);
    setIsModalOpen(true);
  };

  // Ouvrir le modal de modification
  const openEditModal = async (client: Client): Promise<void> => {
    setEditingClient(client);
    setFormData({
      code_client: client.code_client || '',
      nom: client.nom,
      prenom: client.prenom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      date_naissance: client.date_naissance || '',
      type_piece: client.type_piece || '',
      numero_piece: client.numero_piece || '',
      statut: client.statut || 'ACTIF',
      is_casino_player: client.is_casino_player || false,
    });
    setFormErrors({});
    setKycData(initialKycData);
    setKycSignature(null);
    setSignatureDirty(false);
    setIsModalOpen(true);

    // La fiche KYC est désormais disponible pour tous les clients
    setIsLoadingKyc(true);
    try {
      const [kyc, signature] = await Promise.all([
        loadClientKyc(client.id),
        loadClientKycSignature(client.id),
      ]);
      if (kyc) {
        setKycData({
          lieu_naissance: kyc.lieu_naissance || '',
          nationalite: kyc.nationalite || '',
          profession: kyc.profession || '',
          date_delivrance_piece: kyc.date_delivrance_piece || '',
          date_expiration_piece: kyc.date_expiration_piece || '',
          autorite_delivrance: kyc.autorite_delivrance || '',
          source_revenus: kyc.source_revenus || '',
          revenu_mensuel_estime: kyc.revenu_mensuel_estime ?? null,
          mode_paiement: kyc.mode_paiement || '',
          banque: kyc.banque || '',
          doc_piece_identite: kyc.doc_piece_identite || false,
          doc_justificatif_domicile: kyc.doc_justificatif_domicile || false,
          doc_photo_client: kyc.doc_photo_client || false,
          doc_autre: kyc.doc_autre || '',
          niveau_risque: kyc.niveau_risque || null,
          commentaires_risque: kyc.commentaires_risque || '',
          declaration_client: kyc.declaration_client || false,
          date_verification: kyc.date_verification || '',
        });
      }
      setKycSignature(signature);
    } catch (err) {
      console.error('❌ Erreur chargement fiche KYC:', err);
    } finally {
      setIsLoadingKyc(false);
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsSubmitting(true);

    try {
      let client: Client;
      if (editingClient) {
        client = await updateClient(editingClient.id, formData);
        toast.success('Client mis à jour avec succès');
      } else {
        client = await createClient(formData);
        toast.success('Client créé avec succès');
      }

      // La fiche KYC est désormais enregistrée pour tous les clients
      try {
        await saveClientKyc(client.id, kycData);
        // On ne crée une nouvelle signature que si le client vient réellement
        // de signer dans ce formulaire — les signatures précédentes ne sont
        // jamais recréées ni écrasées.
        if (kycSignature && signatureDirty) {
          await createClientKycSignature(client.id, kycSignature);
          setSignatureDirty(false);
        }
      } catch (kycError) {
        console.error('❌ Erreur enregistrement fiche KYC:', kycError);
        toast.error('Client enregistré, mais la fiche KYC n\'a pas pu être sauvegardée');
      }

      closeModal();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(errorMessage);
      console.error('❌ Erreur:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (client: Client): void => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!clientToDelete) return;
    
    setIsProcessing(true);
    try {
      await deleteClient(clientToDelete.id);
      toast.success('Client supprimé avec succès');
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleView = async (client: Client): Promise<void> => {
    setSelectedClient(client);
    setViewedKyc(null);
    setViewedSignature(null);
    setIsViewModalOpen(true);

    try {
      const [details, signature] = await Promise.all([
        loadClientWithDetails(client.id),
        loadClientKycSignature(client.id),
      ]);
      setViewedKyc(details?.kyc || null);
      setViewedSignature(signature);
    } catch (err) {
      console.error('❌ Erreur chargement détails client:', err);
    }
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData(initialFormData);
    setFormErrors({});
    setKycData(initialKycData);
    setKycSignature(null);
    setSignatureDirty(false);
  };

  // Génération du QR Code
  const generateQRCode = (client: Client) => {
    const clientData = {
      id: client.id,
      name: `${client.prenom} ${client.nom}`,
      email: client.email,
      phone: client.telephone,
      code: client.code_client,
      status: client.statut,
    };

    const jsonString = JSON.stringify(clientData);
    setQrCodeData(jsonString);
    setSelectedClient(client);
    setIsQRModalOpen(true);

    setTimeout(() => {
      generateQRCodeImage(jsonString);
    }, 100);
  };

  const generateQRCodeImage = (data: string) => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const size = 200;
    const cellSize = 4;
    const margin = 20;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const qrMatrix = generateSimpleQRMatrix(data);
    
    const startX = (canvas.width - size) / 2;
    const startY = (canvas.height - size) / 2;

    for (let row = 0; row < qrMatrix.length; row++) {
      for (let col = 0; col < qrMatrix[row].length; col++) {
        if (qrMatrix[row][col] === 1) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(
            startX + col * cellSize + margin,
            startY + row * cellSize + margin,
            cellSize,
            cellSize
          );
        }
      }
    }

    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Client: ${selectedClient?.prenom} ${selectedClient?.nom}`, canvas.width / 2, canvas.height - 10);
  };

  const generateSimpleQRMatrix = (data: string): number[][] => {
    const matrix: number[][] = [];
    const size = 45;
    
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        const hash = data.split('').reduce((acc, char, index) => {
          return acc + char.charCodeAt(0) * (index + 1);
        }, 0);
        
        const val = (i * j + hash) % 3;
        matrix[i][j] = val === 0 ? 1 : 0;
      }
    }
    
    return matrix;
  };

  const copyQRData = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `client-${selectedClient?.id}-qrcode.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const printQRCode = () => {
    const canvas = qrCanvasRef.current;
    if (canvas) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>QR Code Client</title></head>
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#0a0a0a;">
              <div style="text-align:center;background:#141414;padding:40px;border-radius:12px;border:1px solid #2a2a2a;">
                <img src="${canvas.toDataURL('image/png')}" style="width:300px;height:300px;" />
                <h2 style="color:#ffffff;">${selectedClient?.prenom} ${selectedClient?.nom}</h2>
                <p style="color:#aaaaaa;">ID: ${selectedClient?.id}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const getStatusBadge = (status: string = 'ACTIF'): JSX.Element => {
    const statusMap: Record<string, { color: string; icon: JSX.Element; label: string }> = {
      ACTIF: { 
        color: 'bg-success-bg text-success border-success/30', 
        icon: <CheckCircle size={12} />,
        label: 'Actif'
      },
      INACTIF: { 
        color: 'bg-surface-2 text-muted border-base', 
        icon: <XCircle size={12} />,
        label: 'Inactif'
      },
      BLOCKED: { 
        color: 'bg-danger-bg text-danger border-danger/30', 
        icon: <XCircle size={12} />,
        label: 'Bloqué'
      }
    };
    
    const config = statusMap[status] || statusMap.ACTIF;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Statistiques
  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.statut === 'ACTIF').length,
    inactifs: clients.filter(c => c.statut === 'INACTIF').length,
    blocked: clients.filter(c => c.statut === 'BLOCKED').length,
    casino: clients.filter(c => c.is_casino_player).length,
  };

  // Affichage du chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size={40} className="animate-spin text-accent" />
        <span className="ml-3 text-muted">Chargement des clients...</span>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-lg p-6 text-danger text-center">
        <AlertCircle size={40} className="mx-auto mb-3" />
        <p className="text-lg font-medium">{error}</p>
        <button 
          onClick={() => loadClients()}
          className="mt-3 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent/90 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Gestion des Clients
          </h2>
          <p className="text-muted text-sm mt-1">Gérez les informations de vos clients</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => loadClients()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          
          {/* ✅ BOUTON D'AJOUT PRINCIPAL */}
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-black hover:bg-accent-2 transition-all font-medium shadow-lg shadow-accent/20"
          >
            <UserPlus size={18} />
            <span>Ajouter un client</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-surface border border-base rounded-xl p-4 text-center">
          <p className="text-muted text-xs mb-1">Total</p>
          <p className="text-primary font-bold text-xl">{stats.total}</p>
        </div>
        <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center">
          <p className="text-muted text-xs mb-1">Actifs</p>
          <p className="text-success font-bold text-xl">{stats.actifs}</p>
        </div>
        <div className="bg-muted/5 border border-muted/20 rounded-xl p-4 text-center">
          <p className="text-muted text-xs mb-1">Inactifs</p>
          <p className="text-muted font-bold text-xl">{stats.inactifs}</p>
        </div>
        <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 text-center">
          <p className="text-muted text-xs mb-1">Bloqués</p>
          <p className="text-danger font-bold text-xl">{stats.blocked}</p>
        </div>
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-center">
          <p className="text-muted text-xs mb-1">🎰 Casino</p>
          <p className="text-accent font-bold text-xl">{stats.casino}</p>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Rechercher un client par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-base rounded-xl text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-surface border border-base rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
            <option value="blocked">Bloqués</option>
          </select>
          
          {/* ✅ BOUTON D'AJOUT SECONDAIRE */}
          <button 
            onClick={openAddModal}
            className="px-4 py-2.5 bg-accent text-black rounded-xl transition flex items-center gap-2 hover:bg-accent-2 font-medium"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
          
          <button 
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('tous');
              loadClients();
            }}
            className="px-4 py-2.5 bg-surface border border-base rounded-xl text-muted hover:text-primary transition flex items-center gap-2"
          >
            <X size={18} />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau des clients */}
      <div className="bg-surface border border-base rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base bg-surface-2">
                <th className="text-left p-4 text-muted font-medium text-sm">Client</th>
                <th className="text-left p-4 text-muted font-medium text-sm hidden lg:table-cell">Contact</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Code</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Statut</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Users size={48} className="text-muted/30" />
                      <p className="text-muted">
                        {searchTerm || filterStatus !== 'tous' 
                          ? 'Aucun client ne correspond à vos critères'
                          : 'Aucun client trouvé'}
                      </p>
                      {!searchTerm && filterStatus === 'tous' && (
                        <button 
                          onClick={openAddModal}
                          className="px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-2 transition flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Ajouter votre premier client
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="border-b border-base hover:bg-surface-2 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-semibold text-sm flex-shrink-0">
                          {client.prenom?.[0] || ''}{client.nom?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-primary">
                            {client.prenom} {client.nom}
                          </p>
                          <p className="text-xs text-muted">
                            {client.email || 'Pas d\'email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        {client.telephone && (
                          <p className="text-sm flex items-center gap-1 text-secondary">
                            <Phone size={14} className="text-muted" />
                            {client.telephone}
                          </p>
                        )}
                        {client.adresse && (
                          <p className="text-sm flex items-center gap-1 text-secondary">
                            <MapPin size={14} className="text-muted" />
                            {client.adresse}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <p className="font-mono text-muted text-xs">
                          {client.code_client || `#${client.id}`}
                        </p>
                        {client.is_casino_player && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                            🎰 Casino
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(client.statut)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleView(client)}
                          className="p-1.5 hover:bg-accent-4 rounded-lg transition"
                          title="Voir les détails"
                        >
                          <Eye size={16} className="text-accent" />
                        </button>
                        <button 
                          onClick={() => generateQRCode(client)}
                          className="p-1.5 hover:bg-success-bg rounded-lg transition"
                          title="Générer QR Code"
                        >
                          <QrCode size={16} className="text-success" />
                        </button>
                        <button 
                          onClick={() => openEditModal(client)}
                          className="p-1.5 hover:bg-accent-4 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit size={16} className="text-accent" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(client)}
                          className="p-1.5 hover:bg-danger-bg rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-danger" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredClients.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-base bg-surface-2 gap-3">
            <p className="text-sm text-muted">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-surface border border-base rounded-lg hover:bg-surface-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-muted hover:text-primary text-sm"
              >
                Précédent
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg transition text-sm ${
                      currentPage === page
                        ? 'bg-accent text-black'
                        : 'bg-surface border border-base hover:bg-surface-2 text-muted hover:text-primary'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-surface border border-base rounded-lg hover:bg-surface-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-muted hover:text-primary text-sm"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajout/Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-base rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-base flex justify-between items-center sticky top-0 bg-surface z-10">
              <div>
                <h2 className="text-xl font-bold text-primary">
                  {editingClient ? (
                    <span className="flex items-center gap-2">
                      <Edit size={20} className="text-accent" />
                      Modifier le client
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus size={20} className="text-accent" />
                      Nouveau client
                    </span>
                  )}
                </h2>
                <p className="text-muted text-sm mt-1">
                  {editingClient ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-surface-2 rounded-lg transition text-muted"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                    disabled={isSubmitting}
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Nom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-surface-2 border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition ${
                      formErrors.nom ? 'border-danger' : 'border-base'
                    }`}
                    disabled={isSubmitting}
                    placeholder="Dupont"
                  />
                  {formErrors.nom && (
                    <p className="text-danger text-xs mt-1">{formErrors.nom}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-surface-2 border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition ${
                      formErrors.email ? 'border-danger' : 'border-base'
                    }`}
                    disabled={isSubmitting}
                    placeholder="jean.dupont@email.com"
                  />
                  {formErrors.email && (
                    <p className="text-danger text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 bg-surface-2 border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition ${
                      formErrors.telephone ? 'border-danger' : 'border-base'
                    }`}
                    disabled={isSubmitting}
                    placeholder="+33 6 12 34 56 78"
                  />
                  {formErrors.telephone && (
                    <p className="text-danger text-xs mt-1">{formErrors.telephone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  disabled={isSubmitting}
                  placeholder="12 Rue de la Paix, Paris"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Date de naissance</label>
                  <input
                    type="date"
                    name="date_naissance"
                    value={formData.date_naissance || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Code client</label>
                  <input
                    type="text"
                    name="code_client"
                    value={formData.code_client || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition font-mono text-sm"
                    disabled={isSubmitting}
                    placeholder="Auto-généré si vide"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Type de pièce</label>
                  <select
                    name="type_piece"
                    value={formData.type_piece || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner</option>
                    <option value="CNI">CNI</option>
                    <option value="PASSEPORT">Passeport</option>
                    <option value="PERMIS">Permis de conduire</option>
                    <option value="CARTE_SEJOUR">Carte de séjour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Numéro de pièce</label>
                  <input
                    type="text"
                    name="numero_piece"
                    value={formData.numero_piece || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition font-mono text-sm"
                    disabled={isSubmitting}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Statut</label>
                  <select
                    name="statut"
                    value={formData.statut || 'ACTIF'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                    disabled={isSubmitting}
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                    <option value="BLOCKED">Bloqué</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_casino_player"
                      checked={formData.is_casino_player || false}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-base text-accent focus:ring-accent"
                      disabled={isSubmitting}
                    />
                    <span>🎰 Joueur de casino</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4 border-t border-base pt-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-accent" />
                  <h3 className="text-sm font-semibold text-primary">Fiche KYC — Conformité LBC/FT</h3>
                  {isLoadingKyc && <Loader size={14} className="animate-spin text-muted" />}
                </div>

                  {/* 1. Informations personnelles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Lieu de naissance</label>
                      <input
                        type="text"
                        name="lieu_naissance"
                        value={kycData.lieu_naissance || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                        placeholder="Antananarivo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Nationalité</label>
                      <input
                        type="text"
                        name="nationalite"
                        value={kycData.nationalite || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                        placeholder="Malgache"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Profession</label>
                    <input
                      type="text"
                      name="profession"
                      value={kycData.profession || ''}
                      onChange={handleKycInputChange}
                      className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                      disabled={isSubmitting}
                      placeholder="Entrepreneur"
                    />
                  </div>

                  {/* 2. Vérification d'identité (complète type_piece / numero_piece ci-dessus) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Date de délivrance</label>
                      <input
                        type="date"
                        name="date_delivrance_piece"
                        value={kycData.date_delivrance_piece || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Date d'expiration</label>
                      <input
                        type="date"
                        name="date_expiration_piece"
                        value={kycData.date_expiration_piece || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Autorité de délivrance</label>
                      <input
                        type="text"
                        name="autorite_delivrance"
                        value={kycData.autorite_delivrance || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                        placeholder="Ministère de l'Intérieur"
                      />
                    </div>
                  </div>

                  {/* 3. Informations financières */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Source principale des revenus</label>
                      <input
                        type="text"
                        name="source_revenus"
                        value={kycData.source_revenus || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                        placeholder="Salaire, activité commerciale..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Revenu mensuel estimé</label>
                      <input
                        type="number"
                        name="revenu_mensuel_estime"
                        value={kycData.revenu_mensuel_estime ?? ''}
                        onChange={handleKycInputChange}
                        min={0}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                        placeholder="Ex: 2000000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Mode de paiement utilisé</label>
                      <input
                        type="text"
                        name="mode_paiement"
                        value={kycData.mode_paiement || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                        placeholder="Espèces, carte, virement..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Banque / Institution financière</label>
                      <input
                        type="text"
                        name="banque"
                        value={kycData.banque || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* 4. Documents justificatifs */}
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-2">Documents justificatifs</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                      <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          name="doc_piece_identite"
                          checked={kycData.doc_piece_identite}
                          onChange={handleKycInputChange}
                          className="w-4 h-4 rounded border-base text-accent focus:ring-accent"
                          disabled={isSubmitting}
                        />
                        <span>Copie pièce d'identité</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          name="doc_justificatif_domicile"
                          checked={kycData.doc_justificatif_domicile}
                          onChange={handleKycInputChange}
                          className="w-4 h-4 rounded border-base text-accent focus:ring-accent"
                          disabled={isSubmitting}
                        />
                        <span>Justificatif de domicile</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          name="doc_photo_client"
                          checked={kycData.doc_photo_client}
                          onChange={handleKycInputChange}
                          className="w-4 h-4 rounded border-base text-accent focus:ring-accent"
                          disabled={isSubmitting}
                        />
                        <span>Photo du client</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      name="doc_autre"
                      value={kycData.doc_autre || ''}
                      onChange={handleKycInputChange}
                      className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition text-sm"
                      disabled={isSubmitting}
                      placeholder="Autre document (préciser)"
                    />
                  </div>

                  {/* 5. Évaluation du risque */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Niveau de risque</label>
                      <select
                        name="niveau_risque"
                        value={kycData.niveau_risque || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                      >
                        <option value="">Sélectionner</option>
                        <option value="FAIBLE">Faible</option>
                        <option value="MOYEN">Moyen</option>
                        <option value="ELEVE">Élevé</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">Date de vérification</label>
                      <input
                        type="date"
                        name="date_verification"
                        value={kycData.date_verification || ''}
                        onChange={handleKycInputChange}
                        className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Commentaires sur l'évaluation du risque</label>
                    <textarea
                      name="commentaires_risque"
                      value={kycData.commentaires_risque || ''}
                      onChange={handleKycInputChange}
                      rows={2}
                      className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* 6. Déclaration du client */}
                  <label className="flex items-start gap-2 text-sm text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      name="declaration_client"
                      checked={kycData.declaration_client}
                      onChange={handleKycInputChange}
                      className="w-4 h-4 mt-0.5 rounded border-base text-accent focus:ring-accent"
                      disabled={isSubmitting}
                    />
                    <span>Le client certifie que les informations fournies sont exactes et complètes.</span>
                  </label>

                  {/* Signature électronique du client */}
                  <SignaturePad
                    value={kycSignature}
                    onChange={handleSignatureChange}
                    disabled={isSubmitting}
                    label="Signature électronique du client"
                  />
                </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-base">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-surface-2 border border-base rounded-lg hover:bg-surface-3 transition text-muted hover:text-primary"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent text-black rounded-lg transition hover:bg-accent-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {editingClient ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    <>
                      {editingClient ? 'Modifier' : 'Ajouter'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualisation */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-base rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-base flex justify-between items-center sticky top-0 bg-surface z-10">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <Eye size={20} className="text-accent" />
                  Détails du client
                </h2>
                <p className="text-muted text-sm mt-1">
                  {selectedClient.prenom} {selectedClient.nom}
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-surface-2 rounded-lg transition text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-black text-2xl font-semibold">
                  {selectedClient.prenom?.[0] || ''}{selectedClient.nom?.[0] || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedClient.prenom} {selectedClient.nom}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getStatusBadge(selectedClient.statut)}
                    {selectedClient.is_casino_player && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                        🎰 Casino
                      </span>
                    )}
                    <span className="text-sm text-muted">• Code: {selectedClient.code_client || `#${selectedClient.id}`}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted border-b border-base pb-2">Contact</h4>
                  <div className="space-y-2 text-sm">
                    {selectedClient.email && (
                      <p className="flex items-center gap-2 text-secondary">
                        <Mail size={16} className="text-muted" />
                        {selectedClient.email}
                      </p>
                    )}
                    {selectedClient.telephone && (
                      <p className="flex items-center gap-2 text-secondary">
                        <Phone size={16} className="text-muted" />
                        {selectedClient.telephone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted border-b border-base pb-2">Adresse</h4>
                  <div className="space-y-2 text-sm">
                    {selectedClient.adresse && (
                      <p className="flex items-center gap-2 text-secondary">
                        <MapPin size={16} className="text-muted" />
                        {selectedClient.adresse}
                      </p>
                    )}
                    {selectedClient.date_naissance && (
                      <p className="flex items-center gap-2 text-secondary">
                        <Calendar size={16} className="text-muted" />
                        Né(e) le {new Date(selectedClient.date_naissance).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted border-b border-base pb-2">Pièce d'identité</h4>
                  <div className="space-y-2 text-sm">
                    {selectedClient.type_piece && (
                      <p className="flex items-center gap-2 text-secondary">
                        <CreditCard size={16} className="text-muted" />
                        {selectedClient.type_piece}
                      </p>
                    )}
                    {selectedClient.numero_piece && (
                      <p className="flex items-center gap-2 text-secondary font-mono text-xs">
                        <Hash size={16} className="text-muted" />
                        {selectedClient.numero_piece}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted border-b border-base pb-2">Informations</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-secondary">
                      <User size={16} className="text-muted" />
                      ID: {selectedClient.id}
                    </p>
                    {selectedClient.created_at && (
                      <p className="flex items-center gap-2 text-secondary">
                        <Calendar size={16} className="text-muted" />
                        Créé le {new Date(selectedClient.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted border-b border-base pb-2 flex items-center gap-2">
                  <Shield size={16} />
                  Fiche KYC — Conformité LBC/FT
                </h4>
                {!viewedKyc ? (
                  <p className="text-sm text-muted italic">Aucune fiche KYC renseignée pour ce client.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      {viewedKyc.nationalite && (
                        <p className="flex items-center gap-2 text-secondary">
                          <User size={16} className="text-muted" />
                          Nationalité : {viewedKyc.nationalite}
                        </p>
                      )}
                      {viewedKyc.profession && (
                        <p className="flex items-center gap-2 text-secondary">
                          <Briefcase size={16} className="text-muted" />
                          {viewedKyc.profession}
                        </p>
                      )}
                      {viewedKyc.banque && (
                        <p className="flex items-center gap-2 text-secondary">
                          <Landmark size={16} className="text-muted" />
                          {viewedKyc.banque}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {viewedKyc.niveau_risque && (
                        <p className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-muted" />
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            viewedKyc.niveau_risque === 'ELEVE' ? 'bg-danger/20 text-danger' :
                            viewedKyc.niveau_risque === 'MOYEN' ? 'bg-warning/20 text-warning' :
                            'bg-success-bg text-success'
                          }`}>
                            Risque {viewedKyc.niveau_risque === 'FAIBLE' ? 'faible' : viewedKyc.niveau_risque === 'MOYEN' ? 'moyen' : 'élevé'}
                          </span>
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-secondary">
                        <FileCheck size={16} className="text-muted" />
                        {[
                          viewedKyc.doc_piece_identite && "Pièce d'identité",
                          viewedKyc.doc_justificatif_domicile && 'Justif. domicile',
                          viewedKyc.doc_photo_client && 'Photo',
                        ].filter(Boolean).join(', ') || 'Aucun document renseigné'}
                      </p>
                      {viewedKyc.date_verification && (
                        <p className="flex items-center gap-2 text-secondary">
                          <Calendar size={16} className="text-muted" />
                          Vérifié le {new Date(viewedKyc.date_verification).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {viewedSignature && (
                  <div>
                    <p className="text-xs text-muted mb-1">Signature du client</p>
                    <div className="border border-base rounded-lg bg-white p-2 flex items-center justify-center" style={{ height: 120 }}>
                      <img src={viewedSignature} alt="Signature du client" className="max-h-full" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-base flex-wrap">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    generateQRCode(selectedClient);
                  }}
                  className="px-4 py-2 bg-success-bg hover:bg-success/20 rounded-lg transition flex items-center gap-2 border border-success/30 text-success"
                >
                  <QrCode size={16} />
                  QR Code
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-surface-2 border border-base rounded-lg hover:bg-surface-3 transition text-muted hover:text-primary"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedClient);
                  }}
                  className="px-4 py-2 bg-accent text-black rounded-lg transition hover:bg-accent-2 flex items-center gap-2"
                >
                  <Edit size={16} />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {isQRModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-base rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-base flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <QrCode size={20} className="text-success" />
                  QR Code Client
                </h2>
                <p className="text-muted text-sm mt-1">
                  {selectedClient.prenom} {selectedClient.nom}
                </p>
              </div>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="p-2 hover:bg-surface-2 rounded-lg transition text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-lg p-4 mb-4 border border-base">
                  <canvas
                    ref={qrCanvasRef}
                    width={250}
                    height={250}
                    className="w-64 h-64"
                  />
                </div>

                <div className="w-full space-y-2 mb-4">
                  <div className="bg-surface-2 rounded-lg p-3 border border-base">
                    <p className="text-xs text-muted">ID</p>
                    <p className="font-mono text-sm text-primary">#{selectedClient.id}</p>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-3 border border-base">
                    <p className="text-xs text-muted">Nom complet</p>
                    <p className="font-medium text-primary">{selectedClient.prenom} {selectedClient.nom}</p>
                  </div>
                  {selectedClient.email && (
                    <div className="bg-surface-2 rounded-lg p-3 border border-base">
                      <p className="text-xs text-muted">Email</p>
                      <p className="text-sm text-secondary">{selectedClient.email}</p>
                    </div>
                  )}
                  {selectedClient.telephone && (
                    <div className="bg-surface-2 rounded-lg p-3 border border-base">
                      <p className="text-xs text-muted">Téléphone</p>
                      <p className="text-sm text-secondary">{selectedClient.telephone}</p>
                    </div>
                  )}
                  {selectedClient.code_client && (
                    <div className="bg-surface-2 rounded-lg p-3 border border-base">
                      <p className="text-xs text-muted">Code client</p>
                      <p className="font-mono text-sm text-primary">{selectedClient.code_client}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-2 w-full">
                  <button
                    onClick={copyQRData}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent text-sm"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent text-sm"
                  >
                    <Download size={16} />
                    Télécharger
                  </button>
                  <button
                    onClick={printQRCode}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent text-sm"
                  >
                    <Printer size={16} />
                    Imprimer
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-base text-center bg-surface-2 rounded-b-2xl">
              <p className="text-xs text-muted">
                Scannez ce QR Code pour accéder aux informations du client
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-base rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-danger" />
              </div>
              
              <h3 className="text-xl font-bold text-primary mb-2">
                Confirmer la suppression
              </h3>
              
              <p className="text-muted text-sm mb-2">
                Êtes-vous sûr de vouloir supprimer le client <br />
                <strong className="text-primary">{clientToDelete.prenom} {clientToDelete.nom}</strong> ?
              </p>
              <p className="text-danger/80 text-xs">
                ⚠️ Cette action est irréversible
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setClientToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-base text-primary font-medium text-sm hover:bg-surface-2 transition-all duration-300"
                  disabled={isProcessing}
                >
                  Annuler
                </button>
                
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-danger text-white font-medium text-sm hover:bg-danger/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ BOUTON FLOATING D'AJOUT (FAB) */}
      <button
        onClick={openAddModal}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent text-black shadow-2xl hover:bg-accent-2 transition-all hover:scale-105 flex items-center justify-center lg:hidden"
        title="Ajouter un client"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default ClientsPage;
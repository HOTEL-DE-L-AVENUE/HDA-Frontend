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
  Users
} from 'lucide-react';

// Types
interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'actif' | 'inactif' | 'en_attente';
  notes: string;
  createdAt: string;
  totalVisits: number;
  totalSpent: number;
}

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  status: 'actif' | 'inactif' | 'en_attente';
  notes: string;
}

interface StatusConfig {
  color: string;
  icon: JSX.Element;
  label: string;
}

const ClientsPage: React.FC = () => {
  // States
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const itemsPerPage: number = 5;

  // Formulaire
  const initialFormData: ClientFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    status: 'actif',
    notes: ''
  };
  
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);

  // Données mockées
  const mockClients: Client[] = [
    {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.com',
      phone: '+33 6 12 34 56 78',
      address: '12 Rue de la Paix',
      city: 'Paris',
      country: 'France',
      status: 'actif',
      notes: 'Client VIP, préfère les suites',
      createdAt: '2024-01-15',
      totalVisits: 12,
      totalSpent: 2480
    },
    {
      id: 2,
      firstName: 'Marie',
      lastName: 'Lambert',
      email: 'marie.lambert@email.com',
      phone: '+33 6 98 76 54 32',
      address: '45 Avenue des Champs',
      city: 'Lyon',
      country: 'France',
      status: 'actif',
      notes: 'Fidèle client du restaurant',
      createdAt: '2024-02-20',
      totalVisits: 8,
      totalSpent: 1560
    },
    {
      id: 3,
      firstName: 'Thomas',
      lastName: 'Bernard',
      email: 'thomas.bernard@email.com',
      phone: '+33 7 45 67 89 01',
      address: '78 Boulevard Haussmann',
      city: 'Marseille',
      country: 'France',
      status: 'inactif',
      notes: "N'a pas visité depuis 6 mois",
      createdAt: '2023-08-10',
      totalVisits: 3,
      totalSpent: 420
    }
  ];

  useEffect(() => {
    setClients(mockClients);
  }, []);

  // Génération du QR Code
  const generateQRCode = (client: Client) => {
    const clientData = {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phone: client.phone,
      address: `${client.address}, ${client.city}, ${client.country}`,
      status: client.status,
      createdAt: client.createdAt
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
    ctx.fillText('Client ID: ' + selectedClient?.id, canvas.width / 2, canvas.height - 10);
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
                <h2 style="color:#ffffff;">Client: ${selectedClient?.firstName} ${selectedClient?.lastName}</h2>
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

  const getFilteredClients = (): Client[] => {
    let filtered = clients;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.firstName.toLowerCase().includes(term) ||
        client.lastName.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.city.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(client => client.status === filterStatus);
    }
    
    return filtered;
  };

  const filteredClients: Client[] = getFilteredClients();
  const totalPages: number = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex: number = (currentPage - 1) * itemsPerPage;
  const paginatedClients: Client[] = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (editingClient) {
      setClients(clients.map(client =>
        client.id === editingClient.id
          ? { ...client, ...formData }
          : client
      ));
    } else {
      const newClient: Client = {
        id: Math.max(...clients.map(c => c.id), 0) + 1,
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        totalVisits: 0,
        totalSpent: 0
      };
      setClients([...clients, newClient]);
    }
    
    closeModal();
  };

  const handleEdit = (client: Client): void => {
    setEditingClient(client);
    setFormData(client);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number): void => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  const handleView = (client: Client): void => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData(initialFormData);
  };

  const getStatusBadge = (status: Client['status']): JSX.Element => {
    const statusConfig: Record<Client['status'], StatusConfig> = {
      actif: { 
        color: 'bg-success-bg text-success border-success/30', 
        icon: <CheckCircle size={12} />,
        label: 'Actif'
      },
      inactif: { 
        color: 'bg-surface-2 text-muted border-base', 
        icon: <XCircle size={12} />,
        label: 'Inactif'
      },
      en_attente: { 
        color: 'bg-warning-bg text-warning border-warning/30', 
        icon: <Clock size={12} />,
        label: 'En attente'
      }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const stats = {
    total: clients.length,
    actifs: clients.filter(c => c.status === 'actif').length,
    totalVisits: clients.reduce((sum, c) => sum + c.totalVisits, 0),
    totalSpent: clients.reduce((sum, c) => sum + c.totalSpent, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-primary text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            Gestion des Clients
          </h2>
          <p className="text-muted text-sm mt-1">Gérez les informations de vos clients</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-2 border border-base text-muted hover:text-primary text-sm transition-all">
            <Download size={16} />
            <span className="hidden md:inline">Exporter</span>
          </button>
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Users size={24} className="text-black" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-base rounded-2xl p-5">
          <p className="text-muted text-xs mb-1">Total Clients</p>
          <p className="text-primary font-bold text-xl">{stats.total}</p>
        </div>
        <div className="bg-surface border border-base rounded-2xl p-5">
          <p className="text-muted text-xs mb-1">Clients Actifs</p>
          <p className="text-success font-bold text-xl">{stats.actifs}</p>
        </div>
        <div className="bg-surface border border-base rounded-2xl p-5">
          <p className="text-muted text-xs mb-1">Visites Total</p>
          <p className="text-primary font-bold text-xl">{stats.totalVisits}</p>
        </div>
        <div className="bg-surface border border-base rounded-2xl p-5">
          <p className="text-muted text-xs mb-1">Revenus Total</p>
          <p className="text-accent font-bold text-xl">{stats.totalSpent.toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-base rounded-xl text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
          />
        </div>
        <div className="flex gap-2">
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
            <option value="en_attente">En attente</option>
          </select>
          <button className="px-4 py-2.5 bg-surface border border-base rounded-xl text-muted hover:text-primary transition flex items-center gap-2">
            <Filter size={18} />
            Filtres
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-accent text-black rounded-xl transition flex items-center gap-2 hover:bg-accent-2"
          >
            <UserPlus size={18} />
            Nouveau Client
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-surface border border-base rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base bg-surface-2">
                <th className="text-left p-4 text-muted font-medium text-sm">Client</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Contact</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Localisation</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Statut</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Visites</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Dépensé</th>
                <th className="text-left p-4 text-muted font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr key={client.id} className="border-b border-base hover:bg-surface-2 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-semibold text-sm">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{client.firstName} {client.lastName}</p>
                          <p className="text-sm text-muted">Depuis {client.createdAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm flex items-center gap-1 text-secondary">
                          <Mail size={14} className="text-muted" />
                          {client.email}
                        </p>
                        <p className="text-sm flex items-center gap-1 text-secondary">
                          <Phone size={14} className="text-muted" />
                          {client.phone}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-1 text-secondary">
                          <MapPin size={14} className="text-muted" />
                          {client.address}
                        </p>
                        <p className="text-muted">{client.city}, {client.country}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(client.status)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-lg font-semibold text-primary">{client.totalVisits}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-accent">
                        {client.totalSpent.toLocaleString('fr-FR')} €
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
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
                          onClick={() => handleEdit(client)}
                          className="p-1.5 hover:bg-accent-4 rounded-lg transition"
                          title="Modifier"
                        >
                          <Edit size={16} className="text-accent" />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
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
        {filteredClients.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-base bg-surface-2">
            <p className="text-sm text-muted">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-surface border border-base rounded-lg hover:bg-surface-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-muted hover:text-primary"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg transition ${
                    currentPage === page
                      ? 'bg-accent text-black'
                      : 'bg-surface border border-base hover:bg-surface-2 text-muted hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-surface border border-base rounded-lg hover:bg-surface-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-muted hover:text-primary"
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
            <div className="p-6 border-b border-base flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-primary">
                  {editingClient ? 'Modifier le client' : 'Nouveau client'}
                </h2>
                <p className="text-muted text-sm mt-1">
                  {editingClient ? 'Modifiez les informations' : 'Ajoutez un nouveau client'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-surface-2 rounded-lg transition text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Prénom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Nom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">
                    Téléphone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Adresse</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Pays</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="en_attente">En attente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-2 border border-base rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="Informations supplémentaires..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-base">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-surface-2 border border-base rounded-lg hover:bg-surface-3 transition text-muted hover:text-primary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-accent text-black rounded-lg transition hover:bg-accent-2 flex items-center gap-2"
                >
                  {editingClient ? 'Modifier' : 'Ajouter'}
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
            <div className="p-6 border-b border-base flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-primary">Détails du client</h2>
                <p className="text-muted text-sm mt-1">
                  {selectedClient.firstName} {selectedClient.lastName}
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
                  {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedClient.firstName} {selectedClient.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedClient.status)}
                    <span className="text-sm text-muted">• Depuis {selectedClient.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted">Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-secondary">
                      <Mail size={16} className="text-muted" />
                      {selectedClient.email}
                    </p>
                    <p className="flex items-center gap-2 text-secondary">
                      <Phone size={16} className="text-muted" />
                      {selectedClient.phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted">Adresse</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-secondary">
                      <MapPin size={16} className="text-muted" />
                      {selectedClient.address}
                    </p>
                    <p className="text-muted">{selectedClient.city}, {selectedClient.country}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-2 rounded-lg p-4 text-center border border-base">
                  <p className="text-sm text-muted">Visites</p>
                  <p className="text-2xl font-bold text-primary">{selectedClient.totalVisits}</p>
                </div>
                <div className="bg-surface-2 rounded-lg p-4 text-center border border-base">
                  <p className="text-sm text-muted">Dépensé</p>
                  <p className="text-2xl font-bold text-accent">{selectedClient.totalSpent.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-surface-2 rounded-lg p-4 text-center border border-base">
                  <p className="text-sm text-muted">Depuis le</p>
                  <p className="text-2xl font-bold text-accent">{selectedClient.createdAt}</p>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted mb-2">Notes</h4>
                  <p className="text-sm bg-surface-2 rounded-lg p-4 border border-base text-secondary">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-base">
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
                    handleEdit(selectedClient);
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
                  {selectedClient.firstName} {selectedClient.lastName}
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
                    <p className="text-sm text-muted">Client ID</p>
                    <p className="font-mono text-sm text-primary">#{selectedClient.id}</p>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-3 border border-base">
                    <p className="text-sm text-muted">Nom complet</p>
                    <p className="font-medium text-primary">{selectedClient.firstName} {selectedClient.lastName}</p>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-3 border border-base">
                    <p className="text-sm text-muted">Email</p>
                    <p className="text-sm text-secondary">{selectedClient.email}</p>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-3 border border-base">
                    <p className="text-sm text-muted">Téléphone</p>
                    <p className="text-sm text-secondary">{selectedClient.phone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 w-full">
                  <button
                    onClick={copyQRData}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent"
                  >
                    <Download size={16} />
                    Télécharger
                  </button>
                  <button
                    onClick={printQRCode}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent"
                  >
                    <Printer size={16} />
                    Imprimer
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `QR Code - ${selectedClient.firstName} ${selectedClient.lastName}`,
                          text: qrCodeData,
                        });
                      }
                    }}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-accent-4 hover:bg-accent/20 rounded-lg transition flex items-center justify-center gap-2 border border-accent/30 text-accent"
                  >
                    <Share2 size={16} />
                    Partager
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
    </div>
  );
};

export default ClientsPage;
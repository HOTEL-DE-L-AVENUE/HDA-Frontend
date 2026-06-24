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
  Printer
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
            <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f8fafc;">
              <div style="text-align:center;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <img src="${canvas.toDataURL('image/png')}" style="width:300px;height:300px;" />
                <h2 style="color:#0f172a;">Client: ${selectedClient?.firstName} ${selectedClient?.lastName}</h2>
                <p style="color:#64748b;">ID: ${selectedClient?.id}</p>
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
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
        icon: <CheckCircle size={12} />,
        label: 'Actif'
      },
      inactif: { 
        color: 'bg-gray-100 text-gray-700 border-gray-200', 
        icon: <XCircle size={12} />,
        label: 'Inactif'
      },
      en_attente: { 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestion des Clients
            </h1>
            <p className="text-gray-500 mt-1">Gérez les informations de vos clients</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white hover:bg-gray-50 rounded-lg transition flex items-center gap-2 border border-gray-200 shadow-sm">
              <Download size={18} />
              Exporter
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition flex items-center gap-2 shadow-lg shadow-purple-500/30"
            >
              <UserPlus size={18} />
              Nouveau Client
            </button>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition shadow-sm"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
              <option value="en_attente">En attente</option>
            </select>
            <button className="px-4 py-2.5 bg-white hover:bg-gray-50 rounded-lg transition flex items-center gap-2 border border-gray-200 shadow-sm">
              <Filter size={18} />
              Filtres
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Total Clients</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Clients Actifs</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.actifs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Visites Total</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalVisits}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Revenus Total</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.totalSpent.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Client</th>
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Contact</th>
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Localisation</th>
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Statut</th>
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Visites</th>
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Dépensé</th>
                  <th className="text-left p-4 text-gray-600 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                            <p className="text-sm text-gray-500">Depuis {client.createdAt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1 text-gray-700">
                            <Mail size={14} className="text-gray-400" />
                            {client.email}
                          </p>
                          <p className="text-sm flex items-center gap-1 text-gray-700">
                            <Phone size={14} className="text-gray-400" />
                            {client.phone}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center gap-1 text-gray-700">
                            <MapPin size={14} className="text-gray-400" />
                            {client.address}
                          </p>
                          <p className="text-gray-500">{client.city}, {client.country}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-semibold text-gray-900">{client.totalVisits}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-yellow-600">
                          {client.totalSpent.toLocaleString('fr-FR')} €
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleView(client)}
                            className="p-1.5 hover:bg-purple-100 rounded-lg transition"
                            title="Voir les détails"
                          >
                            <Eye size={16} className="text-purple-600" />
                          </button>
                          <button 
                            onClick={() => generateQRCode(client)}
                            className="p-1.5 hover:bg-emerald-100 rounded-lg transition"
                            title="Générer QR Code"
                          >
                            <QrCode size={16} className="text-emerald-600" />
                          </button>
                          <button 
                            onClick={() => handleEdit(client)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit size={16} className="text-blue-600" />
                          </button>
                          <button 
                            onClick={() => handleDelete(client.id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 size={16} className="text-red-600" />
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredClients.length)} sur {filteredClients.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded transition ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout/Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingClient ? 'Modifier le client' : 'Nouveau client'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {editingClient ? 'Modifiez les informations' : 'Ajoutez un nouveau client'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="en_attente">En attente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder="Informations supplémentaires..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Détails du client</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedClient.firstName} {selectedClient.lastName}
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedClient.status)}
                    <span className="text-sm text-gray-500">• Depuis {selectedClient.createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-gray-700">
                      <Mail size={16} className="text-gray-400" />
                      {selectedClient.email}
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                      <Phone size={16} className="text-gray-400" />
                      {selectedClient.phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500">Adresse</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-gray-700">
                      <MapPin size={16} className="text-gray-400" />
                      {selectedClient.address}
                    </p>
                    <p className="text-gray-500">{selectedClient.city}, {selectedClient.country}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                  <p className="text-sm text-gray-500">Visites</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedClient.totalVisits}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                  <p className="text-sm text-gray-500">Dépensé</p>
                  <p className="text-2xl font-bold text-yellow-600">{selectedClient.totalSpent.toLocaleString('fr-FR')} €</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                  <p className="text-sm text-gray-500">Depuis le</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedClient.createdAt}</p>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-sm bg-gray-50 rounded-lg p-4 border border-gray-200 text-gray-700">{selectedClient.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    generateQRCode(selectedClient);
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center gap-2 border border-emerald-200 text-emerald-700"
                >
                  <QrCode size={16} className="text-emerald-600" />
                  QR Code
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-gray-700"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedClient);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <QrCode size={20} className="text-emerald-600" />
                  QR Code Client
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedClient.firstName} {selectedClient.lastName}
                </p>
              </div>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <canvas
                    ref={qrCanvasRef}
                    width={250}
                    height={250}
                    className="w-64 h-64"
                  />
                </div>

                <div className="w-full space-y-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-500">Client ID</p>
                    <p className="font-mono text-sm text-gray-900">#{selectedClient.id}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium text-gray-900">{selectedClient.firstName} {selectedClient.lastName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm text-gray-700">{selectedClient.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="text-sm text-gray-700">{selectedClient.phone}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 w-full">
                  <button
                    onClick={copyQRData}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center justify-center gap-2 border border-blue-200 text-blue-700"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-blue-600" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </button>
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition flex items-center justify-center gap-2 border border-purple-200 text-purple-700"
                  >
                    <Download size={16} className="text-purple-600" />
                    Télécharger
                  </button>
                  <button
                    onClick={printQRCode}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition flex items-center justify-center gap-2 border border-emerald-200 text-emerald-700"
                  >
                    <Printer size={16} className="text-emerald-600" />
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
                    className="flex-1 min-w-[100px] px-4 py-2 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition flex items-center justify-center gap-2 border border-yellow-200 text-yellow-700"
                  >
                    <Share2 size={16} className="text-yellow-600" />
                    Partager
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 text-center bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-500">
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
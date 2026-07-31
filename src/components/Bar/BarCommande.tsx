import React, { useEffect, useState } from 'react';
import type { BarCommande, BarTable, BarProduct } from '../../types/bar.type';
import { formatCurrency } from '../../utils/data';
import barService from '../../services/bar.service';
import { BAR_COMMANDES_ACTIONS } from '../../data/Bar.data';
import { Badge, Button, Input, Modal, Select } from '../UI';
import { Plus, Printer, XCircle } from 'lucide-react';
import { clientService, type Client } from '../../services/client.service';

interface Props {
  commandes: BarCommande[];
  onCreateCommande?: (commande: { client: string; table: number; items: BarCommande['items'] }) => Promise<void> | void;
  onDeleteCommande?: (id: number) => Promise<void> | void;
  cocktails?: BarProduct[];
  stockMap?: Record<number, { quantite: number; unite: string }>;
}

const statusClasses: Record<BarCommande['statut'], { label: string; variant: string }> = {
  'En attente': { label: 'En attente', variant: 'warning' },
  'En préparation': { label: 'En préparation', variant: 'info' },
  Servie: { label: 'Servie', variant: 'success' },
};

export const BarCommandeView: React.FC<Props> = ({ commandes, onCreateCommande, onDeleteCommande, cocktails = [], stockMap = {} }) => {
  const [client, setClient] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientNom, setNewClientNom] = useState('');
  const [newClientPrenom, setNewClientPrenom] = useState('');
  const [newClientTelephone, setNewClientTelephone] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [table, setTable] = useState('');
  const [tables, setTables] = useState<BarTable[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<BarCommande['items']>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandeSearchTerm, setCommandeSearchTerm] = useState('');
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [detailCommande, setDetailCommande] = useState<BarCommande | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadTables = async () => {
    try {
      const data = await barService.getBarTables();
      const tables = Array.isArray(data) ? data : (data as { data?: BarTable[] }).data ?? [];
      setTables(tables);
    } catch (error) {
      console.error('Erreur chargement tables bar:', error);
    }
  };

  useEffect(() => {
    void loadTables();
  }, []);

  const resetModal = () => {
    setClient('');
    setTable('');
    setSelectedItems([]);
    setSearchTerm('');
    setIsCreatingTable(false);
    setNewTableNumber('');
    setIsCreatingClient(false);
    setNewClientNom('');
    setNewClientPrenom('');
    setNewClientTelephone('');
    setFeedback(null);
    setIsModalOpen(false);
  };

  const handleOpenModal = () => {
    setClient('');
    setTable('');
    setSelectedItems([]);
    setSearchTerm('');
    setFeedback(null);
    setIsCreatingTable(tables.length === 0);
    setNewTableNumber('');
    setIsCreatingClient(false);
    setNewClientNom('');
    setNewClientPrenom('');
    setNewClientTelephone('');
    setIsModalOpen(true);
    void loadClients();
  };

  const handleCloseModal = () => {
    resetModal();
  };

  const handleAddItem = (cocktail: BarProduct) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.nom === cocktail.nom);
      if (existing) {
        return prev.map((item) =>
          item.nom === cocktail.nom ? { ...item, quantite: item.quantite + 1, prix: cocktail.prix } : item
        );
      }
      return [...prev, { product_id: cocktail.id, nom: cocktail.nom, quantite: 1, prix: cocktail.prix }];
    });
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    setSelectedItems((prev) =>
      prev.flatMap((item, itemIndex) => {
        if (itemIndex !== index) return [item];
        const nextQuantity = item.quantite + delta;
        return nextQuantity > 0 ? [{ ...item, quantite: nextQuantity }] : [];
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleCreateTable = async (event?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();

    const numero = newTableNumber.trim();

    if (!numero) {
      setFeedback({ type: 'error', message: 'Renseignez un nom de table.' });
      return;
    }

    try {
      const createdTable = await barService.createBarTable({ numero, capacite: 0 });
      const tableName = createdTable?.numero || numero;
      setTables((prev) => [...prev, createdTable]);
      setTable(String(createdTable.id));
      setIsCreatingTable(false);
      setNewTableNumber('');
      setFeedback({ type: 'success', message: `Table ${tableName} créée avec succès.` });
    } catch (error) {
      console.error('Erreur création table bar:', error);
      setFeedback({ type: 'error', message: 'La table n’a pas pu être créée.' });
    }
  };

  const handleAjouterCommande = async (event: React.FormEvent) => {
    event.preventDefault();

    const clientNom = client.trim();
    const tableNumber = Number(table);

    if (!clientNom || !table || Number.isNaN(tableNumber) || tableNumber <= 0 || selectedItems.length === 0) {
      return;
    }

    const unavailableItem = selectedItems.find((item) => {
      const available = stockMap[item.product_id || 0]?.quantite;
      return !Number.isFinite(available) || Number(item.quantite) > available;
    });
    if (unavailableItem) {
      const available = stockMap[unavailableItem.product_id || 0]?.quantite || 0;
      setFeedback({ type: 'error', message: 'Stock insuffisant pour ' + unavailableItem.nom + '. Disponible : ' + available + '.' });
      return;
    }

    try {
      await onCreateCommande?.({
        client: clientNom,
        table: tableNumber,
        items: selectedItems,
      });
      resetModal();
    } catch (error) {
      console.error('Erreur création commande bar:', error);
      setFeedback({ type: 'error', message: "La commande n'a pas pu être créée. Vérifiez les données puis réessayez." });
    }
  };

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await clientService.getClients();
      setClients(data.sort((firstClient, secondClient) => {
        const firstName = `${firstClient.nom} ${firstClient.prenom || ''}`.trim();
        const secondName = `${secondClient.nom} ${secondClient.prenom || ''}`.trim();
        return firstName.localeCompare(secondName, 'fr');
      }));
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      setFeedback({ type: 'error', message: 'La liste des clients n’a pas pu être chargée.' });
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleCreateClient = async () => {
    const nom = newClientNom.trim();
    const prenom = newClientPrenom.trim();
    const telephone = newClientTelephone.trim();

    if (!nom) {
      setFeedback({ type: 'error', message: 'Le nom du client est requis.' });
      return;
    }

    try {
      setIsSavingClient(true);
      const createdClient = await clientService.createClient({
        nom,
        prenom: prenom || undefined,
        telephone: telephone || undefined,
        statut: 'ACTIF',
      });
      const clientName = `${createdClient.nom}${createdClient.prenom ? ` ${createdClient.prenom}` : ''}`;
      setClients((currentClients) => [...currentClients, createdClient].sort((firstClient, secondClient) => {
        const firstName = `${firstClient.nom} ${firstClient.prenom || ''}`.trim();
        const secondName = `${secondClient.nom} ${secondClient.prenom || ''}`.trim();
        return firstName.localeCompare(secondName, 'fr');
      }));
      setClient(clientName);
      setNewClientNom('');
      setNewClientPrenom('');
      setNewClientTelephone('');
      setIsCreatingClient(false);
      setFeedback({ type: 'success', message: 'Client ajouté et sélectionné.' });
    } catch (error) {
      console.error('Erreur création client bar:', error);
      setFeedback({ type: 'error', message: 'Le client n’a pas pu être ajouté.' });
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDeleteCommande = async (commande: BarCommande) => {
    if (!window.confirm(`Supprimer définitivement la commande #${commande.id} ?`)) return;

    try {
      setDeletingId(commande.id);
      await onDeleteCommande?.(commande.id);
    } catch (error) {
      console.error('Erreur suppression commande bar:', error);
      setFeedback({ type: 'error', message: "La commande n'a pas pu être supprimée." });
    } finally {
      setDeletingId(null);
    }
  };
  const escapePrintHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  } as Record<string, string>)[char] || char);

  const handlePrintCommande = (commande: BarCommande) => {
    const printWindow = window.open('', '_blank', 'width=720,height=640');
    if (!printWindow) {
      setFeedback({ type: 'error', message: 'Autorisez les fenetres pop-up pour imprimer la commande.' });
      return;
    }

    const tableName = tables.find((tableItem) => tableItem.id === commande.table)?.numero || `Table ${commande.table}`;
    const items = commande.items.map((item) => `
      <tr><td>${escapePrintHtml(item.nom)}</td><td class="number">${item.quantite}</td><td class="number">${formatCurrency(item.prix)}</td><td class="number">${formatCurrency(item.prix * item.quantite)}</td></tr>`).join('');

    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Commande #${commande.id}</title><style>
      body { font-family: Arial, sans-serif; color: #111; margin: 32px; } h1 { margin: 0 0 4px; font-size: 22px; } p { margin: 4px 0; } table { width: 100%; border-collapse: collapse; margin-top: 24px; } th, td { padding: 9px 4px; border-bottom: 1px solid #ddd; text-align: left; } .number { text-align: right; } .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 16px; } .muted { color: #555; font-size: 12px; } @media print { body { margin: 12px; } }
    </style></head><body><h1>Commande Bar #${commande.id}</h1><p class="muted">Imprimee le ${new Date().toLocaleString('fr-FR')}</p><p><strong>Client :</strong> ${escapePrintHtml(commande.client)}</p><p><strong>Table :</strong> ${escapePrintHtml(tableName)}</p><table><thead><tr><th>Article</th><th class="number">Qte</th><th class="number">Prix</th><th class="number">Total</th></tr></thead><tbody>${items}</tbody></table><p class="total">Total : ${formatCurrency(commande.total)}</p></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const formatCommandeDate = (value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const columns = [
    {
      key: 'table',
      label: 'Table',
      render: (commande: BarCommande) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-black shadow-[0_0_20px_rgba(234,179,8,0.25)]">
            {commande.table}
          </div>
          <div>
            <p className="font-semibold text-primary">{commande.client}</p>
            <p className="text-xs text-slate-500">{tables.find((tableItem) => tableItem.id === commande.table)?.numero || `Table ${commande.table}`}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Articles',
      render: (commande: BarCommande) => (
        <div>
          {commande.items.length === 0 ? (
            <span className="text-sm text-slate-500">—</span>
          ) : (
            <>
              {commande.items.slice(0, 2).map((item, index) => (
                <p key={`${commande.id}-${index}`} className="text-sm text-slate-300">
                  {item.nom} ×{item.quantite}
                </p>
              ))}
              {commande.items.length > 2 && <p className="text-xs text-slate-500">+{commande.items.length - 2} autres</p>}
            </>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (commande: BarCommande) => <span className="text-sm text-slate-300">{formatCommandeDate(commande.created_at)}</span>,
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (commande: BarCommande) => <span className="font-semibold text-accent">{formatCurrency(commande.total)}</span>,
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (commande: BarCommande) => {
        const status = statusClasses[commande.statut] || statusClasses['En attente'];
        return <Badge variant={status.variant as any}>{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (commande: BarCommande) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setDetailCommande(commande)}>Detail</Button>
          <Button size="sm" variant="secondary" icon={<Printer size={14} />} onClick={() => handlePrintCommande(commande)}>Imprimer</Button>
          <Button size="sm" variant="danger" icon={<XCircle size={14} />} onClick={() => void handleDeleteCommande(commande)} disabled={deletingId === commande.id}>
            {deletingId === commande.id ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      ),
    },
  ];

  const filteredCommandes = commandes.filter((commande) => {
    const query = commandeSearchTerm.trim().toLocaleLowerCase('fr-FR');
    if (!query) return true;

    const searchableValue = [
      commande.client,
      tables.find((tableItem) => tableItem.id === commande.table)?.numero || String(commande.table),
      formatCommandeDate(commande.created_at),
      ...commande.items.map((item) => item.nom),
    ].join(' ').toLocaleLowerCase('fr-FR');

    return searchableValue.includes(query);
  });
  const data = filteredCommandes.map((commande) => ({ ...commande, id: String(commande.id) }));
  const totalCommandes = commandes.reduce((sum, commande) => sum + commande.total, 0);
  const commandesEnAttente = commandes.filter((commande) => commande.statut === 'En attente').length;
  const filteredCocktails = cocktails.filter((cocktail) => {
    const value = searchTerm.trim().toLowerCase();
    if (!value) return true;
    return `${cocktail.nom} ${cocktail.categorie}`.toLowerCase().includes(value);
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-base bg-surface p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-primary font-semibold">Commandes Bar</h3>
            <p className="text-sm text-slate-500">Créez une commande avec un client et une table issue de la base</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent">
              {commandes.length} commande{commandes.length > 1 ? 's' : ''} active{commandes.length > 1 ? 's' : ''}
            </div>
            <Button icon={<Plus size={16} />} onClick={handleOpenModal}>
              {BAR_COMMANDES_ACTIONS.newOrderLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-base bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Commandes actives</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{commandes.length}</p>
        </div>
        <div className="rounded-2xl border border-base bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">En attente</p>
          <p className="mt-2 text-2xl font-semibold text-amber-400">{commandesEnAttente}</p>
        </div>
        <div className="rounded-2xl border border-base bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">CA en cours</p>
          <p className="mt-2 text-2xl font-semibold text-accent">{formatCurrency(totalCommandes)}</p>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Nouvelle Commande" size="lg">
        <form onSubmit={handleAjouterCommande} className="space-y-4">
          <Select
            label="Table"
            value={table}
            onChange={(event) => setTable(event.target.value)}
            options={[
              { value: '', label: 'Sélectionner une table' },
              ...tables.map((tableItem) => ({ value: String(tableItem.id), label: tableItem.numero }))
            ]}
          />

          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-300">Créer une table si besoin</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => setIsCreatingTable((prev) => !prev)}>
                {isCreatingTable ? 'Fermer' : 'Nouvelle table'}
              </Button>
            </div>

            {(isCreatingTable || tables.length === 0) && (
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  label="Nom de table"
                  value={newTableNumber}
                  onChange={(event) => setNewTableNumber(event.target.value)}
                  placeholder="Ex. Bar 12"
                />
                <div className="flex items-end">
                  <Button type="button" size="sm" className="w-full justify-center" onClick={() => void handleCreateTable()}>
                    Créer
                  </Button>
                </div>
              </div>
            )}

            {feedback && (
              <p className={`mt-2 text-sm ${feedback.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {feedback.message}
              </p>
            )}
          </div>

          <div className="flex items-end gap-3">
            <Select
              label="Client"
              value={client}
              onChange={(event) => setClient(event.target.value)}
              options={[
                { value: '', label: isLoadingClients ? 'Chargement des clients...' : 'Sélectionner un client' },
                ...clients.map((clientItem) => ({
                  value: `${clientItem.nom}${clientItem.prenom ? ` ${clientItem.prenom}` : ''}`,
                  label: `${clientItem.nom}${clientItem.prenom ? ` ${clientItem.prenom}` : ''}${clientItem.code_client ? ` (${clientItem.code_client})` : ''}`,
                })),
              ]}
              disabled={isLoadingClients}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsCreatingClient((current) => !current); setFeedback(null); }}
            >
              <Plus size={16} />
              Nouveau client
            </Button>
          </div>

          {isCreatingClient && (
            <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/40 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-300">Ajouter un nouveau client</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Nom" value={newClientNom} onChange={(event) => setNewClientNom(event.target.value)} placeholder="Nom" />
                <Input label="Prénom" value={newClientPrenom} onChange={(event) => setNewClientPrenom(event.target.value)} placeholder="Prénom" />
              </div>
              <Input label="Téléphone" value={newClientTelephone} onChange={(event) => setNewClientTelephone(event.target.value)} placeholder="Téléphone" />
              <Button type="button" size="sm" onClick={() => void handleCreateClient()} disabled={isSavingClient}>
                {isSavingClient ? 'Ajout en cours...' : 'Ajouter le client'}
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-base bg-surface-2 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-300">Menus</p>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher un article"
                className="max-w-[220px]"
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {filteredCocktails.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun menu disponible.</p>
              ) : (
                filteredCocktails.map((cocktail) => (
                  <div key={cocktail.id} className="flex items-center justify-between rounded-lg border border-base bg-surface px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-primary">{cocktail.nom}</p>
                      <p className="text-xs text-slate-500">{cocktail.categorie}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-accent">{formatCurrency(cocktail.prix)}</span>
                      <Button size="sm" variant="secondary" type="button" onClick={() => handleAddItem(cocktail)}>
                        +
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="rounded-xl border border-base bg-surface-2 p-4">
              <p className="mb-2 text-sm font-medium text-slate-300">Résumé</p>
              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div key={`${item.nom}-${index}`} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
                    <span className="text-primary">{item.nom}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-base bg-surface-2 px-2 py-1">
                        <button type="button" onClick={() => handleUpdateItemQuantity(index, -1)} className="text-slate-400 transition hover:text-white">
                          −
                        </button>
                        <span className="min-w-5 text-center text-primary">{item.quantite}</span>
                        <button type="button" onClick={() => handleUpdateItemQuantity(index, 1)} className="text-slate-400 transition hover:text-white">
                          +
                        </button>
                      </div>
                      <span className="text-accent">{formatCurrency(item.prix * item.quantite)}</span>
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-400 transition hover:text-red-300">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-base pt-3">
                <span className="text-sm font-medium text-slate-300">Total</span>
                <span className="text-lg font-semibold text-accent">
                  {formatCurrency(selectedItems.reduce((sum, item) => sum + item.prix * item.quantite, 0))}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={handleCloseModal} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={selectedItems.length === 0}>
              <Plus size={16} />
              Créer la commande
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={detailCommande !== null} onClose={() => setDetailCommande(null)} title="Detail de la commande" size="md">
        {detailCommande && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-500">Client</p><p className="font-medium text-primary">{detailCommande.client}</p></div>
              <div><p className="text-slate-500">Table</p><p className="font-medium text-primary">{tables.find((tableItem) => tableItem.id === detailCommande.table)?.numero || `Table ${detailCommande.table}`}</p></div>
            </div>
            <div className="rounded-xl border border-base bg-surface-2 p-3">
              <p className="mb-2 text-sm font-medium text-slate-300">Articles</p>
              <div className="space-y-2">
                {detailCommande.items.map((item, index) => (
                  <div key={`${detailCommande.id}-${index}`} className="flex justify-between text-sm"><span>{item.nom} x {item.quantite}</span><span className="text-accent">{formatCurrency(item.prix * item.quantite)}</span></div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-base pt-3 font-semibold"><span>Total</span><span className="text-accent">{formatCurrency(detailCommande.total)}</span></div>
            </div>
            <Button className="w-full" variant="secondary" onClick={() => setDetailCommande(null)}>Fermer</Button>
          </div>
        )}
      </Modal>
      <div className="rounded-2xl overflow-hidden border border-base bg-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-base px-3 py-3 sm:px-6 sm:py-4">
          <h3 className="text-primary font-semibold">Liste des commandes</h3>
          <Input
            value={commandeSearchTerm}
            onChange={(event) => setCommandeSearchTerm(event.target.value)}
            placeholder="Rechercher client, table, article..."
            className="mt-3 w-full sm:mt-0 sm:max-w-xs"
          />
        </div>

        {data.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {commandes.length === 0
              ? `${BAR_COMMANDES_ACTIONS.emptyTitle}. ${BAR_COMMANDES_ACTIONS.emptyDescription}`
              : 'Aucune commande ne correspond à votre recherche.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-2 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Table</th>
                  <th className="px-4 py-3 font-medium">Articles</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Montant</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((commande) => (
                  <tr key={commande.id} className="border-t border-base">
                    <td className="px-4 py-3">{columns[0].render(commande as unknown as BarCommande)}</td>
                    <td className="px-4 py-3">{columns[1].render(commande as unknown as BarCommande)}</td>
                    <td className="px-4 py-3">{columns[2].render(commande as unknown as BarCommande)}</td>
                    <td className="px-4 py-3">{columns[3].render(commande as unknown as BarCommande)}</td>
                    <td className="px-4 py-3">{columns[4].render(commande as unknown as BarCommande)}</td>
                    <td className="px-4 py-3 text-right">{columns[5].render(commande as unknown as BarCommande)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

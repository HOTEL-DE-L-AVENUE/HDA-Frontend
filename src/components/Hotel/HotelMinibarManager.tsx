// hotel/MinibarManager.tsx
import React, { useState } from 'react';
import { MinibarItem, MinibarConsumption, Room } from '../../types/hotel.types';
import { formatCurrency, formatDate } from '../../utils/data';
import { Plus, Minus, ShoppingCart, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { ConsumptionModal } from './Modal/ConsumptionModal';
import { Product } from '../../types/product.types';

interface MinibarManagerProps {
  items: MinibarItem[];
  rooms: Room[];
  products: Product[];
}

// Données mockées pour les consommations
const mockConsumptions: MinibarConsumption[] = [
  {
    id: 1,
    room_id: 101,
    client_id: 1,
    product_id: 1,
    quantite: 2,
    prix_unitaire: 2500,
    montant: 5000,
    facturee: true,
    consumed_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 heures
  },
  {
    id: 2,
    room_id: 101,
    client_id: 1,
    product_id: 2,
    quantite: 1,
    prix_unitaire: 3500,
    montant: 3500,
    facturee: false,
    consumed_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes
  },
  {
    id: 3,
    room_id: 102,
    client_id: 2,
    product_id: 3,
    quantite: 3,
    prix_unitaire: 1800,
    montant: 5400,
    facturee: true,
    consumed_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 heures
  },
  {
    id: 4,
    room_id: 103,
    client_id: 3,
    product_id: 1,
    quantite: 1,
    prix_unitaire: 2500,
    montant: 2500,
    facturee: false,
    consumed_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes
  },
  {
    id: 5,
    room_id: 101,
    client_id: 1,
    product_id: 4,
    quantite: 1,
    prix_unitaire: 4500,
    montant: 4500,
    facturee: true,
    consumed_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 jour
  },
];

// Données mockées pour les produits du mini-bar
const mockMinibarItems: MinibarItem[] = [
  {
    id: 1,
    room_id: 101,
    product_id: 1,
    quantite: 5,
    seuil_alerte: 2,
    product: {
      id: 1,
      category_id: 1,
      code: 'COLA-001',
      nom: 'Coca-Cola 33cl',
      unite: 'Bouteille',
      prix_achat: 1500,
      prix_vente: 2500,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 2,
    room_id: 101,
    product_id: 2,
    quantite: 3,
    seuil_alerte: 1,
    product: {
      id: 2,
      category_id: 1,
      code: 'EAU-001',
      nom: 'Eau Minérale 50cl',
      unite: 'Bouteille',
      prix_achat: 800,
      prix_vente: 1500,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 3,
    room_id: 101,
    product_id: 3,
    quantite: 2,
    seuil_alerte: 3,
    product: {
      id: 3,
      category_id: 2,
      code: 'JUS-001',
      nom: 'Jus d\'Orange 33cl',
      unite: 'Bouteille',
      prix_achat: 2000,
      prix_vente: 3500,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 4,
    room_id: 102,
    product_id: 4,
    quantite: 1,
    seuil_alerte: 1,
    product: {
      id: 4,
      category_id: 3,
      code: 'CHOC-001',
      nom: 'Chocolat Noir',
      unite: 'Pièce',
      prix_achat: 1200,
      prix_vente: 2500,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 5,
    room_id: 102,
    product_id: 1,
    quantite: 4,
    seuil_alerte: 2,
    product: {
      id: 1,
      category_id: 1,
      code: 'COLA-001',
      nom: 'Coca-Cola 33cl',
      unite: 'Bouteille',
      prix_achat: 1500,
      prix_vente: 2500,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 6,
    room_id: 103,
    product_id: 5,
    quantite: 0,
    seuil_alerte: 2,
    product: {
      id: 5,
      category_id: 3,
      code: 'BISC-001',
      nom: 'Biscuits Apéritif',
      unite: 'Paquet',
      prix_achat: 1000,
      prix_vente: 2000,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 7,
    room_id: 104,
    product_id: 2,
    quantite: 6,
    seuil_alerte: 3,
    product: {
      id: 2,
      category_id: 1,
      code: 'EAU-001',
      nom: 'Eau Minérale 50cl',
      unite: 'Bouteille',
      prix_achat: 800,
      prix_vente: 1500,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
  {
    id: 8,
    room_id: 105,
    product_id: 6,
    quantite: 2,
    seuil_alerte: 1,
    product: {
      id: 6,
      category_id: 4,
      code: 'CHAMP-001',
      nom: 'Champagne Mini',
      unite: 'Bouteille',
      prix_achat: 15000,
      prix_vente: 35000,
      actif: true,
      type_produit: 'CONSOMMABLE',
    },
  },
];

// Données mockées pour les chambres
const mockRooms: Room[] = [
  { id: 101, room_type_id: 1, numero: '101', capacite: 2, prix_nuit: 250000, statut: 'OCCUPEE' },
  { id: 102, room_type_id: 1, numero: '102', capacite: 2, prix_nuit: 250000, statut: 'OCCUPEE' },
  { id: 103, room_type_id: 2, numero: '103', capacite: 3, prix_nuit: 350000, statut: 'LIBRE' },
  { id: 104, room_type_id: 1, numero: '104', capacite: 2, prix_nuit: 250000, statut: 'NETTOYAGE' },
  { id: 105, room_type_id: 3, numero: '105', capacite: 4, prix_nuit: 500000, statut: 'RESERVEE' },
];

export const MinibarManager: React.FC<MinibarManagerProps> = ({
  items = mockMinibarItems,
  rooms = mockRooms,
  products,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [localItems, setLocalItems] = useState<MinibarItem[]>(items);
  const [localConsumptions, setLocalConsumptions] = useState<MinibarConsumption[]>(mockConsumptions);

  // Filtrer les items par chambre sélectionnée
  const roomItems = selectedRoom 
    ? localItems.filter(item => item.room_id === selectedRoom.id)
    : [];

  // Calculer le total des consommations pour la chambre sélectionnée
  const roomConsumptions = selectedRoom
    ? localConsumptions.filter(c => c.room_id === selectedRoom.id)
    : [];
  
  const totalConsumptionAmount = roomConsumptions.reduce((sum, c) => sum + c.montant, 0);
  const totalConsumptionCount = roomConsumptions.length;

  // Fonction pour ajuster la quantité
  const handleAdjustQuantity = (itemId: number, delta: number) => {
    setLocalItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantite: Math.max(0, item.quantite + delta) }
          : item
      )
    );
    console.log(`Ajuster la quantité de l'item ${itemId} de ${delta}`);
  };

  // Fonction pour réapprovisionner le mini-bar
  const handleRestock = (itemId: number) => {
    setLocalItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantite: item.quantite + 5 }
          : item
      )
    );
    console.log(`Réapprovisionner l'item ${itemId}`);
  };

  // Fonction pour supprimer un item
  const handleRemoveItem = (itemId: number) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce produit du mini-bar ?')) {
      setLocalItems(prev => prev.filter(item => item.id !== itemId));
      console.log(`Supprimer l'item ${itemId}`);
    }
  };

  // Fonction pour marquer une consommation comme facturée
  const handleMarkAsBilled = (consumptionId: number) => {
    setLocalConsumptions(prev =>
      prev.map(c =>
        c.id === consumptionId
          ? { ...c, facturee: true }
          : c
      )
    );
    console.log(`Marquer la consommation ${consumptionId} comme facturée`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Mini-bar</h3>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Total produits: {localItems.length}</span>
          <span className="w-px h-4 bg-base" />
          <span>Chambres équipées: {new Set(localItems.map(i => i.room_id)).size}</span>
        </div>
      </div>

      {/* Sélection de chambre */}
      <div className="flex flex-wrap gap-2">
        <span className="text-muted text-sm mr-2">Sélectionner une chambre:</span>
        {rooms.map(room => {
          const roomItemCount = localItems.filter(i => i.room_id === room.id).length;
          const hasItems = roomItemCount > 0;
          return (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                selectedRoom?.id === room.id
                  ? 'btn-primary'
                  : 'bg-surface-2 text-muted hover:text-primary'
              }`}
            >
              {room.numero}
              {!hasItems && (
                <span className="text-xs text-muted">(vide)</span>
              )}
              {hasItems && (
                <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full">
                  {roomItemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedRoom && (
        <>
          {/* Contenu du mini-bar */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-primary font-semibold">
                  Mini-bar - Chambre {selectedRoom.numero}
                </h4>
                {roomItems.length > 0 && (
                  <p className="text-muted text-sm">
                    {roomItems.reduce((sum, item) => sum + item.quantite, 0)} produits disponibles
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsConsumptionModalOpen(true)}
                  className="btn-primary px-4 py-2 rounded-xl flex items-center gap-2"
                  disabled={roomItems.length === 0}
                >
                  <ShoppingCart size={18} />
                  Consommation
                </button>
              </div>
            </div>

            {roomItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🍾</div>
                <p className="text-muted">Aucun produit dans le mini-bar</p>
                <p className="text-muted text-sm mt-1">Ajoutez des produits depuis la gestion des stocks</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roomItems.map(item => {
                  const isLowStock = item.seuil_alerte && item.quantite <= item.seuil_alerte;
                  const isOutOfStock = item.quantite === 0;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`flex flex-col p-4 rounded-xl border transition-all ${
                        isOutOfStock 
                          ? 'bg-danger/5 border-danger/20 opacity-60'
                          : isLowStock
                          ? 'bg-warning/5 border-warning/20'
                          : 'bg-surface-2 border-transparent hover:border-accent/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-primary font-medium">
                            {item.product?.nom || 'Produit'}
                          </p>
                          <p className="text-muted text-xs">
                            {item.product?.unite || 'Unité'} • {formatCurrency(item.product?.prix_vente || 0)}
                          </p>
                        </div>
                        {isLowStock && !isOutOfStock && (
                          <span className="text-warning text-xs flex items-center gap-1">
                            <AlertTriangle size={12} /> Stock bas
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-danger text-xs flex items-center gap-1">
                            <AlertTriangle size={12} /> Rupture
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-base">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAdjustQuantity(item.id, -1)}
                            className="p-1.5 rounded-lg hover:bg-surface-3 transition-colors disabled:opacity-50"
                            disabled={item.quantite <= 0}
                          >
                            <Minus size={16} className={item.quantite <= 0 ? 'text-muted' : 'text-primary'} />
                          </button>
                          <span className={`text-primary font-medium text-lg min-w-[24px] text-center ${
                            isOutOfStock ? 'text-danger' : ''
                          }`}>
                            {item.quantite}
                          </span>
                          <button 
                            onClick={() => handleAdjustQuantity(item.id, 1)}
                            className="p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
                          >
                            <Plus size={16} className="text-primary" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleRestock(item.id)}
                            className="p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
                            title="Réapprovisionner"
                          >
                            <RefreshCw size={14} className="text-muted hover:text-accent" />
                          </button>
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} className="text-muted hover:text-danger" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Résumé des consommations */}
          {roomConsumptions.length > 0 && (
            <div className="card p-6 bg-gradient-to-r from-accent-4 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-primary font-semibold">Résumé des consommations</h4>
                  <p className="text-muted text-sm">
                    {totalConsumptionCount} consommation{totalConsumptionCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-muted text-sm">Total consommé</p>
                  <p className="text-accent font-bold text-xl">{formatCurrency(totalConsumptionAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Historique des consommations */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-primary font-semibold">Historique des consommations</h4>
              <span className="text-muted text-sm">
                {roomConsumptions.length} entrée{roomConsumptions.length > 1 ? 's' : ''}
              </span>
            </div>

            {roomConsumptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">Aucune consommation enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roomConsumptions
                  .sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime())
                  .map((consumption) => {
                    const product = products.find(p => p.id === consumption.product_id);
                    return (
                      <div 
                        key={consumption.id} 
                        className={`flex items-center justify-between p-3 rounded-xl ${
                          consumption.facturee 
                            ? 'bg-surface-2' 
                            : 'bg-warning/5 border border-warning/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent-4 flex items-center justify-center text-accent">
                            🍾
                          </div>
                          <div>
                            <p className="text-primary text-sm font-medium">
                              {product?.nom || 'Produit #' + consumption.product_id}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted">
                              <span>{consumption.quantite} unité{consumption.quantite > 1 ? 's' : ''}</span>
                              <span className="w-px h-3 bg-base" />
                              <span>{formatCurrency(consumption.prix_unitaire)} / unité</span>
                              <span className="w-px h-3 bg-base" />
                              <span>{formatDate(consumption.consumed_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-accent font-semibold">
                            {formatCurrency(consumption.montant)}
                          </span>
                          {!consumption.facturee && (
                            <button
                              onClick={() => handleMarkAsBilled(consumption.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            >
                              Facturer
                            </button>
                          )}
                          {consumption.facturee && (
                            <span className="text-xs text-success">✅ Facturée</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}

      <ConsumptionModal
        isOpen={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        room={selectedRoom}
        products={products}
        onConsume={(productId, quantity) => {
          // Enregistrer la consommation
          console.log(`Consommation: produit ${productId}, quantité ${quantity}`);
          
          // Ajouter à l'historique
          const product = products.find(p => p.id === productId);
          if (product && selectedRoom) {
            const newConsumption: MinibarConsumption = {
              id: Date.now(),
              room_id: selectedRoom.id,
              client_id: 1, // À remplacer par le vrai client
              product_id: productId,
              quantite: quantity,
              prix_unitaire: product.prix_vente || 0,
              montant: (product.prix_vente || 0) * quantity,
              facturee: false,
              consumed_at: new Date().toISOString(),
            };
            setLocalConsumptions(prev => [newConsumption, ...prev]);
          }
          
          // Mettre à jour le stock
          setLocalItems(prev =>
            prev.map(item =>
              item.room_id === selectedRoom?.id && item.product_id === productId
                ? { ...item, quantite: Math.max(0, item.quantite - quantity) }
                : item
            )
          );
          
          setIsConsumptionModalOpen(false);
        }}
      />
    </div>
  );
};
// hotel/MinibarManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { MinibarItem, MinibarConsumption, Room } from '../../types/hotel.types';
import { formatCurrency, formatDate } from '../../utils/data';
import { Plus, Minus, ShoppingCart, Trash2, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { ConsumptionModal } from './Modal/ConsumptionModal';
import { Product } from '../../types/product.types';
import { minibarService } from '../../services/minibar.service';
import { consumptionService } from '../../services/consumption.service';

interface MinibarManagerProps {
  rooms: Room[];
  products: Product[];
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export const MinibarManager: React.FC<MinibarManagerProps> = ({
  rooms,
  products,
  onError,
  onSuccess,
}) => {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [items, setItems] = useState<MinibarItem[]>([]);
  const [consumptions, setConsumptions] = useState<MinibarConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsumptions, setLoadingConsumptions] = useState(false);
  const [stats, setStats] = useState({ totalProduits: 0, chambresEquipees: 0 });
  const [error, setError] = useState<string | null>(null);

  // Charger les consommations d'une chambre
  const loadRoomConsumptions = useCallback(async (roomId: number) => {
    try {
      setLoadingConsumptions(true);
      setError(null);
      const response = await consumptionService.getByRoom(roomId);
      
      const formattedConsumptions: MinibarConsumption[] = (response.data || []).map((c: any) => ({
        id: c.id,
        room_id: c.room_id,
        client_id: c.client_id,
        product_id: c.product_id,
        quantite: c.quantite,
        prix_unitaire: c.prix_unitaire,
        montant: c.montant,
        facturee: c.facturee,
        consumed_at: c.consumed_at,
      }));

      setConsumptions(formattedConsumptions);
    } catch (error) {
      console.error('Erreur lors du chargement des consommations:', error);
      const errorMessage = 'Impossible de charger les consommations';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoadingConsumptions(false);
    }
  }, [onError]);

  // Charger les données du minibar
  const loadMinibarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allItemsResponse, statsResponse] = await Promise.all([
        minibarService.getAll(),
        minibarService.getStats().catch(() => ({ data: { total_produits: 0, chambres_equipees: 0 } })),
      ]);

      // Transformer les données pour correspondre au type MinibarItem
      const formattedItems: MinibarItem[] = (allItemsResponse.data || []).map((item: any) => {
        const product = products.find(p => p.id === item.product_id);
        return {
          id: item.id,
          room_id: item.room_id,
          product_id: item.product_id,
          quantite: item.quantite || 0,
          seuil_alerte: item.seuil_alerte || 1,
          product: product || {
            id: item.product_id,
            category_id: 0,
            code: item.product_code || '',
            nom: item.product_nom || 'Produit inconnu',
            unite: 'Pièce',
            prix_achat: 0,
            prix_vente: item.product_prix || 0,
            actif: true,
            type_produit: 'CONSOMMABLE' as const,
          },
        };
      });

      setItems(formattedItems);
      setStats({
        totalProduits: statsResponse.data?.total_produits || formattedItems.length,
        chambresEquipees: statsResponse.data?.chambres_equipees || new Set(formattedItems.map(i => i.room_id)).size,
      });

      // Si une chambre est sélectionnée, charger ses consommations
      if (selectedRoom) {
        await loadRoomConsumptions(selectedRoom.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      const errorMessage = 'Impossible de charger les données du minibar';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [products, selectedRoom, loadRoomConsumptions, onError]);

  // Charger les données au montage et quand la chambre sélectionnée change
  useEffect(() => {
    loadMinibarData();
  }, [loadMinibarData]);

  // Filtrer les items par chambre sélectionnée
  const roomItems = selectedRoom 
    ? items.filter(item => item.room_id === selectedRoom.id)
    : [];

  // Filtrer les consommations par chambre sélectionnée
  const roomConsumptions = selectedRoom
    ? consumptions.filter(c => c.room_id === selectedRoom.id)
    : [];
  
  const totalConsumptionAmount = roomConsumptions.reduce((sum, c) => sum + (c.montant || 0), 0);
  const totalConsumptionCount = roomConsumptions.length;

  // Fonction pour ajuster la quantité
  const handleAdjustQuantity = async (itemId: number, delta: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantite + delta);
    
    try {
      // Mise à jour optimiste
      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? { ...i, quantite: newQuantity }
            : i
        )
      );

      await minibarService.updateQuantity(itemId, newQuantity);
      onSuccess?.(`Quantité mise à jour avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      onError?.('Impossible de mettre à jour la quantité');
      // Recharger les données pour corriger l'état
      await loadMinibarData();
    }
  };

  // Fonction pour réapprovisionner le mini-bar
  const handleRestock = async (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      const newQuantity = item.quantite + 5;
      // Mise à jour optimiste
      setItems(prev =>
        prev.map(i =>
          i.id === itemId
            ? { ...i, quantite: newQuantity }
            : i
        )
      );

      await minibarService.updateQuantity(itemId, newQuantity);
      onSuccess?.(`Réapprovisionnement effectué avec succès`);
    } catch (error) {
      console.error('Erreur lors du réapprovisionnement:', error);
      onError?.('Impossible de réapprovisionner');
      await loadMinibarData();
    }
  };

  // Fonction pour supprimer un item
  const handleRemoveItem = async (itemId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit du mini-bar ?')) return;

    try {
      await minibarService.delete(itemId);
      // Mise à jour optimiste
      setItems(prev => prev.filter(item => item.id !== itemId));
      onSuccess?.('Produit supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      onError?.('Impossible de supprimer le produit');
      await loadMinibarData();
    }
  };

  // Fonction pour marquer une consommation comme facturée
  const handleMarkAsBilled = async (consumptionId: number) => {
    try {
      await consumptionService.markAsBilled(consumptionId);
      setConsumptions(prev =>
        prev.map(c =>
          c.id === consumptionId
            ? { ...c, facturee: true }
            : c
        )
      );
      onSuccess?.('Consommation facturée avec succès');
    } catch (error) {
      console.error('Erreur lors du marquage de la facturation:', error);
      onError?.('Impossible de marquer comme facturée');
    }
  };

  // Gestion de la consommation
  const handleConsume = async (productId: number, quantity: number) => {
    if (!selectedRoom) {
      onError?.('Veuillez sélectionner une chambre');
      return;
    }

    try {
      const product = products.find(p => p.id === productId);
      if (!product) {
        onError?.('Produit non trouvé');
        return;
      }

      // Vérifier si le produit est dans le minibar
      const minibarItem = items.find(
        item => item.room_id === selectedRoom.id && item.product_id === productId
      );

      if (!minibarItem) {
        onError?.('Ce produit n\'est pas disponible dans le minibar de cette chambre');
        return;
      }

      if (minibarItem.quantite < quantity) {
        onError?.(`Stock insuffisant. Disponible: ${minibarItem.quantite}`);
        return;
      }

      const consumption = await consumptionService.create({
        room_id: selectedRoom.id,
        client_id: 1, // À remplacer par l'ID du client réel
        product_id: productId,
        quantite: quantity,
        prix_unitaire: product.prix_vente || 0,
      });

      const newConsumption: MinibarConsumption = {
        id: consumption.data.id,
        room_id: consumption.data.room_id,
        client_id: consumption.data.client_id,
        product_id: consumption.data.product_id,
        quantite: consumption.data.quantite,
        prix_unitaire: consumption.data.prix_unitaire,
        montant: consumption.data.montant,
        facturee: consumption.data.facturee,
        consumed_at: consumption.data.consumed_at,
      };

      setConsumptions(prev => [newConsumption, ...prev]);

      // Mettre à jour le stock du minibar
      if (minibarItem) {
        const newQuantity = Math.max(0, minibarItem.quantite - quantity);
        setItems(prev =>
          prev.map(item =>
            item.id === minibarItem.id
              ? { ...item, quantite: newQuantity }
              : item
          )
        );
        
        // Mettre à jour la quantité dans la base de données
        await minibarService.updateQuantity(minibarItem.id, newQuantity);
      }

      onSuccess?.('Consommation enregistrée avec succès');
      setIsConsumptionModalOpen(false);
    } catch (error) {
      console.error('Erreur lors de la consommation:', error);
      onError?.('Impossible d\'enregistrer la consommation');
    }
  };

  // Ouvrir le modal
  const openModal = () => {
    if (roomItems.length === 0) {
      onError?.('Aucun produit dans le minibar de cette chambre');
      return;
    }
    setIsConsumptionModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-accent" size={32} />
        <span className="ml-2 text-muted">Chargement du minibar...</span>
      </div>
    );
  }

  if (error && !selectedRoom) {
    return (
      <div className="card p-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-danger">{error}</p>
        <button
          onClick={loadMinibarData}
          className="mt-4 btn-primary px-4 py-2 rounded-xl"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-primary font-semibold">Mini-bar</h3>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Total produits: {stats.totalProduits}</span>
          <span className="w-px h-4 bg-base" />
          <span>Chambres équipées: {stats.chambresEquipees}</span>
          <button
            onClick={loadMinibarData}
            className="ml-2 p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={16} className="text-muted hover:text-accent" />
          </button>
        </div>
      </div>

      {/* Sélection de chambre */}
      <div className="flex flex-wrap gap-2">
        <span className="text-muted text-sm mr-2">Sélectionner une chambre:</span>
        {rooms.map(room => {
          const roomItemCount = items.filter(i => i.room_id === room.id).length;
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
                  onClick={openModal}
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

            {loadingConsumptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-accent" size={24} />
                <span className="ml-2 text-muted">Chargement...</span>
              </div>
            ) : roomConsumptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted">Aucune consommation enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {roomConsumptions
                  .sort((a, b) => new Date(b.consumed_at).getTime() - new Date(a.consumed_at).getTime())
                  .map((consumption) => {
                    const product = products.find(p => p.id === consumption.product_id);
                    return (
                      <div 
                        key={consumption.id} 
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                          consumption.facturee 
                            ? 'bg-surface-2' 
                            : 'bg-warning/5 border border-warning/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-accent-4 flex items-center justify-center text-accent flex-shrink-0">
                            🍾
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-primary text-sm font-medium truncate">
                              {product?.nom || 'Produit #' + consumption.product_id}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                              <span>{consumption.quantite} unité{consumption.quantite > 1 ? 's' : ''}</span>
                              <span className="w-px h-3 bg-base hidden sm:block" />
                              <span>{formatCurrency(consumption.prix_unitaire)} / unité</span>
                              <span className="w-px h-3 bg-base hidden sm:block" />
                              <span>{formatDate(consumption.consumed_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <span className="text-accent font-semibold whitespace-nowrap">
                            {formatCurrency(consumption.montant)}
                          </span>
                          {!consumption.facturee ? (
                            <button
                              onClick={() => handleMarkAsBilled(consumption.id)}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors whitespace-nowrap"
                            >
                              Facturer
                            </button>
                          ) : (
                            <span className="text-xs text-success whitespace-nowrap">✅ Facturée</span>
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

      {/* Le modal */}
      <ConsumptionModal
        isOpen={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        room={selectedRoom}
        products={products}
        onConsume={handleConsume}
      />
    </div>
  );
};
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { BarProduct } from '../../types/bar.type';
import { formatCurrency } from '../../utils/data';
import barService from '../../services/bar.service';
import { useToast } from '../../context/ToastContext';

interface Props {
  cocktail: BarProduct;
  stock?: { quantite: number; unite: string };
  onStockUpdate?: () => void;
  onAddToOrder?: (cocktail: BarProduct) => boolean | void | Promise<void>;
}

export const CocktailListItem: React.FC<Props> = ({ cocktail, stock, onStockUpdate, onAddToOrder }) => {
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  const handleAddToOrder = async () => {
    if (adding) return;
    if (!stock || stock.quantite <= 0) {
      showToast('Rupture de stock', 'error');
      return;
    }

    setAdding(true);
    try {
      const sessionRes = await barService.getBarOpenSessions();
      const sessions = sessionRes;
      const currentSession = Array.isArray(sessions) 
        ? sessions.find((s) => s.fermeture_at === null || s.fermeture_at === undefined) 
        : null;

      await barService.addBarTransaction({
        session_id: currentSession?.id,
        product_id: cocktail.id,
        quantite: 1,
        prix_unitaire: cocktail.prix,
      });
      
      await barService.updateBarStock(cocktail.id, { quantite: stock.quantite - 1 });

      if (onAddToOrder) {
        const added = await onAddToOrder(cocktail);
        if (!added) {
          showToast('Créez d\'abord une commande', 'error');
          return;
        }
      }

      showToast(`${cocktail.nom} ajouté`, 'success');
      if (onStockUpdate) onStockUpdate();
    } catch (err) {
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setAdding(false);
    }
  };

  const isOutOfStock = !stock || stock.quantite <= 0;
  const isLowStock = stock && stock.quantite > 0 && stock.quantite <= 5;

  return (
    <div className="flex items-center justify-between gap-3 p-3 border-b border-base last:border-b-0 hover:bg-surface/30 transition-colors group">
      {/* Info produit */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <h4 className="text-sm sm:text-base font-semibold text-primary truncate">
            {cocktail.nom}
          </h4>
          <span className="text-xs sm:text-sm font-bold text-accent whitespace-nowrap">
            {formatCurrency(cocktail.prix)}
          </span>
        </div>
        
        {/* Stock info */}
        {stock && (
          <div className="text-xs text-muted">
            Stock: <span className={`font-semibold ${
              isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {isOutOfStock ? 'Rupture' : `${stock.quantite} ${stock.unite}`}
            </span>
          </div>
        )}
      </div>

      {/* Bouton d'ajout */}
      <button
        onClick={handleAddToOrder}
        disabled={isOutOfStock || adding}
        className={`flex-shrink-0 p-2 sm:p-2.5 rounded-lg transition-all font-medium ${
          isOutOfStock
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-accent text-black hover:bg-accent/90 active:scale-95'
        } ${adding ? 'opacity-60 cursor-wait' : ''}`}
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

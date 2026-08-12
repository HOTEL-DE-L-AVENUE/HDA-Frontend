import React, { useState } from 'react';
import { CocktailListItem } from './CocktailListItem';
import { BarProduct } from '../../types/bar.type';
import { Button, Input, Modal, Select } from '../UI';
import { Plus } from 'lucide-react';
import barService from '../../services/bar.service';
import { useToast } from '../../context/ToastContext';

interface Props {
  cocktails: BarProduct[];
  stockMap?: Record<number, { quantite: number; unite: string }>;
  onStockUpdate?: () => void;
  onAddToOrder?: (cocktail: BarProduct) => boolean | void | Promise<void>;
  onProductAdded?: (newProduct: BarProduct) => void;
}

export const CocktailMenu: React.FC<Props> = ({ 
  cocktails, 
  stockMap, 
  onStockUpdate, 
  onAddToOrder,
  onProductAdded 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // États du formulaire de création de boisson
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Alcools');
  const [prix, setPrix] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [alcool, setAlcool] = useState(true);

  const handleOpenModal = () => {
    setNom('');
    setCategorie('Alcools');
    setPrix('');
    setIngredients('');
    setAlcool(true);
    setIsModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNom = nom.trim();
    const parsedPrix = Number(prix);

    if (!trimmedNom || Number.isNaN(parsedPrix) || parsedPrix <= 0) {
      showToast('Veuillez renseigner un nom et un prix valide.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const created = await barService.createBarProduct({
        nom: trimmedNom,
        categorie,
        prix: parsedPrix,
        ingredients: ingredients.trim() || 'N/A',
        alcool,
      });

      showToast('Boisson ajoutée avec succès', 'success');
      if (onProductAdded) {
        onProductAdded(created);
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast("Erreur lors de la création de la boisson", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrer les cocktails selon la barre de recherche
  const filteredCocktails = cocktails.filter((cocktail) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      cocktail.nom.toLowerCase().includes(query) ||
      (cocktail.categorie && cocktail.categorie.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-4">
      {/* En-tête avec Titre, Barre de recherche et Bouton "Ajouter une boisson" */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface border border-base rounded-2xl p-4 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Carte des Cocktails</h2>
          <p className="text-xs sm:text-sm text-slate-400">Gérez les boissons et alcools proposés au bar</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une boisson..."
            className="w-full sm:w-64 text-xs sm:text-sm"
          />
          <Button icon={<Plus size={18} />} onClick={handleOpenModal} className="whitespace-nowrap">
            Ajouter une boisson
          </Button>
        </div>
      </div>
      
      {filteredCocktails.length === 0 ? (
        <div className="rounded-2xl border border-base bg-surface text-center py-12 text-slate-500 text-sm">
          Aucune boisson trouvée.
        </div>
      ) : (
        <div className="rounded-xl border border-base overflow-hidden bg-surface divide-y divide-base">
          {filteredCocktails.map((cocktail) => (
            <CocktailListItem
              key={cocktail.id}
              cocktail={cocktail}
              stock={stockMap?.[cocktail.id]}
              onStockUpdate={onStockUpdate}
              onAddToOrder={onAddToOrder}
            />
          ))}
        </div>
      )}

      {/* Modal d'ajout de boisson */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ajouter une nouvelle boisson" size="md">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Nom de la boisson"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Mojito, Whisky..."
          />
          <Select
            label="Catégorie"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            options={[
              { value: 'Alcools', label: 'Alcools' },
              { value: 'Bières', label: 'Bières' },
              { value: 'Cocktails', label: 'Cocktails' },
              { value: 'Sans alcool', label: 'Sans alcool' },
              { value: 'Softs', label: 'Softs' },
            ]}
          />
          <Input
            label="Prix (MGA)"
            type="number"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="Ex: 4000"
          />
          <Input
            label="Ingrédients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ex: Rhum, menthe, citron..."
          />
          <Select
            label="Contient de l'alcool ?"
            value={alcool ? 'oui' : 'non'}
            onChange={(e) => setAlcool(e.target.value === 'oui')}
            options={[
              { value: 'oui', label: 'Oui' },
              { value: 'non', label: 'Non' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
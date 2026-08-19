// src/components/Bar/CocktailMenu.tsx
import React, { useState } from 'react';
import { CocktailListItem } from './CocktailListItem';
import { BarProduct } from '../../types/bar.type';
import { Button, Input, Modal, Select } from '../UI';
import { Plus } from 'lucide-react';
import barService from '../../services/bar.service';
import { useToast } from '../../context/ToastContext';

interface Props {
  cocktails: BarProduct[];
  stockMap?: Record<number, { quantite: number; unite: string; seuil_minimum?: number }>;
  onStockUpdate?: () => void;
  onAddToOrder?: (cocktail: BarProduct) => boolean | void | Promise<void>;
  onProductAdded?: (newProduct: BarProduct) => void;
  onProductUpdated?: (updatedProduct: BarProduct) => void;
  onProductDeleted?: (productId: number) => void;
}

export const CocktailMenu: React.FC<Props> = ({
  cocktails,
  stockMap,
  onStockUpdate,
  onAddToOrder,
  onProductAdded,
  onProductUpdated,
  onProductDeleted
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // États du formulaire d'ajout
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Alcools');
  const [prix, setPrix] = useState('');
  const [quantite, setQuantite] = useState('');
  const [seuilMinimum, setSeuilMinimum] = useState('5');
  const [unite, setUnite] = useState('unités');
  const [alcool, setAlcool] = useState(true);

  // États du formulaire de modification
  const [editingProduct, setEditingProduct] = useState<BarProduct | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCategorie, setEditCategorie] = useState('Alcools');
  const [editPrix, setEditPrix] = useState('');
  const [editQuantite, setEditQuantite] = useState('');
  const [editSeuilMinimum, setEditSeuilMinimum] = useState('5');
  const [editUnite, setEditUnite] = useState('unités');
  const [editAlcool, setEditAlcool] = useState(true);

  const handleOpenModal = () => {
    setNom('');
    setCategorie('Alcools');
    setPrix('');
    setQuantite('');
    setSeuilMinimum('5');
    setUnite('unités');
    setAlcool(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cocktail: BarProduct) => {
    setEditingProduct(cocktail);
    setEditNom(cocktail.nom || '');
    setEditCategorie(cocktail.categorie || 'Alcools');
    setEditPrix(String(cocktail.prix ?? ''));
    setEditAlcool(Boolean(cocktail.alcool));

    const currentStock = stockMap?.[cocktail.id];
    setEditQuantite(currentStock ? String(currentStock.quantite) : '0');
    setEditUnite(currentStock?.unite || 'unités');
    setEditSeuilMinimum(currentStock?.seuil_minimum ? String(currentStock.seuil_minimum) : '5');

    setIsEditModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNom = nom.trim();
    const parsedPrix = Number(prix.toString().replace(',', '.'));
    const parsedQuantite = Number(quantite);
    const parsedSeuil = Number(seuilMinimum);

    if (!trimmedNom || Number.isNaN(parsedPrix) || parsedPrix < 0) {
      showToast('Veuillez renseigner un nom et un prix valide.', 'error');
      return;
    }

    if (Number.isNaN(parsedQuantite) || parsedQuantite < 0) {
      showToast('Veuillez renseigner un stock initial valide.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        nom: trimmedNom,
        categorie,
        prix: parsedPrix,
        alcool: alcool ? 1 : 0,
        quantite: parsedQuantite,
        seuil_minimum: parsedSeuil,
        unite: unite.trim() || 'unités',
      };

      const created = await barService.createBarProduct(payload);

      showToast('Boisson et stock ajoutés avec succès', 'success');
      if (onProductAdded) {
        onProductAdded(created);
      }
      if (onStockUpdate) {
        onStockUpdate();
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast("Erreur lors de la création de la boisson", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const trimmedNom = editNom.trim();
    const parsedPrix = Number(editPrix.toString().replace(',', '.'));
    const parsedQuantite = Number(editQuantite);
    const parsedSeuil = Number(editSeuilMinimum);

    if (!trimmedNom || Number.isNaN(parsedPrix) || parsedPrix < 0) {
      showToast('Veuillez renseigner un nom et un prix valide.', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const payload: Record<string, any> = {
        nom: trimmedNom,
        categorie: editCategorie,
        prix: parsedPrix,
        alcool: editAlcool ? 1 : 0,
        quantite: Number.isNaN(parsedQuantite) ? 0 : parsedQuantite,
        seuil_minimum: Number.isNaN(parsedSeuil) ? 5 : parsedSeuil,
        unite: editUnite.trim() || 'unités',
      };

      const updated = await barService.updateBarProduct(editingProduct.id, payload);

      showToast('Boisson modifiée avec succès', 'success');

      if (onProductUpdated) {
        onProductUpdated({
          ...editingProduct,
          ...(typeof updated === 'object' && updated !== null ? updated : {}),
          nom: trimmedNom,
          categorie: editCategorie,
          prix: parsedPrix,
          alcool: editAlcool ? 1 : 0,
        });
      }

      if (onStockUpdate) {
        onStockUpdate();
      }
      setIsEditModalOpen(false);
    } catch (err) {
      showToast("Erreur lors de la modification de la boisson", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette boisson ?')) return;

    try {
      await barService.deleteBarProduct(productId);
      showToast('Boisson supprimée avec succès', 'success');
      if (onProductDeleted) {
        onProductDeleted(productId);
      }
      if (onStockUpdate) {
        onStockUpdate();
      }
    } catch (err) {
      showToast("Erreur lors de la suppression de la boisson", 'error');
    }
  };

  // Filtrer les cocktails selon la barre de recherche
  const filteredCocktails = cocktails.filter((cocktail) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      (cocktail.nom && cocktail.nom.toLowerCase().includes(query)) ||
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
              // onAddToOrder omis pour éviter la diminution du stock au clic sur la ligne
              onEdit={() => handleOpenEditModal(cocktail)}
              onDelete={() => handleDeleteProduct(cocktail.id)}
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

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stock initial"
              type="number"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="Ex: 50"
            />
            <Input
              label="Seuil d'alerte min."
              type="number"
              value={seuilMinimum}
              onChange={(e) => setSeuilMinimum(e.target.value)}
              placeholder="Ex: 5"
            />
          </div>

          <Input
            label="Unité (ex: bouteilles, portions, verres)"
            value={unite}
            onChange={(e) => setUnite(e.target.value)}
            placeholder="Ex: bouteilles"
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

      {/* Modal de modification de boisson */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modifier la boisson" size="md">
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <Input
            label="Nom de la boisson"
            value={editNom}
            onChange={(e) => setEditNom(e.target.value)}
            placeholder="Ex: Mojito, Whisky..."
          />
          <Select
            label="Catégorie"
            value={editCategorie}
            onChange={(e) => setEditCategorie(e.target.value)}
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
            value={editPrix}
            onChange={(e) => setEditPrix(e.target.value)}
            placeholder="Ex: 4000"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stock actuel"
              type="number"
              value={editQuantite}
              onChange={(e) => setEditQuantite(e.target.value)}
              placeholder="Ex: 50"
            />
            <Input
              label="Seuil d'alerte min."
              type="number"
              value={editSeuilMinimum}
              onChange={(e) => setEditSeuilMinimum(e.target.value)}
              placeholder="Ex: 5"
            />
          </div>

          <Input
            label="Unité (ex: bouteilles, portions, verres)"
            value={editUnite}
            onChange={(e) => setEditUnite(e.target.value)}
            placeholder="Ex: bouteilles"
          />

          <Select
            label="Contient de l'alcool ?"
            value={editAlcool ? 'oui' : 'non'}
            onChange={(e) => setEditAlcool(e.target.value === 'oui')}
            options={[
              { value: 'oui', label: 'Oui' },
              { value: 'non', label: 'Non' },
            ]}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Modification...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
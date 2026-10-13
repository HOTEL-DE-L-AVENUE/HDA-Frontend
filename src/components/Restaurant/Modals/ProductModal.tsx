// src/components/Restaurant/Modals/ProductModal.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Input, Select, Button } from '../../UI';
import { useToast } from '../../../context/ToastContext';
import * as restaurantService from '../../../services/restaurantService';
import type { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  products: Product[];
  editingProduct?: Product | null;
}

interface RecipeIngredientDraft {
  key: string;
  ingredient_id: number | null;
  nom: string;
  unite: string;
  quantite: number;
}

const normalizeProductName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const isSimilarProductName = (first: string, second: string) => {
  const firstName = normalizeProductName(first);
  const secondName = normalizeProductName(second);
  return Boolean(firstName && secondName && firstName === secondName);
};

const isOtherCategory = (name: string) => {
  const normalizedName = normalizeProductName(name);
  return normalizedName === 'autre' || normalizedName === 'autres';
};

const NEW_UNIT_VALUE = '__new_unit__';

const normalizeUnitText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const unitCodeFromName = (name: string) => normalizeUnitText(name)
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const matchUnitCode = (rawUnit: string, units: restaurantService.RestaurantUnit[]) => {
  const key = normalizeUnitText(rawUnit);
  return units.find((unit) => normalizeUnitText(unit.code) === key || normalizeUnitText(unit.nom) === key)?.code ?? rawUnit;
};

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  editingProduct
}) => {
  const { showToast } = useToast();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [codePreviewError, setCodePreviewError] = useState<string | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<restaurantService.RestaurantIngredient[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientDraft[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [ingredientsLoadError, setIngredientsLoadError] = useState<string | null>(null);
  const [units, setUnits] = useState<restaurantService.RestaurantUnit[]>([]);
  const [addingUnitKey, setAddingUnitKey] = useState<string | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [form, setForm] = useState({
    nom: '',
    code: '',
    prix_vente: 0,
    prix_achat: 0,
    unite: 'PIECE',
    type_produit: 'PRODUIT_FINI' as const,
    actif: true,
    couleur: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    setSubmissionError(null);
    if (editingProduct) {
      setForm({
        nom: editingProduct.nom || '',
        code: editingProduct.code || '',
        prix_vente: editingProduct.prix_vente || 0,
        prix_achat: editingProduct.prix_achat || 0,
        unite: editingProduct.unite || 'PIECE',
        type_produit: (editingProduct.type_produit || 'PRODUIT_FINI') as any,
        actif: editingProduct.actif ?? true,
        couleur: editingProduct.couleur || ''
      });
    } else {
      setForm({
        nom: '',
        code: '',
        prix_vente: 0,
        prix_achat: 0,
        unite: 'PIECE',
        type_produit: 'PRODUIT_FINI',
        actif: true,
        couleur: ''
      });
    }
    if (editingProduct) {
      setCodePreviewError(null);
      return;
    }

    let cancelled = false;
    setCodePreviewError(null);
    restaurantService.getNextRestaurantProductCode()
      .then((response) => {
        if (!response.success) throw new Error(response.message || 'Aperçu du code produit indisponible.');
        if (!cancelled) setForm((current) => ({ ...current, code: response.data.code }));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Erreur aperçu code plat Restaurant:', error);
        setCodePreviewError('Le code sera généré automatiquement à l\'enregistrement.');
      });
    return () => { cancelled = true; };
  }, [isOpen, editingProduct]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIngredientsLoading(true);
    setIngredientsLoadError(null);
    setSubmissionError(null);
    Promise.all([
      restaurantService.getRestaurantIngredients(),
      restaurantService.getUnits(),
      editingProduct
        ? restaurantService.getProductRecipe(editingProduct.id)
        : Promise.resolve({
          success: true,
          message: undefined,
          data: [] as Array<{
            ingredient_id: number;
            quantite: number;
            unite: string;
            ingredient_nom: string;
            ingredient_unite: string;
          }>,
        }),
    ])
      .then(([ingredientsResponse, unitsResponse, recipeResponse]) => {
        if (!ingredientsResponse.success) {
          throw new Error(ingredientsResponse.message || 'Impossible de charger les ingrédients disponibles.');
        }
        if (!unitsResponse.success) {
          throw new Error(unitsResponse.message || 'Impossible de charger les unités.');
        }
        if (!recipeResponse.success) {
          throw new Error(recipeResponse.message || 'Impossible de charger les ingrédients de ce plat.');
        }
        if (cancelled) return;
        setAvailableIngredients(ingredientsResponse.data);
        setUnits(unitsResponse.data);
        setRecipeIngredients(recipeResponse.data.map((ingredient, index) => ({
          key: `${ingredient.ingredient_id}-${index}`,
          ingredient_id: ingredient.ingredient_id,
          nom: ingredient.ingredient_nom,
          unite: matchUnitCode(ingredient.unite, unitsResponse.data),
          quantite: Number(ingredient.quantite),
        })));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Erreur chargement des ingrédients du plat:', error);
        const message = error instanceof Error ? error.message : 'Impossible de charger les ingrédients.';
        setIngredientsLoadError(message);
        setSubmissionError(message);
      })
      .finally(() => {
        if (!cancelled) setIngredientsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isOpen, editingProduct?.id]);

  const createCustomUnit = async (name: string): Promise<restaurantService.RestaurantUnit> => {
    const code = unitCodeFromName(name);
    const existing = units.find((unit) => unit.code === code || normalizeUnitText(unit.nom) === normalizeUnitText(name));
    if (existing) return existing;
    const response = await restaurantService.createUnit({ code, nom: name });
    if (!response.success) throw new Error(response.message || 'Impossible de créer cette unité.');
    setUnits((current) => [...current, response.data]);
    return response.data;
  };

  const handleAddUnit = async (rowKey: string) => {
    try {
      const unit = await createCustomUnit(newUnitName.trim());
      setRecipeIngredients((current) => current.map((row) => (
        row.key === rowKey ? { ...row, unite: unit.code } : row
      )));
      setAddingUnitKey(null);
      setNewUnitName('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible d\'ajouter cette unité.', 'error');
    }
  };

  const unitOptionsFor = (currentUnit: string) => {
    const options = units.map((unit) => ({ value: unit.code, label: unit.nom }));
    if (currentUnit && !options.some((option) => option.value === currentUnit)) {
      options.unshift({ value: currentUnit, label: currentUnit });
    }
    return [
      { value: '', label: 'Choisir' },
      ...options,
      { value: NEW_UNIT_VALUE, label: '+ Ajouter une unité' },
    ];
  };

  const handleSubmit = async () => {
    if (!form.nom.trim()) return;
    if (ingredientsLoading || ingredientsLoadError) return;
    const invalidIngredient = recipeIngredients.some((ingredient) => (
      !(ingredient.quantite > 0)
      || !ingredient.unite.trim()
      || !ingredient.ingredient_id
    ));
    if (invalidIngredient) {
      showToast('Chaque ingrédient doit être sélectionné dans le stock et avoir une unité et une quantité positive.', 'error');
      return;
    }

    if (!editingProduct) {
      const matches = products.filter((product) =>
        isSimilarProductName(product.nom, form.nom)
      );
      if (matches.length > 0) {
        showToast(`Le produit « ${form.nom.trim()} » est déjà enregistré et ne peut pas être ajouté une deuxième fois.`, 'error');
        return;
      }
    }
    setSubmissionError(null);

    try {
      const payload: Record<string, unknown> = {
        nom: form.nom.trim(),
        ingredients: recipeIngredients.map((ingredient) => ({
          ingredient_id: ingredient.ingredient_id,
          unite: ingredient.unite.trim(),
          quantite: ingredient.quantite
        }))
      };

      if (!editingProduct) {
        Object.assign(payload, {
          code: form.code,
          category_id: null,
          prix_vente: form.prix_vente,
          prix_achat: 0,
          unite: form.unite,
          type_produit: form.type_produit,
          actif: form.actif,
          couleur: form.couleur,
        });
      }
      await onSubmit(payload);
      onClose();
    } catch (error) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string; error?: { message?: string } };
        };
      };
      const responseMessage = apiError.response?.data?.message
        || apiError.response?.data?.error?.message;
      if (apiError.response?.status === 409) {
        showToast(responseMessage || `Conflit lors de l\'ajout du produit « ${form.nom.trim()} ». Vérifiez son nom et son code.`, 'error');
        return;
      }
      setSubmissionError(responseMessage || (error instanceof Error ? error.message : 'Impossible d\'ajouter ce produit. Veuillez réessayer.'));
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? "Modifier le plat" : "Ajouter un plat"} size="lg">
        <div className="space-y-4">
        <Input
          label="Nom du plat"
          value={form.nom}
          onChange={(e) => {
            setForm({ ...form, nom: e.target.value });
            setSubmissionError(null);
          }}
          placeholder="Ex: Burger Deluxe"
        />
        {editingProduct && (
          <p className="text-xs text-muted">Seul le nom du plat est modifié ici ; sa recette est gérée séparément ci-dessous.</p>
        )}
        {submissionError && (
          <p role="alert" className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {submissionError}
          </p>
        )}

        {!editingProduct && (
          <>
            <Input
              label="Code du plat"
              value={form.code}
              readOnly
              placeholder="Génération du code..."
            />
            {codePreviewError && <p className="text-xs text-muted">{codePreviewError}</p>}

            <Input
              label="Prix de vente (MGA)"
              type="number"
              value={form.prix_vente}
              onChange={(e) => setForm({ ...form, prix_vente: Number(e.target.value) })}
              placeholder="0"
              min={0}
              step={1000}
            />
          </>
        )}


        <section className="space-y-3 rounded-xl border border-base p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Ingrédients du plat</h3>
              <p className="text-xs text-muted">Sélectionnez les ingrédients disponibles dans le stock Restaurant et définissez la quantité nécessaire pour chaque ingrédient.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setRecipeIngredients((current) => [...current, {
                key: `${Date.now()}-${Math.random()}`,
                ingredient_id: null,
                nom: '',
                unite: '',
                quantite: 0,
              }])}
              disabled={ingredientsLoading}
            >
              <Plus size={15} /> Ajouter
            </Button>
          </div>
          {ingredientsLoading && <p className="text-xs text-muted">Chargement des ingrédients...</p>}
          {ingredientsLoadError && <p role="alert" className="text-sm text-red-400">{ingredientsLoadError}</p>}
          {!ingredientsLoading && recipeIngredients.length === 0 && (
            <p className="text-sm text-muted">Aucun ingrédient associé à ce plat.</p>
          )}
          {recipeIngredients.map((ingredient) => (
            <div key={ingredient.key} className="space-y-3 rounded-lg bg-surface-2 p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_110px_160px_auto]">
              <Select
                label="Ingrédient"
                value={ingredient.ingredient_id?.toString() || ''}
                onChange={(event) => {
                  const selectedId = Number(event.target.value);
                  const selected = availableIngredients.find((item) => item.id === selectedId);
                  setRecipeIngredients((current) => current.map((row) => (
                    row.key === ingredient.key
                      ? {
                        ...row,
                        ingredient_id: selectedId,
                        nom: selected?.nom || '',
                        unite: selected ? matchUnitCode(selected.unite, units) : '',
                      }
                      : row
                  )));
                }}
                options={[
                  { value: '', label: 'Sélectionner un ingrédient' },
                  ...availableIngredients.map((item) => ({ value: item.id.toString(), label: item.nom }))
                ]}
              />
              <Input
                label="Quantité"
                type="number"
                min={0.001}
                step={0.001}
                value={ingredient.quantite || ''}
                onChange={(event) => setRecipeIngredients((current) => current.map((row) => (
                  row.key === ingredient.key ? { ...row, quantite: Number(event.target.value) } : row
                )))}
                placeholder="0"
              />
              <Select
                label="Unité"
                value={ingredient.unite}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === NEW_UNIT_VALUE) {
                    setAddingUnitKey(ingredient.key);
                    setNewUnitName('');
                    return;
                  }
                  setRecipeIngredients((current) => current.map((row) => (
                    row.key === ingredient.key ? { ...row, unite: value } : row
                  )));
                }}
                options={unitOptionsFor(ingredient.unite)}
              />
              <button
                type="button"
                onClick={() => setRecipeIngredients((current) => current.filter((row) => row.key !== ingredient.key))}
                className="self-end rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                aria-label="Supprimer cet ingrédient"
              >
                <Trash2 size={17} />
              </button>
            </div>
            {addingUnitKey === ingredient.key && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input
                    autoFocus
                    label="Nouvelle unité"
                    value={newUnitName}
                    onChange={(event) => setNewUnitName(event.target.value)}
                    placeholder="Ex. Paquet, Cuillère à thé"
                  />
                </div>
                <Button onClick={() => handleAddUnit(ingredient.key)} disabled={!newUnitName.trim()}>
                  Ajouter l\'unité
                </Button>
                <Button variant="secondary" onClick={() => setAddingUnitKey(null)}>
                  Annuler
                </Button>
              </div>
            )}
            </div>
          ))}
        </section>


        {!editingProduct && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              checked={form.actif}
              onChange={(e) => setForm({ ...form, actif: e.target.checked })}
              className="w-4 h-4 rounded border-base bg-surface-2 text-accent focus:ring-accent/20"
            />
            <label className="text-secondary text-sm">Produit actif (disponible à la vente)</label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={ingredientsLoading || Boolean(ingredientsLoadError) || !form.nom.trim()}>
            {editingProduct ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </div>
      </Modal>
    </>
  );
};

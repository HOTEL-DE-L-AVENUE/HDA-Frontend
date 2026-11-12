// src/components/Bar/CocktailMenu.tsx
import React, { useEffect, useState } from 'react';
import { BarProduct } from '../../types/bar.type';
import { Button, Input, Modal, Select } from '../UI';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import barService from '../../services/bar.service';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/data';
import { ProductModal } from '../Restaurant/Modals/ProductModal';
import * as restaurantService from '../../services/restaurantService';
import type { Product as RestaurantProduct, Category } from '../Restaurant/types';

// Normalise un nom d'article pour détecter les doublons :
// "J&B (70 cl)" et "JB 70cl" donnent la même clé, "Gordon's" et "Gordons" aussi.
const FORMAT_REGEX = /(\d+(?:[.,]\d+)?)\s*(cl|ml|l)\b|\b(pm|gm)\b/g;

const normalizeName = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/(\d)[.,](\d)/g, '$1§$2') // protège les décimales (1,5 L = 1.5L)
  .replace(/[&'’`´.\-_/()[\]]/g, ' ')
  .replace(/§/g, '.')
  .replace(/\s+/g, ' ')
  .trim();

const getNameParts = (value: string) => {
  const normalized = normalizeName(value);
  const formats = new Set<string>();
  const base = normalized.replace(FORMAT_REGEX, (_match, qty, unit, size) => {
    formats.add(size ? size : `${String(qty).replace(',', '.')}${unit}`);
    return ' ';
  }).replace(/\s+/g, '');
  return { base, formats };
};

// Même nom de base et formats compatibles (identiques, ou l'un des deux sans format précisé)
const isSimilarName = (a: string, b: string) => {
  const pa = getNameParts(a);
  const pb = getNameParts(b);
  if (!pa.base || pa.base !== pb.base) return false;
  if (pa.formats.size === 0 || pb.formats.size === 0) return true;
  return [...pa.formats].some((format) => pb.formats.has(format));
};

interface Props {
  cocktails: BarProduct[];
  stockMap?: Record<number, { quantite: number; unite: string; seuil_minimum?: number }>;
  onStockUpdate?: () => void;
  onAddToOrder?: (cocktail: BarProduct) => boolean | void | Promise<void>;
  onProductAdded?: (newProduct: BarProduct) => void;
  onProductUpdated?: (updatedProduct: BarProduct) => void;
  onProductDeleted?: (productId: number) => void;
  userIsAdmin?: boolean; // Ajout de la prop
  compact?: boolean;
}

export const CocktailMenu: React.FC<Props> = ({
  cocktails,
  stockMap,
  onStockUpdate,
  onAddToOrder,
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  userIsAdmin = false,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Toutes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addItemType, setAddItemType] = useState<'boisson' | 'plat'>('boisson');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurantProducts, setRestaurantProducts] = useState<RestaurantProduct[]>([]);
  const [restaurantCategories, setRestaurantCategories] = useState<Category[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isModalOpen || addItemType !== 'plat') return;
    let cancelled = false;
    Promise.all([restaurantService.getProducts(), restaurantService.getCategories()])
      .then(([productsResponse, categoriesResponse]) => {
        if (cancelled) return;
        if (productsResponse.success) setRestaurantProducts(productsResponse.data as RestaurantProduct[]);
        if (categoriesResponse.success) setRestaurantCategories(categoriesResponse.data as Category[]);
      })
      .catch((error) => console.error('Erreur chargement du catalogue Restaurant:', error));
    return () => { cancelled = true; };
  }, [isModalOpen, addItemType]);

  // États du formulaire d'ajout
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Alcools');
  const [sousCategorie, setSousCategorie] = useState('');
  const [prix, setPrix] = useState('');
  const [quantite, setQuantite] = useState('');
  const [seuilMinimum, setSeuilMinimum] = useState('5');
  const [unite, setUnite] = useState('unités');
  const [alcool, setAlcool] = useState(true);

  // Articles similaires détectés avant l'ajout
  const [duplicateMatches, setDuplicateMatches] = useState<BarProduct[]>([]);

  // États du formulaire de modification
  const [editingProduct, setEditingProduct] = useState<BarProduct | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editCategorie, setEditCategorie] = useState('Alcools');
  const [editSousCategorie, setEditSousCategorie] = useState('');
  const [editPrix, setEditPrix] = useState('');
  const [editQuantite, setEditQuantite] = useState('');
  const [editSeuilMinimum, setEditSeuilMinimum] = useState('5');
  const [editUnite, setEditUnite] = useState('unités');
  const [editAlcool, setEditAlcool] = useState(true);

  const handleOpenModal = () => {
    setAddItemType('boisson');
    setNom('');
    setCategorie('Alcools');
    setSousCategorie('');
    setPrix('');
    setQuantite('');
    setSeuilMinimum('5');
    setUnite('unités');
    setAlcool(true);
    setIsModalOpen(true);
  };

  const handleCreateRestaurantProduct = async (formData: Record<string, any>) => {
    const { ingredients = [], category_nom, ...productData } = formData;
    let category: Category | null = null;
    if (typeof category_nom === 'string' && category_nom.trim()) {
      category = restaurantCategories.find((item) => item.nom.trim().toLocaleLowerCase() === category_nom.trim().toLocaleLowerCase()) || null;
      if (!category) {
        const response = await restaurantService.createCategory({ nom: category_nom.trim() });
        if (!response.success || !response.data) throw new Error(response.message || 'Création de la catégorie impossible.');
        category = response.data as Category;
        setRestaurantCategories((current) => [...current, category as Category]);
      }
    }

    const response = await restaurantService.createProduct({
      ...productData,
      category_id: category?.id ?? null,
      prix_achat: 0,
      ingredients,
    });
    if (!response.success) throw new Error(response.message || 'Création du plat impossible.');
    showToast('Plat ajouté avec succès au menu du Restaurant.', 'success');
    setIsModalOpen(false);
    setAddItemType('boisson');
  };

  const handleOpenEditModal = (cocktail: BarProduct) => {
    setEditingProduct(cocktail);
    setEditNom(cocktail.nom || '');
    const [productCategory, productSubcategory = ''] = (cocktail.categorie || 'Alcools').split(/\s*(?:>|\/|\|)\s*/);
    setEditCategorie(productCategory || 'Alcools');
    setEditSousCategorie(productSubcategory);
    setEditPrix(String(cocktail.prix ?? ''));
    setEditAlcool(Boolean(cocktail.alcool));

    const currentStock = stockMap?.[cocktail.id];
    setEditQuantite(currentStock ? String(currentStock.quantite) : '0');
    setEditUnite(currentStock?.unite || 'unités');
    setEditSeuilMinimum(currentStock?.seuil_minimum ? String(currentStock.seuil_minimum) : '5');

    setIsEditModalOpen(true);
  };

  const getSubcategories = (category: string) => {
    if (category === 'Cocktails') return ['Avec alcool', 'Sans alcool'];
    if (category === 'Bières & Soft') return ['PM', 'GM'];
    return [];
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct(false);
  };

  // Ouvre la modification de l'article déjà inscrit à la place d'un nouvel ajout
  const handleEditExisting = (product: BarProduct) => {
    setDuplicateMatches([]);
    setIsModalOpen(false);
    handleOpenEditModal(product);
  };

  const createProduct = async (force: boolean) => {
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

    if (!force) {
      const matches = cocktails.filter((product) => isSimilarName(product.nom || '', trimmedNom));
      if (matches.length > 0) {
        setDuplicateMatches(matches);
        return;
      }
    }

    try {
      setIsSaving(true);
      setDuplicateMatches([]);
      const payload = {
        nom: trimmedNom,
        categorie: sousCategorie ? `${categorie} > ${sousCategorie}` : categorie,
        prix: parsedPrix,
        alcool,
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

      const payload = {
        nom: trimmedNom,
        categorie: editSousCategorie ? `${editCategorie} > ${editSousCategorie}` : editCategorie,
        prix: parsedPrix,
        alcool: editAlcool,
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
          categorie: editSousCategorie ? `${editCategorie} > ${editSousCategorie}` : editCategorie,
          prix: parsedPrix,
          alcool: editAlcool,
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

  const getCategoryParts = (cocktail: BarProduct) => {
    const [category, subcategory] = (cocktail.categorie || 'Autres')
      .split(/\s*(?:>|\/|\|)\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
    return { category: category || 'Autres', subcategory: subcategory || '' };
  };

  const categoryNames = ['Toutes', ...Array.from(new Set(cocktails.map((cocktail) => getCategoryParts(cocktail).category)))];
  const subcategoryNames = ['Toutes', ...Array.from(new Set(
    cocktails
      .filter((cocktail) => selectedCategory === 'Toutes' || getCategoryParts(cocktail).category === selectedCategory)
      .map((cocktail) => getCategoryParts(cocktail).subcategory)
      .filter(Boolean)
  ))];

  // Filtrer les articles selon la recherche et la navigation du terminal.
  const filteredCocktails = cocktails.filter((cocktail) => {
    const query = searchTerm.trim().toLowerCase();
    const parts = getCategoryParts(cocktail);
    const matchesSearch = !query || cocktail.nom.toLowerCase().includes(query) || cocktail.categorie.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'Toutes' || parts.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'Toutes' || parts.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('Toutes');
    setSearchTerm('');
  };

  const handleAddArticle = async (cocktail: BarProduct) => {
    const stock = stockMap?.[cocktail.id];
    if (!stock || stock.quantite <= 0) {
      showToast('Rupture de stock', 'error');
      return;
    }

    try {
      const added = await onAddToOrder?.(cocktail);
      if (added === false) {
        showToast("Créez d'abord une commande", 'error');
        return;
      }
      showToast(`${cocktail.nom} ajouté`, 'success');
    } catch {
      showToast("Erreur lors de l'ajout", 'error');
    }
  };

  const menuItems = filteredCocktails.filter((cocktail) => {
    const parts = getCategoryParts(cocktail);
    return (selectedCategory === 'Toutes' || parts.category === selectedCategory)
      && (selectedSubcategory === 'Toutes' || parts.subcategory === selectedSubcategory);
  });
  const hasRestaurantMenuItems = filteredCocktails.some((cocktail) => cocktail.source_module === 'RESTAURANT');

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex flex-col rounded-xl border border-base bg-surface shadow-sm sm:flex-row sm:items-center sm:justify-between ${compact ? 'gap-2 p-2 sm:gap-3' : 'gap-4 p-4'}`}>
        <div>
          {!compact && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Bar & Lounge</p>}
          <h2 className={`font-bold text-primary ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
            {hasRestaurantMenuItems ? 'Plats et boissons disponibles' : 'Les boissons disponibles'}
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un article" className="w-full pl-9 text-xs sm:text-sm" />
          </div>
          {userIsAdmin && (
            <Button icon={<Plus size={18} />} onClick={handleOpenModal} className="whitespace-nowrap">
              Ajouter une boisson
            </Button>
          )}
        </div>
      </div>

      {filteredCocktails.length === 0 ? (
        <div className="rounded-xl border border-base bg-surface py-12 text-center text-sm text-slate-500 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          Aucune boisson trouvée.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-base bg-[#101415] p-2 shadow-md lg:grid-cols-[160px_minmax(0,1fr)]">
          <aside className="sticky top-0 z-20 self-start border-b border-base bg-[#171b1c] pb-2 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:pb-0">
            <div className="flex gap-2 overflow-x-auto p-1 lg:flex-col lg:gap-1">
              {categoryNames.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button key={category} type="button" aria-pressed={active} onClick={() => selectCategory(category)} className={`flex min-h-11 shrink-0 items-center rounded-lg px-3 py-3 text-left text-xs font-semibold transition lg:w-full ${active ? 'bg-red-500 text-white shadow-lg shadow-red-950/30' : 'bg-transparent text-secondary hover:bg-surface-3'}`}>
                    <span>{category}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col">
            {subcategoryNames.length > 1 && (
              <div className="mb-3 flex shrink-0 gap-2 overflow-x-auto border-b border-base pb-3">
                {subcategoryNames.map((subcategory) => (
                  <button key={subcategory} type="button" aria-pressed={selectedSubcategory === subcategory} onClick={() => setSelectedSubcategory(subcategory)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition ${selectedSubcategory === subcategory ? 'bg-sky-500 text-white' : 'bg-[#30343a] text-muted hover:text-primary'}`}>
                    {subcategory}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 content-start gap-3 pr-1 lg:grid-cols-4">
              {menuItems.map((cocktail) => {
                const stock = stockMap?.[cocktail.id];
                const isRestaurantMenuItem = cocktail.source_module === 'RESTAURANT';
                const isOutOfStock = !isRestaurantMenuItem && (!stock || stock.quantite <= 0);
                return (
                  <div key={cocktail.id} className={`group relative min-h-[112px] rounded-xl border p-3 text-left transition hover:-translate-y-0.5 ${isOutOfStock ? 'border-red-800 bg-red-600 hover:bg-red-600' : 'border-emerald-700/40 bg-[#00bd83] hover:bg-[#00ca8c]'}`}>
                    {onAddToOrder ? (
                      <button type="button" disabled={isOutOfStock} onClick={() => void handleAddArticle(cocktail)} className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-white disabled:cursor-not-allowed">
                        <span className="text-sm font-bold leading-tight">{cocktail.nom}</span>
                        <span className="text-xs font-semibold text-emerald-950">{formatCurrency(cocktail.prix)}</span>
                        {!isRestaurantMenuItem && (
                          <span className={`text-[11px] font-semibold ${isOutOfStock ? 'text-white' : 'text-emerald-950'}`}>
                            Stock : {stock?.quantite ?? 0} {stock?.unite || 'unités'}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-white">
                        <span className="text-sm font-bold leading-tight">{cocktail.nom}</span>
                        <span className="text-xs font-semibold text-emerald-950">{formatCurrency(cocktail.prix)}</span>
                        {!isRestaurantMenuItem && (
                          <span className={`text-[11px] font-semibold ${isOutOfStock ? 'text-white' : 'text-emerald-950'}`}>
                            Stock : {stock?.quantite ?? 0} {stock?.unite || 'unités'}
                          </span>
                        )}
                      </div>
                    )}
                    {userIsAdmin && !isRestaurantMenuItem && (
                      <div className="absolute right-1.5 top-1.5 hidden gap-1 group-hover:flex group-focus-within:flex [@media(hover:none)]:flex" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => handleOpenEditModal(cocktail)} className="rounded bg-black/20 p-1 text-white" title="Modifier"><Edit3 size={13} /></button>
                        <button type="button" onClick={() => void handleDeleteProduct(cocktail.id)} className="rounded bg-black/20 p-1 text-white" title="Supprimer"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Modal d'ajout de boisson */}
      <Modal isOpen={isModalOpen && addItemType === 'boisson'} onClose={() => setIsModalOpen(false)} title="Ajouter une nouvelle boisson" size="md">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <section className="space-y-2 rounded-xl border border-base bg-surface-2 p-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">Type de produit</h3>
              <p className="text-xs text-muted">Choisissez ce que vous souhaitez ajouter.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'boisson', label: 'Boisson' },
                { value: 'plat', label: 'Plat' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={addItemType === option.value}
                  onClick={() => setAddItemType(option.value)}
                  className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${addItemType === option.value
                    ? 'border-accent bg-accent/15 text-primary'
                    : 'border-base bg-surface text-secondary hover:bg-surface-3'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
          <Input
            label="Nom de la boisson"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex: Mojito, Whisky..."
          />
          <>
            <Input
              label="Catégorie"
              value={categorie}
              onChange={(e) => { setCategorie(e.target.value); setSousCategorie(''); }}
              placeholder="Saisir ou rechercher une catégorie"
              list="bar-product-categories"
            />
            <datalist id="bar-product-categories">
              {categoryNames.filter((category) => category !== 'Toutes').map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </>
          {getSubcategories(categorie).length > 0 && (
            <Select
              label="Sous-catégorie"
              value={sousCategorie}
              onChange={(e) => setSousCategorie(e.target.value)}
              options={[{ value: '', label: 'Sélectionner une sous-catégorie' }, ...getSubcategories(categorie).map((value) => ({ value, label: value }))]}
            />
          )}
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
      <ProductModal
        isOpen={isModalOpen && addItemType === 'plat'}
        onClose={() => { setIsModalOpen(false); setAddItemType('boisson'); }}
        onSubmit={handleCreateRestaurantProduct}
        products={restaurantProducts}
      />

      {/* Avertissement : article déjà inscrit */}
      <Modal isOpen={duplicateMatches.length > 0} onClose={() => setDuplicateMatches([])} title="Article déjà inscrit" size="md">
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            « <span className="font-semibold text-primary">{nom.trim()}</span> » ressemble à {duplicateMatches.length > 1 ? 'des articles déjà inscrits' : 'un article déjà inscrit'}.
            Voulez-vous modifier l'article existant plutôt que d'en créer un nouveau ?
          </p>

          <div className="space-y-2">
            {duplicateMatches.map((product) => {
              const stock = stockMap?.[product.id];
              return (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-base bg-surface-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{product.nom}</p>
                    <p className="text-xs text-muted">
                      {product.categorie || 'Sans catégorie'} · {formatCurrency(product.prix)}
                      {stock ? ` · Stock : ${stock.quantite} ${stock.unite}` : ''}
                    </p>
                  </div>
                  <Button type="button" icon={<Edit3 size={14} />} onClick={() => handleEditExisting(product)} className="shrink-0">
                    Modifier
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setDuplicateMatches([])} className="flex-1">
              Annuler
            </Button>
            <Button variant="secondary" type="button" onClick={() => void createProduct(true)} className="flex-1" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Ajouter quand même'}
            </Button>
          </div>
        </div>
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
          <>
            <Input
              label="Catégorie"
              value={editCategorie}
              onChange={(e) => { setEditCategorie(e.target.value); setEditSousCategorie(''); }}
              placeholder="Saisir ou rechercher une catégorie"
              list="bar-product-edit-categories"
            />
            <datalist id="bar-product-edit-categories">
              {categoryNames.filter((category) => category !== 'Toutes').map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </>
          {getSubcategories(editCategorie).length > 0 && (
            <Select
              label="Sous-catégorie"
              value={editSousCategorie}
              onChange={(e) => setEditSousCategorie(e.target.value)}
              options={[{ value: '', label: 'Sélectionner une sous-catégorie' }, ...getSubcategories(editCategorie).map((value) => ({ value, label: value }))]}
            />
          )}
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

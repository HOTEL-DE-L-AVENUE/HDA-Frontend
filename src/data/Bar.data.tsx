
import { BarProduct, BestSeller } from '../types/bar.type';
import { formatCurrency } from '../utils/data';

// ─── Navigation ───────────────────────────────────────────────────────────────

export const BAR_TABS = [
  { id: 'bar',    label: 'Bar & Cocktails' },
  { id: 'stock',  label: 'Stock'           },
  { id: 'caisse', label: 'Caisse'          },
] as const;

export type BarTabId = typeof BAR_TABS[number]['id'];

// ─── Carte des cocktails (products côté BDD) ──────────────────────────────────
// En production, ces données viennent de GET /api/products?type=PRODUIT_FINI&module=bar

export const COCKTAIL_MENU: BarProduct[] = [
  { id: 'b1', nom: 'HDA Signature',    ingredients: 'Champagne, cognac VSOP, bitter orange, gold leaf',            prix: 48, categorie: 'Signature',   alcool: true  },
  { id: 'b2', nom: 'Negroni Prestige', ingredients: 'Gin premium, Campari, Vermouth rouge, orange',                prix: 28, categorie: 'Classique',   alcool: true  },
  { id: 'b3', nom: 'Royal Mojito',     ingredients: 'Rhum blanc, citron vert, menthe fraîche, sucre, perrier',     prix: 22, categorie: 'Classique',   alcool: true  },
  { id: 'b4', nom: 'Whisky Sour Gold', ingredients: "Bourbon 18 ans, citron, blanc d'œuf, Angostura",              prix: 35, categorie: 'Premium',     alcool: true  },
  { id: 'b5', nom: 'Coucher de Soleil',ingredients: "Jus d'orange, grenadine, tequila premium, sel fumé",          prix: 24, categorie: 'Fruité',      alcool: true  },
  { id: 'b6', nom: 'Elixir Vert',      ingredients: 'Concombre, basilic, citron vert, eau pétillante',             prix: 18, categorie: 'Sans alcool', alcool: false },
  { id: 'b7', nom: 'Bellini Blanc',    ingredients: 'Prosecco, pêche blanche fraîche, touches florales',           prix: 26, categorie: 'Bulles',      alcool: true  },
  { id: 'b8', nom: 'Absinthe Rituel',  ingredients: "Absinthe verte, louche d'eau glacée, cube de sucre",          prix: 30, categorie: 'Tradition',   alcool: true  },
];

// ─── Meilleures ventes (calculé via orders + order_items côté BDD) ────────────
// En production : GET /api/bar/best-sellers

export const BEST_SELLERS: BestSeller[] = [
  { nom: 'Whisky 18Y',     ventes: 42, montant: formatCurrency(42 * 180) },
  { nom: 'HDA Signature',  ventes: 38, montant: formatCurrency(38 * 48)  },
  { nom: 'Champagne Rosé', ventes: 29, montant: formatCurrency(29 * 95)  },
];

// Référence pour normaliser la barre de progression
export const BEST_SELLERS_MAX_VENTES = 50;
import React, { useState } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { useHDA } from '../context/HDAContext';
import { formatCurrency } from '../utils/data';
import { Wine, Star, Music } from 'lucide-react';

const tabs = [
  { id: 'bar', label: 'Bar & Cocktails' },
  { id: 'stock', label: 'Stock' },
  { id: 'caisse', label: 'Caisse' },
];

const cocktailMenu = [
  { id: 'b1', nom: 'HDA Signature', ingredients: 'Champagne, cognac VSOP, bitter orange, gold leaf', prix: 48, categorie: 'Signature', alcool: true },
  { id: 'b2', nom: 'Negroni Prestige', ingredients: 'Gin premium, Campari, Vermouth rouge, orange', prix: 28, categorie: 'Classique', alcool: true },
  { id: 'b3', nom: 'Royal Mojito', ingredients: 'Rhum blanc, citron vert, menthe fraîche, sucre, perrier', prix: 22, categorie: 'Classique', alcool: true },
  { id: 'b4', nom: 'Whisky Sour Gold', ingredients: 'Bourbon 18 ans, citron, blanc d\'œuf, Angostura', prix: 35, categorie: 'Premium', alcool: true },
  { id: 'b5', nom: 'Coucher de Soleil', ingredients: 'Jus d\'orange, grenadine, tequila premium, sel fumé', prix: 24, categorie: 'Fruité', alcool: true },
  { id: 'b6', nom: 'Elixir Vert', ingredients: 'Concombre, basilic, citron vert, eau pétillante', prix: 18, categorie: 'Sans alcool', alcool: false },
  { id: 'b7', nom: 'Bellini Blanc', ingredients: 'Prosecco, pêche blanche fraîche, touches florales', prix: 26, categorie: 'Bulles', alcool: true },
  { id: 'b8', nom: 'Absinthe Rituel', ingredients: 'Absinthe verte, louche d\'eau glacée, cube de sucre', prix: 30, categorie: 'Tradition', alcool: true },
];

const bestSellers = [
  { nom: 'Whisky 18Y', ventes: 42, montant: formatCurrency(42 * 180) },
  { nom: 'HDA Signature', ventes: 38, montant: formatCurrency(38 * 48) },
  { nom: 'Champagne Rosé', ventes: 29, montant: formatCurrency(29 * 95) },
];

export const BarPage: React.FC = () => {
  const { getModuleCaisseSolde } = useHDA();
  const [activeTab, setActiveTab] = useState('bar');
  const { solde, entrees, sorties } = getModuleCaisseSolde('bar');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Bar & Lounge</h2>
          <p className="text-slate-500 text-sm mt-1">Cocktails premium & service bar</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
          <Wine size={24} className="text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-500 text-xs mb-1">Revenu Bar</p>
          <p className="text-white font-bold text-xl">{formatCurrency(solde)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-500 text-xs mb-1">Entrées</p>
          <p className="text-emerald-400 font-bold text-xl">{formatCurrency(entrees)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-500 text-xs mb-1">Sorties</p>
          <p className="text-red-400 font-bold text-xl">{formatCurrency(sorties)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800/50 rounded-2xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'bar' && (
        <div className="space-y-6">
          {/* Ambient Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900/50 via-slate-900 to-pink-900/50 border border-rose-800/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Music size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">HDA Lounge — Ambiance Jazz Live</h3>
                <p className="text-slate-400 text-sm">Ouvert de 17h à 2h • DJ & Artistes live le week-end</p>
              </div>
              <div className="ml-auto hidden md:flex items-center gap-2 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-sm font-medium">En direct</span>
              </div>
            </div>
          </div>

          {/* Cocktail Menu */}
          <h3 className="text-white font-semibold">Carte des Cocktails</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cocktailMenu.map(cocktail => (
              <div key={cocktail.id} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5 hover:border-rose-800/40 hover:shadow-lg hover:shadow-rose-950/20 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-rose-600 to-pink-600 text-white">
                    {cocktail.categorie}
                  </span>
                  {!cocktail.alcool && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Sans alcool</span>
                  )}
                </div>
                <h4 className="text-white font-semibold mb-2">{cocktail.nom}</h4>
                <p className="text-slate-500 text-xs mb-4 leading-relaxed">{cocktail.ingredients}</p>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold text-lg">{formatCurrency(cocktail.prix)}</span>
                  <button className="w-8 h-8 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 flex items-center justify-center text-rose-400 transition-all text-lg">
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Best Sellers */}
          <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Star size={16} className="text-amber-400" />
              Meilleures Ventes
            </h3>
            <div className="space-y-3">
              {bestSellers.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-xs">#{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm font-medium">{item.nom}</span>
                      <span className="text-amber-400 font-semibold text-sm">{item.montant}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-500" style={{ width: `${(item.ventes / 50) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs w-14 text-right">{item.ventes} ventes</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stock' && <StockManager module="bar" categories={['Spiritueux', 'Vins', 'Bières', 'Soft', 'Sirop', 'Champagne', 'Autre']} />}
      {activeTab === 'caisse' && <CaisseManager module="bar" categories={['Ventes Bar', 'Stock', 'Personnel', 'Événement', 'Autre']} title="Caisse Bar & Lounge" gradient="from-rose-500 to-pink-600" />}
    </div>
  );
};

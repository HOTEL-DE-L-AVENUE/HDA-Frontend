import React, { useState } from 'react';
import { StockManager, CaisseManager } from '../components/StockManager';
import { Hotel, Wifi, Coffee, Car, Sparkles } from 'lucide-react';
import { useHDA } from '../context/HDAContext';
import { formatCurrency } from '../utils/data';

const tabs = [
  { id: 'services', label: 'Services' },
  { id: 'stock', label: 'Stock' },
  { id: 'caisse', label: 'Caisse' },
];

const hotelServices = [
  { id: 'h1', nom: 'Spa & Bien-être', description: 'Accès complet au spa, sauna, hammam', prix: 85, icon: <Sparkles size={20} />, disponible: true, couleur: 'from-pink-500 to-rose-600' },
  { id: 'h2', nom: 'Wi-Fi Premium', description: 'Connexion haut débit illimitée', prix: 15, icon: <Wifi size={20} />, disponible: true, couleur: 'from-blue-500 to-cyan-600' },
  { id: 'h3', nom: 'Petit Déjeuner Buffet', description: 'Buffet continental & chaud', prix: 32, icon: <Coffee size={20} />, disponible: true, couleur: 'from-amber-500 to-orange-500' },
  { id: 'h4', nom: 'Service Voiturier', description: 'Parking sécurisé avec voiturier', prix: 45, icon: <Car size={20} />, disponible: false, couleur: 'from-slate-600 to-slate-700' },
  { id: 'h5', nom: 'Suite Présidentielle', description: 'Vue panoramique, butler 24h/24', prix: 1200, icon: <Hotel size={20} />, disponible: true, couleur: 'from-violet-500 to-purple-600' },
  { id: 'h6', nom: 'Conciergerie VIP', description: 'Service personnalisé exclusif', prix: 250, icon: <Sparkles size={20} />, disponible: true, couleur: 'from-gold-500 to-amber-600' },
];

export const HotelPage: React.FC = () => {
  const { getModuleCaisseSolde } = useHDA();
  const [activeTab, setActiveTab] = useState('services');
  const { solde, entrees, sorties } = getModuleCaisseSolde('hotel');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Hôtel</h2>
          <p className="text-slate-500 text-sm mt-1">Gestion des services hôteliers premium</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
          <Hotel size={24} className="text-white" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5">
          <p className="text-slate-500 text-xs mb-1">Revenu Hôtel</p>
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

      {/* Tab Content */}
      {activeTab === 'services' && (
        <div>
          <h3 className="text-white font-semibold mb-4">Services Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotelServices.map(service => (
              <div key={service.id} className="bg-slate-900 border border-slate-800/50 rounded-2xl p-5 hover:border-slate-700/50 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${service.couleur} flex items-center justify-center text-white`}>
                    {service.icon}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.disponible 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                  }`}>
                    {service.disponible ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
                <h4 className="text-white font-semibold mb-1">{service.nom}</h4>
                <p className="text-slate-500 text-sm mb-4">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold text-lg">{formatCurrency(service.prix)}</span>
                  <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    service.disponible 
                      ? 'bg-white/10 text-white hover:bg-white/15' 
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}>
                    Réserver
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'stock' && <StockManager module="hotel" categories={['Linge', 'Bien-être', 'Nourriture', 'Décoration', 'Électronique', 'Autre']} />}
      {activeTab === 'caisse' && <CaisseManager module="hotel" categories={['Hébergement', 'Services', 'Spa', 'Restauration', 'Maintenance', 'Autre']} title="Caisse Hôtel" gradient="from-indigo-500 to-blue-600" />}
    </div>
  );
};

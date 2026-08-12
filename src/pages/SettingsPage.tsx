import React from 'react';
import { Settings as SettingsIcon, Lock, Bell, Palette, Globe, Shield, Info } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const settingsCategories = [
    {
      title: 'Sécurité',
      description: 'Gérer votre mot de passe et la sécurité du compte',
      icon: <Lock size={20} className="text-black" />,
      items: [
        { label: 'Changer le mot de passe', action: 'Coming soon' },
        { label: 'Historique de connexion', action: 'Coming soon' },
      ],
    },
    {
      title: 'Notifications',
      description: 'Configurer les alertes et notifications',
      icon: <Bell size={20} className="text-black" />,
      items: [
        { label: 'Notifications email', action: 'Coming soon' },
        { label: 'Notifications push', action: 'Coming soon' },
      ],
    },
    {
      title: 'Apparence',
      description: 'Personnaliser l\'interface',
      icon: <Palette size={20} className="text-black" />,
      items: [
        { label: 'Thème', action: 'Coming soon' },
        { label: 'Langue', action: 'Coming soon' },
      ],
    },
    {
      title: 'Général',
      description: 'Paramètres généraux de l\'application',
      icon: <Globe size={20} className="text-black" />,
      items: [
        { label: 'Zone horaire', action: 'Coming soon' },
        { label: 'Format de date', action: 'Coming soon' },
      ],
    },
    {
      title: 'Confidentialité',
      description: 'Gérer vos données personnelles',
      icon: <Shield size={20} className="text-black" />,
      items: [
        { label: 'Exporter mes données', action: 'Coming soon' },
        { label: 'Supprimer mon compte', action: 'Coming soon' },
      ],
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="w-full">
        <h2 className="text-primary text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
          Paramètres
        </h2>
        <p className="text-muted text-sm">Configurez vos préférences et paramètres de compte</p>
      </div>

      {/* Info Banner */}
      <div
        className="p-4 rounded-xl flex items-start gap-3"
        style={{
          backgroundColor: 'var(--color-info-bg)',
          border: '1px solid var(--color-info)',
        }}
      >
        <Info size={20} className="text-info flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-primary font-medium text-sm mb-1">Paramètres en développement</p>
          <p className="text-muted text-xs">
            Les fonctionnalités de paramètres sont actuellement en cours de développement. 
            Certaines options peuvent ne pas être disponibles.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {settingsCategories.map((category, index) => (
          <div
            key={index}
            className="rounded-2xl p-5"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Category Header */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  boxShadow: 'var(--shadow-accent)',
                }}
              >
                {category.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-primary font-semibold mb-1">{category.title}</h3>
                <p className="text-muted text-xs">{category.description}</p>
              </div>
            </div>

            {/* Category Items */}
            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span className="text-primary text-sm font-medium">{item.label}</span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: 'var(--color-surface-3)',
                      color: 'var(--color-muted)',
                    }}
                  >
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div
        className="p-5 rounded-2xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <SettingsIcon size={20} className="text-muted" />
          <h3 className="text-primary font-semibold">Informations système</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-muted text-xs mb-1">Version</p>
            <p className="text-primary text-sm font-medium">1.0.0</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Environnement</p>
            <p className="text-primary text-sm font-medium">Production</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Dernière mise à jour</p>
            <p className="text-primary text-sm font-medium">12 Août 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
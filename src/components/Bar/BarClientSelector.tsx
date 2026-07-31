import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Input, Select } from '../UI';
import { clientService, type Client } from '../../services/client.service';

interface Props {
  value: number | '';
  onChange: (clientId: number | '') => void;
}

const labelFor = (client: Client) =>
  `${client.nom}${client.prenom ? ` ${client.prenom}` : ''}${client.code_client ? ` (${client.code_client})` : ''}`;

export const BarClientSelector: React.FC<Props> = ({ value, onChange }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    clientService.getClients({ statut: 'ACTIF' })
      .then(setClients)
      .catch(() => setMessage('Impossible de charger la liste des clients.'));
  }, []);

  const createClient = async () => {
    if (!nom.trim()) {
      setMessage('Le nom du client est requis.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const created = await clientService.createClient({
        nom: nom.trim(),
        prenom: prenom.trim() || undefined,
        telephone: telephone.trim() || undefined,
        statut: 'ACTIF',
      });
      setClients((current) => [...current, created].sort((a, b) => labelFor(a).localeCompare(labelFor(b), 'fr')));
      onChange(created.id);
      setNom('');
      setPrenom('');
      setTelephone('');
      setShowNew(false);
    } catch (error) {
      console.error('Erreur creation client bar:', error);
      setMessage('Impossible de creer ce client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Select
        label="Client"
        value={value === '' ? '' : String(value)}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : '')}
        options={[
          { value: '', label: 'Selectionner un client' },
          ...clients.map((client) => ({ value: String(client.id), label: labelFor(client) })),
        ]}
      />
      <Button type="button" size="sm" variant="secondary" onClick={() => { setShowNew((current) => !current); setMessage(''); }}>
        <Plus size={14} /> {showNew ? 'Annuler nouveau client' : 'Nouveau client'}
      </Button>
      {showNew && (
        <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/40 p-3 space-y-3">
          <p className="text-sm font-medium text-slate-300">Ajouter un nouveau client</p>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Nom" value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Nom" />
            <Input label="Prenom" value={prenom} onChange={(event) => setPrenom(event.target.value)} placeholder="Prenom" />
          </div>
          <Input label="Telephone" value={telephone} onChange={(event) => setTelephone(event.target.value)} placeholder="Telephone" />
          <Button type="button" size="sm" onClick={() => void createClient()} disabled={saving}>
            {saving ? 'Creation...' : 'Ajouter le client'}
          </Button>
        </div>
      )}
      {message && <p className="text-sm text-red-400">{message}</p>}
    </div>
  );
};

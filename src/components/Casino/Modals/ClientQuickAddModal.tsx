import React, { useState } from 'react';
import { Button } from '../../UI';
import { ModalShell, FormField, TextInput, ModalActions } from './ModalShell';

interface ClientQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nom: string; prenom?: string; telephone?: string }) => Promise<void> | void;
}

export const ClientQuickAddModal: React.FC<ClientQuickAddModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ nom: nom.trim(), prenom: prenom.trim() || undefined, telephone: telephone.trim() || undefined });
      setNom('');
      setPrenom('');
      setTelephone('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Ajouter un joueur" subtitle="Ajout rapide, sans carte de fidélité">
      <FormField label="Nom">
        <TextInput value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Rakoto" />
      </FormField>
      <FormField label="Prénom">
        <TextInput value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" />
      </FormField>
      <FormField label="Téléphone">
        <TextInput value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="034 xx xxx xx" />
      </FormField>
      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving || !nom.trim()}>
          {saving ? 'Ajout…' : 'Ajouter le joueur'}
        </Button>
      </ModalActions>
    </ModalShell>
  );
};

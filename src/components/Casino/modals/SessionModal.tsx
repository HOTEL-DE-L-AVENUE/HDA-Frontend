import React, { useState } from 'react';
import { LockKeyhole, Unlock } from 'lucide-react';
import { Modal, Field, NumberInput, TextArea, Button, ErrorBanner, formatAriary, SectionCard } from '../common';
import { sessionsApi } from '../../../services/casino.service';
import type { CashSession, Cashier, SessionSummary } from '../../../types/casino.types';

interface OpenSessionModalProps {
  cashier: Cashier;
  onClose: () => void;
  onSuccess: (session: CashSession) => void;
}

export const OpenSessionModal: React.FC<OpenSessionModalProps> = ({ cashier, onClose, onSuccess }) => {
  const [fondInitial, setFondInitial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const amount = Number(fondInitial);
    if (!fondInitial || amount < 0) {
      setError('Fond initial invalide.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await sessionsApi.open({ cashier_id: cashier.id, fond_initial: amount });
      onSuccess(session);
    } catch (e: any) {
      setError(
        e?.status === 409
          ? 'Une session est déjà ouverte pour cette caisse.'
          : e?.message || "Erreur à l'ouverture de la session."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title={`Ouvrir la caisse — ${cashier.nom}`}
      subtitle="Déclarez le fond de caisse initial avant la première opération"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={<Unlock size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Ouverture…' : 'Ouvrir la session'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <Field label="Fond initial (Ariary)" required>
          <NumberInput
            value={fondInitial}
            onChange={(e) => setFondInitial(e.target.value)}
            placeholder="200000"
            min={0}
            autoFocus
          />
        </Field>
      </div>
    </Modal>
  );
};

interface CloseSessionModalProps {
  session: CashSession;
  summary: SessionSummary | null;
  onClose: () => void;
  onSuccess: (session: CashSession) => void;
}

export const CloseSessionModal: React.FC<CloseSessionModalProps> = ({ session, summary, onClose, onSuccess }) => {
  const [fondDeclare, setFondDeclare] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theorique = summary?.solde_theorique ?? null;
  const ecartPrevisionnel = theorique !== null && fondDeclare ? Number(fondDeclare) - theorique : null;

  async function handleSubmit() {
    if (!fondDeclare) {
      setError('Le fond final déclaré est requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await sessionsApi.close(session.id, {
        fond_final_declare: Number(fondDeclare),
        commentaire: commentaire.trim() || undefined,
      });
      onSuccess(updated);
    } catch (e: any) {
      setError(e?.message || 'Erreur à la fermeture de la session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Clôturer la session de caisse"
      subtitle={`Ouverte le ${session.ouverture_at}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button icon={<LockKeyhole size={16} />} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Clôture…' : 'Clôturer'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <SectionCard title="Résumé en direct">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted text-xs">Fond initial</p>
              <p className="text-primary font-semibold">{formatAriary(session.fond_initial)}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Solde théorique</p>
              <p className="text-primary font-semibold">{formatAriary(theorique)}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Total entrées</p>
              <p className="text-primary font-semibold">{formatAriary(summary?.total_entrees)}</p>
            </div>
            <div>
              <p className="text-muted text-xs">Total sorties</p>
              <p className="text-primary font-semibold">{formatAriary(summary?.total_sorties)}</p>
            </div>
          </div>
        </SectionCard>

        <Field label="Fond final déclaré (comptage physique, Ariary)" required>
          <NumberInput
            value={fondDeclare}
            onChange={(e) => setFondDeclare(e.target.value)}
            placeholder="850000"
            min={0}
            autoFocus
          />
        </Field>

        {ecartPrevisionnel !== null && (
          <p
            className="text-sm font-semibold"
            style={{ color: ecartPrevisionnel === 0 ? '#22c55e' : ecartPrevisionnel > 0 ? '#3b82f6' : '#ef4444' }}
          >
            Écart prévisionnel : {ecartPrevisionnel > 0 ? '+' : ''}
            {formatAriary(ecartPrevisionnel)}
          </p>
        )}

        <Field label="Commentaire">
          <TextArea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="RAS" />
        </Field>
      </div>
    </Modal>
  );
};

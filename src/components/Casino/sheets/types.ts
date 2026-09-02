export type CasinoView = 'setup' | 'players' | 'chips' | 'final' | 'management' | 'caisse' | 'report';

export interface IdentityVerificationData {
  fullName: string;
  idType: string;
  idNumber: string;
  issueDate: string;
  transactionType: 'achat' | 'apport' | 'echange';
  amount: number;
  verifiedAt: string;
}

export type PlayerLine = {
  id: number;
  ficheId?: number;
  casinoPlayerId?: number;
  casinoPlayerGameId?: number;
  time: string;
  playerTime: string;
  name: string;
  email: string;
  initialDeposit: string;
  initialCredit: string;
  member: string;
  arrival: string;
  caves: string;
  amount: string;
  total: string;
  accumulated: string;
  payment: string;
  paymentMethod: string;
  bonuses: string;
  bonusResults: string;
  bonusSignature: string;
  resultPaymentOptions: string;
  signature: string;
  finalSignature: string;
  departure: string;
  cashing: string;
  identityVerification?: string;
};

export type ChipLine = {
  value: number;
  previous: string;
  opening: string;
  closing: string;
  withdrawn: string;
};

export type RackCheck = {
  id: number;
  time: string;
  type: 'Entrée' | 'Contrôle périodique' | 'Sortie';
  expected: number;
  actual: string;
  missing: string;
  verified: boolean;
};

export const CHIP_VALUES = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];
export const casinoCurrency = new Intl.NumberFormat('fr-FR');
export const casinoBorder = { borderColor: 'var(--color-border)' };
export const casinoInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-primary outline-none placeholder:text-muted';
export const IDENTITY_VERIFICATION_THRESHOLD = 3_000_000;

export const parseCasinoAmount = (value: string | number | null | undefined): number => {
  const text = String(value ?? '').trim().replace(/\s/g, '');
  if (!text) return 0;
  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text;
  const amount = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const createPlayerLine = (id: number, ficheId = id): PlayerLine => ({
  id,
  ficheId,
  time: '',
  playerTime: '',
  name: '',
  email: '',
  initialDeposit: '',
  initialCredit: '',
  member: '',
  arrival: '',
  caves: '',
  amount: '',
  total: '',
  accumulated: '',
  payment: 'Payé',
  paymentMethod: '',
  bonuses: '',
  bonusResults: '',
  bonusSignature: '',
  resultPaymentOptions: '',
  signature: '',
  finalSignature: '',
  departure: '',
  cashing: '',
});

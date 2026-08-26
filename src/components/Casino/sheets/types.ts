export type CasinoView = 'players' | 'chips' | 'final';

export type PlayerLine = {
  id: number;
  ficheId?: number;
  time: string;
  playerTime: string;
  name: string;
  member: string;
  arrival: string;
  caves: string;
  amount: string;
  total: string;
  accumulated: string;
  payment: string;
  paymentMethod: string;
  signature: string;
  departure: string;
  cashing: string;
};

export type ChipLine = {
  value: number;
  previous: string;
  opening: string;
  closing: string;
  withdrawn: string;
};

export const CHIP_VALUES = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];
export const casinoCurrency = new Intl.NumberFormat('fr-FR');
export const casinoBorder = { borderColor: 'var(--color-border)' };
export const casinoInput = 'w-full min-w-0 bg-transparent px-2 py-2 text-xs text-primary outline-none placeholder:text-muted';

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
  member: '',
  arrival: '',
  caves: '',
  amount: '',
  total: '',
  accumulated: '',
  payment: 'Payé',
    paymentMethod: '',
  signature: '',
  departure: '',
  cashing: '',
});

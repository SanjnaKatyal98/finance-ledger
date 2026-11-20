import { Transaction } from './models';

export interface Filters { q: string; category: string; status: string; min: string; max: string; }
export const EMPTY_FILTERS: Filters = { q: '', category: '', status: '', min: '', max: '' };

const num = (s: string): number | null => (s.trim() === '' || Number.isNaN(Number(s)) ? null : Number(s));

export function applyFilters(txs: Transaction[], f: Filters): Transaction[] {
  const q = f.q.trim().toLowerCase();
  const min = num(f.min);
  const max = num(f.max);
  return txs.filter(
    (t) =>
      (!q || t.merchant.toLowerCase().includes(q)) &&
      (!f.category || t.category === f.category) &&
      (!f.status || t.status === f.status) &&
      (min === null || t.amount >= min) &&
      (max === null || t.amount <= max),
  );
}
import { Status, Transaction } from './models';

const MERCHANTS: [string, string][] = [
  ['Amazon', 'Shopping'], ['Uber', 'Travel'], ['Starbucks', 'Food'], ['Delta Airlines', 'Travel'],
  ['Whole Foods', 'Food'], ['AWS', 'Software'], ['Shell', 'Fuel'], ['Apple Store', 'Shopping'],
  ['Slack', 'Software'], ['Marriott', 'Travel'],
];
const STATUSES: Status[] = ['Approved', 'Pending', 'Flagged', 'Approved'];
const pad = (n: number) => String(n).padStart(2, '0');

export function buildSeed(): Transaction[] {
  return Array.from({ length: 40 }, (_, i) => {
    const [merchant, category] = MERCHANTS[i % MERCHANTS.length];
    const d = new Date(2025, 0, 1 + i * 2);
    return {
      id: `seed-${i + 1}`,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      merchant,
      category,
      amount: ((i * 7919) % 2400) + 15.5,
      status: STATUSES[i % STATUSES.length],
      notes: '',
    };
  });
}
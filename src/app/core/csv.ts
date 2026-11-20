import { STATUSES, Status, Transaction } from './models';

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
    } else if (ch === ',' && !quoted) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Expected header: date,merchant,category,amount,status,notes */
export function parseCsv(text: string): { rows: Transaction[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return { rows: [], skipped: 0 };
  const header = splitLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (n: string) => header.indexOf(n);
  const rows: Transaction[] = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const c = splitLine(line);
    const date = c[idx('date')] ?? '';
    const amount = Number(c[idx('amount')]);
    const merchant = c[idx('merchant')] ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(amount) || !merchant) { skipped++; continue; }
    const rawStatus = c[idx('status')] ?? '';
    const status: Status = STATUSES.find((s) => s.toLowerCase() === rawStatus.toLowerCase()) ?? 'Pending';
    rows.push({
      id: crypto.randomUUID(), date, merchant, amount, status,
      category: c[idx('category')] || 'Uncategorized',
      notes: c[idx('notes')] ?? '',
    });
  }
  return { rows, skipped };
}
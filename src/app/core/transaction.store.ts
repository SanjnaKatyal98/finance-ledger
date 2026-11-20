import { Injectable, inject, signal } from '@angular/core';
import { StorageRepository } from './storage.service';
import { Transaction } from './models';
import { buildSeed } from './seed';

const KEY = 'ledger.transactions.v1';

@Injectable({ providedIn: 'root' })
export class TransactionStore {
  private readonly repo = inject(StorageRepository);
  private readonly state = signal<Transaction[]>(this.load());
  readonly transactions = this.state.asReadonly();

  private load(): Transaction[] {
    const stored = this.repo.read<Transaction[] | null>(KEY, null);
    if (stored) return stored;
    const seed = buildSeed();
    this.repo.write(KEY, seed);
    return seed;
  }

  private commit(next: Transaction[]): void {
    this.state.set(next);
    this.repo.write(KEY, next);
  }

  update(id: string, patch: Partial<Pick<Transaction, 'notes' | 'status'>>): void {
    this.commit(this.state().map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  append(txs: Transaction[]): void { this.commit([...this.state(), ...txs]); }
  reset(): void { this.commit(buildSeed()); }
}
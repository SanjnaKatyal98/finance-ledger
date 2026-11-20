import { Injectable, inject, signal } from '@angular/core';
import { StorageRepository } from './storage.service';
import { Rule } from './models';

export const RULES_KEY = 'ledger.rules.v1';

@Injectable({ providedIn: 'root' })
export class RuleStore {
  private readonly repo = inject(StorageRepository);
  private readonly state = signal<Rule[]>(this.repo.read<Rule[]>(RULES_KEY, []));
  readonly rules = this.state.asReadonly();

  private commit(next: Rule[]): void {
    this.state.set(next);
    this.repo.write(RULES_KEY, next);
  }

  upsert(rule: Rule): void {
    const exists = this.state().some((r) => r.id === rule.id);
    this.commit(exists ? this.state().map((r) => (r.id === rule.id ? rule : r)) : [...this.state(), rule]);
  }

  remove(id: string): void { this.commit(this.state().filter((r) => r.id !== id)); }
}
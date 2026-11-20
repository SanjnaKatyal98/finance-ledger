import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { STATUSES } from '../../core/models';
import { Filters, applyFilters } from '../../core/filters';
import { violations } from '../../core/rule-engine';
import { TransactionStore } from '../../core/transaction.store';
import { RuleStore } from '../../core/rule.store';
import { debouncedValues$ } from '../../core/debounce';
import { parseCsv } from '../../core/csv';

@Component({
  selector: 'app-ledger',
  imports: [ReactiveFormsModule, RouterOutlet, RouterLink, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Ledger</h2>

    <form [formGroup]="form" class="filters">
      <input formControlName="q" placeholder="Search merchant…" aria-label="Search merchant" />
      <select formControlName="category" aria-label="Category">
        <option value="">All categories</option>
        @for (c of categories(); track c) { <option [value]="c">{{ c }}</option> }
      </select>
      <select formControlName="status" aria-label="Status">
        <option value="">Any status</option>
        @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
      </select>
      <input formControlName="min" type="number" placeholder="Min $" aria-label="Min amount" />
      <input formControlName="max" type="number" placeholder="Max $" aria-label="Max amount" />
    </form>

    <div class="actions">
      <label class="file">Import CSV <input type="file" accept=".csv" (change)="onFile($event)" /></label>
      <button type="button" (click)="store.reset()">Reset Demo Data</button>
      <span>{{ importMsg() }}</span>
    </div>

    <p>{{ rows().length }} of {{ store.transactions().length }} transactions</p>

    <table>
      <thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Status</th><th>Rules</th></tr></thead>
      <tbody>
        @for (r of rows(); track r.tx.id) {
          <tr [routerLink]="['tx', r.tx.id]" queryParamsHandling="preserve" class="row">
            <td>{{ r.tx.date }}</td>
            <td>{{ r.tx.merchant }}</td>
            <td>{{ r.tx.category }}</td>
            <td>{{ r.tx.amount | currency }}</td>
            <td>
              @switch (r.tx.status) {
                @case ('Approved') { <span class="pill ok">Approved</span> }
                @case ('Flagged') { <span class="pill bad">Flagged</span> }
                @default { <span class="pill wait">Pending</span> }
              }
            </td>
            <td>
              @for (h of r.hits; track h.id) {
                <span class="badge" [class.blocker]="h.severity === 'Blocker'" [title]="h.severity">{{ h.name }}</span>
              }
            </td>
          </tr>
        } @empty {
          <tr><td colspan="6">No transactions match your filters.</td></tr>
        }
      </tbody>
    </table>

    <router-outlet />
  `,
})
export class LedgerComponent {
  protected readonly store = inject(TransactionStore);
  private readonly ruleStore = inject(RuleStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly statuses = STATUSES;
  protected readonly importMsg = signal('');
  protected readonly form = this.fb.group({ q: '', category: '', status: '', min: '', max: '' });

  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly filters = computed<Filters>(() => {
    const p = this.params();
    return {
      q: p.get('q') ?? '', category: p.get('category') ?? '', status: p.get('status') ?? '',
      min: p.get('min') ?? '', max: p.get('max') ?? '',
    };
  });

  protected readonly categories = computed(() =>
    [...new Set(this.store.transactions().map((t) => t.category))].sort(),
  );

  protected readonly rows = computed(() => {
    const rules = this.ruleStore.rules();
    return applyFilters(this.store.transactions(), this.filters()).map((tx) => ({
      tx, hits: violations(rules, tx),
    }));
  });

  constructor() {
    // URL -> form (reload, shared link, back button)
    effect(() => this.form.patchValue(this.filters(), { emitEvent: false }));

    // form -> URL (debounced)
    debouncedValues$(this.form.valueChanges, 300)
      .pipe(takeUntilDestroyed())
      .subscribe((v) =>
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            q: v.q || null, category: v.category || null, status: v.status || null,
            min: v.min || null, max: v.max || null,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        }),
      );
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { rows, skipped } = parseCsv(String(reader.result));
      this.store.append(rows);
      this.importMsg.set(`Imported ${rows.length} rows${skipped ? `, skipped ${skipped} invalid` : ''}.`);
    };
    reader.onerror = () => this.importMsg.set('Could not read file.');
    reader.readAsText(file);
    input.value = '';
  }
}
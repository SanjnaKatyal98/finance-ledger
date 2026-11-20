import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { STATUSES, Status } from '../../core/models';
import { TransactionStore } from '../../core/transaction.store';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-tx-drawer',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="close()"></div>
    <aside class="drawer" role="dialog" aria-label="Transaction detail">
      @if (tx(); as t) {
        <h3>{{ t.merchant }}</h3>
        <p>{{ t.date }} · {{ t.category }} · {{ t.amount }}</p>
        <form [formGroup]="form" (ngSubmit)="save()">
          <label>Status
            <select formControlName="status">
              @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </label>
          <label>Notes <textarea formControlName="notes" rows="5"></textarea></label>
          <button type="submit">Save</button>
          <button type="button" (click)="close()">Cancel</button>
        </form>
      } @else {
        <p>Transaction not found.</p>
        <button type="button" (click)="close()">Close</button>
      }
    </aside>
  `,
})
export class TxDrawerComponent {
  readonly id = input.required<string>(); // bound from :id via withComponentInputBinding()

  private readonly store = inject(TransactionStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly statuses = STATUSES;
  protected readonly tx = computed(() => this.store.transactions().find((t) => t.id === this.id()));
  protected readonly form = this.fb.group({ notes: '', status: 'Pending' as Status });

  constructor() {
    effect(() => {
      const t = this.tx();
      if (t) this.form.reset({ notes: t.notes, status: t.status });
    });
  }

  protected save(): void {
    const t = this.tx();
    if (!t) return;
    const prev = { notes: t.notes, status: t.status };
    this.store.update(t.id, this.form.getRawValue());
    this.toast.show('Transaction updated', () => this.store.update(t.id, prev));
    this.close();
  }

  protected close(): void {
    this.router.navigate(['/ledger'], { queryParamsHandling: 'preserve' });
  }
}
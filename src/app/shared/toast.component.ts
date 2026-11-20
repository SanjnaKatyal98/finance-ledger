import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toasts.toast(); as t) {
      <div class="toast" role="status">
        <span>{{ t.message }}</span>
        <button type="button" (click)="toasts.undo()">Undo</button>
      </div>
    }
  `,
})
export class ToastComponent {
  protected readonly toasts = inject(ToastService);
}
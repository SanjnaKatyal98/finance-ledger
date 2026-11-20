import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StorageRepository } from './core/storage.service';
import { ToastComponent } from './shared/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav>
      <a routerLink="/ledger" routerLinkActive="active">Ledger</a>
      <a routerLink="/rules" routerLinkActive="active">Rules</a>
    </nav>
    @if (repo.error(); as e) { <div class="banner" role="alert">{{ e }}</div> }
    <main><router-outlet /></main>
    <app-toast />
  `,
})
export class App {
  protected readonly repo = inject(StorageRepository);
}
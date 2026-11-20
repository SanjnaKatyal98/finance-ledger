import { Routes } from '@angular/router';
import { unsavedChangesGuard } from './features/rules/unsaved-changes.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ledger' },
  {
    path: 'ledger',
    loadComponent: () => import('./features/ledger/ledger.component').then((m) => m.LedgerComponent),
    children: [
      {
        path: 'tx/:id',
        loadComponent: () => import('./features/ledger/tx-drawer.component').then((m) => m.TxDrawerComponent),
      },
    ],
  },
  {
    path: 'rules',
    loadComponent: () => import('./features/rules/rules.component').then((m) => m.RulesComponent),
    canDeactivate: [unsavedChangesGuard],
  },
  { path: '**', redirectTo: 'ledger' },
];
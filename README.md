# Finance Ledger: Client-Side Rule Engine & Transaction Ledger

An Angular 21 app where finance analysts view, filter and audit transactions in real time while configuring deterministic validation rules. There is no backend: all state is persisted in the browser's `localStorage`.

## Features

**Ledger (`/ledger`)**
- 40 seeded transactions, plus **Reset Demo Data**
- CSV import via `FileReader` (header: `date,merchant,category,amount,status,notes`)
- Debounced merchant search, plus category, status and amount-range filters
- Filters are synced to the URL (`?q=...&status=...`), so reloads and shared links keep the view
- Live badges showing which active rules each transaction violates
- Routed slide-over drawer (`/ledger/tx/:id`) to edit notes and status, with a 5-second **Undo** toast

**Rules (`/rules`)**
- Nested reactive form with a `FormArray` of conditions
- Severity (Warning / Blocker) and a combinator (ALL / ANY)
- Sync cross-field validator: no duplicate Field + Operator pair in one rule
- Simulated async validator: rule-name uniqueness with a 400 ms delay and an inline spinner
- `CanDeactivate` guard (plus a `beforeunload` listener) that warns about unsaved changes

## Run locally

Requirements: Node.js 20.19+ (or 22+) and npm.

```bash
git clone https://github.com/SanjnaKatyal98/finance-ledger.git
cd finance-ledger
npm install
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run build      # production build
```

Sample CSV for testing the import:

```csv
date,merchant,category,amount,status,notes
2025-03-01,Zoom,Software,149.99,Pending,annual plan
2025-03-02,Hilton,Travel,820.00,Flagged,conference
```

## Architecture decisions

- **Standalone and OnPush everywhere.** There are no NgModules. All components use `ChangeDetectionStrategy.OnPush`, all routes are lazy-loaded with `loadComponent`, and templates use built-in control flow (`@if`, `@for` with `track`, `@switch`).
- **Zoneless.** The app does not depend on zone.js. State changes flow through signals, and the async validator status is bridged to a signal so OnPush re-renders.
- **Signals for derived state, RxJS for event streams.** `signal` and `computed` hold synchronous state: the transaction and rule stores, the URL-derived `filters`, and the filtered `rows` with rule hits. RxJS handles the async parts: the debounced search (`debounceTime` + `distinctUntilChanged`), the URL query-param stream, the 400 ms async validator, and the Undo toast (`switchMap` + `timer(5000)`, so a new toast cancels the old timer).
- **No subscription leaks.** Subscriptions use `takeUntilDestroyed()` or `toSignal()`, so Angular cleans them up. There are no manual `unsubscribe` calls.
- **URL as the source of truth for filters.** Query params feed a `filters` signal. The form is patched from the URL, and debounced form changes are written back with `replaceUrl`, which avoids history spam.
- **Single storage gateway.** `StorageRepository` is the only code that touches `localStorage`. It handles corrupt JSON and `QuotaExceededError`, and exposes errors as a signal that the app shell shows as a banner.
- **Pure rule engine.** `rule-engine.ts` has no framework dependencies, so AND/OR evaluation is easy to unit test. Ledger badges are a `computed` over transactions, filters and rules, so they update the instant a rule is saved.
- **Strict TypeScript.** `strict` and `strictTemplates` are enabled and there is no `any`. Form controls are strongly typed with `NonNullableFormBuilder`.

## Project structure

```
src/app/
├─ core/               models, storage repository, rule engine, filters, CSV parser,
│                      debounce helper, transaction/rule stores, toast service, seed data
├─ features/
│  ├─ ledger/          ledger page and detail drawer
│  └─ rules/           rule builder, validators, unsaved-changes guard
└─ shared/             toast component
```

## Tests

`npm test` runs three groups of tests:
1. **Rule engine:** AND/OR logic, weekend condition, and empty rules
2. **Cross-field validator:** duplicate Field + Operator detection
3. **Debounced search/filter:** debounce timing with RxJS `TestScheduler`, plus filter logic

## Known limitations

- Operators are not restricted per field.

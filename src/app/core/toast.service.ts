import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, map, of, startWith, switchMap, timer } from 'rxjs';

export interface ToastState { message: string; undo: () => void; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly requests$ = new Subject<ToastState | null>();

  readonly toast = toSignal(
    this.requests$.pipe(
      switchMap((t) =>
        t === null ? of(null) : timer(5000).pipe(map((): ToastState | null => null), startWith<ToastState | null>(t)),
      ),
    ),
    { initialValue: null as ToastState | null },
  );

  show(message: string, undo: () => void): void { this.requests$.next({ message, undo }); }
  dismiss(): void { this.requests$.next(null); }
  undo(): void { this.toast()?.undo(); this.dismiss(); }
}
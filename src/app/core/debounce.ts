import { Observable, debounceTime, distinctUntilChanged } from 'rxjs';

export function debouncedValues$<T>(source$: Observable<T>, ms = 300): Observable<T> {
  return source$.pipe(
    debounceTime(ms),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  );
}
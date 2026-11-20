import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageRepository {
  readonly error = signal<string | null>(null);

  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      this.error.set(`Could not read "${key}" (corrupt data or storage unavailable).`);
      return fallback;
    }
  }

  write<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.error.set(null);
      return true;
    } catch (e) {
      const quota =
        e instanceof DOMException &&
        (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
      this.error.set(
        quota ? 'Browser storage is full. Changes were NOT saved.' : 'Could not save to browser storage.',
      );
      return false;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      this.error.set(`Could not remove "${key}".`);
    }
  }
}
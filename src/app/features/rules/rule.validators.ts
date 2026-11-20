import { AbstractControl, AsyncValidatorFn, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, map, of, timer } from 'rxjs';
import { Rule } from '../../core/models';

/** Sync cross-field validator: no duplicate Field + Operator pairs. */
export const noDuplicateConditions: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!(control instanceof FormArray)) return null;
  const seen = new Set<string>();
  for (const group of control.controls) {
    const key = `${group.get('field')?.value}|${group.get('operator')?.value}`;
    if (seen.has(key)) return { duplicatePair: key };
    seen.add(key);
  }
  return null;
};

/** Simulated async uniqueness check (400ms) against rules read from localStorage. */
export function uniqueRuleName(
  getRules: () => Rule[],
  getEditingId: () => string | null,
  delayMs = 400,
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const v = String(control.value ?? '').trim().toLowerCase();
    if (!v) return of(null);
    return timer(delayMs).pipe(
      map(() =>
        getRules().some((r) => r.id !== getEditingId() && r.name.trim().toLowerCase() === v)
          ? { nameTaken: true }
          : null,
      ),
    );
  };
}
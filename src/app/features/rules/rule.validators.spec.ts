import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { noDuplicateConditions } from './rule.validators';

const group = (field: string, operator: string) =>
  new FormGroup({
    field: new FormControl(field),
    operator: new FormControl(operator),
    value: new FormControl('1'),
  });

describe('noDuplicateConditions', () => {
  it('flags duplicate Field + Operator pairs', () => {
    const arr = new FormArray([group('amount', '>'), group('amount', '>')], {
      validators: [noDuplicateConditions],
    });
    expect(arr.hasError('duplicatePair')).toBe(true);
  });

  it('allows the same field with a different operator', () => {
    const arr = new FormArray([group('amount', '>'), group('amount', '<')], {
      validators: [noDuplicateConditions],
    });
    expect(arr.valid).toBe(true);
  });
});
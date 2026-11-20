import { Rule, Transaction } from './models';
import { ruleViolated, violations } from './rule-engine';

const tx = (o: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  date: '2025-01-04', // Saturday
  merchant: 'Amazon',
  category: 'Shopping',
  amount: 600,
  status: 'Pending',
  notes: '',
  ...o,
});

const rule = (combinator: 'AND' | 'OR'): Rule => ({
  id: 'r',
  name: 'R',
  severity: 'Warning',
  combinator,
  conditions: [
    { field: 'amount', operator: '>', value: '500' },
    { field: 'merchant', operator: 'contains', value: 'zon' },
  ],
});

describe('rule engine', () => {
  it('AND requires all conditions to match', () => {
    expect(ruleViolated(rule('AND'), tx())).toBe(true);
    expect(ruleViolated(rule('AND'), tx({ amount: 100 }))).toBe(false);
  });

  it('OR requires at least one condition to match', () => {
    expect(ruleViolated(rule('OR'), tx({ amount: 100 }))).toBe(true);
    expect(ruleViolated(rule('OR'), tx({ amount: 100, merchant: 'Uber' }))).toBe(false);
  });

  it('evaluates weekend conditions and ignores rules with no conditions', () => {
    const weekend: Rule = {
      ...rule('AND'),
      conditions: [{ field: 'weekend', operator: 'equals', value: 'true' }],
    };
    expect(ruleViolated(weekend, tx())).toBe(true);
    expect(ruleViolated(weekend, tx({ date: '2025-01-06' }))).toBe(false); // Monday
    expect(violations([{ ...rule('AND'), conditions: [] }], tx())).toEqual([]);
  });
});
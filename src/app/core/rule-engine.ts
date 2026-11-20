import { Condition, Rule, Transaction } from './models';

export function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 || day === 6;
}

export function evalCondition(c: Condition, tx: Transaction): boolean {
  switch (c.field) {
    case 'amount': {
      const n = Number(c.value);
      if (c.value.trim() === '' || Number.isNaN(n)) return false;
      if (c.operator === '>') return tx.amount > n;
      if (c.operator === '<') return tx.amount < n;
      if (c.operator === 'equals') return tx.amount === n;
      return false;
    }
    case 'merchant':
    case 'category': {
      const actual = (c.field === 'merchant' ? tx.merchant : tx.category).toLowerCase();
      const expected = c.value.trim().toLowerCase();
      if (c.operator === 'contains') return actual.includes(expected);
      if (c.operator === 'equals') return actual === expected;
      return false;
    }
    case 'weekend':
      return isWeekend(tx.date) === (c.value.trim().toLowerCase() === 'true');
  }
}

export function ruleViolated(rule: Rule, tx: Transaction): boolean {
  if (rule.conditions.length === 0) return false;
  return rule.combinator === 'AND'
    ? rule.conditions.every((c) => evalCondition(c, tx))
    : rule.conditions.some((c) => evalCondition(c, tx));
}

export const violations = (rules: Rule[], tx: Transaction): Rule[] =>
  rules.filter((r) => ruleViolated(r, tx));
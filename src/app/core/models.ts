export type Status = 'Approved' | 'Flagged' | 'Pending';
export const STATUSES: Status[] = ['Approved', 'Flagged', 'Pending'];

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  category: string;
  amount: number;
  status: Status;
  notes: string;
}

export type RuleField = 'amount' | 'merchant' | 'category' | 'weekend';
export type Operator = '>' | '<' | 'contains' | 'equals';
export type Severity = 'Warning' | 'Blocker';
export type Combinator = 'AND' | 'OR';

export interface Condition {
  field: RuleField;
  operator: Operator;
  value: string;
}

export interface Rule {
  id: string;
  name: string;
  severity: Severity;
  combinator: Combinator;
  conditions: Condition[];
}
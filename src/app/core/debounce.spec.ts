import { TestScheduler } from 'rxjs/testing';
import { debouncedValues$ } from './debounce';
import { applyFilters, EMPTY_FILTERS } from './filters';
import { Transaction } from './models';

describe('debounced search/filter', () => {
  const scheduler = () =>
    new TestScheduler((actual, expected) => expect(actual).toEqual(expected));

  it('emits only the last value after the quiet period', () => {
    scheduler().run(({ hot, expectObservable }) => {
      const src = hot('a 100ms b 100ms c', { a: 'a', b: 'am', c: 'ama' });
      // c is typed at frame 202, so it is emitted 300ms later at 502
      expectObservable(debouncedValues$(src, 300)).toBe('502ms c', { c: 'ama' });
    });
  });

  it('suppresses a repeated identical value', () => {
    scheduler().run(({ hot, expectObservable }) => {
      const src = hot('a 400ms a 400ms', { a: 'same' });
      expectObservable(debouncedValues$(src, 300)).toBe('300ms a', { a: 'same' });
    });
  });

  it('filters by merchant keyword and by status', () => {
    const base = { date: '2025-01-01', category: 'X', amount: 10, notes: '' };
    const data: Transaction[] = [
      { ...base, id: '1', merchant: 'Amazon', status: 'Approved' },
      { ...base, id: '2', merchant: 'Uber', status: 'Flagged' },
    ];
    expect(applyFilters(data, { ...EMPTY_FILTERS, q: 'AMA' }).map((t) => t.id)).toEqual(['1']);
    expect(applyFilters(data, { ...EMPTY_FILTERS, status: 'Flagged' }).map((t) => t.id)).toEqual(['2']);
  });
});
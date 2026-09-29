import { describe, expect, it } from 'vitest';

import { readCreateItemBody, readUpdateItemBody } from './item-payload';

const baseCreateBody = {
  categoryId: 'dairy',
  name: 'Milk',
  qtyUnit: 'l',
  qtyValue: 1,
  zone: 'fridge',
};

describe('item expiry declaration payload', () => {
  it('omits the declaration when the request does not state provenance', () => {
    expect(readCreateItemBody({ ...baseCreateBody, expiresOn: '2026-06-05' })).not.toHaveProperty(
      'expiry',
    );
    expect(readUpdateItemBody({ expiresOn: '2026-06-05' })).not.toHaveProperty('expiry');
  });

  it('reads a printed date with its package marking', () => {
    expect(
      readCreateItemBody({
        ...baseCreateBody,
        expiresOn: '2026-06-05',
        expiry: { confirm: true, printedMarking: 'use_by', source: 'printed' },
      }).expiry,
    ).toEqual({ confirm: true, printedMarking: 'use_by', source: 'printed' });
  });

  it('reads a category-zone estimate with its estimator identity', () => {
    expect(
      readUpdateItemBody({
        expiresOn: '2026-06-05',
        expiry: { confidence: 0.5, estimatorVersion: 'category-zone-v1', source: 'estimated' },
      }).expiry,
    ).toEqual({ confidence: 0.5, estimatorVersion: 'category-zone-v1', source: 'estimated' });
  });

  it('accepts nullable estimate metadata', () => {
    expect(
      readUpdateItemBody({
        expiresOn: '2026-06-05',
        expiry: { confidence: null, estimatorVersion: null, source: 'estimated' },
      }).expiry,
    ).toEqual({ confidence: null, estimatorVersion: null, source: 'estimated' });
  });

  it('reads an optimistic expected fact id', () => {
    expect(
      readUpdateItemBody({
        expiresOn: null,
        expiry: { expectedFactId: 'aaaaaaaa-1111-4111-8111-111111111111', source: 'user' },
      }).expiry,
    ).toEqual({ expectedFactId: 'aaaaaaaa-1111-4111-8111-111111111111', source: 'user' });
  });

  it('preserves null as an explicit no-active-fact expectation', () => {
    expect(
      readUpdateItemBody({
        expiresOn: null,
        expiry: { expectedFactId: null, source: 'user' },
      }).expiry,
    ).toEqual({ expectedFactId: null, source: 'user' });
  });

  it('refuses to let a request name the actor or the confirmation time', () => {
    expect(() =>
      readUpdateItemBody({
        expiry: { confirmedBy: 'someone-else', source: 'user' },
      }),
    ).toThrow('expiry.confirmedBy is not a supported field.');
    expect(() =>
      readUpdateItemBody({
        expiry: { confirmedAt: '2020-01-01T00:00:00Z', source: 'user' },
      }),
    ).toThrow('expiry.confirmedAt is not a supported field.');
    expect(() => readUpdateItemBody({ expiry: { origin: 'declared', source: 'user' } })).toThrow(
      'expiry.origin is not a supported field.',
    );
  });

  it('rejects model-derived provenance while the source stays reserved', () => {
    expect(() => readUpdateItemBody({ expiry: { source: 'model' } })).toThrow(
      'Model-derived expiry provenance is not enabled.',
    );
  });

  it.each([
    [{ source: 'guessed' }, 'expiry.source is invalid.'],
    [{}, 'source is required.'],
    [{ printedMarking: 'sell_by', source: 'printed' }, 'expiry.printedMarking is invalid.'],
    [{ confirm: 'yes', source: 'user' }, 'expiry.confirm must be a boolean.'],
    [{ confidence: 'high', source: 'estimated' }, 'confidence must be a number or null.'],
    [{ estimatorVersion: 7, source: 'estimated' }, 'estimatorVersion must be a string or null.'],
  ])('rejects the malformed declaration %j', (expiry, message) => {
    expect(() => readUpdateItemBody({ expiry })).toThrow(message);
  });

  it('rejects a declaration that is not an object', () => {
    expect(() => readUpdateItemBody({ expiry: 'user' })).toThrow('expiry must be a JSON object.');
    expect(() => readUpdateItemBody({ expiry: ['user'] })).toThrow('expiry must be a JSON object.');
    expect(() => readUpdateItemBody({ expiry: null })).toThrow('expiry must be a JSON object.');
  });
});

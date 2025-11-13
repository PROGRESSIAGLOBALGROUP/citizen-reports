/**
 * Sanity tests for frontend
 */

import { describe, it, expect } from 'vitest';

describe('Frontend Sanity Tests', () => {
  it('Vitest está configurado correctamente', () => {
    expect(true).toBe(true);
  });

  it('Operaciones básicas funcionan', () => {
    const sum = 2 + 2;
    expect(sum).toBe(4);
  });

  it('String operations work', () => {
    const str = 'hello';
    expect(str).toHaveLength(5);
    expect(str.toUpperCase()).toBe('HELLO');
  });

  it('Array methods work', () => {
    const arr = [1, 2, 3, 4, 5];
    const doubled = arr.map((n) => n * 2);
    expect(doubled).toEqual([2, 4, 6, 8, 10]);
  });
});

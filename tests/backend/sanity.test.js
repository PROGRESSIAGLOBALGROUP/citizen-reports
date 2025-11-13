/**
 * Sanity test - Verifica que el sistema de testing funciona
 */

describe('Sanity Tests', () => {
  test('Jest está configurado correctamente', () => {
    expect(true).toBe(true);
  });

  test('Operaciones básicas funcionan', () => {
    const sum = 1 + 1;
    expect(sum).toBe(2);
  });

  test('Array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('Object operations work', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });
});

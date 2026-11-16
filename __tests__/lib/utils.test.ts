import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('should format currency with Taka symbol', () => {
    expect(formatCurrency(1000)).toBe('৳1,000');
    expect(formatCurrency(25000)).toBe('৳25,000');
    expect(formatCurrency(0)).toBe('৳0');
  });

  it('should handle decimal values', () => {
    expect(formatCurrency(1234.56)).toBe('৳1,235');
    expect(formatCurrency(999.99)).toBe('৳1,000');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-500)).toBe('-৳500');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1000000)).toBe('৳1,000,000');
    expect(formatCurrency(9999999)).toBe('৳9,999,999');
  });

  it('should handle zero and null values', () => {
    expect(formatCurrency(0)).toBe('৳0');
    expect(formatCurrency(null as any)).toBe('৳0');
    expect(formatCurrency(undefined as any)).toBe('৳0');
  });
});

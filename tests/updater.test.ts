import { describe, it, expect } from 'vitest';
import { compareSemver, CURRENT_VERSION } from '../src/engines/updater';

describe('App Updater Engine', () => {
  it('correctly compares semantic versions', () => {
    expect(compareSemver('2.0.1', '2.0.0')).toBe(1);
    expect(compareSemver('v2.1.0', 'v2.0.0')).toBe(1);
    expect(compareSemver('3.0.0', '2.9.9')).toBe(1);
    expect(compareSemver('2.0.0', '2.0.0')).toBe(0);
    expect(compareSemver('v2.0.0', '2.0.0')).toBe(0);
    expect(compareSemver('1.9.9', '2.0.0')).toBe(-1);
    expect(compareSemver('2.0.0', '2.0.1')).toBe(-1);
  });

  it('validates current version definition', () => {
    expect(CURRENT_VERSION).toBe('2.2.2');
  });
});

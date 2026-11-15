import {
  applyTo,
  effectOn,
  LINKED_NOT_FOUND,
  originOf,
  undoOn,
} from '../../../../../src/modules/finan/application/use-cases/linked-adjustment';
import { FinanTransaction } from '../../../../../src/modules/finan/application/ports/finan.repository';

describe('linked adjustment (Finanz SPEC v0.10)', () => {
  const tx = (found = true): jest.Mocked<FinanTransaction> => ({
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    adjustValue: jest.fn().mockResolvedValue(found),
  });

  it('M1: an income adds, an expense or a balance takes away, other types do nothing', () => {
    expect(effectOn(1, 50)).toBe(50);
    expect(effectOn(2, 50)).toBe(-50);
    expect(effectOn(8, 50)).toBe(-50);
    expect(effectOn(3, 50)).toBe(0);
    expect(effectOn('2' as any, '50.5' as any)).toBe(-50.5);
  });

  it('M2: reads an origin id, and 0, NULL or junk as none', () => {
    expect(originOf(7)).toBe(7);
    expect(originOf('7')).toBe(7);
    for (const none of [0, null, undefined, '', 'x', -3, 1.5]) expect(originOf(none)).toBeNull();
  });

  it('applies the effect, and throws when the origin does not exist', async () => {
    const t = tx();
    await applyTo(t, 7, 2, 50, 'u');
    expect(t.adjustValue).toHaveBeenCalledWith(7, -50, 'u');
    await expect(applyTo(tx(false), 7, 2, 50, 'u')).rejects.toThrow(LINKED_NOT_FOUND);
  });

  it('undoes the effect, and skips an origin that does not exist', async () => {
    const t = tx(false);
    await undoOn(t, 7, 2, 50, 'u');
    expect(t.adjustValue).toHaveBeenCalledWith(7, 50, 'u');
  });

  it('does nothing without an origin', async () => {
    const t = tx();
    await applyTo(t, null, 2, 50, 'u');
    await undoOn(t, null, 2, 50, 'u');
    expect(t.adjustValue).not.toHaveBeenCalled();
  });
});

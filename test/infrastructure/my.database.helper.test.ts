import { Database, HDB } from '../../src/infrastructure/my.database.helper';
import RealDatabase from '../../src/infrastructure/data/mysql/database';
import * as RealHDB from '../../src/infrastructure/data/mysql/mysql.helper';

// This barrel file (src/infrastructure/my.database.helper.ts) is always mocked in the
// tests that consume it (finan/auth/series persistence tests), so it never gets loaded
// unmocked elsewhere. This test exercises the real re-export.
describe('my.database.helper barrel', () => {
  it('should re-export the real Database class', () => {
    expect(Database).toBe(RealDatabase);
  });

  it('should re-export the real HDB query-condition helpers', () => {
    expect(HDB).toBe(RealHDB);
    expect(typeof HDB.generateEqualCondition).toBe('function');
  });
});

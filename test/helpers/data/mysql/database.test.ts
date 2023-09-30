import Database from '../../../../src/helpers/data/mysql/database'; // Update the import path

describe('Database', () => {
  let db: any;

  beforeAll(() => {
    // Initialize the database connection before running tests
    db = new Database('MYDATABASEAUTH');
    db.open();
  });

  afterAll(() => {
    db.close();
  });

  it('should execute a query successfully', async () => {
    const result = await db.executeQuery('SELECT 1 + 1 AS result');
    expect(result).toHaveLength(1);
    expect(result[0].result).toBe(2);
  });

  it('should return the correct user password when logging in', async () => {
    const username = 'anderokgo';
    const password = await db.loginUser(username);
    expect(password).toBeTruthy();
  });

  it('should return false for a non-existing user when logging in', async () => {
    const username = 'non_existing_user';
    const password = await db.loginUser(username);
    expect(password).toBe(false);
  });

  it('should escape a string correctly', () => {
    const inputString = "This is a 'test' string";
    const escapedString = db.myScape(inputString);
    expect(escapedString).toBe("'This is a \\'test\\' string'");
  });
});

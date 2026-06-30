import Database from '../../../../src/infrastructure/data/mysql/database';
import mysql from 'mysql';

// Mock mysql module
jest.mock('mysql');
jest.mock('dotenv');
jest.mock('../../../../src/infrastructure/services/email', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('Database', () => {
  let database: Database;
  let mockPool: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      release: jest.fn(),
      ping: jest.fn(),
    };

    mockPool = {
      getConnection: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
      escape: jest.fn(),
    };

    (mysql.createPool as jest.Mock).mockReturnValue(mockPool);
    database = new Database('TEST_DB');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('open', () => {
    it('should connect successfully', async () => {
      mockPool.getConnection.mockImplementation((callback: Function) => {
        callback(null, mockConnection);
      });

      await database.open();

      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should reject on connection error', async () => {
      const error = new Error('Connection failed');
      mockPool.getConnection.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.open()).rejects.toThrow('Error connecting to MySQL: Connection failed');
    });
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockResult = [{ id: 1, name: 'test' }];
      mockPool.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(null, mockResult);
      });

      const result = await database.executeQuery('SELECT * FROM test', ['param1']);

      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM test', ['param1'], expect.any(Function));
      expect(result).toEqual(mockResult);
    });

    it('should reject on query error', async () => {
      const error = new Error('Query failed');
      mockPool.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(error, null);
      });

      await expect(database.executeQuery('SELECT * FROM test')).rejects.toThrow('Query failed');
    });
  });

  describe('executeSafeQuery', () => {
    it('should execute query and return result', async () => {
      const mockResult = [{ id: 1, name: 'test' }];
      mockPool.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(null, mockResult);
      });

      const result = await database.executeSafeQuery('SELECT * FROM test');

      expect(result).toEqual(mockResult);
    });

    it('should return error object on query failure', async () => {
      const error = new Error('Query failed');
      mockPool.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(error, null);
      });

      const result = await database.executeSafeQuery('SELECT * FROM test');

      expect(result).toEqual({ errorSys: true, message: 'Intenal Server Error' });
    });
  });

  describe('close', () => {
    it('should close pool successfully', async () => {
      mockPool.end.mockImplementation((callback: Function) => {
        callback(null);
      });

      await database.close();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should reject on close error', async () => {
      const error = new Error('Close failed');
      mockPool.end.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.close()).rejects.toThrow(error);
    });
  });

  describe('testConnection', () => {
    it('should ping successfully and release the connection', async () => {
      mockPool.getConnection.mockImplementation((callback: Function) => {
        callback(null, mockConnection);
      });
      mockConnection.ping.mockImplementation((callback: Function) => {
        callback(null);
      });

      const result = await database.testConnection();

      expect(mockConnection.ping).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should reject when a pooled connection cannot be acquired', async () => {
      const error = new Error('Connection failed');
      mockPool.getConnection.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.testConnection()).rejects.toThrow(error);
    });

    it('should reject on ping error but still release the connection', async () => {
      const error = new Error('Ping failed');
      mockPool.getConnection.mockImplementation((callback: Function) => {
        callback(null, mockConnection);
      });
      mockConnection.ping.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.testConnection()).rejects.toThrow(error);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('myEscape', () => {
    it('should escape string', () => {
      const escapedString = "'test'";
      mockPool.escape.mockReturnValue(escapedString);

      const result = database.myEscape('test');

      expect(mockPool.escape).toHaveBeenCalledWith('test');
      expect(result).toBe(escapedString);
    });
  });
});

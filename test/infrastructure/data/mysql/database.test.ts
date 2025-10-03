import Database from '../../../../src/infrastructure/data/mysql/database';
import mysql from 'mysql';

// Mock mysql module
jest.mock('mysql');
jest.mock('dotenv');

describe('Database', () => {
  let database: Database;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      ping: jest.fn(),
      escape: jest.fn(),
      state: 'authenticated',
    };

    (mysql.createConnection as jest.Mock).mockReturnValue(mockConnection);
    database = new Database('TEST_DB');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('open', () => {
    it('should connect successfully', async () => {
      mockConnection.connect.mockImplementation((callback: Function) => {
        callback(null);
      });

      await database.open();

      expect(mockConnection.connect).toHaveBeenCalled();
    });

    it('should reject on connection error', async () => {
      const error = new Error('Connection failed');
      mockConnection.connect.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.open()).rejects.toThrow('Error connecting to MySQL: Connection failed');
    });
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockResult = [{ id: 1, name: 'test' }];
      mockConnection.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(null, mockResult);
      });

      const result = await database.executeQuery('SELECT * FROM test', ['param1']);

      expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM test', ['param1'], expect.any(Function));
      expect(result).toEqual(mockResult);
    });

    it('should reject on query error', async () => {
      const error = new Error('Query failed');
      mockConnection.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(error, null);
      });

      await expect(database.executeQuery('SELECT * FROM test')).rejects.toThrow('Query failed');
    });
  });

  describe('executeSafeQuery', () => {
    it('should execute query and return result', async () => {
      const mockResult = [{ id: 1, name: 'test' }];
      mockConnection.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(null, mockResult);
      });

      const result = await database.executeSafeQuery('SELECT * FROM test');

      expect(result).toEqual(mockResult);
    });

    it('should return error object on query failure', async () => {
      const error = new Error('Query failed');
      mockConnection.query.mockImplementation((query: string, params: any, callback: Function) => {
        callback(error, null);
      });

      const result = await database.executeSafeQuery('SELECT * FROM test');

      expect(result).toEqual({ errorSys: true, message: 'Intenal Server Error' });
    });
  });

  describe('close', () => {
    it('should close connection successfully', async () => {
      mockConnection.end.mockImplementation((callback: Function) => {
        callback(null);
      });

      await database.close();

      expect(mockConnection.end).toHaveBeenCalled();
    });

    it('should reject on close error', async () => {
      const error = new Error('Close failed');
      mockConnection.end.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.close()).rejects.toThrow(error);
    });
  });

  describe('testConnection', () => {
    it('should ping successfully', async () => {
      mockConnection.ping.mockImplementation((callback: Function) => {
        callback(null);
      });

      const result = await database.testConnection();

      expect(mockConnection.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should reject on ping error', async () => {
      const error = new Error('Ping failed');
      mockConnection.ping.mockImplementation((callback: Function) => {
        callback(error);
      });

      await expect(database.testConnection()).rejects.toThrow(error);
    });
  });

  describe('myEscape', () => {
    it('should escape string', () => {
      const escapedString = "'test'";
      mockConnection.escape.mockReturnValue(escapedString);

      const result = database.myEscape('test');

      expect(mockConnection.escape).toHaveBeenCalledWith('test');
      expect(result).toBe(escapedString);
    });
  });

  describe('status', () => {
    it('should return connection state', () => {
      const result = database.status();

      expect(result).toBe('authenticated');
    });
  });
});

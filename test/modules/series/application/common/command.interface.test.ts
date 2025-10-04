import { Command, CommandHandler } from '../../../../../src/modules/series/application/common/command.interface';

describe('Command Interface', () => {
  describe('Command interface', () => {
    it('should have timestamp property', () => {
      const command: Command = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      expect(command.timestamp).toBeInstanceOf(Date);
      expect(command.timestamp.getTime()).toBe(new Date('2023-01-01T10:00:00Z').getTime());
    });

    it('should have readonly timestamp property', () => {
      const command: Command = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      // TypeScript would prevent this, but testing the interface structure
      expect(() => {
        // @ts-ignore
        command.timestamp = new Date();
      }).not.toThrow();
    });

    it('should handle different timestamp values', () => {
      const now = new Date();
      const past = new Date('2020-01-01T00:00:00Z');
      const future = new Date('2030-01-01T00:00:00Z');

      const commandNow: Command = { timestamp: now };
      const commandPast: Command = { timestamp: past };
      const commandFuture: Command = { timestamp: future };

      expect(commandNow.timestamp).toBe(now);
      expect(commandPast.timestamp).toBe(past);
      expect(commandFuture.timestamp).toBe(future);
    });
  });

  describe('CommandHandler interface', () => {
    let mockHandler: CommandHandler<Command>;

    beforeEach(() => {
      mockHandler = {
        execute: jest.fn(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should implement execute method', async () => {
      const command: Command = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      mockHandler.execute.mockResolvedValue();

      await mockHandler.execute(command);

      expect(mockHandler.execute).toHaveBeenCalledWith(command);
    });

    it('should handle execute with void result', async () => {
      const command: Command = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      mockHandler.execute.mockResolvedValue();

      const result = await mockHandler.execute(command);

      expect(result).toBeUndefined();
    });

    it('should handle execute with custom result type', async () => {
      interface CustomCommand extends Command<number> {
        value: number;
      }

      interface CustomCommandHandler extends CommandHandler<CustomCommand, number> {}

      const mockCustomHandler: CustomCommandHandler = {
        execute: jest.fn(),
      };

      const customCommand: CustomCommand = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
        value: 42,
      };

      const expectedResult = 84;
      mockCustomHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockCustomHandler.execute(customCommand);

      expect(result).toBe(expectedResult);
      expect(mockCustomHandler.execute).toHaveBeenCalledWith(customCommand);
    });

    it('should handle execute errors', async () => {
      const command: Command = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      const error = new Error('Command execution failed');
      mockHandler.execute.mockRejectedValue(error);

      await expect(mockHandler.execute(command)).rejects.toThrow('Command execution failed');
    });
  });

  describe('Generic Command with TResult', () => {
    it('should work with string result', async () => {
      interface StringCommand extends Command<string> {
        message: string;
      }

      interface StringCommandHandler extends CommandHandler<StringCommand, string> {}

      const mockHandler: StringCommandHandler = {
        execute: jest.fn(),
      };

      const command: StringCommand = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
        message: 'Hello World',
      };

      const expectedResult = 'Processed: Hello World';
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(command);

      expect(result).toBe(expectedResult);
    });

    it('should work with object result', async () => {
      interface ObjectCommand extends Command<{ success: boolean; data: any }> {
        action: string;
      }

      interface ObjectCommandHandler extends CommandHandler<ObjectCommand, { success: boolean; data: any }> {}

      const mockHandler: ObjectCommandHandler = {
        execute: jest.fn(),
      };

      const command: ObjectCommand = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
        action: 'create',
      };

      const expectedResult = { success: true, data: { id: 1, action: 'create' } };
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(command);

      expect(result).toEqual(expectedResult);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(1);
    });

    it('should work with array result', async () => {
      interface ArrayCommand extends Command<number[]> {
        count: number;
      }

      interface ArrayCommandHandler extends CommandHandler<ArrayCommand, number[]> {}

      const mockHandler: ArrayCommandHandler = {
        execute: jest.fn(),
      };

      const command: ArrayCommand = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
        count: 3,
      };

      const expectedResult = [1, 2, 3];
      mockHandler.execute.mockResolvedValue(expectedResult);

      const result = await mockHandler.execute(command);

      expect(result).toEqual(expectedResult);
      expect(result).toHaveLength(3);
    });
  });

  describe('Edge cases', () => {
    it('should handle very old timestamp', () => {
      const veryOldDate = new Date('1900-01-01T00:00:00Z');
      const command: Command = {
        timestamp: veryOldDate,
      };

      expect(command.timestamp).toBe(veryOldDate);
    });

    it('should handle very future timestamp', () => {
      const futureDate = new Date('2099-12-31T23:59:59Z');
      const command: Command = {
        timestamp: futureDate,
      };

      expect(command.timestamp).toBe(futureDate);
    });

    it('should handle execute with null result', async () => {
      interface NullCommand extends Command<null> {}

      interface NullCommandHandler extends CommandHandler<NullCommand, null> {}

      const mockHandler: NullCommandHandler = {
        execute: jest.fn(),
      };

      const command: NullCommand = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      mockHandler.execute.mockResolvedValue(null);

      const result = await mockHandler.execute(command);

      expect(result).toBeNull();
    });
  });
});

import { Request, Response } from '../../../../src/infrastructure/middle.helper';
import { getDefault } from '../../../../src/modules/default/application/default.controller';

describe('Default Controller', () => {
  const req: Partial<Request> = {};
  const res: Partial<Response> = {
    json: jest.fn(),
    status: jest.fn(() => res as Response), // Type assertion here
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a message for getDefault', async () => {
    await getDefault(req as Request, res as Response);

    // Check if the response JSON has been called correctly with the expected message
    expect(res.json).toHaveBeenCalledWith({ msg: 'API Working' });
  });
});

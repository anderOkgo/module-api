import { randomBytes } from 'crypto';
import { UserKeyRepository } from '../../../../../src/modules/bitacora/application/ports/diary-key.ports';
import {
  ChangeKeyUseCase,
  CreateKeyUseCase,
  GetKeyUseCase,
  OpenDiaryUseCase,
} from '../../../../../src/modules/bitacora/application/use-cases/diary-key.use-cases';
import { aesGcmDiaryKeyCrypto } from '../../../../../src/modules/bitacora/infrastructure/crypto/aes-gcm';
import { toBase64url } from '../../../../../src/modules/bitacora/domain/services/key-rules';

const USER = 7;
const KEK = randomBytes(32);
const HEADER = toBase64url(KEK);
const SALT = toBase64url(randomBytes(16));
const PARAMS = { iterations: 600000, salt: SALT };

const makeKeys = (): jest.Mocked<UserKeyRepository> => ({
  findKey: jest.fn(),
  createKey: jest.fn(),
  replaceKey: jest.fn(),
});

/** A stored key made with the real crypto, so wrong keys fail for real. */
const storedKey = (dek = randomBytes(32)) => ({
  dek,
  record: { kdf: 'PBKDF2-SHA256', iterations: 600000, salt: SALT, wrappedDek: aesGcmDiaryKeyCrypto.wrapDek(USER, KEK, dek) },
});

describe('Diary key use cases (SPEC v1.11 §3.5, C15–C17)', () => {
  let keys: jest.Mocked<UserKeyRepository>;

  beforeEach(() => {
    keys = makeKeys();
  });

  it.each([
    ['getKey', () => new GetKeyUseCase(makeKeys()).execute(undefined)],
    ['createKey', () => new CreateKeyUseCase(makeKeys(), aesGcmDiaryKeyCrypto).execute('7', PARAMS, HEADER)],
    ['changeKey', () => new ChangeKeyUseCase(makeKeys(), aesGcmDiaryKeyCrypto).execute(0, PARAMS, HEADER, HEADER)],
  ])('%s rejects a missing userId with 401', async (_name, run) => {
    expect((await run()).status).toBe(401);
  });

  describe('GetKeyUseCase (C16, K2)', () => {
    it('returns 404 KEY_NOT_SET when the account has no key', async () => {
      keys.findKey.mockResolvedValue(null);
      expect(await new GetKeyUseCase(keys).execute(USER)).toEqual({ success: false, status: 404, message: 'KEY_NOT_SET' });
    });

    it('returns the derivation parameters, never the wrapped key', async () => {
      keys.findKey.mockResolvedValue(storedKey().record);
      const result = await new GetKeyUseCase(keys).execute(USER);
      expect(result).toMatchObject({ status: 200, data: { kdf: 'PBKDF2-SHA256', iterations: 600000, salt: SALT } });
      expect(JSON.stringify(result)).not.toContain('v1:');
    });
  });

  describe('CreateKeyUseCase (C15, K2)', () => {
    it('stores a new data key wrapped by the header key, and answers 201 with the parameters', async () => {
      keys.createKey.mockResolvedValue(true);
      const result = await new CreateKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, PARAMS, HEADER);
      expect(result).toEqual({
        success: true,
        status: 201,
        message: 'Key created',
        data: { kdf: 'PBKDF2-SHA256', iterations: 600000, salt: SALT },
      });
      const record = keys.createKey.mock.calls[0][1];
      expect(keys.createKey.mock.calls[0][0]).toBe(USER);
      expect(aesGcmDiaryKeyCrypto.unwrapDek(USER, KEK, record.wrappedDek)).toHaveLength(32);
    });

    it('answers 409 when the account already has a key', async () => {
      keys.createKey.mockResolvedValue(false);
      expect((await new CreateKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, PARAMS, HEADER)).status).toBe(409);
    });

    it('answers 400 with every error, without writing, for bad parameters and a malformed header', async () => {
      const result = await new CreateKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, { iterations: 1 }, 'short');
      expect(result.status).toBe(400);
      expect(result.errors).toHaveLength(3);
      expect(keys.createKey).not.toHaveBeenCalled();
    });

    it('reports only what is wrong: the header alone, or the parameters alone', async () => {
      const useCase = new CreateKeyUseCase(keys, aesGcmDiaryKeyCrypto);
      expect((await useCase.execute(USER, PARAMS, undefined)).errors).toEqual([
        'the key header must be 32 bytes in unpadded base64url',
      ]);
      expect((await useCase.execute(USER, { ...PARAMS, iterations: 1 }, HEADER)).errors).toEqual([
        'iterations must be an integer from 600000 to 10000000',
      ]);
    });
  });

  describe('ChangeKeyUseCase (C17, K6)', () => {
    const NEW_KEK = randomBytes(32);

    it('re-wraps the same data key with the new key; the old key no longer opens it', async () => {
      const { dek, record } = storedKey();
      keys.findKey.mockResolvedValue(record);
      const newSalt = toBase64url(randomBytes(16));
      const result = await new ChangeKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(
        USER,
        { iterations: 700000, salt: newSalt },
        HEADER,
        toBase64url(NEW_KEK)
      );
      expect(result).toMatchObject({ status: 200, data: { iterations: 700000, salt: newSalt } });
      const replaced = keys.replaceKey.mock.calls[0][1];
      expect(aesGcmDiaryKeyCrypto.unwrapDek(USER, NEW_KEK, replaced.wrappedDek)?.equals(dek)).toBe(true);
      expect(aesGcmDiaryKeyCrypto.unwrapDek(USER, KEK, replaced.wrappedDek)).toBeNull();
    });

    it.each([
      ['428 KEY_NOT_SET without a key', null, HEADER, 428, 'KEY_NOT_SET'],
      ['428 KEY_REQUIRED without the current key', 'stored', undefined, 428, 'KEY_REQUIRED'],
      ['403 KEY_WRONG with a wrong current key', 'stored', toBase64url(randomBytes(32)), 403, 'KEY_WRONG'],
    ] as const)('answers %s, writing nothing', async (_name, stored, current, status, message) => {
      keys.findKey.mockResolvedValue(stored ? storedKey().record : null);
      const result = await new ChangeKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, PARAMS, current, toBase64url(NEW_KEK));
      expect(result).toEqual({ success: false, status, message });
      expect(keys.replaceKey).not.toHaveBeenCalled();
    });

    it('answers 400 for a malformed new key before reading anything', async () => {
      const result = await new ChangeKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, PARAMS, HEADER, undefined);
      expect(result).toMatchObject({ status: 400, errors: ['the new key header must be 32 bytes in unpadded base64url'] });
      expect(keys.findKey).not.toHaveBeenCalled();
    });

    it('answers 400 for bad parameters with a valid new key', async () => {
      const result = await new ChangeKeyUseCase(keys, aesGcmDiaryKeyCrypto).execute(
        USER,
        { iterations: 600000, salt: 'x' },
        HEADER,
        toBase64url(NEW_KEK)
      );
      expect(result).toMatchObject({ status: 400, errors: ['salt must be 16 bytes in unpadded base64url'] });
    });
  });

  describe('OpenDiaryUseCase (K1, K4)', () => {
    it('gives the body cipher of the account with the right key', async () => {
      const { dek, record } = storedKey();
      keys.findKey.mockResolvedValue(record);
      const opened = await new OpenDiaryUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, HEADER);
      if (!('cipher' in opened)) throw new Error('expected a cipher');
      const stored = opened.cipher.encrypt('2026-03-04', 'x');
      expect(aesGcmDiaryKeyCrypto.cipherFor(USER, dek).decrypt('2026-03-04', stored)).toBe('x');
    });

    it.each([
      ['KEY_NOT_SET when the account has no key', null, HEADER, 428],
      ['KEY_REQUIRED without a header', 'stored', undefined, 428],
      ['KEY_REQUIRED with a malformed header', 'stored', 'abc', 428],
      ['KEY_WRONG with another key', 'stored', toBase64url(randomBytes(32)), 403],
    ] as const)('refuses with %s', async (name, stored, header, status) => {
      keys.findKey.mockResolvedValue(stored ? storedKey().record : null);
      const opened = await new OpenDiaryUseCase(keys, aesGcmDiaryKeyCrypto).execute(USER, header);
      expect(opened).toEqual({ refusal: { success: false, status, message: name.split(' ')[0] } });
    });
  });
});

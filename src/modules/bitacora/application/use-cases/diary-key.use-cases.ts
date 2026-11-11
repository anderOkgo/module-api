import { BodyCipher } from '../ports/body-cipher';
import { DiaryKeyCrypto, UserKeyRepository } from '../ports/diary-key.ports';
import { checkKeyParams, KDF, parseKeyHeader } from '../../domain/services/key-rules';
import {
  badRequest,
  isUserId,
  keyNotSet,
  keyRequired,
  keyWrong,
  notFound,
  succeed,
  unauthorized,
  UseCaseResult,
} from './use-case-result';

/**
 * The diary key (SPEC v1.11 §3.5, §4.6, D32). The device derives a 32-byte key (KEK) from the
 * passphrase and sends it in a header; the server keeps only the data key (DEK) wrapped by it.
 * No use case here returns, logs or echoes a key.
 */

/** What C15–C17 return: how to derive the key on a device. */
export interface KeyParams {
  kdf: string;
  iterations: number;
  salt: string;
}

/** C16 `GET /key`: whether the account has a key, and how to derive it. */
export class GetKeyUseCase {
  constructor(private readonly keys: UserKeyRepository) {}

  async execute(userId: unknown): Promise<UseCaseResult<KeyParams>> {
    if (!isUserId(userId)) return unauthorized();
    const record = await this.keys.findKey(userId);
    if (!record) return notFound('KEY_NOT_SET');
    return succeed({ kdf: record.kdf, iterations: record.iterations, salt: record.salt }, 'Key parameters loaded');
  }
}

/** C15 `POST /key`: creates the account's key once; the data key is made here and stored wrapped. */
export class CreateKeyUseCase {
  constructor(private readonly keys: UserKeyRepository, private readonly crypto: DiaryKeyCrypto) {}

  async execute(userId: unknown, payload: unknown, keyHeader: unknown): Promise<UseCaseResult<KeyParams>> {
    if (!isUserId(userId)) return unauthorized();
    const params = checkKeyParams(payload);
    const kek = parseKeyHeader(keyHeader);
    if (!params.ok || !kek) {
      return badRequest([...(params.ok ? [] : params.errors), ...(kek ? [] : ['the key header must be 32 bytes in unpadded base64url'])]);
    }

    const { iterations, salt } = params.value;
    const wrappedDek = this.crypto.wrapDek(userId, kek, this.crypto.generateDek());
    const created = await this.keys.createKey(userId, { kdf: KDF, iterations, salt, wrappedDek });
    if (!created) return { success: false, status: 409, message: 'The account already has a diary key' };
    return succeed({ kdf: KDF, iterations, salt }, 'Key created', 201);
  }
}

/** C17 `PUT /key`: a new passphrase re-wraps the same data key; no body is touched. */
export class ChangeKeyUseCase {
  constructor(private readonly keys: UserKeyRepository, private readonly crypto: DiaryKeyCrypto) {}

  async execute(
    userId: unknown,
    payload: unknown,
    currentHeader: unknown,
    newHeader: unknown
  ): Promise<UseCaseResult<KeyParams>> {
    if (!isUserId(userId)) return unauthorized();
    const params = checkKeyParams(payload);
    const newKek = parseKeyHeader(newHeader);
    if (!params.ok || !newKek) {
      return badRequest([...(params.ok ? [] : params.errors), ...(newKek ? [] : ['the new key header must be 32 bytes in unpadded base64url'])]);
    }

    const record = await this.keys.findKey(userId);
    if (!record) return keyNotSet();
    const currentKek = parseKeyHeader(currentHeader);
    if (!currentKek) return keyRequired();
    const dek = this.crypto.unwrapDek(userId, currentKek, record.wrappedDek);
    if (!dek) return keyWrong();

    const { iterations, salt } = params.value;
    await this.keys.replaceKey(userId, { kdf: KDF, iterations, salt, wrappedDek: this.crypto.wrapDek(userId, newKek, dek) });
    return succeed({ kdf: KDF, iterations, salt }, 'Key changed');
  }
}

/**
 * Opens the diary for one request: the body cipher of the account, or the 428/403 answer of §3.5.
 * Runs after the token check (401 first) and before any diary use case.
 */
export class OpenDiaryUseCase {
  constructor(private readonly keys: UserKeyRepository, private readonly crypto: DiaryKeyCrypto) {}

  async execute(userId: number, keyHeader: unknown): Promise<{ cipher: BodyCipher } | { refusal: UseCaseResult<never> }> {
    const record = await this.keys.findKey(userId);
    if (!record) return { refusal: keyNotSet() };
    const kek = parseKeyHeader(keyHeader);
    if (!kek) return { refusal: keyRequired() };
    const dek = this.crypto.unwrapDek(userId, kek, record.wrappedDek);
    if (!dek) return { refusal: keyWrong() };
    return { cipher: this.crypto.cipherFor(userId, dek) };
  }
}

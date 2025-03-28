import { encryp } from '../../../src/infrastructure/cyfer.helper';

// Test suite for encryption and decryption
describe('Encryption and Decryption Tests', () => {
  it('should encrypt and decrypt a string', () => {
    // Test with the same key
    const originalString = 'Hello, World!';
    const key = 'MySecretKey';
    const encryptedString = encryp().cy(originalString, key);
    const decryptedString = encryp().dcy(encryptedString, key);
    expect(decryptedString).toEqual(originalString);
  });

  it('should handle edge cases', () => {
    // Test with empty string and empty key
    const emptyString = '';
    const emptyKey = '';
    const encryptedEmptyString = encryp().cy(emptyString, emptyKey);
    const decryptedEmptyString = encryp().dcy(encryptedEmptyString, emptyKey);
    expect(decryptedEmptyString).toEqual(emptyString);

    // Test with a different key
    const originalString = 'SensitiveData';
    const key1 = 'Key1';
    const key2 = 'Key2';
    const encryptedString = encryp().cy(originalString, key1);
    const decryptedStringWithWrongKey = encryp().dcy(encryptedString, key2);
    expect(decryptedStringWithWrongKey).not.toEqual(originalString);
  });
});

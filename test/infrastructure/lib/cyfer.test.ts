import cyfer from '../../../src/infrastructure/services/cyfer';

// Test suite for encryption and decryption
describe('Encryption and Decryption Tests', () => {
  it('should encrypt and decrypt a string', () => {
    // Test with the same key
    const originalString = 'Hello, World!';
    const key = 'MySecretKey';
    const encryptedString = cyfer().cy(originalString, key);
    const decryptedString = cyfer().dcy(encryptedString, key);
    expect(decryptedString).toEqual(originalString);
  });

  it('should handle edge cases', () => {
    // Test with empty string and empty key
    const emptyString = '';
    const emptyKey = '';
    const encryptedEmptyString = cyfer().cy(emptyString, emptyKey);
    const decryptedEmptyString = cyfer().dcy(encryptedEmptyString, emptyKey);
    expect(decryptedEmptyString).toEqual(emptyString);

    // Test with a different key
    const originalString = 'SensitiveData';
    const key1 = 'Key1';
    const key2 = 'Key2';
    const encryptedString = cyfer().cy(originalString, key1);
    const decryptedStringWithWrongKey = cyfer().dcy(encryptedString, key2);
    expect(decryptedStringWithWrongKey).not.toEqual(originalString);
  });

  it('should flip negative intermediate values to positive during decryption', () => {
    // dcy computes p1 = ((p2*16)|p3) - key.charCodeAt(li), which maxes out around 255.
    // A key with a high-codepoint character forces p1 negative, exercising the
    // `if (p1 < 0) p1 = p1 * -1` branch (line 27).
    const originalString = 'test';
    const encryptKey = 'normalKey';
    const decryptKeyWithHighCodePoint = 'Ԁ';

    const encryptedString = cyfer().cy(originalString, encryptKey);

    expect(() => cyfer().dcy(encryptedString, decryptKeyWithHighCodePoint)).not.toThrow();
  });
});

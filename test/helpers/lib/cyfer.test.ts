import cyfer from '../../../src/helpers/lib/cyfer';

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
});

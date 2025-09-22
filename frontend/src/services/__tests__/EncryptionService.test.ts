/**
 * Test suite for EncryptionService
 * Validates banking data encryption, decryption, and masking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from '../EncryptionService';

describe('EncryptionService', () => {
  const testBankingDetails = {
    accountHolder: 'John Doe',
    bank: 'Standard Bank',
    accountNumber: '1234567890',
    branchCode: '051001'
  };

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt strings correctly', () => {
      const plaintext = 'sensitive-data-123';

      const encrypted = EncryptionService.encrypt(plaintext);
      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('algorithm', 'AES');
      expect(encrypted.encrypted).not.toBe(plaintext);

      const decrypted = EncryptionService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should generate different encrypted values for same input', () => {
      const plaintext = 'test-data';

      const encrypted1 = EncryptionService.encrypt(plaintext);
      const encrypted2 = EncryptionService.encrypt(plaintext);

      // Different IVs should result in different encrypted strings
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // But both should decrypt to same value
      expect(EncryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(EncryptionService.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should throw error for invalid decryption', () => {
      const invalidEncrypted = {
        encrypted: 'invalid-data',
        iv: 'invalid-iv',
        algorithm: 'AES' as const
      };

      expect(() => EncryptionService.decrypt(invalidEncrypted)).toThrow();
    });
  });

  describe('Banking Details Encryption', () => {
    it('should encrypt banking details correctly', () => {
      const encrypted = EncryptionService.encryptBankingDetails(testBankingDetails);

      expect(encrypted.accountHolder).toBe(testBankingDetails.accountHolder); // Unencrypted
      expect(encrypted.bank).toBe(testBankingDetails.bank); // Unencrypted
      expect(EncryptionService.isEncrypted(encrypted.accountNumber)).toBe(true);
      expect(EncryptionService.isEncrypted(encrypted.branchCode)).toBe(true);
    });

    it('should decrypt banking details correctly', () => {
      const encrypted = EncryptionService.encryptBankingDetails(testBankingDetails);
      const decrypted = EncryptionService.decryptBankingDetails(encrypted);

      expect(decrypted).toEqual(testBankingDetails);
    });

    it('should handle backward compatibility with unencrypted data', () => {
      // Test with plain text banking details (for migration)
      const decrypted = EncryptionService.decryptBankingDetails(testBankingDetails);
      expect(decrypted).toEqual(testBankingDetails);
    });
  });

  describe('Data Masking', () => {
    it('should mask account numbers correctly', () => {
      expect(EncryptionService.maskAccountNumber('1234567890')).toBe('******7890');
      expect(EncryptionService.maskAccountNumber('123')).toBe('****'); // Too short
      expect(EncryptionService.maskAccountNumber('')).toBe('****'); // Empty
    });

    it('should mask branch codes correctly', () => {
      expect(EncryptionService.maskBranchCode('051001')).toBe('****01');
      expect(EncryptionService.maskBranchCode('12')).toBe('***'); // Too short
      expect(EncryptionService.maskBranchCode('')).toBe('***'); // Empty
    });

    it('should get masked banking details correctly', () => {
      const encrypted = EncryptionService.encryptBankingDetails(testBankingDetails);
      const masked = EncryptionService.getMaskedBankingDetails(encrypted);

      expect(masked.accountHolder).toBe(testBankingDetails.accountHolder);
      expect(masked.bank).toBe(testBankingDetails.bank);
      expect(masked.accountNumber).toBe('******7890');
      expect(masked.branchCode).toBe('****01');
    });
  });

  describe('Security Validations', () => {
    it('should properly identify encrypted fields', () => {
      const encrypted = EncryptionService.encrypt('test');
      expect(EncryptionService.isEncrypted(encrypted)).toBe(true);
      expect(EncryptionService.isEncrypted('plain-text')).toBe(false);
      expect(EncryptionService.isEncrypted(null)).toBe(false);
      expect(EncryptionService.isEncrypted(undefined)).toBe(false);
    });

    it('should not allow empty string encryption', () => {
      expect(() => EncryptionService.encrypt('')).toThrow('Cannot encrypt empty string');
    });

    it('should handle corrupt encrypted data gracefully', () => {
      const corruptedData = {
        encrypted: 'corrupted-data',
        iv: '1234567890abcdef', // Valid hex IV
        algorithm: 'AES' as const
      };

      expect(() => EncryptionService.decrypt(corruptedData)).toThrow();
    });
  });

  describe('Performance and Security', () => {
    it('should encrypt/decrypt within reasonable time', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        const encrypted = EncryptionService.encrypt(`test-data-${i}`);
        EncryptionService.decrypt(encrypted);
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should use different IVs for security', () => {
      const plaintext = 'sensitive-account-number';
      const ivs = new Set();

      // Generate 50 encryptions and ensure all IVs are unique
      for (let i = 0; i < 50; i++) {
        const encrypted = EncryptionService.encrypt(plaintext);
        ivs.add(encrypted.iv);
      }

      expect(ivs.size).toBe(50); // All IVs should be unique
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic banking data', () => {
      const realisticBankingDetails = {
        accountHolder: 'Acme Corporation (Pty) Ltd',
        bank: 'First National Bank',
        accountNumber: '62123456789',
        branchCode: '250655'
      };

      // Encrypt
      const encrypted = EncryptionService.encryptBankingDetails(realisticBankingDetails);

      // Verify encryption
      expect(EncryptionService.isEncrypted(encrypted.accountNumber)).toBe(true);
      expect(EncryptionService.isEncrypted(encrypted.branchCode)).toBe(true);

      // Get masked version
      const masked = EncryptionService.getMaskedBankingDetails(encrypted);
      expect(masked.accountNumber).toBe('*******6789');
      expect(masked.branchCode).toBe('****55');

      // Decrypt and verify
      const decrypted = EncryptionService.decryptBankingDetails(encrypted);
      expect(decrypted).toEqual(realisticBankingDetails);
    });
  });
});
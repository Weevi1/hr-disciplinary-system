/**
 * Encryption Service for Sensitive Data
 * Handles field-level encryption for banking details and PII
 */

import CryptoJS from 'crypto-js';

export interface EncryptedField {
  encrypted: string;
  iv: string; // Initialization vector for added security
  algorithm: 'AES';
}

export class EncryptionService {
  private static readonly ALGORITHM = 'AES';

  // In production, this should come from environment variables
  private static readonly ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'your-super-secret-key-here-32-chars';

  /**
   * Encrypt sensitive string data
   */
  static encrypt(plaintext: string): EncryptedField {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty string');
    }

    // Generate random IV for each encryption
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt with AES
    const encrypted = CryptoJS.AES.encrypt(plaintext, this.ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
      algorithm: this.ALGORITHM
    };
  }

  /**
   * Decrypt sensitive string data
   */
  static decrypt(encryptedField: EncryptedField): string {
    if (!encryptedField || !encryptedField.encrypted) {
      throw new Error('Invalid encrypted field');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedField.encrypted, this.ENCRYPTION_KEY, {
        iv: CryptoJS.enc.Hex.parse(encryptedField.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

      if (!plaintext) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      return plaintext;
    } catch (error) {
      throw new Error('Failed to decrypt data: ' + (error as Error).message);
    }
  }

  /**
   * Mask sensitive data for display (show only last 4 digits)
   */
  static maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return '****';
    }

    const lastFour = accountNumber.slice(-4);
    const masked = '*'.repeat(Math.max(0, accountNumber.length - 4));
    return masked + lastFour;
  }

  /**
   * Mask bank branch code
   */
  static maskBranchCode(branchCode: string): string {
    if (!branchCode || branchCode.length < 2) {
      return '***';
    }

    const lastTwo = branchCode.slice(-2);
    const masked = '*'.repeat(Math.max(0, branchCode.length - 2));
    return masked + lastTwo;
  }

  /**
   * Validate if string appears to be encrypted
   */
  static isEncrypted(value: any): value is EncryptedField {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.encrypted === 'string' &&
      typeof value.iv === 'string' &&
      value.algorithm === 'AES'
    );
  }

  /**
   * Encrypt banking details object
   */
  static encryptBankingDetails(bankDetails: {
    accountHolder: string;
    bank: string;
    accountNumber: string;
    branchCode: string;
  }) {
    return {
      accountHolder: bankDetails.accountHolder, // Name can remain unencrypted
      bank: bankDetails.bank, // Bank name can remain unencrypted
      accountNumber: this.encrypt(bankDetails.accountNumber),
      branchCode: this.encrypt(bankDetails.branchCode)
    };
  }

  /**
   * Decrypt banking details object
   */
  static decryptBankingDetails(encryptedBankDetails: any) {
    return {
      accountHolder: encryptedBankDetails.accountHolder,
      bank: encryptedBankDetails.bank,
      accountNumber: this.isEncrypted(encryptedBankDetails.accountNumber)
        ? this.decrypt(encryptedBankDetails.accountNumber)
        : encryptedBankDetails.accountNumber, // Backward compatibility
      branchCode: this.isEncrypted(encryptedBankDetails.branchCode)
        ? this.decrypt(encryptedBankDetails.branchCode)
        : encryptedBankDetails.branchCode // Backward compatibility
    };
  }

  /**
   * Get masked banking details for display
   */
  static getMaskedBankingDetails(encryptedBankDetails: any) {
    const decrypted = this.decryptBankingDetails(encryptedBankDetails);

    return {
      accountHolder: decrypted.accountHolder,
      bank: decrypted.bank,
      accountNumber: this.maskAccountNumber(decrypted.accountNumber),
      branchCode: this.maskBranchCode(decrypted.branchCode)
    };
  }
}

// Utility functions for components
export const encryptSensitiveData = EncryptionService.encrypt;
export const decryptSensitiveData = EncryptionService.decrypt;
export const maskAccountNumber = EncryptionService.maskAccountNumber;
export const maskBranchCode = EncryptionService.maskBranchCode;
// Test for ShardedOrganizationService - Organization Creation
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShardedOrganizationService } from '../ShardedOrganizationService';
import { DatabaseShardingService } from '../DatabaseShardingService';
import type { ShardedOrganizationData } from '../../types/billing';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  getAuth: vi.fn(() => ({ currentUser: null }))
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn()
  }))
}));

// Mock DatabaseShardingService
vi.mock('../DatabaseShardingService', () => ({
  DatabaseShardingService: {
    createDocument: vi.fn(),
    initializeShardedCollections: vi.fn()
  }
}));

describe('ShardedOrganizationService', () => {
  const mockOrganizationData: ShardedOrganizationData = {
    id: 'test-org',
    name: 'Test Organization',
    industry: 'Technology',
    province: 'Gauteng',
    city: 'Johannesburg',
    contactEmail: 'test@testorg.com',
    contactPhone: '+27123456789',
    employeeCount: 25,
    subscriptionStatus: 'trial',
    adminUser: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'admin@testorg.com',
      password: 'temp123',
      role: 'business-owner' as const
    },
    customCategories: ['Custom Category 1']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization with sharded structure', async () => {
      // Mock successful Firebase Auth user creation
      const mockUser = { uid: 'test-user-id' };
      const mockUserCredential = { user: mockUser };
      
      vi.mocked(require('firebase/auth').createUserWithEmailAndPassword)
        .mockResolvedValue(mockUserCredential);
      vi.mocked(require('firebase/auth').updateProfile)
        .mockResolvedValue(undefined);

      // Mock successful Firestore operations
      vi.mocked(require('firebase/firestore').writeBatch().commit)
        .mockResolvedValue(undefined);
      
      // Mock successful sharding service operations
      vi.mocked(DatabaseShardingService.createDocument)
        .mockResolvedValue(undefined);
      vi.mocked(DatabaseShardingService.initializeShardedCollections)
        .mockResolvedValue(undefined);

      // Execute the test
      const result = await ShardedOrganizationService.createOrganization(mockOrganizationData);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.organizationId).toBe('test-org');
      expect(result.adminUserId).toBe('test-user-id');

      // Verify Firebase Auth was called
      expect(require('firebase/auth').createUserWithEmailAndPassword)
        .toHaveBeenCalledWith(
          expect.anything(),
          'admin@testorg.com',
          'temp123'
        );

      // Verify sharded collections were initialized
      expect(DatabaseShardingService.initializeShardedCollections)
        .toHaveBeenCalledWith('test-org', expect.anything());
    });

    it('should handle organization creation failure', async () => {
      // Mock Firebase Auth failure
      vi.mocked(require('firebase/auth').createUserWithEmailAndPassword)
        .mockRejectedValue(new Error('Auth creation failed'));

      // Execute the test
      const result = await ShardedOrganizationService.createOrganization(mockOrganizationData);

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.error).toContain('Auth creation failed');
    });

    it('should create default categories in sharded structure', async () => {
      // Mock successful operations
      const mockUser = { uid: 'test-user-id' };
      const mockUserCredential = { user: mockUser };
      
      vi.mocked(require('firebase/auth').createUserWithEmailAndPassword)
        .mockResolvedValue(mockUserCredential);
      vi.mocked(require('firebase/auth').updateProfile)
        .mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').writeBatch().commit)
        .mockResolvedValue(undefined);
      vi.mocked(DatabaseShardingService.createDocument)
        .mockResolvedValue(undefined);

      // Execute the test
      const result = await ShardedOrganizationService.createOrganization(mockOrganizationData);

      // Verify categories were created
      expect(DatabaseShardingService.createDocument).toHaveBeenCalledWith(
        'test-org',
        'categories',
        expect.any(String),
        expect.objectContaining({
          name: expect.any(String),
          level: expect.any(String),
          isDefault: true
        })
      );

      // Verify custom category was created
      expect(DatabaseShardingService.createDocument).toHaveBeenCalledWith(
        'test-org',
        'categories',
        expect.any(String),
        expect.objectContaining({
          name: 'Custom Category 1',
          isDefault: false
        })
      );
    });

    it('should create admin user with correct permissions', async () => {
      // Mock successful operations
      const mockUser = { uid: 'admin-user-id' };
      const mockUserCredential = { user: mockUser };
      
      vi.mocked(require('firebase/auth').createUserWithEmailAndPassword)
        .mockResolvedValue(mockUserCredential);
      vi.mocked(require('firebase/auth').updateProfile)
        .mockResolvedValue(undefined);
      vi.mocked(require('firebase/firestore').writeBatch().commit)
        .mockResolvedValue(undefined);
      vi.mocked(DatabaseShardingService.createDocument)
        .mockResolvedValue(undefined);

      // Execute the test
      await ShardedOrganizationService.createOrganization(mockOrganizationData);

      // Verify admin user document was created with correct structure
      expect(DatabaseShardingService.createDocument).toHaveBeenCalledWith(
        'test-org',
        'users',
        'admin-user-id',
        expect.objectContaining({
          id: 'admin-user-id',
          email: 'admin@testorg.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'business-owner',
          organizationId: 'test-org',
          permissions: expect.objectContaining({
            canManageEmployees: true,
            canCreateWarnings: true,
            canViewReports: true,
            canManageUsers: true,
            canManageSettings: true
          })
        })
      );
    });
  });
});
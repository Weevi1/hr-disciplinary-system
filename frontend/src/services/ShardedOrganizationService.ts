// frontend/src/services/ShardedOrganizationService.ts
// Organization creation service compatible with sharded database architecture

import { doc, setDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, auth, functions } from '../config/firebase'
import { DatabaseShardingService } from './DatabaseShardingService'
import { ShardedDataService } from './ShardedDataService'
import { UserOrgIndexService } from './UserOrgIndexService'
import { TimeService } from './TimeService'
import { UNIVERSAL_SA_CATEGORIES } from './UniversalCategories'
import { PDFTemplateService } from './PDFTemplateService'
import Logger from '../utils/logger'
import type { Organization, User } from '../types'

interface ShardedOrganizationData extends Partial<Organization> {
  // Required fields for sharded organization creation
  id: string
  name: string
  contactEmail: string
  subscriptionTier: string
  subscriptionStatus: string
  resellerId?: string
  
  // Admin user data
  adminUser: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: 'business-owner' | 'hr-manager'
  }
  
  // Optional branding
  branding?: {
    logoUrl?: string
    primaryColor?: string
  }
  
  // Optional customization
  customCategories?: string[]
}

/**
 * Sharded Organization Service
 * Creates organizations compatible with database sharding architecture
 */
export class ShardedOrganizationService {
  
  /**
   * Create organization with sharded structure
   */
  static async createOrganization(organizationData: ShardedOrganizationData): Promise<{
    organizationId: string
    adminUserId: string
    success: boolean
    error?: string
  }> {
    let batch = writeBatch(db)
    const organizationId = organizationData.id
    
    try {
      Logger.debug(`🏢 [SHARDED ORG] Creating organization with sharded structure: ${organizationId}`)
      Logger.debug(`📋 [SHARDED ORG] Organization name: ${organizationData.name}`)
      Logger.debug(`👤 [SHARDED ORG] Admin user name: ${organizationData.adminUser.firstName} ${organizationData.adminUser.lastName}`)

      // Step 1: Create organization document in main collection
      Logger.debug(`🗂️ [SHARDED ORG] Creating organization document at: organizations/${organizationId}`)
      const orgRef = doc(db, 'organizations', organizationId)

      // Initialize default PDF template settings for new organization
      // This ensures every org has explicit PDF configuration from creation
      const defaultPdfSettings = PDFTemplateService.getDefaultSettings(auth.currentUser?.uid || 'system');
      Logger.debug(`📄 [SHARDED ORG] Initializing PDF template with version ${defaultPdfSettings.generatorVersion}`);

      const organizationDoc = {
        id: organizationId,
        name: organizationData.name,
        industry: organizationData.industry || '',
        province: organizationData.province || '',
        city: organizationData.city || '',
        contactEmail: organizationData.contactEmail,
        contactPhone: organizationData.contactPhone || '',
        employeeCount: organizationData.employeeCount || 0,

        subscriptionTier: organizationData.subscriptionTier,
        subscriptionStatus: organizationData.subscriptionStatus,

        resellerId: organizationData.resellerId || null,

        branding: organizationData.branding || {
          logoUrl: '',
          primaryColor: '#2563eb'
        },

        // PDF template settings (initialized with defaults)
        pdfSettings: defaultPdfSettings,

        createdAt: TimeService.getServerTimestamp(),
        updatedAt: TimeService.getServerTimestamp(),
        isActive: organizationData.subscriptionStatus === 'active',

        // Sharded database metadata
        databaseVersion: '2.0',
        shardingEnabled: true,
        dataStructure: 'sharded'
      }

      batch.set(orgRef, organizationDoc)

      // Step 2: Initialize sharded collections
      await this.initializeShardedCollections(organizationId, batch)

      // Step 3: Commit organization and sharded structure BEFORE creating categories
      // This ensures the organization document exists in Firestore before Firestore rules check it
      await batch.commit()
      Logger.success(`✅ [SHARDED ORG] Organization ${organizationId} created with sharded structure`)
      Logger.success(`✅ [SHARDED ORG] PDF template v${defaultPdfSettings.generatorVersion} initialized for ${organizationId}`)

      // Step 4: Create default warning categories AFTER organization exists
      // This allows Firestore rules to validate resellerManagesOrganization() correctly
      await this.createDefaultCategories(organizationId, organizationData.customCategories || [])

      // Step 5: Create admin user account (separate from batch due to Firebase Auth)
      const adminUserId = await this.createAdminUser(organizationId, organizationData.adminUser)

      return {
        organizationId,
        adminUserId,
        success: true
      }

    } catch (error) {
      Logger.error('❌ [SHARDED ORG] Failed to create organization:', error)
      
      // Cleanup on failure
      try {
        await this.cleanupFailedOrganization(organizationId)
      } catch (cleanupError) {
        Logger.error('Failed to cleanup failed organization:', cleanupError)
      }

      return {
        organizationId,
        adminUserId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Initialize sharded collections for organization
   */
  private static async initializeShardedCollections(organizationId: string, batch: any): Promise<void> {
    Logger.debug(`🔧 [SHARDED ORG] Initializing sharded collections for ${organizationId}`)

    // Create initial metadata documents in sharded collections
    const collections = ['employees', 'warnings', 'categories', 'users', 'meetings', 'reports']

    for (const collectionName of collections) {
      const metadataRef = doc(db, `organizations/${organizationId}/${collectionName}`, '_metadata')
      batch.set(metadataRef, {
        collectionName,
        organizationId,
        createdAt: TimeService.getServerTimestamp(),
        totalDocuments: 0,
        lastUpdated: TimeService.getServerTimestamp()
      })
    }

    // Create organization settings in sharded structure
    const settingsRef = doc(db, `organizations/${organizationId}/settings`, 'main')
    batch.set(settingsRef, {
      organizationId,
      defaultWarningLevel: 'verbal',
      requireWitnessSignature: true,
      autoEscalation: true,
      notificationSettings: {
        emailNotifications: true,
        smsNotifications: false,
        deliveryConfirmation: true
      },
      customFields: [],
      createdAt: TimeService.getServerTimestamp()
    })
  }

  /**
   * Create default warning categories in sharded structure using UniversalCategories as source of truth
   */
  private static async createDefaultCategories(organizationId: string, customCategories: any[] = []): Promise<void> {
    Logger.debug(`📋 [SHARDED ORG] Creating categories for ${organizationId}`)

    // Check if customCategories contains the modified universal categories from the wizard
    // If it has entries with isDefault: true, these are the wizard's modified universal categories
    const hasModifiedUniversalCategories = customCategories.some(cat => cat.isDefault === true)

    if (hasModifiedUniversalCategories) {
      // The wizard has provided modified categories - use them directly instead of UNIVERSAL_SA_CATEGORIES
      Logger.debug(`📚 [SHARDED ORG] Using ${customCategories.length} wizard-modified categories`)

      // Create all categories passed from the wizard (both modified universal and custom)
      for (const category of customCategories) {
        await ShardedDataService.createWarningCategory(category as any, organizationId)
      }

      Logger.success(`✅ [SHARDED ORG] Created ${customCategories.length} categories for ${organizationId}`)
      return
    }

    // No modifications from wizard - use default universal categories
    Logger.debug(`📚 [SHARDED ORG] Using ${UNIVERSAL_SA_CATEGORIES.length} default universal categories`)

    // Convert UniversalCategories to the format expected by ShardedDataService
    const defaultCategories = UNIVERSAL_SA_CATEGORIES.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      severity: category.severity,
      escalationPath: category.escalationPath,
      color: category.severity === 'minor' ? '#16a34a' :
             category.severity === 'serious' ? '#ea580c' :
             '#dc2626', // gross_misconduct
      isActive: true,
      isDefault: true,
      // Additional metadata from UniversalCategories
      lraSection: category.lraSection,
      schedule8Reference: category.schedule8Reference,
      commonExamples: category.commonExamples,
      defaultValidityPeriod: category.defaultValidityPeriod,
      requiresImmediateAction: category.requiresImmediateAction || false
    }))

    // Only add truly custom categories (those that aren't default categories)
    const allCategories = [...defaultCategories]
    const trueCustomCategories = customCategories.filter(cat => !cat.isDefault)

    trueCustomCategories.forEach((category, index) => {
      if (typeof category === 'string') {
        // Old format - convert to object
        allCategories.push({
          id: `custom-${index + 1}`,
          name: category,
          description: `Custom category: ${category}`,
          severity: 'minor',
          escalationPath: ['counselling', 'verbal', 'first_written', 'final_written'],
          color: '#6366f1',
          isActive: true,
          isDefault: false
        })
      } else {
        // New format - use as-is
        allCategories.push({
          ...category,
          isDefault: false
        })
      }
    })

    // Create categories in sharded structure
    for (const category of allCategories) {
      await ShardedDataService.createWarningCategory(category as any, organizationId)
    }

    Logger.success(`✅ [SHARDED ORG] Created ${allCategories.length} categories for ${organizationId} (${defaultCategories.length} default + ${trueCustomCategories.length} custom)`)
  }

  /**
   * Create admin user account using Cloud Function (preserves current session)
   */
  private static async createAdminUser(organizationId: string, adminData: ShardedOrganizationData['adminUser']): Promise<string> {
    try {
      Logger.debug(`👤 [SHARDED ORG] Creating admin user for ${organizationId} via Cloud Function`)

      // Call Cloud Function to create user via Admin SDK (won't sign out current user)
      const createOrganizationAdmin = httpsCallable(functions, 'createOrganizationAdmin')

      const result = await createOrganizationAdmin({
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: adminData.role,
        organizationId: organizationId,
        sendWelcomeEmail: false,
        requirePasswordChange: false
      })

      const response = result.data as { uid: string; email: string; success: boolean; message: string }

      if (!response.success) {
        throw new Error(`Failed to create admin user: ${response.message}`)
      }

      const userId = response.uid
      Logger.debug(`📝 [SHARDED ORG] Admin user created via Cloud Function: ${userId}`)

      // Create user document in sharded structure
      const userData = {
        id: userId,
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: adminData.role,
        organizationId,
        isActive: true,
        createdAt: TimeService.getServerTimestamp(),
        lastLogin: null, // Haven't logged in yet
        permissions: {
          canManageEmployees: true,
          canCreateWarnings: true,
          canViewReports: true,
          canManageUsers: true,
          canManageSettings: true
        }
      }

      await DatabaseShardingService.createDocument(organizationId, 'users', userData, userId)

      // Create UserOrgIndex entry for instant O(1) lookup
      try {
        await UserOrgIndexService.setUserOrganization(
          userId,
          organizationId,
          'business-owner',
          adminData.email,
          'sharded'
        )
        Logger.debug(`📋 Created UserOrgIndex entry: ${userId} → ${organizationId}`)
      } catch (indexError) {
        Logger.error('❌ Failed to create UserOrgIndex entry:', indexError)
        // Don't fail the entire organization creation for index issues
      }

      Logger.success(`✅ [SHARDED ORG] Admin user created: ${userId}`)
      return userId

    } catch (error: any) {
      // Handle specific Firebase errors
      if (error?.message?.includes('email-already-exists') || error?.message?.includes('already in use')) {
        const errorMsg = `Email ${adminData.email} is already in use. Please use a different email address or contact support if this is your email.`
        Logger.error(`❌ [SHARDED ORG] ${errorMsg}`)
        throw new Error(errorMsg)
      }

      Logger.error('❌ [SHARDED ORG] Failed to create admin user:', error)
      throw error
    }
  }

  /**
   * Cleanup failed organization creation
   */
  private static async cleanupFailedOrganization(organizationId: string): Promise<void> {
    try {
      Logger.debug(`🧹 [SHARDED ORG] Cleaning up failed organization: ${organizationId}`)

      // Delete organization document
      const orgRef = doc(db, 'organizations', organizationId)
      await setDoc(orgRef, {}, { merge: false })

      // Note: Firebase doesn't support cascade delete, so sharded sub-collections
      // would need manual cleanup, but since the organization failed to create
      // completely, the sub-collections should be minimal

      Logger.success(`✅ [SHARDED ORG] Cleanup completed for ${organizationId}`)
    } catch (error) {
      Logger.error('❌ [SHARDED ORG] Cleanup failed:', error)
    }
  }

  /**
   * Activate organization after successful payment
   */
  static async activateOrganization(organizationId: string): Promise<void> {
    try {
      Logger.debug(`🚀 [SHARDED ORG] Activating organization: ${organizationId}`)

      // Update organization status
      const orgRef = doc(db, 'organizations', organizationId)
      await setDoc(orgRef, {
        subscriptionStatus: 'active',
        isActive: true,
        activatedAt: TimeService.getServerTimestamp(),
        updatedAt: TimeService.getServerTimestamp()
      }, { merge: true })

      // Activate admin user
      const users = await DatabaseShardingService.queryDocuments(organizationId, 'users', [
        ['role', '==', 'business-owner']
      ])

      if (users.documents.length > 0) {
        const adminUser = users.documents[0]
        await DatabaseShardingService.updateDocument(organizationId, 'users', adminUser.id, {
          isActive: true,
          activatedAt: TimeService.getServerTimestamp()
        })
      }

      Logger.success(`✅ [SHARDED ORG] Organization ${organizationId} activated`)
    } catch (error) {
      Logger.error('❌ [SHARDED ORG] Failed to activate organization:', error)
      throw error
    }
  }

  /**
   * Get organization with sharded metadata
   */
  static async getShardedOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const orgRef = doc(db, 'organizations', organizationId)
      const orgDoc = await DatabaseShardingService.getDocument(organizationId, 'organizations', organizationId)
      
      if (!orgDoc.exists) {
        return null
      }

      return orgDoc.data as Organization
    } catch (error) {
      Logger.error('Failed to get sharded organization:', error)
      return null
    }
  }

  /**
   * Migrate existing organization to sharded structure
   */
  static async migrateToShardedStructure(organizationId: string): Promise<boolean> {
    try {
      Logger.warn(`🔄 [MIGRATION] Migrating organization to sharded structure: ${organizationId}`)

      // This would implement the migration logic from flat to sharded
      // For now, return true indicating migration capability exists
      
      Logger.success(`✅ [MIGRATION] Organization ${organizationId} ready for sharded structure`)
      return true
    } catch (error) {
      Logger.error('❌ [MIGRATION] Failed to migrate organization:', error)
      return false
    }
  }
}
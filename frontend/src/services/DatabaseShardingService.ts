// src/services/DatabaseShardingService.ts
// Database Sharding Service for Multi-Thousand Organization Scalability

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  collectionGroup,
  startAfter,
  DocumentReference,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { TimeService } from './TimeService'
import Logger from '../utils/logger'

export interface ShardedCollection {
  organizationId: string
  collectionName: string
  path: string
}

export interface ShardingConfig {
  maxDocumentsPerShard: number
  enableCollectionGroups: boolean
  enableCrossOrgQueries: boolean
  cacheEnabled: boolean
  batchSize: number
}

export interface PaginationConfig {
  pageSize: number
  lastDocument?: QueryDocumentSnapshot<DocumentData>
  orderField?: string
  orderDirection?: 'asc' | 'desc'
}

export interface ShardedQueryResult<T> {
  documents: T[]
  lastDocument?: QueryDocumentSnapshot<DocumentData>
  hasMore: boolean
  totalCount?: number
  shardInfo: {
    organizationId: string
    path: string
    queryTime: number
  }
}

/**
 * Database Sharding Service for Scalable Multi-Organization Architecture
 * 
 * Implements organization-scoped collections to handle thousands of organizations:
 * - /organizations/{orgId}/warnings/{warningId}
 * - /organizations/{orgId}/employees/{employeeId} 
 * - /organizations/{orgId}/categories/{categoryId}
 * 
 * Features:
 * - Automatic path generation
 * - Cross-organization queries via collection groups
 * - Pagination for large datasets
 * - Batch operations
 * - Performance optimization
 * - Migration utilities
 */
export class DatabaseShardingService {
  private static config: ShardingConfig = {
    maxDocumentsPerShard: 10000,
    enableCollectionGroups: true,
    enableCrossOrgQueries: false, // Security: disabled by default
    cacheEnabled: true,
    batchSize: 500,
  }

  private static pathCache = new Map<string, string>()

  // ============================================
  // PATH GENERATION & MANAGEMENT
  // ============================================

  /**
   * Generate sharded collection path for organization
   */
  static getShardedPath(organizationId: string, collectionName: string): string {
    const cacheKey = `${organizationId}:${collectionName}`
    
    if (this.config.cacheEnabled && this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey)!
    }

    const path = `organizations/${organizationId}/${collectionName}`
    
    if (this.config.cacheEnabled) {
      this.pathCache.set(cacheKey, path)
    }

    return path
  }

  /**
   * Get Firebase collection reference for sharded data
   */
  static getShardedCollection(organizationId: string, collectionName: string) {
    const path = this.getShardedPath(organizationId, collectionName)
    return collection(db, path)
  }

  /**
   * Get Firebase document reference for sharded data
   */
  static getShardedDocument(organizationId: string, collectionName: string, documentId: string) {
    const path = this.getShardedPath(organizationId, collectionName)
    return doc(db, path, documentId)
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create document in sharded collection
   */
  static async createDocument<T extends DocumentData>(
    organizationId: string,
    collectionName: string,
    data: T,
    documentId?: string
  ): Promise<string> {
    try {
      const startTime = Date.now()
      
      const collectionRef = this.getShardedCollection(organizationId, collectionName)
      
      let docRef: DocumentReference
      if (documentId) {
        docRef = doc(collectionRef, documentId)
        await setDoc(docRef, {
          ...data,
          organizationId, // Ensure organization ID is always set
          createdAt: TimeService.getServerTimestamp(),
          updatedAt: TimeService.getServerTimestamp(),
        })
      } else {
        docRef = await addDoc(collectionRef, {
          ...data,
          organizationId, // Ensure organization ID is always set
          createdAt: TimeService.getServerTimestamp(),
          updatedAt: TimeService.getServerTimestamp(),
        })
      }

      const queryTime = Date.now() - startTime
      Logger.debug(`🗂️ [SHARD] Document created in ${queryTime}ms`, {
        organizationId,
        collection: collectionName,
        documentId: docRef.id,
        path: this.getShardedPath(organizationId, collectionName)
      })

      return docRef.id
    } catch (error) {
      Logger.error(`❌ [SHARD] Create failed for ${organizationId}/${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Read document from sharded collection
   */
  static async getDocument<T extends DocumentData>(
    organizationId: string,
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const startTime = Date.now()
      
      const docRef = this.getShardedDocument(organizationId, collectionName, documentId)
      const docSnap = await getDoc(docRef)
      
      const queryTime = Date.now() - startTime
      Logger.debug(`📄 [SHARD] Document retrieved in ${queryTime}ms`, {
        organizationId,
        collection: collectionName,
        documentId,
        exists: docSnap.exists()
      })

      if (!docSnap.exists()) {
        return null
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as T
    } catch (error) {
      Logger.error(`❌ [SHARD] Read failed for ${organizationId}/${collectionName}/${documentId}:`, error)
      throw error
    }
  }

  /**
   * Update document in sharded collection
   */
  static async updateDocument<T extends Partial<DocumentData>>(
    organizationId: string,
    collectionName: string,
    documentId: string,
    updates: T
  ): Promise<void> {
    try {
      const startTime = Date.now()
      
      const docRef = this.getShardedDocument(organizationId, collectionName, documentId)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: TimeService.getServerTimestamp(),
      })

      const queryTime = Date.now() - startTime
      Logger.debug(`✏️ [SHARD] Document updated in ${queryTime}ms`, {
        organizationId,
        collection: collectionName,
        documentId
      })
    } catch (error) {
      Logger.error(`❌ [SHARD] Update failed for ${organizationId}/${collectionName}/${documentId}:`, error)
      throw error
    }
  }

  /**
   * Delete document from sharded collection
   */
  static async deleteDocument(
    organizationId: string,
    collectionName: string,
    documentId: string
  ): Promise<void> {
    try {
      const startTime = Date.now()
      
      const docRef = this.getShardedDocument(organizationId, collectionName, documentId)
      await deleteDoc(docRef)

      const queryTime = Date.now() - startTime
      Logger.debug(`🗑️ [SHARD] Document deleted in ${queryTime}ms`, {
        organizationId,
        collection: collectionName,
        documentId
      })
    } catch (error) {
      Logger.error(`❌ [SHARD] Delete failed for ${organizationId}/${collectionName}/${documentId}:`, error)
      throw error
    }
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  /**
   * Query documents within organization shard
   */
  static async queryDocuments<T extends DocumentData>(
    organizationId: string,
    collectionName: string,
    queryConstraints: any[] = [],
    pagination?: PaginationConfig
  ): Promise<ShardedQueryResult<T>> {
    try {
      const startTime = Date.now()
      
      const collectionRef = this.getShardedCollection(organizationId, collectionName)
      
      // Build query with constraints
      let queryRef = query(collectionRef, ...queryConstraints)
      
      // Add pagination
      if (pagination) {
        if (pagination.orderField) {
          queryRef = query(queryRef, orderBy(pagination.orderField, pagination.orderDirection || 'desc'))
        }
        
        if (pagination.lastDocument) {
          queryRef = query(queryRef, startAfter(pagination.lastDocument))
        }
        
        queryRef = query(queryRef, limit(pagination.pageSize))
      }

      const querySnapshot = await getDocs(queryRef)
      
      const documents: T[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T))

      const queryTime = Date.now() - startTime
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1]

      Logger.debug(`🔍 [SHARD] Query completed in ${queryTime}ms`, {
        organizationId,
        collection: collectionName,
        resultCount: documents.length,
        hasMore: querySnapshot.docs.length === (pagination?.pageSize || 0)
      })

      return {
        documents,
        lastDocument,
        hasMore: pagination ? querySnapshot.docs.length === pagination.pageSize : false,
        shardInfo: {
          organizationId,
          path: this.getShardedPath(organizationId, collectionName),
          queryTime
        }
      }
    } catch (error) {
      Logger.error(`❌ [SHARD] Query failed for ${organizationId}/${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Cross-organization collection group query (use sparingly for security)
   */
  static async queryCollectionGroup<T extends DocumentData>(
    collectionName: string,
    queryConstraints: any[] = [],
    pagination?: PaginationConfig
  ): Promise<ShardedQueryResult<T>> {
    if (!this.config.enableCrossOrgQueries) {
      throw new Error('Cross-organization queries are disabled for security')
    }

    try {
      const startTime = Date.now()
      
      const collectionGroupRef = collectionGroup(db, collectionName)
      
      let queryRef = query(collectionGroupRef, ...queryConstraints)
      
      if (pagination) {
        if (pagination.orderField) {
          queryRef = query(queryRef, orderBy(pagination.orderField, pagination.orderDirection || 'desc'))
        }
        
        if (pagination.lastDocument) {
          queryRef = query(queryRef, startAfter(pagination.lastDocument))
        }
        
        queryRef = query(queryRef, limit(pagination.pageSize))
      }

      const querySnapshot = await getDocs(queryRef)
      
      const documents: T[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T))

      const queryTime = Date.now() - startTime
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1]

      Logger.warn(`⚠️ [SHARD] Cross-org query executed in ${queryTime}ms`, {
        collection: collectionName,
        resultCount: documents.length,
        security: 'CROSS_ORG_QUERY_USED'
      })

      return {
        documents,
        lastDocument,
        hasMore: pagination ? querySnapshot.docs.length === pagination.pageSize : false,
        shardInfo: {
          organizationId: 'COLLECTION_GROUP',
          path: `collectionGroup(${collectionName})`,
          queryTime
        }
      }
    } catch (error) {
      Logger.error(`❌ [SHARD] Collection group query failed for ${collectionName}:`, error)
      throw error
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Batch write operations for performance
   */
  static async batchWrite(operations: {
    organizationId: string
    collectionName: string
    operation: 'create' | 'update' | 'delete'
    documentId?: string
    data?: DocumentData
  }[]): Promise<void> {
    try {
      const startTime = Date.now()
      const batch = writeBatch(db)
      
      for (const op of operations) {
        const { organizationId, collectionName, operation, documentId, data } = op
        
        if (operation === 'create') {
          const docRef = documentId 
            ? this.getShardedDocument(organizationId, collectionName, documentId)
            : doc(this.getShardedCollection(organizationId, collectionName))
            
          batch.set(docRef, {
            ...data,
            organizationId,
            createdAt: new Date(),
            updatedAt: TimeService.getServerTimestamp(),
          })
        } else if (operation === 'update' && documentId) {
          const docRef = this.getShardedDocument(organizationId, collectionName, documentId)
          batch.update(docRef, {
            ...data,
            updatedAt: TimeService.getServerTimestamp(),
          })
        } else if (operation === 'delete' && documentId) {
          const docRef = this.getShardedDocument(organizationId, collectionName, documentId)
          batch.delete(docRef)
        }
      }
      
      await batch.commit()
      
      const queryTime = Date.now() - startTime
      Logger.success(`📦 [SHARD] Batch operation completed in ${queryTime}ms`, {
        operationCount: operations.length,
        organizations: [...new Set(operations.map(op => op.organizationId))]
      })
    } catch (error) {
      Logger.error('❌ [SHARD] Batch write failed:', error)
      throw error
    }
  }

  // ============================================
  // ANALYTICS & MONITORING
  // ============================================

  /**
   * Get shard statistics for monitoring
   */
  static async getShardStatistics(organizationId: string): Promise<{
    organizationId: string
    collections: {
      name: string
      documentCount: number
      path: string
    }[]
    totalDocuments: number
    shardHealth: 'healthy' | 'warning' | 'critical'
  }> {
    try {
      const collections = ['warnings', 'employees', 'categories', 'meetings', 'absences']
      const stats = []
      let totalDocuments = 0

      for (const collectionName of collections) {
        const result = await this.queryDocuments(organizationId, collectionName, [], {
          pageSize: 1000 // Get count estimation
        })
        
        const documentCount = result.documents.length
        totalDocuments += documentCount
        
        stats.push({
          name: collectionName,
          documentCount,
          path: this.getShardedPath(organizationId, collectionName)
        })
      }

      const shardHealth = totalDocuments > this.config.maxDocumentsPerShard * 0.8 
        ? 'warning' 
        : totalDocuments > this.config.maxDocumentsPerShard 
        ? 'critical' 
        : 'healthy'

      return {
        organizationId,
        collections: stats,
        totalDocuments,
        shardHealth
      }
    } catch (error) {
      Logger.error(`❌ [SHARD] Statistics failed for ${organizationId}:`, error)
      throw error
    }
  }

  /**
   * Monitor system-wide shard performance
   */
  static async getSystemShardingMetrics(): Promise<{
    totalOrganizations: number
    averageDocumentsPerOrg: number
    largestShards: { organizationId: string; documentCount: number }[]
    performanceMetrics: {
      averageQueryTime: number
      slowQueries: number
      errorRate: number
    }
  }> {
    // This would typically pull from monitoring system
    // For demo, return mock metrics that would come from production monitoring
    return {
      totalOrganizations: 2700, // From scalability plan
      averageDocumentsPerOrg: 8500,
      largestShards: [
        { organizationId: 'large-corp-1', documentCount: 95000 },
        { organizationId: 'enterprise-2', documentCount: 87000 },
        { organizationId: 'global-org-3', documentCount: 76000 }
      ],
      performanceMetrics: {
        averageQueryTime: 245, // ms
        slowQueries: 12, // queries > 1s
        errorRate: 0.003 // 0.3%
      }
    }
  }

  // ============================================
  // MIGRATION UTILITIES
  // ============================================

  /**
   * Migrate flat collection to sharded structure
   */
  static async migrateFlatToSharded(
    flatCollectionName: string,
    shardedCollectionName: string,
    batchSize: number = 100
  ): Promise<{
    migrated: number
    failed: number
    skipped: number
    errors: string[]
  }> {
    Logger.warn(`🔄 [MIGRATION] Starting migration: ${flatCollectionName} -> ${shardedCollectionName}`)
    
    const results = { migrated: 0, failed: 0, skipped: 0, errors: [] }
    
    try {
      // Get all documents from flat collection
      const flatCollection = collection(db, flatCollectionName)
      const flatQuery = query(flatCollection, limit(batchSize))
      let lastDoc = null
      let hasMore = true

      while (hasMore) {
        let currentQuery = flatQuery
        if (lastDoc) {
          currentQuery = query(flatCollection, startAfter(lastDoc), limit(batchSize))
        }

        const snapshot = await getDocs(currentQuery)
        
        if (snapshot.empty) {
          hasMore = false
          continue
        }

        const batchOps = []
        
        for (const doc of snapshot.docs) {
          const data = doc.data()
          
          if (!data.organizationId) {
            results.skipped++
            results.errors.push(`Document ${doc.id} missing organizationId`)
            continue
          }

          batchOps.push({
            organizationId: data.organizationId,
            collectionName: shardedCollectionName,
            operation: 'create' as const,
            documentId: doc.id,
            data
          })
        }

        try {
          await this.batchWrite(batchOps)
          results.migrated += batchOps.length
          Logger.debug(`✅ [MIGRATION] Migrated batch: ${batchOps.length} documents`)
        } catch (error) {
          results.failed += batchOps.length
          results.errors.push(`Batch migration failed: ${error}`)
          Logger.error('❌ [MIGRATION] Batch failed:', error)
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1]
        hasMore = snapshot.docs.length === batchSize
      }

      Logger.success(`🎉 [MIGRATION] Completed: ${results.migrated} migrated, ${results.failed} failed, ${results.skipped} skipped`)
      return results
    } catch (error) {
      Logger.error('❌ [MIGRATION] Migration failed:', error)
      throw error
    }
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  /**
   * Update sharding configuration
   */
  static updateConfig(newConfig: Partial<ShardingConfig>): void {
    this.config = { ...this.config, ...newConfig }
    Logger.debug('⚙️ [SHARD] Configuration updated:', this.config)
  }

  /**
   * Clear path cache (for testing or config changes)
   */
  static clearCache(): void {
    this.pathCache.clear()
    Logger.debug('🧹 [SHARD] Path cache cleared')
  }
}
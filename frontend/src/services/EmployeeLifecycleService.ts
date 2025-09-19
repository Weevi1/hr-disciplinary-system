// frontend/src/services/EmployeeLifecycleService.ts
// Employee Lifecycle Management Service
// Handles employee state transitions: active → archived → deletion eligibility

import Logger from '../utils/logger'
import { ShardedDataService } from './ShardedDataService'
import { TimeService } from './TimeService'
import type { Employee } from '../types'

export interface EmployeeLifecycleState {
  status: 'active' | 'archived' | 'deletion_eligible'
  archivedAt?: Date
  archiveReason?: string
  archivedBy?: string
  deletionEligibleAt?: Date
  canBeDeleted: boolean
}

export interface ArchiveEmployeeOptions {
  reason: string
  archivedBy: string
  notifyEmployee?: boolean
}

export interface EmployeeLifecycleStats {
  active: number
  archived: number
  deletionEligible: number
  totalArchived: number
  oldestArchived?: {
    employeeId: string
    name: string
    archivedDate: Date
    daysArchived: number
  }
}

/**
 * Employee Lifecycle Service
 *
 * Manages the complete employee lifecycle:
 * 1. Active - Normal working employee
 * 2. Archived - Employee no longer active but data retained
 * 3. Deletion Eligible - Archived for 5+ years, can be permanently deleted
 */
export class EmployeeLifecycleService {

  private static readonly ARCHIVE_TO_DELETION_DAYS = 5 * 365 // 5 years in days

  /**
   * Get employee lifecycle state
   */
  static getEmployeeLifecycleState(employee: Employee): EmployeeLifecycleState {
    const state: EmployeeLifecycleState = {
      status: employee.isActive ? 'active' : 'archived',
      canBeDeleted: false
    }

    if (!employee.isActive && employee.archivedAt) {
      state.archivedAt = new Date(employee.archivedAt)
      state.archiveReason = employee.archiveReason
      state.archivedBy = employee.archivedBy

      // Check if employee is eligible for deletion (5 years archived)
      const daysSinceArchived = this.getDaysSinceArchived(employee.archivedAt)
      if (daysSinceArchived >= this.ARCHIVE_TO_DELETION_DAYS) {
        state.status = 'deletion_eligible'
        state.deletionEligibleAt = new Date(
          new Date(employee.archivedAt).getTime() + (this.ARCHIVE_TO_DELETION_DAYS * 24 * 60 * 60 * 1000)
        )
        state.canBeDeleted = true
      }
    }

    return state
  }

  /**
   * Archive an active employee
   */
  static async archiveEmployee(
    employeeId: string,
    organizationId: string,
    options: ArchiveEmployeeOptions
  ): Promise<void> {
    try {
      Logger.debug(`🗄️ [LIFECYCLE] Archiving employee: ${employeeId}`)

      const employee = await ShardedDataService.getEmployeeById(employeeId, organizationId)
      if (!employee) {
        throw new Error('Employee not found')
      }

      if (!employee.isActive) {
        throw new Error('Employee is already archived')
      }

      const archiveData = {
        isActive: false,
        archivedAt: TimeService.getServerTimestamp(),
        archiveReason: options.reason,
        archivedBy: options.archivedBy,
        updatedAt: TimeService.getServerTimestamp()
      }

      await ShardedDataService.updateEmployee(employeeId, organizationId, archiveData)

      Logger.success(`✅ [LIFECYCLE] Employee ${employeeId} archived successfully`)

      // TODO: Send notification if requested
      if (options.notifyEmployee) {
        // Implementation would go here for employee notification
        Logger.debug(`📧 [LIFECYCLE] Employee notification requested for ${employeeId}`)
      }

    } catch (error) {
      Logger.error(`❌ [LIFECYCLE] Failed to archive employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Restore an archived employee
   */
  static async restoreEmployee(
    employeeId: string,
    organizationId: string,
    restoredBy: string
  ): Promise<void> {
    try {
      Logger.debug(`🔄 [LIFECYCLE] Restoring employee: ${employeeId}`)

      const employee = await ShardedDataService.getEmployeeById(employeeId, organizationId)
      if (!employee) {
        throw new Error('Employee not found')
      }

      if (employee.isActive) {
        throw new Error('Employee is already active')
      }

      const restoreData = {
        isActive: true,
        restoredAt: TimeService.getServerTimestamp(),
        restoredBy,
        updatedAt: TimeService.getServerTimestamp(),
        // Clear archive data
        archivedAt: null,
        archiveReason: null,
        archivedBy: null
      }

      await ShardedDataService.updateEmployee(employeeId, organizationId, restoreData)

      Logger.success(`✅ [LIFECYCLE] Employee ${employeeId} restored successfully`)

    } catch (error) {
      Logger.error(`❌ [LIFECYCLE] Failed to restore employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Get employees eligible for deletion (archived for 5+ years)
   */
  static async getEmployeesEligibleForDeletion(organizationId: string): Promise<Employee[]> {
    try {
      Logger.debug(`🔍 [LIFECYCLE] Finding deletion-eligible employees for ${organizationId}`)

      // Load all employees (active and archived)
      const allEmployees = await ShardedDataService.queryDocuments<Employee>(
        organizationId,
        'employees',
        [], // No filters - get all employees
        { pageSize: 1000, orderField: 'archivedAt', orderDirection: 'asc' }
      )

      const eligibleEmployees = allEmployees.documents.filter(employee => {
        if (employee.isActive || !employee.archivedAt) {
          return false
        }

        const daysSinceArchived = this.getDaysSinceArchived(employee.archivedAt)
        return daysSinceArchived >= this.ARCHIVE_TO_DELETION_DAYS
      })

      Logger.debug(`📊 [LIFECYCLE] Found ${eligibleEmployees.length} employees eligible for deletion`)
      return eligibleEmployees

    } catch (error) {
      Logger.error(`❌ [LIFECYCLE] Failed to get deletion-eligible employees:`, error)
      throw error
    }
  }

  /**
   * Permanently delete an employee (only if eligible)
   */
  static async permanentlyDeleteEmployee(
    employeeId: string,
    organizationId: string,
    deletedBy: string,
    confirmationCode: string
  ): Promise<void> {
    try {
      Logger.warn(`🗑️ [LIFECYCLE] PERMANENT DELETION requested for employee: ${employeeId}`)

      const employee = await ShardedDataService.getEmployeeById(employeeId, organizationId)
      if (!employee) {
        throw new Error('Employee not found')
      }

      // Verify deletion eligibility
      const lifecycleState = this.getEmployeeLifecycleState(employee)
      if (!lifecycleState.canBeDeleted) {
        const daysRemaining = this.ARCHIVE_TO_DELETION_DAYS - this.getDaysSinceArchived(employee.archivedAt!)
        throw new Error(`Employee not eligible for deletion. ${daysRemaining} days remaining in archive period.`)
      }

      // Verify confirmation code (simple security measure)
      const expectedCode = `DELETE-${employee.profile.employeeNumber}-${deletedBy.slice(-4).toUpperCase()}`
      if (confirmationCode !== expectedCode) {
        throw new Error(`Invalid confirmation code. Expected: ${expectedCode}`)
      }

      // Create audit record before deletion
      const auditRecord = {
        action: 'PERMANENT_DELETION',
        employeeId,
        employeeNumber: employee.profile.employeeNumber,
        employeeName: `${employee.profile.firstName} ${employee.profile.lastName}`,
        deletedBy,
        deletedAt: TimeService.getServerTimestamp(),
        archiveDate: employee.archivedAt,
        daysArchived: this.getDaysSinceArchived(employee.archivedAt!),
        reason: 'Automatic deletion after 5-year archive period'
      }

      // Store audit record in separate collection
      await ShardedDataService.createDocument(
        organizationId,
        'employee_deletion_audit',
        auditRecord
      )

      // Perform permanent deletion
      await ShardedDataService.deleteDocument(organizationId, 'employees', employeeId)

      Logger.warn(`🗑️ [LIFECYCLE] PERMANENT DELETION completed for employee: ${employeeId}`)
      Logger.warn(`📋 [LIFECYCLE] Audit record created for deletion of ${employee.profile.employeeNumber}`)

    } catch (error) {
      Logger.error(`❌ [LIFECYCLE] Failed to permanently delete employee ${employeeId}:`, error)
      throw error
    }
  }

  /**
   * Get employee lifecycle statistics for organization
   */
  static async getLifecycleStats(organizationId: string): Promise<EmployeeLifecycleStats> {
    try {
      Logger.debug(`📊 [LIFECYCLE] Calculating lifecycle stats for ${organizationId}`)

      // Load all employees
      const allEmployees = await ShardedDataService.queryDocuments<Employee>(
        organizationId,
        'employees',
        [],
        { pageSize: 2000, orderField: 'createdAt', orderDirection: 'asc' }
      )

      const stats: EmployeeLifecycleStats = {
        active: 0,
        archived: 0,
        deletionEligible: 0,
        totalArchived: 0
      }

      let oldestArchivedEmployee: any = null
      let oldestArchiveDays = 0

      for (const employee of allEmployees.documents) {
        if (employee.isActive) {
          stats.active++
        } else {
          stats.archived++
          stats.totalArchived++

          if (employee.archivedAt) {
            const daysSinceArchived = this.getDaysSinceArchived(employee.archivedAt)

            if (daysSinceArchived >= this.ARCHIVE_TO_DELETION_DAYS) {
              stats.deletionEligible++
            }

            if (daysSinceArchived > oldestArchiveDays) {
              oldestArchiveDays = daysSinceArchived
              oldestArchivedEmployee = {
                employeeId: employee.id,
                name: `${employee.profile.firstName} ${employee.profile.lastName}`,
                archivedDate: new Date(employee.archivedAt),
                daysArchived: daysSinceArchived
              }
            }
          }
        }
      }

      if (oldestArchivedEmployee) {
        stats.oldestArchived = oldestArchivedEmployee
      }

      Logger.success(`📊 [LIFECYCLE] Stats calculated: ${stats.active} active, ${stats.archived} archived, ${stats.deletionEligible} deletion eligible`)
      return stats

    } catch (error) {
      Logger.error(`❌ [LIFECYCLE] Failed to calculate lifecycle stats:`, error)
      throw error
    }
  }

  /**
   * Bulk archive multiple employees
   */
  static async bulkArchiveEmployees(
    employeeIds: string[],
    organizationId: string,
    options: ArchiveEmployeeOptions
  ): Promise<{
    successful: string[]
    failed: Array<{ employeeId: string; error: string }>
  }> {
    const result = {
      successful: [] as string[],
      failed: [] as Array<{ employeeId: string; error: string }>
    }

    Logger.debug(`🗄️ [LIFECYCLE] Bulk archiving ${employeeIds.length} employees`)

    for (const employeeId of employeeIds) {
      try {
        await this.archiveEmployee(employeeId, organizationId, options)
        result.successful.push(employeeId)
      } catch (error) {
        result.failed.push({
          employeeId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    Logger.success(`✅ [LIFECYCLE] Bulk archive complete: ${result.successful.length} successful, ${result.failed.length} failed`)
    return result
  }

  /**
   * Generate deletion confirmation code
   */
  static generateDeletionConfirmationCode(employeeNumber: string, deletedBy: string): string {
    return `DELETE-${employeeNumber}-${deletedBy.slice(-4).toUpperCase()}`
  }

  /**
   * Check if employee can be archived
   */
  static canArchiveEmployee(employee: Employee): { canArchive: boolean; reason?: string } {
    if (!employee.isActive) {
      return { canArchive: false, reason: 'Employee is already archived' }
    }

    // Check for active warnings that might require special handling
    if (employee.disciplinaryRecord?.activeWarnings > 0) {
      return {
        canArchive: true,
        reason: 'Employee has active warnings - ensure proper closure before archiving'
      }
    }

    return { canArchive: true }
  }

  /**
   * Helper: Calculate days since employee was archived
   */
  private static getDaysSinceArchived(archivedAt: any): number {
    const archivedDate = new Date(archivedAt)
    const now = new Date()
    const diffTime = now.getTime() - archivedDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Helper: Format time remaining until deletion eligibility
   */
  static getTimeUntilDeletionEligible(archivedAt: any): string {
    const daysSinceArchived = this.getDaysSinceArchived(archivedAt)
    const daysRemaining = this.ARCHIVE_TO_DELETION_DAYS - daysSinceArchived

    if (daysRemaining <= 0) {
      return 'Eligible for deletion'
    }

    const yearsRemaining = Math.floor(daysRemaining / 365)
    const remainingDays = daysRemaining % 365

    if (yearsRemaining > 0) {
      return `${yearsRemaining} year${yearsRemaining !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
    } else {
      return `${remainingDays} day${remainingDays !== 1 ? 's' : ''} remaining`
    }
  }
}
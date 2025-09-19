// frontend/src/utils/userCreationContext.ts
// Global context for managing user creation state to prevent race condition warnings

class UserCreationManager {
  private isCreatingUser = false;
  private pendingUserIds: Set<string> = new Set();

  /**
   * Mark that we're starting to create a user
   */
  startUserCreation(userId: string) {
    this.isCreatingUser = true;
    this.pendingUserIds.add(userId);
  }

  /**
   * Mark that we've finished creating a user
   */
  finishUserCreation(userId: string) {
    this.pendingUserIds.delete(userId);
    if (this.pendingUserIds.size === 0) {
      this.isCreatingUser = false;
    }
  }

  /**
   * Check if we're currently creating users
   */
  isCreating(): boolean {
    return this.isCreatingUser;
  }

  /**
   * Check if a specific user is being created
   */
  isPendingUser(userId: string): boolean {
    return this.pendingUserIds.has(userId);
  }
}

// Global singleton instance
export const userCreationManager = new UserCreationManager();
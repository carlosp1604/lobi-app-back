export interface MaxSessionsPolicyConfig {
  maxActive: number
}

/**
 * Policy that enforces the maximum number of active sessions for a user
 */
export class MaxSessionsPolicy {
  constructor(private readonly configuration: MaxSessionsPolicyConfig) {}

  /**
   * Calculates the number of surplus sessions that would exist if a new session were created
   * @param activeBeforeCreate number of sessions currently active
   * @returns the number of surplus sessions after creation (0 if within limit)
   */
  public surplusAfterCreate(activeBeforeCreate: number): number {
    const activeAfter = activeBeforeCreate + 1
    return Math.max(0, activeAfter - this.configuration.maxActive)
  }

  /**
   * Checks whether creating a new session would exceed the maximum allowed
   * @param activeBeforeCreate number of sessions currently active
   * @returns true if the new session would exceed the limit, otherwise false
   */
  public wouldExceed(activeBeforeCreate: number): boolean {
    return this.surplusAfterCreate(activeBeforeCreate) > 0
  }
}

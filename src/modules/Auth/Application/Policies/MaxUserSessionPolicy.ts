export interface MaxSessionsPolicyConfig {
  maxActive: number
}

/**
 * Policy that enforces the maximum number of active sessions for a user
 */
export class MaxSessionsPolicy {
  constructor(private readonly configuration: MaxSessionsPolicyConfig) {}

  get maxSessions(): number {
    return this.configuration.maxActive
  }
}

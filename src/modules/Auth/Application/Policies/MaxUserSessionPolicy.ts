import { UserSession } from '~/src/modules/Auth/Domain/UserSession'

/**
 * Policy that enforces the maximum number of active sessions for a user
 */
export class MaxSessionsPolicy {
  constructor(private readonly maxSessions: number) {
    if (!Number.isInteger(maxSessions) || maxSessions < 1) {
      throw new RangeError('MaxSessionsPolicy: maxSessions must be a positive integer')
    }
  }

  public sessionsToRevoke(activeSessions: Array<UserSession>): Array<UserSession> {
    if (activeSessions.length < this.maxSessions) {
      return []
    }

    const sortedSessions = this.sortSessions(activeSessions)

    const countToRevoke = sortedSessions.length - this.maxSessions + 1

    return sortedSessions.slice(0, countToRevoke)
  }

  private sortSessions(sessions: Array<UserSession>): Array<UserSession> {
    return [...sessions].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }
}

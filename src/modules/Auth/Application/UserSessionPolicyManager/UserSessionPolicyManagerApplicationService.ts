import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'
import { Identifier } from '~/src/modules/Shared/Domain/ValueObject/Identifier'

export class UserSessionPolicyManagerApplicationService {
  constructor(
    private readonly maxSessionsPolicy: MaxSessionsPolicy,
    private readonly loggerService: LoggerServiceInterface,
  ) {}

  public applyPolicyAndRevokeForLogin(
    activeSessions: Array<UserSession>,
    now: Date,
  ): Result<Array<UserSession>, UserSessionPolicyManagerApplicationError> {
    return this.applyPolicyToActiveSessions(activeSessions, now)
  }

  public applyPolicyAndRevokeForRefresh(
    currentSessionId: Identifier,
    userId: Identifier,
    activeSessions: Array<UserSession>,
    now: Date,
  ): Result<Array<UserSession>, UserSessionPolicyManagerApplicationError> {
    const currentSession = activeSessions.find((session) => session.id.equals(currentSessionId))

    if (!currentSession) {
      this.loggerService.error('Inconsistent state', undefined, {
        sessionId: currentSessionId.value,
        userId: userId.value,
        reason: 'Current session not found in active sessions list',
      })

      return fail(UserSessionPolicyManagerApplicationError.sessionsInconsistency(currentSessionId.value, userId.value))
    }

    const revokeCurrentResult = this.handleRevocation(currentSession, now)

    if (!revokeCurrentResult.success) {
      return revokeCurrentResult
    }

    const stillActive = activeSessions.filter((session) => !session.id.equals(currentSession.id))

    const maxSessionsPolicyResult = this.applyPolicyToActiveSessions(stillActive, now)

    if (!maxSessionsPolicyResult.success) {
      return maxSessionsPolicyResult
    }

    const revokedByPolicy = maxSessionsPolicyResult.value

    return success([currentSession, ...revokedByPolicy])
  }

  private applyPolicyToActiveSessions(
    activeSessions: Array<UserSession>,
    now: Date,
  ): Result<Array<UserSession>, UserSessionPolicyManagerApplicationError> {
    const sessionsToRevoke = this.maxSessionsPolicy.sessionsToRevoke(activeSessions)

    const successfullyRevoked: Array<UserSession> = []
    for (const session of sessionsToRevoke) {
      const revokeResult = this.handleRevocation(session, now)

      if (!revokeResult.success) {
        return revokeResult
      }

      successfullyRevoked.push(session)
    }

    return success(successfullyRevoked)
  }

  private handleRevocation(session: UserSession, now: Date): Result<void, UserSessionPolicyManagerApplicationError> {
    const canBeRevokedResult = session.canBeRevoked(now)

    if (!canBeRevokedResult.success) {
      this.loggerService.warn('Session revocation failed', {
        sessionId: session.id.value,
        userId: session.userId.value,
        revokedAt: session.revokedAt,
        expiresAt: session.expiresAt,
        error: canBeRevokedResult.error.message,
      })

      return fail(UserSessionPolicyManagerApplicationError.revocationFailed(canBeRevokedResult.error.message))
    }

    session.revoke(now)
    return success(undefined)
  }
}

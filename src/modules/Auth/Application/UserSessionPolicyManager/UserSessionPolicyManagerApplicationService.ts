import { ErrorUtils } from '~/src/modules/Shared/Domain/ErrorUtils'
import { UserSession } from '~/src/modules/Auth/Domain/UserSession'
import { MaxSessionsPolicy } from '~/src/modules/Auth/Application/Policies/MaxUserSessionPolicy'
import { Result, success, fail } from '~/src/modules/Shared/Domain/Result'
import { LoggerServiceInterface } from '~/src/modules/Shared/Domain/LoggerServiceInterface'
import { UserSessionDomainException } from '~/src/modules/Auth/Domain/UserSessionDomainException'
import { UserSessionPolicyManagerApplicationError } from '~/src/modules/Auth/Application/UserSessionPolicyManager/UserSessionPolicyManagerApplicationError'

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
    currentSession: UserSession,
    activeSessions: Array<UserSession>,
    now: Date,
  ): Result<Array<UserSession>, UserSessionPolicyManagerApplicationError> {
    const isCurrentInList = activeSessions.some((session) => session.id.equals(currentSession.id))

    if (!isCurrentInList) {
      this.loggerService.error('Inconsistent state', undefined, {
        sessionId: currentSession.id.value,
        userId: currentSession.userId.value,
        reason: 'Current session not found in active sessions list',
      })

      return fail(UserSessionPolicyManagerApplicationError.sessionsInconsistency(currentSession.id.value, currentSession.userId.value))
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
    try {
      session.revoke(now)

      return success(undefined)
    } catch (exception: unknown) {
      const normalizedError = ErrorUtils.normalize(exception)

      const errorMetadata = {
        sessionId: session.id.value,
        userId: session.userId.value,
        revokedAt: session.revokedAt,
        expiresAt: session.expiresAt,
      }

      if (!(exception instanceof UserSessionDomainException)) {
        this.loggerService.error('Unexpected error while revoking session', normalizedError.stack, {
          ...errorMetadata,
          error: normalizedError.message,
        })

        throw new Error(`Unexpected error while revoking session ${session.id.value}`)
      }

      this.loggerService.warn('Session revocation failed', {
        ...errorMetadata,
        error: normalizedError.message,
      })

      return fail(UserSessionPolicyManagerApplicationError.revocationFailed(normalizedError.message))
    }
  }
}

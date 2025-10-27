export class UserSessionPolicyManagerApplicationError extends Error {
  public readonly id: string
  public readonly name: string

  public static revocationFailedId = 'user_session_policy_manager_application_service_revocation_failed'
  public static sessionsInconsistencyId = 'user_session_policy_manager_application_service_sessions_inconsistency'

  private constructor(message: string, id: string) {
    super(message)
    this.id = id
    this.name = UserSessionPolicyManagerApplicationError.name
  }

  public static revocationFailed(domainErrorMessage: string): UserSessionPolicyManagerApplicationError {
    return new UserSessionPolicyManagerApplicationError(`Session revocation failed: ${domainErrorMessage}`, this.revocationFailedId)
  }

  public static sessionsInconsistency(sessionId: string, userId: string): UserSessionPolicyManagerApplicationError {
    return new UserSessionPolicyManagerApplicationError(
      `Sessions Inconsistency: The session ${sessionId} for user ${userId} was not found in the active sessions list`,
      this.sessionsInconsistencyId,
    )
  }
}

export interface TokenGeneratorApplicationServiceInterface {
  /**
   * Generates an access token for the given user and session
   * @param userId User ID
   * @param sessionId Session ID
   * @param expiresAt the expiration date of the token
   * @param now the current timestamp used as the token’s issued-at time
   * @returns the generated access token
   */
  generateAccessToken(userId: string, sessionId: string, expiresAt: Date, now: Date): Promise<string>

  /**
   * Generates a session token
   * @returns the generated session token
   */
  generateSessionToken(): Promise<string>
}

export interface TokenGeneratorApplicationServiceInterface {
  /**
   * Generates an access token for the given user and session
   * @param userId User ID
   * @param sessionId Session ID
   * @param expiresAt the expiration date of the token
   * @returns the generated access token
   */
  generateAccessToken(userId: string, sessionId: string, expiresAt: Date): Promise<string>

  /**
   * Generates a session token for the given user and session
   * @param userId User ID
   * @param sessionId Session ID
   * @param expiresAt the expiration date of the token
   * @returns the generated session token
   */
  generateSessionToken(userId: string, sessionId: string, expiresAt: Date): Promise<string>
}

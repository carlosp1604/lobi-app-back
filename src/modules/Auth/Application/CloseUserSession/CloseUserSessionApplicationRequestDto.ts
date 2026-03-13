export interface CloseUserSessionApplicationRequestDto {
  readonly userId: string
  readonly sessionId: string
  readonly currentSessionId: string
  readonly ip: string
  readonly userAgent: string | undefined
}

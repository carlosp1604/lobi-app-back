export interface GenerateVerificationTokenApplicationRequestDto {
  readonly email: string
  readonly purpose: string
  readonly sendNewToken: boolean
  readonly ip: string
  readonly userAgent: string | undefined
}

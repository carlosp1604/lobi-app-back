export interface ValidateVerificationTokenApplicationRequestDto {
  readonly token: string
  readonly purpose: string
  readonly email: string
}

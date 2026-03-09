export class ResetUserPasswordApplicationRequestDto {
  readonly email: string
  readonly token: string
  readonly password: string
  readonly userAgent: string | undefined
  readonly ip: string
}

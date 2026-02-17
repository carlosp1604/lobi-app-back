export interface CreateUserApplicationRequestDto {
  readonly email: string
  readonly token: string
  readonly username: string
  readonly name: string
  readonly password: string
  readonly requestedRole: string
  readonly ip: string
  readonly userAgent: string | undefined
}
